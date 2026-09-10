import React from 'react';

/**
 * 清洗并规范化 SVG 字符串
 * 1. 过滤 XSS 危险脚本与属性
 * 2. 补全 viewBox（如果缺失但有宽高）
 * 3. 规范根 svg 尺寸为 1em，使自适应外层文字大小
 */
export function sanitizeAndFormatSvg(rawSvg: string): string {
  if (!rawSvg || typeof rawSvg !== 'string') return '';

  let svg = rawSvg.trim();

  // 1. 如果用户只复制了 <path ...> 或没有 <svg> 根节点，自动外包一个 <svg>
  if (!/<svg/i.test(svg)) {
    svg = `<svg viewBox="0 0 1024 1024" width="1em" height="1em" fill="currentColor" xmlns="http://www.w3.org/2000/svg">${svg}</svg>`;
  }

  // 2. 移除 <script> 标签及内容
  svg = svg.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // 3. 移除危险的内联事件和属性
  svg = svg.replace(/\son\w+\s*=\s*(['"]).*?\1/gi, '');
  svg = svg.replace(/\bhref\s*=\s*(['"])javascript:.*?\1/gi, '');

  // 4. 处理 viewBox 与宽高
  const widthMatch = svg.match(/\bwidth\s*=\s*["']?(\d+(?:\.\d+)?)(?:px)?["']?/i);
  const heightMatch = svg.match(/\bheight\s*=\s*["']?(\d+(?:\.\d+)?)(?:px)?["']?/i);
  const hasViewBox = /\bviewBox\s*=/i.test(svg);

  if (!hasViewBox && widthMatch && heightMatch) {
    const w = widthMatch[1];
    const h = heightMatch[1];
    svg = svg.replace(/<svg\b/i, `<svg viewBox="0 0 ${w} ${h}"`);
  } else if (!hasViewBox) {
    // 默认 viewBox
    svg = svg.replace(/<svg\b/i, '<svg viewBox="0 0 1024 1024"');
  }

  // 5. 替换或设置 width/height 为 1em
  if (/\bwidth\s*=/i.test(svg)) {
    svg = svg.replace(/\bwidth\s*=\s*["'][^"']*["']/i, 'width="1em"');
  } else {
    svg = svg.replace(/<svg\b/i, '<svg width="1em"');
  }

  if (/\bheight\s*=/i.test(svg)) {
    svg = svg.replace(/\bheight\s*=\s*["'][^"']*["']/i, 'height="1em"');
  } else {
    svg = svg.replace(/<svg\b/i, '<svg height="1em"');
  }

  // 6. 处理 fill 与描边
  // 若声明了 fill="none"，注入内联样式防止被 Antd 的 .anticon svg { fill: currentColor; } 强行覆盖填黑
  if (/fill=["']none["']/i.test(svg)) {
    if (!/style=/i.test(svg)) {
      svg = svg.replace(/<svg\b/i, '<svg style="fill: none !important;"');
    }
  } else {
    // 将硬编码单色深灰/黑色 fill 转换为 currentColor，使其能受外层颜色控制
    svg = svg.replace(/fill=["']#(?:000|000000|111|111111|222|222222|333|333333|444|444444|555|555555|666|666666|2c3e50|3a3a3a|1f1f1f)["']/gi, 'fill="currentColor"');
    if (!/\bfill\s*=/i.test(svg)) {
      svg = svg.replace(/<svg\b/i, '<svg fill="currentColor"');
    }
  }

  return svg;
}

/**
 * 创建 React 图标组件 (纯 React.createElement，无需 tsx 后缀)
 */
export function createSvgIconComponent(
  svgContent: string,
  name: string,
  defaultStyle?: { color?: string; size?: string },
): React.FC<any> {
  const formattedSvg = sanitizeAndFormatSvg(svgContent);

  const CustomSvgIcon: React.FC<any> = (props: any) => {
    const { className, style, children, ...restProps } = props || {};
    return React.createElement('span', {
      role: 'img',
      'aria-label': String(name),
      className: `anticon anticon-custom ${className || ''}`.trim(),
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        lineHeight: 1,
        verticalAlign: '-0.125em',
        width: defaultStyle?.size || '1em',
        height: defaultStyle?.size || '1em',
        ...(defaultStyle?.color ? { color: defaultStyle.color } : {}),
        ...(defaultStyle?.size ? { fontSize: defaultStyle.size } : {}),
        ...style,
      },
      dangerouslySetInnerHTML: { __html: formattedSvg },
      ...restProps,
    });
  };

  CustomSvgIcon.displayName = `CustomIcon_${String(name)}`;
  return CustomSvgIcon;
}

/**
 * 批量解析包含多个 SVG 或 Iconfont Symbol 的文本
 */
export function parseBatchSvgString(text: string): Array<{ name: string; title: string; svg: string }> {
  const results: Array<{ name: string; title: string; svg: string }> = [];

  // 1. 尝试匹配 <symbol id="icon-xxx" viewBox="...">...</symbol>
  const symbolRegex = /<symbol\s+[^>]*id=["']([^"']+)["'][^>]*>([\s\S]*?)<\/symbol>/gi;
  let symbolMatch;
  while ((symbolMatch = symbolRegex.exec(text)) !== null) {
    const rawId = symbolMatch[1];
    const inner = symbolMatch[2];
    const viewBoxMatch = symbolMatch[0].match(/viewBox=["']([^"']+)["']/i);
    const viewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 1024 1024';

    const name = rawId.replace(/^icon[-_]/i, '').trim().toLowerCase();
    const svg = `<svg viewBox="${viewBox}" width="1em" height="1em" fill="currentColor">${inner}</svg>`;
    results.push({
      name,
      title: name,
      svg: sanitizeAndFormatSvg(svg),
    });
  }

  if (results.length > 0) return results;

  // 2. 匹配多个独立 <svg>...</svg>
  const svgRegex = /<svg[\s\S]*?<\/svg>/gi;
  let svgMatch;
  let count = 1;
  while ((svgMatch = svgRegex.exec(text)) !== null) {
    const svgCode = svgMatch[0];
    const idMatch = svgCode.match(/\bid=["']([^"']+)["']/i);
    const name = (idMatch ? idMatch[1] : `custom-icon-${Date.now()}-${count++}`).toLowerCase();
    results.push({
      name,
      title: name,
      svg: sanitizeAndFormatSvg(svgCode),
    });
  }

  return results;
}
