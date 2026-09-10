import React, { useState, useEffect, useMemo } from 'react';
import {
  CloseOutlined,
  LoadingOutlined,
  PlusOutlined,
  DeleteOutlined,
  BgColorsOutlined,
  FontSizeOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import { useFormLayout } from '@formily/antd-v5';
import { connect, mapProps, mapReadPretty } from '@formily/react';
import { isValid } from '@formily/shared';
import {
  Button,
  Empty,
  Flex,
  Input,
  Radio,
  Select,
  Space,
  theme,
  Popover,
  Tooltip,
  Popconfirm,
  Badge,
} from 'antd';
import { debounce, groupBy } from 'lodash';
import { useTranslation } from 'react-i18next';
import { hasIcon, Icon, icons } from '@nocobase/client-v2';
import { customIconsManager, CustomIconItem } from '../services/custom-icons-manager';
import { CustomIconModal } from './CustomIconModal';
import {
  parseIconValue,
  formatIconValue,
  PRESET_ICON_COLORS,
  PRESET_ICON_SIZES,
} from '../utils/icon-style-helper';

const { Search } = Input;

export interface IconPickerProps {
  value?: string;
  onChange?: (value: string | null) => void;
  disabled?: boolean;
  suffix?: React.ReactNode;
  iconSize?: number;
  searchable?: boolean;
  onChangeComplete?: (value: string | null) => void;
  apiClient?: any;
}

interface IconPickerReadPrettyProps {
  value?: string;
}

const groupByIconName = (data: string[]) => {
  return groupBy(data, (str) => {
    if (str.endsWith('outlined')) return 'Outlined';
    if (str.endsWith('filled')) return 'Filled';
    if (str.endsWith('twotone')) return 'TwoTone';
    return 'Other';
  });
};

/**
 * 统一渲染带样式图标预览组件
 * 全面支持 Ant Design Outlined / Filled / TwoTone 双色图标以及自定义 SVG 图标
 */
export const RenderPreviewIcon: React.FC<{
  name: string;
  color?: string;
  size?: string;
  style?: React.CSSProperties;
}> = ({ name, color, size, style }) => {
  if (!name) return null;
  const isTwoTone = name.toLowerCase().endsWith('twotone');

  const normalizedSize = size
    ? (size.endsWith('px') || size.endsWith('em') || size.endsWith('rem') ? size : `${size}px`)
    : undefined;

  const extraProps: any = {};
  if (color && isTwoTone) {
    extraProps.twoToneColor = color;
  }

  return (
    <span
      className={`enhanced-preview-icon ${isTwoTone ? 'is-twotone' : ''}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        lineHeight: 1,
        verticalAlign: '-0.125em',
        color: color || undefined,
        fontSize: normalizedSize,
        width: normalizedSize || undefined,
        height: normalizedSize || undefined,
        transition: 'all 0.2s ease',
        ...style,
      }}
    >
      <Icon
        type={name}
        {...extraProps}
        style={{
          fontSize: normalizedSize || 'inherit',
          color: color || 'inherit',
          width: normalizedSize || undefined,
          height: normalizedSize || undefined,
        }}
      />
    </span>
  );
};

export interface SubCategoryDef {
  key: string;
  label: string;
  filter: (name: string, item?: any) => boolean;
}

export const CAOMEI_SUB_CATEGORIES: SubCategoryDef[] = [
  { key: 'all', label: '全部', filter: () => true },
  { key: 'line', label: '线框风格', filter: (n) => n.endsWith('-l') },
  { key: 'solid', label: '实底风格', filter: (n) => !n.endsWith('-l') },
  {
    key: 'office',
    label: '常用办公',
    filter: (n) => /doc|file|folder|book|paper|clip|calendar|clipboard|pen|edit|save|read|certificate|ruler|scissors|printer/i.test(n),
  },
  {
    key: 'devices',
    label: '电子设备',
    filter: (n) => /computer|laptop|mobile|pad|phone|tv|watch|router|server|mouse|keyboard|hdmi|usb|battery|disk|storage|sdcard|webcam|microchip/i.test(n),
  },
  {
    key: 'arrows',
    label: '方向交互',
    filter: (n) => /angle|arrow|bevel|camber|hand-slide|down|up|left|right|turn|expand|shrink|hand-/i.test(n),
  },
  {
    key: 'media',
    label: '媒体影音',
    filter: (n) => /camera|film|image|music|video|voice|volume|microphone|sound|play|pause|headset/i.test(n),
  },
  {
    key: 'finance',
    label: '商业金融',
    filter: (n) => /buy|shopping|coin|money|bitcoin|credit|pay|red-envelope|alipay|shop|ticket|diamond|crown/i.test(n),
  },
  {
    key: 'brands',
    label: '网络品牌',
    filter: (n) => /alipay|bilibili|baidu|chrome|github|apple|android|google|microsoft|linux|qq|weibo|weixin|zhihu|youtube|twitter|facebook|vimeo|v2ex|steam|paypal/i.test(n),
  },
];

export const BUILTIN_SUB_CATEGORIES: SubCategoryDef[] = [
  { key: 'all', label: '全部', filter: () => true },
  { key: 'direction', label: '方向指示', filter: (n) => /up|down|left|right|arrow|chevron|caret|double/i.test(n) },
  { key: 'suggested', label: '提示建议', filter: (n) => /check|close|info|exclamation|question|warning|stop|clock/i.test(n) },
  { key: 'editor', label: '编辑通用', filter: (n) => /edit|copy|delete|form|file|folder|save|setting|search|scissor|link/i.test(n) },
  { key: 'data', label: '数据图表', filter: (n) => /chart|pie|bar|line|stock|dot|dashboard|database/i.test(n) },
  { key: 'brand', label: '品牌商标', filter: (n) => /alipay|wechat|github|google|apple|android|windows|ie|chrome/i.test(n) },
];

export const UNIVERSAL_ICONIFY_SUB_CATEGORIES: SubCategoryDef[] = [
  { key: 'all', label: '全部', filter: () => true },
  {
    key: 'arrows',
    label: '方向箭头',
    filter: (n) =>
      /arrow|chevron|caret|angle|direction|up|down|left|right|forward|back|corner|expand|shrink|collapse|move|rotate|undo|redo|sort/i.test(n),
  },
  {
    key: 'interface',
    label: '通用界面',
    filter: (n) =>
      /home|setting|cog|gear|search|filter|menu|more|list|grid|check|cross|close|x$|plus|add|minus|info|help|alert|warn|bell|lock|unlock|key|eye|shield|user|profile|log/i.test(n),
  },
  {
    key: 'office',
    label: '办公文档',
    filter: (n) =>
      /file|folder|doc|edit|pencil|pen|paper|clipboard|calendar|date|time|clock|book|bookmark|save|trash|delete|copy|cut|paste|tag|flag/i.test(n),
  },
  {
    key: 'devices',
    label: '硬件设备',
    filter: (n) =>
      /computer|laptop|pc|mobile|phone|smartphone|tablet|screen|monitor|tv|display|watch|camera|battery|hard-drive|server|database|cpu|chip|usb|wifi|bluetooth|printer|mouse|keyboard/i.test(n),
  },
  {
    key: 'media',
    label: '多媒体',
    filter: (n) =>
      /music|audio|sound|volume|mic|microphone|video|movie|film|play|pause|stop|record|disc|album|radio|image|photo|picture/i.test(n),
  },
  {
    key: 'finance',
    label: '商业金融',
    filter: (n) =>
      /shopping|cart|bag|credit|card|wallet|dollar|money|cash|coin|currency|bank|shop|store|percent|percentage|chart|graph|trending|receipt|invoice/i.test(n),
  },
  {
    key: 'communication',
    label: '通讯社交',
    filter: (n) =>
      /mail|email|envelope|message|chat|comment|send|share|phone-call|at-sign|rss|link|globe|network|share-2|heart|star|thumbs/i.test(n),
  },
  {
    key: 'weather',
    label: '自然天气',
    filter: (n) =>
      /sun|moon|cloud|rain|snow|wind|lightning|thermometer|umbrella|drop|flame|fire|leaf|flower|tree|globe|earth|map|pin|navigation|compass/i.test(n),
  },
  {
    key: 'brand',
    label: '知名品牌',
    filter: (n) =>
      /github|google|apple|android|windows|chrome|alipay|wechat|twitter|facebook|youtube|slack|figma|docker|npm|git|react|vue/i.test(n),
  },
];

function EnhancedIconField(props: IconPickerProps) {
  const { fontSizeXL } = theme.useToken().token;
  const layout = useFormLayout();
  const {
    value,
    onChange,
    disabled,
    iconSize = fontSizeXL,
    searchable = true,
    onChangeComplete,
    apiClient,
  } = props;

  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const [activeTab, setActiveTab] = useState('Outlined');
  const [activeSubCat, setActiveSubCat] = useState('all');
  const [, setTick] = useState(0);

  // 当切换大分类时，重置子分类为 'all'
  useEffect(() => {
    setActiveSubCat('all');
  }, [activeTab]);

  // 内部状态同步以保证零延迟即时视觉反馈
  const [internalValue, setInternalValue] = useState<string | null | undefined>(value);
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  const effectiveValue = value !== undefined ? value : internalValue;

  // 解析当前图标名称与样式参数
  const { name: currentBaseName, color: currentColor, size: currentSize } = useMemo(
    () => parseIconValue(effectiveValue),
    [effectiveValue],
  );

  // 如果当前带有复合样式，确保全局引擎预先注册该复合组件
  useEffect(() => {
    if (effectiveValue && effectiveValue.includes('?')) {
      customIconsManager.registerStyledIcon(effectiveValue);
    }
  }, [effectiveValue]);

  // 监听自定义图标管理器的变更
  useEffect(() => {
    const unsub = customIconsManager.subscribe(() => {
      setTick((prev) => prev + 1);
    });
    return unsub;
  }, []);

  // 内置 Antd 图标列表
  const builtInIcons = useMemo(() => {
    return [...icons.keys()].filter((name) => {
      return (
        !name.includes('?') &&
        (name.endsWith('outlined') || name.endsWith('filled') || name.endsWith('twotone'))
      );
    });
  }, []);

  const groupIconData = useMemo(() => groupByIconName(builtInIcons), [builtInIcons]);

  // 自定义图标数据
  const allCustomIcons = customIconsManager.getAllIcons();
  const customCategories = customIconsManager.getCategories();

  // 过滤后的内置图标
  const filteredBuiltInIcons = useMemo(() => {
    const q = searchVal.trim().toLowerCase();
    if (!q) return builtInIcons;
    return builtInIcons.filter((i) => i.toLowerCase().includes(q));
  }, [builtInIcons, searchVal]);

  // 过滤后的自定义图标
  const filteredCustomIcons = useMemo(() => {
    const q = searchVal.trim().toLowerCase();
    if (!q) return allCustomIcons;
    return allCustomIcons.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        (item.title && item.title.toLowerCase().includes(q)),
    );
  }, [allCustomIcons, searchVal]);

  const handleSearch = debounce((text: string) => {
    setSearchVal(text || '');
  }, 200);

  const style: React.CSSProperties = {
    width: '28em',
    height: '22em',
    overflowY: 'auto',
    padding: '4px 0',
  };

  // 分类下拉分组选项（采用下拉分组，彻底消除长条按钮堆叠）
  const categorySelectOptions = useMemo(() => {
    const groups: any[] = [
      {
        label: '官方内置图标',
        options: [
          { label: '线框风格 (Outlined)', value: 'Outlined' },
          { label: '实底风格 (Filled)', value: 'Filled' },
          { label: '双色风格 (TwoTone)', value: 'TwoTone' },
        ],
      },
    ];

    if (customCategories.length > 0) {
      const labelMap: Record<string, string> = {
        caomei: '草莓图标库 (caomei)',
        lucide: 'Lucide 精工图标库 (lucide)',
        streamline: 'Streamline 核心图库 (streamline)',
        'streamline-logos': 'Streamline 知名品牌 (streamline-logos)',
        'streamline-emojis': 'Streamline 高清表情 (streamline-emojis)',
        ri: 'Remix Icon (ri)',
        tabler: 'Tabler 图标库 (tabler)',
        'simple-icons': 'Simple Icons 品牌 (simple-icons)',
        solar: 'Solar 现代图标库 (solar)',
        custom: t('Custom') || '自定义',
      };
      groups.push({
        label: '扩展与外部图库',
        options: customCategories.map((c) => ({
          label: labelMap[c] || c,
          value: `custom:${c}`,
        })),
      });
    }

    return groups;
  }, [customCategories, t]);

  // 计算当前分类对应的子分类项列表（带数量统计）
  const currentSubCategories = useMemo(() => {
    // 1. 草莓图标库专用子分类
    if (activeTab === 'custom:caomei') {
      const iconsInCat = allCustomIcons.filter((i) => (i.category || 'custom') === 'caomei');
      return CAOMEI_SUB_CATEGORIES.map((sub) => {
        const count = iconsInCat.filter((item) => sub.filter(item.name, item)).length;
        return { ...sub, count };
      }).filter((s) => s.key === 'all' || s.count > 0);
    }

    // 2. 所有其他外部与自定义图标库（如 Lucide、Remix、Tabler、Solar 等）
    if (activeTab.startsWith('custom:')) {
      const targetCat = activeTab.replace('custom:', '');
      const iconsInCat = allCustomIcons.filter((i) => (i.category || 'custom') === targetCat);
      return UNIVERSAL_ICONIFY_SUB_CATEGORIES.map((sub) => {
        const count = iconsInCat.filter((item) => sub.filter(item.name, item)).length;
        return { ...sub, count };
      }).filter((s) => s.key === 'all' || s.count > 0);
    }

    // 3. 系统官方内置图标（线框 / 实底 / 双色）
    const list = groupIconData[activeTab] || [];
    return BUILTIN_SUB_CATEGORIES.map((sub) => {
      const count = list.filter((key) => sub.filter(key)).length;
      return { ...sub, count };
    }).filter((s) => s.key === 'all' || s.count > 0);
  }, [activeTab, allCustomIcons, groupIconData]);

  // 选中图标并保留当前已配置的颜色与尺寸
  const handleSelectIcon = (key: string) => {
    const nextVal = formatIconValue(key, currentColor, currentSize);
    if (nextVal && nextVal.includes('?')) {
      customIconsManager.registerStyledIcon(nextVal);
    }
    setInternalValue(nextVal);
    onChange?.(nextVal);
    onChangeComplete?.(nextVal);
    setVisible(false);
  };

  // 变更颜色
  const handleColorChange = (newColor: string | undefined) => {
    if (!currentBaseName) return;
    const nextVal = formatIconValue(currentBaseName, newColor, currentSize);
    if (nextVal && nextVal.includes('?')) {
      customIconsManager.registerStyledIcon(nextVal);
    }
    setInternalValue(nextVal);
    onChange?.(nextVal);
    onChangeComplete?.(nextVal);
  };

  // 变更大小
  const handleSizeChange = (newSize: string | undefined) => {
    if (!currentBaseName) return;
    const nextVal = formatIconValue(currentBaseName, currentColor, newSize);
    if (nextVal && nextVal.includes('?')) {
      customIconsManager.registerStyledIcon(nextVal);
    }
    setInternalValue(nextVal);
    onChange?.(nextVal);
    onChangeComplete?.(nextVal);
  };

  const handleDeleteCustomIcon = async (e: React.MouseEvent, item: CustomIconItem) => {
    e.stopPropagation();
    try {
      await customIconsManager.deleteIcon({ id: item.id, name: item.name }, apiClient);
      if (currentBaseName === item.name) {
        onChange?.(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 渲染图标网格内容
  const renderContent = () => {
    // 搜索有关键词时的综合展示
    if (searchVal.trim()) {
      const matchBuiltIn = filteredBuiltInIcons;
      const matchCustom = filteredCustomIcons;

      if (matchBuiltIn.length === 0 && matchCustom.length === 0) {
        return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="未找到匹配的图标" />;
      }

      return (
        <Flex vertical gap="middle">
          {matchCustom.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#1677ff', marginBottom: 6 }}>
                自定义与外部图标库 ({matchCustom.length})
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {matchCustom.map((item) => (
                  <Tooltip key={item.name} title={`${item.title || item.name} (${item.name})`}>
                    <span
                      style={{
                        fontSize: iconSize,
                        padding: '4px 6px',
                        cursor: 'pointer',
                        borderRadius: 4,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: currentBaseName === item.name ? '#e6f4ff' : 'transparent',
                        border: currentBaseName === item.name ? '1px solid #1677ff' : '1px solid transparent',
                      }}
                      onClick={() => handleSelectIcon(item.name)}
                    >
                      <Icon type={item.name} />
                    </span>
                  </Tooltip>
                ))}
              </div>
            </div>
          )}

          {matchBuiltIn.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#8c8c8c', marginBottom: 6 }}>
                系统内置图标 ({matchBuiltIn.length})
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {matchBuiltIn.slice(0, 150).map((key) => (
                  <span
                    key={key}
                    title={key.replace(/outlined|filled|twotone$/i, '')}
                    style={{
                      fontSize: iconSize,
                      padding: '4px 6px',
                      cursor: 'pointer',
                      borderRadius: 4,
                      display: 'inline-flex',
                      backgroundColor: currentBaseName === key ? '#e6f4ff' : 'transparent',
                    }}
                    onClick={() => handleSelectIcon(key)}
                  >
                    <Icon type={key} />
                  </span>
                ))}
              </div>
            </div>
          )}
        </Flex>
      );
    }

    // 默认按分类选项卡展示
    const isCustomCat = activeTab.startsWith('custom:');

    if (isCustomCat) {
      const targetCat = activeTab.replace('custom:', '');
      let iconsInCat = allCustomIcons.filter((i) => (i.category || 'custom') === targetCat);

      // 如果选中了特定子分类
      if (activeSubCat !== 'all') {
        const subDef =
          activeTab === 'custom:caomei'
            ? CAOMEI_SUB_CATEGORIES.find((s) => s.key === activeSubCat)
            : UNIVERSAL_ICONIFY_SUB_CATEGORIES.find((s) => s.key === activeSubCat);
        if (subDef) {
          iconsInCat = iconsInCat.filter((item) => subDef.filter(item.name, item));
        }
      }

      if (iconsInCat.length === 0) {
        return (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              activeSubCat !== 'all' ? (
                <span>
                  该子分类下暂无图标，<a onClick={() => setActiveSubCat('all')}>查看全部</a>
                </span>
              ) : (
                <span>
                  该分类下暂无图标，
                  <a onClick={() => setModalOpen(true)}>立即添加 SVG</a>
                </span>
              )
            }
          />
        );
      }

      return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {iconsInCat.map((item) => (
            <Tooltip key={item.name} title={`${item.title || item.name} (${item.name})`}>
              <span
                style={{
                  fontSize: iconSize,
                  padding: '4px 6px',
                  cursor: 'pointer',
                  borderRadius: 4,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: currentBaseName === item.name ? '#e6f4ff' : 'transparent',
                  border: currentBaseName === item.name ? '1px solid #1677ff' : '1px solid transparent',
                  position: 'relative',
                }}
                onClick={() => handleSelectIcon(item.name)}
              >
                <Icon type={item.name} />
              </span>
            </Tooltip>
          ))}
        </div>
      );
    }

    // 系统内置样式标签
    let currentList = groupIconData[activeTab] || [];
    if (activeSubCat !== 'all') {
      const subDef = BUILTIN_SUB_CATEGORIES.find((s) => s.key === activeSubCat);
      if (subDef) {
        currentList = currentList.filter((key) => subDef.filter(key));
      }
    }

    if (currentList.length === 0) {
      return (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <span>
              该分类下暂无匹配图标，<a onClick={() => setActiveSubCat('all')}>查看全部</a>
            </span>
          }
        />
      );
    }

    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {currentList.map((key) => (
          <span
            key={key}
            title={key.replace(/outlined|filled|twotone$/i, '')}
            style={{
              fontSize: iconSize,
              padding: '4px 6px',
              cursor: 'pointer',
              borderRadius: 4,
              display: 'inline-flex',
              backgroundColor: currentBaseName === key ? '#e6f4ff' : 'transparent',
            }}
            onClick={() => handleSelectIcon(key)}
          >
            <Icon type={key} />
          </span>
        ))}
      </div>
    );
  };

  const showSubSidebar = currentSubCategories.length > 1 && !searchVal.trim();
  const containerStyle: React.CSSProperties = {
    width: showSubSidebar ? '33em' : '28em',
    height: '22em',
    display: 'flex',
    overflow: 'hidden',
  };

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center' }}>
      {/* 紧凑一体化按钮组：边框贴合、视觉统一、毫无散落冗余感 */}
      <Space.Compact style={{ display: 'inline-flex', verticalAlign: 'middle' }}>
        {/* 1. 图标主触发按钮 */}
        <Popover
          placement="bottomLeft"
          open={visible}
          onOpenChange={(val) => {
            if (disabled) return;
            setVisible(val);
          }}
          trigger="click"
          title={
            <div style={{ padding: '2px 0 6px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* 精致紧凑工具栏：将原本分散的标题、搜索与一长串分类按钮浓缩为一行 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {searchable && (
                  <Search
                    placeholder="搜索图标名称或标识..."
                    allowClear
                    size="middle"
                    style={{ flex: 1, height: 32 }}
                    onChange={(e) => handleSearch(e.target.value)}
                  />
                )}
                {!searchVal.trim() && (
                  <Select
                    size="middle"
                    value={activeTab}
                    onChange={(val) => setActiveTab(val)}
                    options={categorySelectOptions}
                    style={{ width: 175, height: 32 }}
                    popupMatchSelectWidth={false}
                  />
                )}
                <Tooltip title="自定义输入 SVG 或批量导入图标库">
                  <Button
                    type="dashed"
                    size="middle"
                    icon={<PlusOutlined />}
                    style={{ height: 32 }}
                    onClick={() => setModalOpen(true)}
                  >
                    导入
                  </Button>
                </Tooltip>
              </div>
            </div>
          }
          content={
            <div style={containerStyle}>
              {/* 左侧：图标网格展示与独立纵向滚动 */}
              <div
                style={{
                  flex: 1,
                  height: '100%',
                  overflowY: 'auto',
                  padding: '4px 6px 4px 0',
                }}
              >
                {renderContent()}
              </div>

              {/* 右侧：子分类导航栏（填充原本空白区域） */}
              {showSubSidebar && (
                <div
                  style={{
                    width: 96,
                    height: '100%',
                    overflowY: 'auto',
                    borderLeft: '1px solid #f0f0f0',
                    padding: '2px 0 2px 6px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: '#8c8c8c',
                      padding: '2px 4px 4px',
                      fontWeight: 600,
                      borderBottom: '1px dashed #f0f0f0',
                      marginBottom: 2,
                    }}
                  >
                    子分类
                  </div>
                  {currentSubCategories.map((sub) => {
                    const isActive = activeSubCat === sub.key;
                    return (
                      <div
                        key={sub.key}
                        onClick={() => setActiveSubCat(sub.key)}
                        style={{
                          padding: '4px 6px',
                          borderRadius: 4,
                          fontSize: 12,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          backgroundColor: isActive ? '#e6f4ff' : 'transparent',
                          color: isActive ? '#1677ff' : '#595959',
                          fontWeight: isActive ? 600 : 400,
                          transition: 'all 0.15s ease',
                          userSelect: 'none',
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) e.currentTarget.style.backgroundColor = '#f5f5f5';
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {sub.label}
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            color: isActive ? '#1677ff' : '#bfbfbf',
                            transform: 'scale(0.88)',
                          }}
                        >
                          {sub.count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          }
        >
          <Button
            size={layout.size as any}
            disabled={disabled}
            style={{
              minWidth: 130,
              textAlign: 'left',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            {currentBaseName ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <RenderPreviewIcon
                  name={currentBaseName}
                  color={currentColor}
                  size={currentSize}
                />
                <span style={{ fontSize: 12, color: '#595959', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {currentBaseName}
                </span>
              </span>
            ) : (
              <span style={{ color: '#8c8c8c' }}>{t('Select icon') || '选择图标'}</span>
            )}
          </Button>
        </Popover>

        {/* 2. 颜色配置按钮（内嵌在紧凑按钮组中） */}
        <Popover
          trigger="click"
          placement="bottom"
          title={<div style={{ fontWeight: 600, fontSize: 13 }}>配置图标颜色</div>}
          content={
            <div style={{ width: 220, padding: 4 }}>
              <div style={{ marginBottom: 8, fontSize: 12, color: '#8c8c8c' }}>预设主题色：</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, marginBottom: 12 }}>
                {PRESET_ICON_COLORS.map((c) => (
                  <Tooltip title={c.label} key={c.value}>
                    <div
                      onClick={() => handleColorChange(c.value)}
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 4,
                        backgroundColor: c.value,
                        cursor: 'pointer',
                        border: currentColor === c.value ? '2px solid #000' : '1px solid #d9d9d9',
                        boxShadow: currentColor === c.value ? '0 0 0 2px rgba(22, 119, 255, 0.4)' : undefined,
                        transition: 'all 0.15s',
                      }}
                    />
                  </Tooltip>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 12 }}>自定义:</span>
                <input
                  type="color"
                  value={currentColor || '#1677ff'}
                  onChange={(e) => handleColorChange(e.target.value)}
                  style={{ width: 32, height: 26, padding: 0, border: 'none', cursor: 'pointer', background: 'none' }}
                />
                <Input
                  size="small"
                  style={{ width: 100, fontSize: 12 }}
                  value={currentColor || ''}
                  placeholder="#1677ff"
                  onChange={(e) => handleColorChange(e.target.value)}
                />
              </div>
              {currentColor && (
                <Button size="small" type="dashed" block icon={<UndoOutlined />} onClick={() => handleColorChange(undefined)}>
                  恢复默认颜色
                </Button>
              )}
            </div>
          }
        >
          <Tooltip title="配置图标颜色">
            <Button
              size={layout.size as any}
              disabled={disabled || !currentBaseName}
              style={{ padding: '0 8px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              <BgColorsOutlined style={{ color: currentColor || '#1677ff', fontSize: 14 }} />
              <span
                style={{
                  display: 'inline-block',
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  backgroundColor: currentColor || 'transparent',
                  border: currentColor ? '1px solid #d9d9d9' : '1px dashed #bfbfbf',
                }}
              />
            </Button>
          </Tooltip>
        </Popover>

        {/* 3. 大小配置按钮（内嵌在紧凑按钮组中） */}
        <Popover
          trigger="click"
          placement="bottom"
          title={<div style={{ fontWeight: 600, fontSize: 13 }}>配置图标尺寸</div>}
          content={
            <div style={{ width: 220, padding: 4 }}>
              <div style={{ marginBottom: 8, fontSize: 12, color: '#8c8c8c' }}>预设规格：</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, marginBottom: 12 }}>
                {PRESET_ICON_SIZES.map((s) => (
                  <Button
                    key={s.value}
                    size="small"
                    type={currentSize === s.value ? 'primary' : 'default'}
                    onClick={() => handleSizeChange(s.value)}
                    style={{ fontSize: 12 }}
                  >
                    {s.label}
                  </Button>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 12 }}>自定义:</span>
                <Input
                  size="small"
                  style={{ width: 110, fontSize: 12 }}
                  value={currentSize || ''}
                  placeholder="如 20px"
                  onChange={(e) => handleSizeChange(e.target.value)}
                />
              </div>
              {currentSize && (
                <Button size="small" type="dashed" block icon={<UndoOutlined />} onClick={() => handleSizeChange(undefined)}>
                  恢复默认大小
                </Button>
              )}
            </div>
          }
        >
          <Tooltip title="配置图标大小">
            <Button
              size={layout.size as any}
              disabled={disabled || !currentBaseName}
              style={{ padding: '0 8px', display: 'inline-flex', alignItems: 'center', gap: 3 }}
            >
              <FontSizeOutlined style={{ fontSize: 14 }} />
              <span style={{ fontSize: 12, color: currentSize ? '#1677ff' : '#8c8c8c' }}>
                {currentSize ? currentSize.replace('px', '') : '默认'}
              </span>
            </Button>
          </Tooltip>
        </Popover>

        {/* 4. 清除按钮 */}
        {effectiveValue && !disabled && (
          <Tooltip title="清空图标">
            <Button
              size={layout.size as any}
              icon={<CloseOutlined style={{ fontSize: 12 }} />}
              onClick={() => {
                setInternalValue(null);
                onChange?.(null);
                onChangeComplete?.(null);
              }}
            />
          </Tooltip>
        )}
      </Space.Compact>

      {/* 自定义 SVG / 导入弹窗 */}
      <CustomIconModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        apiClient={apiClient}
        onSuccess={(newItem) => {
          setActiveTab(`custom:${newItem.category || 'custom'}`);
          handleSelectIcon(newItem.name);
        }}
      />
    </div>
  );
}

export const EnhancedIconPicker = connect(
  EnhancedIconField,
  mapProps((props: IconPickerProps, field) => {
    return {
      ...props,
      suffix: (
        <span>{field?.['loading'] || field?.['validating'] ? <LoadingOutlined /> : props.suffix}</span>
      ),
    };
  }),
  mapReadPretty((props: IconPickerReadPrettyProps) => {
    if (!isValid(props.value)) {
      return <div></div>;
    }
    const { name, color, size } = parseIconValue(props.value);
    return (
      <RenderPreviewIcon
        name={name || props.value}
        color={color}
        size={size}
      />
    );
  }),
);

export default EnhancedIconPicker;
