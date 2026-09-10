const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// 参数解析：--pages=5 代表只抓前5页，默认为全量 80 页
const args = process.argv.slice(2);
let maxPages = 80;
args.forEach(arg => {
  if (arg.startsWith('--pages=')) {
    maxPages = parseInt(arg.split('=')[1], 10) || 80;
  }
});

const ASSETS_DIR = path.resolve(__dirname, '../src/server/assets');
if (!fs.existsSync(ASSETS_DIR)) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

const OUTPUT_PATH = path.join(ASSETS_DIR, 'iconmonstr-assets.json');
const FULL_OUTPUT_PATH = path.join(ASSETS_DIR, 'iconmonstr-full.json');
const PROGRESS_FILE = path.join(ASSETS_DIR, 'iconmonstr-progress.json');

function requestUrl(targetUrl, headers = {}, maxRedirects = 3) {
  return new Promise((resolve) => {
    if (maxRedirects < 0) {
      return resolve({ status: 500, headers: {}, body: '' });
    }

    const client = targetUrl.startsWith('https') ? https : http;
    const req = client.get(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        ...headers
      },
      timeout: 15000,
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const nextUrl = res.headers.location.startsWith('http')
          ? res.headers.location
          : new URL(res.headers.location, targetUrl).href;
        return resolve(requestUrl(nextUrl, headers, maxRedirects - 1));
      }

      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    });

    req.on('error', (err) => {
      resolve({ status: 500, headers: {}, body: '', error: err.message });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ status: 504, headers: {}, body: '', error: 'timeout' });
    });
  });
}

// 从单个图标详情页抓取原版 SVG
async function fetchIconSvg(iconPageUrl) {
  for (let retry = 0; retry < 4; retry++) {
    try {
      const pageRes = await requestUrl(iconPageUrl);
      if (pageRes.status === 429) {
        await new Promise(r => setTimeout(r, 2500));
        continue;
      }
      if (pageRes.status !== 200 || !pageRes.body) {
        await new Promise(r => setTimeout(r, 600));
        continue;
      }
      const html = pageRes.body;

      const activeIdMatch = html.match(/class=["']active-id["'][^>]*id=["']([^"']+)["']/i);
      const menuMatch = html.match(/class=["']container-header-menu["'][^>]*id=["']([^"']+)["']/i);
      const btnMatch = html.match(/class=["'][^"']*download-btn[^"']*["'][^>]*id=["']([^"']+)["']/i);
      const titleMatch = html.match(/class=["']content-top-title["']>([^<]+)</i);

      if (!activeIdMatch || !menuMatch || !btnMatch) return null;

      const key = activeIdMatch[1].slice(0, 32);
      const date = menuMatch[1];
      const fileName = btnMatch[1];
      const rawTitle = titleMatch ? titleMatch[1].trim() : fileName;
      const cleanTitle = rawTitle.replace(/\s*-\s*svg$/i, '').trim();

      const dlUrl = `https://iconmonstr.com/?s2member_file_download_key=${key}&s2member_file_download=${date}/svg/iconmonstr-${fileName}.svg`;
      const cookie = pageRes.headers['set-cookie'] ? pageRes.headers['set-cookie'].join('; ') : '';

      const svgRes = await requestUrl(dlUrl, {
        'Referer': iconPageUrl,
        'Cookie': cookie,
      });

      if (svgRes.status === 429) {
        await new Promise(r => setTimeout(r, 2500));
        continue;
      }

      if (svgRes.status === 200 && svgRes.body && svgRes.body.includes('<svg')) {
        return {
          name: `iconmonstr:${fileName}`,
          title: cleanTitle,
          svg: svgRes.body.trim(),
          category: 'iconmonstr',
          source: 'iconmonstr',
        };
      }
    } catch (e) {
      // 重试
      await new Promise(r => setTimeout(r, 800));
    }
  }
  return null;
}

// 异步并发执行器
async function mapConcurrent(items, concurrency, fn) {
  const results = [];
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const cur = index++;
      try {
        const res = await fn(items[cur], cur, items.length);
        results[cur] = res;
      } catch (e) {
        results[cur] = null;
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

async function main() {
  console.log(`=== 开始执行 Iconmonstr 矢量图标库离线归档任务 (计划目标: 1 ~ ${maxPages} 页) ===`);

  // 1. 加载已有进度（断点续传）
  let existingIcons = [];
  const iconMap = new Map();

  if (fs.existsSync(OUTPUT_PATH)) {
    try {
      existingIcons = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf8'));
      existingIcons.forEach(i => iconMap.set(i.name, i));
      console.log(`已加载现有归档资产: ${existingIcons.length} 款图标`);
    } catch (e) {
      console.warn('读取现有资产失败，将重新构建');
    }
  }

  // 2. 抓取分页索引中的所有图标 URL
  console.log(`[步骤 1/3] 正在遍历并解析第 1 到第 ${maxPages} 页目录...`);
  const pageUrls = [];
  for (let p = 1; p <= maxPages; p++) {
    pageUrls.push(p === 1 ? 'https://iconmonstr.com/' : `https://iconmonstr.com/page/${p}/`);
  }

  const allIconUrls = new Set();
  for (let i = 0; i < pageUrls.length; i++) {
    const pageUrl = pageUrls[i];
    process.stdout.write(`\r  > 正在检索页面 [${i + 1}/${pageUrls.length}]: ${pageUrl}... `);
    const res = await requestUrl(pageUrl);
    if (res.status === 200 && res.body) {
      const matches = Array.from(res.body.matchAll(/href=["'](https:\/\/iconmonstr\.com\/[^"']+-svg\/)["']/gi));
      matches.forEach(m => allIconUrls.add(m[1]));
    }
    await new Promise(r => setTimeout(r, 100));
  }
  console.log(`\n> 索引目录检索完成！共发现 ${allIconUrls.size} 款图标详情页面。\n`);

  // 3. 过滤出待下载的图标 URL（断点续传）
  const pendingUrls = Array.from(allIconUrls).filter(url => {
    const slug = url.replace('https://iconmonstr.com/', '').replace(/-svg\/$/, '');
    // 粗略判断是否已在库中
    for (const name of iconMap.keys()) {
      if (name.includes(slug)) return false;
    }
    return true;
  });

  console.log(`[步骤 2/3] 待抓取/更新的图标数: ${pendingUrls.length} (已有: ${iconMap.size})`);

  let fetchedCount = 0;
  let successCount = 0;
  const CONCURRENCY = 4; // 适度并发保证速度且不触发限流

  await mapConcurrent(pendingUrls, CONCURRENCY, async (url, idx, total) => {
    const item = await fetchIconSvg(url);
    fetchedCount++;
    if (item) {
      iconMap.set(item.name, item);
      successCount++;
    }

    if (fetchedCount % 10 === 0 || fetchedCount === total) {
      process.stdout.write(`\r  > 进度: [${fetchedCount}/${total}] (新增成功: ${successCount}, 当前总数: ${iconMap.size})... `);
      // 定期持久化
      const currentList = Array.from(iconMap.values());
      fs.writeFileSync(OUTPUT_PATH, JSON.stringify(currentList, null, 2), 'utf8');
      if (maxPages >= 80 && currentList.length >= 4000) {
        fs.writeFileSync(FULL_OUTPUT_PATH, JSON.stringify(currentList, null, 2), 'utf8');
      }
    }

    // 适度微休眠防止触发独立站防火墙
    await new Promise(r => setTimeout(r, 120));
  });

  // 最终写入
  const finalList = Array.from(iconMap.values());
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(finalList, null, 2), 'utf8');
  if (finalList.length >= 4000 || maxPages >= 80) {
    fs.writeFileSync(FULL_OUTPUT_PATH, JSON.stringify(finalList, null, 2), 'utf8');
  }

  console.log(`\n\n[步骤 3/3] 归档完成！`);
  console.log(`- 成功持久化图标总数: ${finalList.length} 款`);
  console.log(`- 资产存储文件: ${OUTPUT_PATH}`);
  if (fs.existsSync(FULL_OUTPUT_PATH)) {
    console.log(`- 全量归档包: ${FULL_OUTPUT_PATH}`);
  }
}

main().catch(err => {
  console.error('\n归档执行异常:', err);
  process.exit(1);
});
