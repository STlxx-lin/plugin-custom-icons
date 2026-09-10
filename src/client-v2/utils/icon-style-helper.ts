export interface IconStyleConfig {
  name: string;
  color?: string;
  size?: string;
}

/**
 * 解析带样式参数的复合图标值
 * 例如 "czs-home?color=%23ff0000&size=20px" -> { name: "czs-home", color: "#ff0000", size: "20px" }
 */
export function parseIconValue(val: string | null | undefined): IconStyleConfig {
  if (!val || typeof val !== 'string') {
    return { name: '', color: undefined, size: undefined };
  }
  const [name, query] = val.split('?');
  let color: string | undefined;
  let size: string | undefined;

  if (query) {
    try {
      const params = new URLSearchParams(query);
      color = params.get('color') || undefined;
      size = params.get('size') || undefined;
    } catch (e) {
      // ignore
    }
  }

  return { name: name?.trim() || '', color, size };
}

/**
 * 格式化图标名称与样式配置为标准复合字符串
 */
export function formatIconValue(name: string, color?: string, size?: string | number): string | null {
  if (!name || typeof name !== 'string') return null;
  const cleanName = name.trim();
  if (!cleanName) return null;

  const params = new URLSearchParams();
  if (color && color.trim()) {
    params.set('color', color.trim());
  }
  if (size !== undefined && size !== null && String(size).trim()) {
    const sizeStr = typeof size === 'number' ? `${size}px` : String(size).trim();
    params.set('size', sizeStr.endsWith('px') || sizeStr.endsWith('em') || sizeStr.endsWith('rem') ? sizeStr : `${sizeStr}px`);
  }

  const query = params.toString();
  return query ? `${cleanName}?${query}` : cleanName;
}

/**
 * 经典高质感预设色板
 */
export const PRESET_ICON_COLORS = [
  { label: '火山红', value: '#f5222d' },
  { label: '日落橙', value: '#fa8c16' },
  { label: '金盏黄', value: '#faad14' },
  { label: '极光绿', value: '#52c41a' },
  { label: '青翠青', value: '#13c2c2' },
  { label: '拂晓蓝', value: '#1677ff' },
  { label: '酱紫红', value: '#722ed1' },
  { label: '法式洋红', value: '#eb2f96' },
  { label: '深邃黑', value: '#262626' },
  { label: '中性灰', value: '#8c8c8c' },
  { label: '石板蓝', value: '#2f54eb' },
  { label: '薄暮青', value: '#08979c' },
];

/**
 * 常用尺寸快捷预设
 */
export const PRESET_ICON_SIZES = [
  { label: '14px (紧凑)', value: '14px' },
  { label: '16px (标准)', value: '16px' },
  { label: '18px (适中)', value: '18px' },
  { label: '20px (突出)', value: '20px' },
  { label: '24px (放大)', value: '24px' },
  { label: '28px (大号)', value: '28px' },
  { label: '32px (特大)', value: '32px' },
];
