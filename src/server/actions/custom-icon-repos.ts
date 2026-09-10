import path from 'path';
import fs from 'fs';
import https from 'https';
import http from 'http';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface RepoDefinition {
  key: string;
  title: string;
  category: string;
  version: string;
  homepage: string;
  description: string;
  downloadUrl?: string;
  sourceType: 'zip' | 'iconify' | 'iconmonstr';
  prefix?: string;
  iconCount: number;
  tags?: string[];
  previewIcons: string[];
}

/**
 * 从独立的 JSON 配置文件动态加载官方图标库清单
 */
export function getOfficialRepos(): RepoDefinition[] {
  try {
    const jsonPath = path.resolve(__dirname, '../assets/official-repos.json');
    if (fs.existsSync(jsonPath)) {
      return JSON.parse(fs.readFileSync(jsonPath, 'utf8')) as RepoDefinition[];
    }
  } catch (e) {
    console.warn('[plugin-custom-icons] 加载 official-repos.json 失败:', e);
  }
  return [];
}

export const OFFICIAL_REPOS: RepoDefinition[] = getOfficialRepos();

/**
 * 稳健下载文件，支持 301/302 重定向
 */
function downloadFile(url: string, destPath: string, timeout = 25000): Promise<void> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 NocoBaseCustomIcons' } }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, destPath, timeout).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`下载失败，HTTP状态码: ${res.statusCode}`));
      }
      const fileStream = fs.createWriteStream(destPath);
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });
      fileStream.on('error', (err) => {
        fs.unlink(destPath, () => {});
        reject(err);
      });
    });

    req.setTimeout(timeout, () => {
      req.destroy();
      reject(new Error('下载超时'));
    });

    req.on('error', reject);
  });
}

/**
 * 稳健获取 JSON 数据，支持跟随重定向
 */
function fetchJson(url: string, timeout = 15000): Promise<any> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(
      url,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) NocoBaseCustomIcons/2.0',
          Accept: 'application/json',
        },
      },
      (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return fetchJson(res.headers.location, timeout).then(resolve).catch(reject);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(body);
            resolve(json);
          } catch (e: any) {
            reject(new Error(`JSON 解析失败: ${e.message}`));
          }
        });
      },
    );

    req.setTimeout(timeout, () => {
      req.destroy();
      reject(new Error('请求超时'));
    });
    req.on('error', reject);
  });
}

/**
 * 多源通道获取 Iconify 图标集的 icons.json 数据并本地持久化
 */
async function fetchIconifyRepoData(prefix: string): Promise<any> {
  const clean = prefix.trim().toLowerCase();
  const urls = [
    `https://cdn.jsdelivr.net/npm/@iconify-json/${clean}/icons.json`,
    `https://unpkg.com/@iconify-json/${clean}/icons.json`,
    `https://raw.githubusercontent.com/iconify/icon-sets/master/json/${clean}.json`,
  ];

  let lastError: any = null;
  for (const url of urls) {
    try {
      console.log(`[Iconify] 正在从高速源拉取 [${clean}] 图标数据: ${url}`);
      const data = await fetchJson(url, 20000);
      if (data && data.icons && typeof data.icons === 'object') {
        console.log(`[Iconify] 成功从 ${url} 获取 [${clean}] 数据，共 ${Object.keys(data.icons).length} 个图标`);
        return data;
      }
    } catch (e: any) {
      console.warn(`[Iconify] 源 ${url} 拉取失败: ${e.message}，尝试下一备用源...`);
      lastError = e;
    }
  }

  throw new Error(`无法从任何公开源下载 [${clean}] 图标集数据: ${lastError?.message || '网络无法访问'}`);
}

/**
 * 将 Iconify 的 icons.json 转换为 NocoBase 标准格式的图标列表
 */
function parseIconifyJsonToIcons(json: any, prefix: string, category: string) {
  const defaultWidth = json.width || 24;
  const defaultHeight = json.height || 24;
  const iconsObj = json.icons || {};
  const aliasesObj = json.aliases || {};

  const result: any[] = [];

  for (const [name, iconData] of Object.entries(iconsObj)) {
    const d = iconData as any;
    const body = d.body || '';
    if (!body) continue;
    const w = d.width || defaultWidth;
    const h = d.height || defaultHeight;
    const fullSvg = `<svg viewBox="0 0 ${w} ${h}" width="1em" height="1em" fill="currentColor" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
    const fullName = `${prefix}:${name}`.toLowerCase();
    result.push({
      name: fullName,
      title: name,
      category: category || prefix,
      svg: fullSvg,
      source: `iconify:${prefix}`,
      sort: 0,
    });
  }

  // 别名支持（可选）
  for (const [aliasName, aliasData] of Object.entries(aliasesObj)) {
    const a = aliasData as any;
    const parent = a.parent;
    if (parent && iconsObj[parent]) {
      const parentData = iconsObj[parent] as any;
      const body = a.body || parentData.body || '';
      if (!body) continue;
      const w = a.width || parentData.width || defaultWidth;
      const h = a.height || parentData.height || defaultHeight;
      const fullSvg = `<svg viewBox="0 0 ${w} ${h}" width="1em" height="1em" fill="currentColor" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
      const fullName = `${prefix}:${aliasName}`.toLowerCase();
      result.push({
        name: fullName,
        title: aliasName,
        category: category || prefix,
        svg: fullSvg,
        source: `iconify:${prefix}`,
        sort: 0,
      });
    }
  }

  return result;
}

/**
 * 将 IcoMoon selection.json 转换为 SVG 图标列表（草莓图标库）
 */
function parseSelectionJsonToIcons(selectionJson: any, category = 'caomei') {
  const icons = selectionJson.icons || [];
  return icons.map((item: any) => {
    const rawName = item.properties?.name || item.icon?.tags?.[0] || 'icon';
    const name = rawName.startsWith('czs-') ? rawName.toLowerCase() : `czs-${rawName}`.toLowerCase();
    const title = item.properties?.name || name;
    const paths = (item.icon?.paths || [])
      .map((d: string) => `<path d="${d}" fill="currentColor" />`)
      .join('');
    const svg = `<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">${paths}</svg>`;

    return {
      name,
      title,
      category,
      svg,
      source: 'repo:caomei',
      sort: 0,
    };
  });
}

/**
 * 获取 NocoBase 根目录下的持久化存储目录
 */
function getStorageRepoDir(repoKey: string): string {
  const baseStorageDir = path.resolve(process.cwd(), 'storage', 'custom-icons', 'repos', repoKey);
  if (!fs.existsSync(baseStorageDir)) {
    fs.mkdirSync(baseStorageDir, { recursive: true });
  }
  return baseStorageDir;
}

export const createCustomIconReposResource = (app: any, resourceName = 'customIconRepos') => ({
  name: resourceName,
  actions: {
    /**
     * 获取仓库列表及安装状态（包含官方预设与用户动态导入的 Iconify 集合）
     */
    async list(ctx: any, next: any) {
      const repoModel = app.db.getRepository('custom_icon_repos');
      const iconsRepo = app.db.getRepository('custom_icons');

      let dbRepos: any[] = [];
      try {
        dbRepos = await repoModel.find();
      } catch (e) {
        // 如果表未同步则容错
      }

      const dbMap = new Map<string, any>();
      dbRepos.forEach((r) => {
        dbMap.set(r.key, r);
      });

      // 1. 合并官方精选
      const officialRepos = getOfficialRepos();
      const officialList = await Promise.all(
        officialRepos.map(async (def) => {
          const dbItem = dbMap.get(def.key);
          const actualCount = await iconsRepo.count({
            filter: {
              $or: [
                { category: def.category },
                { source: def.sourceType === 'iconify' ? `iconify:${def.prefix || def.key}` : `repo:${def.key}` },
              ],
            },
          });

          const isInstalled = actualCount > 0;
          let repoIconCount = def.iconCount;
          if (def.key === 'iconmonstr') {
            const fullPath = path.resolve(__dirname, '../assets/iconmonstr-full.json');
            const assetsPath = path.resolve(__dirname, '../assets/iconmonstr-assets.json');
            const targetFile = fs.existsSync(fullPath) ? fullPath : (fs.existsSync(assetsPath) ? assetsPath : null);
            if (targetFile) {
              try {
                const arr = JSON.parse(fs.readFileSync(targetFile, 'utf8'));
                if (Array.isArray(arr) && arr.length > 0) {
                  repoIconCount = arr.length;
                }
              } catch (e) {}
            }
          }

          return {
            ...def,
            iconCount: repoIconCount,
            status: isInstalled ? 'installed' : (dbItem?.status || 'not_installed'),
            installedCount: actualCount,
            installedAt: dbItem?.installedAt || null,
          };
        }),
      );

      // 2. 追加用户通过 Prefix 自定义安装的外部 Iconify 集合
      const customInstalledList: any[] = [];
      const officialKeys = new Set(officialRepos.map((r) => r.key));
      for (const r of dbRepos) {
        if (!officialKeys.has(r.key)) {
          const actualCount = await iconsRepo.count({
            filter: {
              $or: [{ category: r.category }, { source: `iconify:${r.key}` }],
            },
          });
          if (actualCount > 0) {
            customInstalledList.push({
              key: r.key,
              title: r.title || r.key,
              category: r.category || r.key,
              version: r.version || 'latest',
              homepage: r.homepage || `https://icon-sets.iconify.design/${r.key}/`,
              description: r.description || `从 Iconify 平台自定义导入的 [${r.key}] 矢量图标集。`,
              sourceType: 'iconify',
              prefix: r.key,
              iconCount: r.iconCount || actualCount,
              tags: ['自定义导入', 'Iconify'],
              status: 'installed',
              installedCount: actualCount,
              installedAt: r.installedAt || null,
              previewIcons: [],
            });
          }
        }
      }

      ctx.body = [...officialList, ...customInstalledList];
      await next();
    },

    /**
     * 探测任意来自 https://icon-sets.iconify.design/ 的集合信息
     */
    async probe(ctx: any, next: any) {
      let rawPrefix = ctx.action.params?.prefix || ctx.request.body?.prefix || ctx.query?.prefix;
      if (!rawPrefix) {
        ctx.throw(400, '请输入图标集前缀或链接 (例如 streamline、solar 或 https://www.streamlinehq.com/)');
      }

      // 智能多平台 URL 解析
      rawPrefix = String(rawPrefix).trim();
      let prefix = rawPrefix;

      // 1. 匹配 streamlinehq.com 官方链接与系列
      const streamlineMatch = rawPrefix.match(/streamlinehq\.com(?:\/icons\/([a-zA-Z0-9_-]+))?/i);
      if (streamlineMatch) {
        const sub = streamlineMatch[1]?.toLowerCase();
        if (sub) {
          if (sub.includes('emoji')) prefix = 'streamline-emojis';
          else if (sub.includes('logo')) prefix = 'streamline-logos';
          else if (sub.includes('ultimate')) prefix = 'streamline-ultimate';
          else if (sub.includes('sharp')) prefix = 'streamline-sharp';
          else if (sub.includes('plump')) prefix = 'streamline-plump';
          else if (sub.includes('flex')) prefix = 'streamline-flex';
          else prefix = 'streamline';
        } else {
          prefix = 'streamline';
        }
      } else if (/iconmonstr\.com/i.test(rawPrefix) || rawPrefix.toLowerCase() === 'iconmonstr') {
        // 3. 匹配 iconmonstr.com 官方平台或关键字
        const iconmonstrMatch = rawPrefix.match(/iconmonstr\.com(?:\/([a-zA-Z0-9_-]+))?/i);
        const subPath = iconmonstrMatch ? iconmonstrMatch[1]?.toLowerCase() : '';
        const isSpecific = subPath && !['collections', 'about', 'license', 'privacy'].includes(subPath);

        const fullPath = path.resolve(__dirname, '../assets/iconmonstr-full.json');
        const assetsPath = path.resolve(__dirname, '../assets/iconmonstr-assets.json');
        const targetFile = fs.existsSync(fullPath) ? fullPath : (fs.existsSync(assetsPath) ? assetsPath : null);
        let currentAvailableTotal = 297;
        if (targetFile) {
          try {
            const arr = JSON.parse(fs.readFileSync(targetFile, 'utf8'));
            if (Array.isArray(arr) && arr.length > 0) currentAvailableTotal = arr.length;
          } catch (e) {}
        }

        ctx.body = {
          success: true,
          prefix: 'iconmonstr',
          title: isSpecific ? `Iconmonstr (${subPath})` : 'Iconmonstr 经典黑白矢量精选库',
          total: currentAvailableTotal,
          author: 'Alexander Kahlkopf (iconmonstr.com)',
          license: 'Free for commercial and personal use (iconmonstr license)',
          category: 'iconmonstr',
          samples: [
            'quote-right-filled',
            'quote-left-filled',
            'layer-multiple-filled',
            'copy-filled',
            'duplicate-filled',
            'paste-filled',
            'cut-filled',
            'contrast-filled',
            'pencil-filled',
            'reload-lined',
            'refresh-lined',
            'heart-filled',
            'save-lined',
            'magnifier-lined',
          ],
          homepage: rawPrefix.startsWith('http') ? rawPrefix : 'https://iconmonstr.com/',
          sourcePlatform: 'iconmonstr',
        };
        await next();
        return;
      } else {
        // 2. 匹配 icon-sets.iconify.design
        const iconifyMatch = rawPrefix.match(/icon-sets\.iconify\.design\/([^/?#]+)/i);
        if (iconifyMatch) {
          prefix = iconifyMatch[1];
        }
      }

      prefix = prefix.replace(/^iconify:/i, '').replace(/^\/|\/$/g, '').trim().toLowerCase();

      try {
        const info = await fetchJson(`https://api.iconify.design/collection?prefix=${prefix}`, 10000);
        const isStreamline = prefix.startsWith('streamline');
        const defaultTitle = isStreamline
          ? (prefix === 'streamline' ? 'Streamline Regular (核心极简矢量库)' : `Streamline (${prefix})`)
          : (info?.title || prefix);

        if (!info && !isStreamline) {
          ctx.throw(404, `未检索到名为 [${prefix}] 的图标集`);
        }

        ctx.body = {
          success: true,
          prefix,
          title: info?.title || defaultTitle,
          total: info?.total || (info?.uncategorized ? info.uncategorized.length : (isStreamline ? 3933 : 0)),
          author: isStreamline ? 'Streamline HQ (streamlinehq.com)' : (info?.author?.name || 'Open Source Contributors'),
          license: isStreamline ? 'Free with attribution' : (info?.license?.title || 'Open Source'),
          category: prefix,
          samples: info?.samples || info?.uncategorized?.slice(0, 12) || [],
          homepage: isStreamline ? 'https://www.streamlinehq.com/' : `https://icon-sets.iconify.design/${prefix}/`,
          sourcePlatform: isStreamline ? 'streamlinehq' : 'iconify',
        };
      } catch (err: any) {
        ctx.throw(500, `探测图标集合失败: ${err.message}`);
      }
      await next();
    },

    /**
     * 一键下载并安装图标库（支持草莓 zip 与所有 Iconify 集合）
     */
    async install(ctx: any, next: any) {
      const repoKey = ctx.action.params?.key || ctx.request.body?.key || 'caomei';
      let def = getOfficialRepos().find((r) => r.key === repoKey);

      // 如果不是预置的官方集，视为 Iconify Prefix
      if (!def) {
        def = {
          key: repoKey,
          title: ctx.request.body?.title || repoKey,
          category: ctx.request.body?.category || repoKey,
          version: 'latest',
          homepage: `https://icon-sets.iconify.design/${repoKey}/`,
          description: `从 Iconify 导入的 [${repoKey}] 矢量图标集`,
          sourceType: 'iconify',
          prefix: repoKey,
          iconCount: 0,
          previewIcons: [],
        };
      }

      const storageDir = getStorageRepoDir(repoKey);
      let iconItems: any[] = [];

      // A. 草莓图标库 (ZIP 流程)
      if (def.sourceType === 'zip') {
        const zipPath = path.join(storageDir, 'package.zip');
        const extractedDir = path.join(storageDir, 'extracted');
        let selectionData: any = null;

        try {
          console.log(`[IconRepo] 正在从官方下载: ${def.downloadUrl} -> ${zipPath}`);
          await downloadFile(def.downloadUrl!, zipPath, 20000);

          if (process.platform === 'win32') {
            await execAsync(
              `powershell -NoProfile -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${extractedDir}' -Force"`,
            );
          } else {
            await execAsync(`unzip -o "${zipPath}" -d "${extractedDir}"`);
          }

          const searchSelectionJson = (dir: string): string | null => {
            const files = fs.readdirSync(dir);
            for (const f of files) {
              const full = path.join(dir, f);
              if (f === 'selection.json') return full;
              if (fs.statSync(full).isDirectory()) {
                const sub = searchSelectionJson(full);
                if (sub) return sub;
              }
            }
            return null;
          };

          const selFile = searchSelectionJson(extractedDir);
          if (selFile && fs.existsSync(selFile)) {
            selectionData = JSON.parse(fs.readFileSync(selFile, 'utf8'));
          }
        } catch (err: any) {
          console.warn(`[IconRepo] 草莓在线下载解压失败: ${err.message}，启用本地内置资产容灾`);
        }

        if (!selectionData) {
          const fallbackAsset = path.resolve(__dirname, '../assets/caomei-selection.json');
          if (fs.existsSync(fallbackAsset)) {
            selectionData = JSON.parse(fs.readFileSync(fallbackAsset, 'utf8'));
          }
        }

        if (!selectionData || !Array.isArray(selectionData.icons)) {
          ctx.throw(500, '未能获取并解析草莓图标库数据');
        }

        iconItems = parseSelectionJsonToIcons(selectionData, def.category);
      } else if (def.sourceType === 'iconmonstr' || repoKey === 'iconmonstr') {
        // C. Iconmonstr 官方极简黑白矢量库流程
        const fullPath = path.resolve(__dirname, '../assets/iconmonstr-full.json');
        const assetsPath = path.resolve(__dirname, '../assets/iconmonstr-assets.json');
        const targetFile = fs.existsSync(fullPath) ? fullPath : (fs.existsSync(assetsPath) ? assetsPath : null);
        if (targetFile) {
          try {
            const raw = fs.readFileSync(targetFile, 'utf8');
            iconItems = JSON.parse(raw);
          } catch (e) {}
        }

        // 本地持久化保存一份备份
        const localBackupPath = path.join(storageDir, 'icons.json');
        try {
          fs.writeFileSync(localBackupPath, JSON.stringify(iconItems), 'utf8');
        } catch (e) {}
      } else {
        // B. Iconify 官方图标集 (多源 CDN 高速拉取流程)
        const prefix = def.prefix || def.key;
        const iconifyJson = await fetchIconifyRepoData(prefix);

        // 本地持久化保存一份备份
        const localBackupPath = path.join(storageDir, 'icons.json');
        try {
          fs.writeFileSync(localBackupPath, JSON.stringify(iconifyJson), 'utf8');
        } catch (e) {}

        iconItems = parseIconifyJsonToIcons(iconifyJson, prefix, def.category);
      }

      if (iconItems.length === 0) {
        ctx.throw(500, `未能从 [${def.title}] 中解析出任何有效的矢量图标`);
      }

      // 分批写入数据库 custom_icons
      const customIconsRepo = app.db.getRepository('custom_icons');
      let createdCount = 0;
      let updatedCount = 0;

      const batchSize = 100;
      for (let i = 0; i < iconItems.length; i += batchSize) {
        const slice = iconItems.slice(i, i + batchSize);
        for (const item of slice) {
          const existing = await customIconsRepo.findOne({ filter: { name: item.name } });
          if (existing) {
            await customIconsRepo.update({
              filterByTk: existing.id,
              values: {
                title: item.title,
                category: item.category,
                svg: item.svg,
                source: item.source,
              },
            });
            updatedCount++;
          } else {
            await customIconsRepo.create({ values: item });
            createdCount++;
          }
        }
      }

      // 更新仓库记录 custom_icon_repos
      const reposModel = app.db.getRepository('custom_icon_repos');
      try {
        const existingRepo = await reposModel.findOne({ filter: { key: def.key } });
        const repoValues = {
          key: def.key,
          title: def.title,
          category: def.category,
          version: def.version,
          homepage: def.homepage,
          description: def.description,
          iconCount: iconItems.length,
          status: 'installed',
          installedAt: new Date(),
        };
        if (existingRepo) {
          await reposModel.update({ filterByTk: existingRepo.id, values: repoValues });
        } else {
          await reposModel.create({ values: repoValues });
        }
      } catch (e) {
        // ignore
      }

      ctx.body = {
        success: true,
        key: def.key,
        title: def.title,
        total: iconItems.length,
        created: createdCount,
        updated: updatedCount,
        category: def.category,
      };
      await next();
    },

    /**
     * 一键卸载图标库并清理其关联图标
     */
    async uninstall(ctx: any, next: any) {
      const repoKey = ctx.action.params?.key || ctx.request.body?.key || 'caomei';
      const customIconsRepo = app.db.getRepository('custom_icons');
      const reposModel = app.db.getRepository('custom_icon_repos');

      // 获取仓库对应的分类或 source
      let targetCategory = repoKey;
      const def = getOfficialRepos().find((r) => r.key === repoKey);
      if (def) {
        targetCategory = def.category;
      } else {
        const dbRepo = await reposModel.findOne({ filter: { key: repoKey } });
        if (dbRepo?.category) targetCategory = dbRepo.category;
      }

      const count = await customIconsRepo.destroy({
        filter: {
          $or: [
            { category: targetCategory },
            { source: `iconify:${repoKey}` },
            { source: `repo:${repoKey}` },
          ],
        },
      });

      try {
        const existingRepo = await reposModel.findOne({ filter: { key: repoKey } });
        if (existingRepo) {
          await reposModel.update({
            filterByTk: existingRepo.id,
            values: {
              status: 'not_installed',
              installedAt: null,
            },
          });
        }
      } catch (e) {}

      ctx.body = {
        success: true,
        key: repoKey,
        removedCount: count,
      };
      await next();
    },
  },
});

