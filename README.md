# @nocobase/plugin-custom-icons

> **NocoBase 自定义图标库与海量 SVG 扩展插件 (Custom Icons Plugin for NocoBase)**  
> 支持在 NocoBase 中灵活导入、管理海量开源图标库及自定义 SVG，并无缝集成到官方原生 `IconPicker` 图标选择器与 `<Icon />` 渲染体系中。

---

## ✨ 核心特性

1. **海量主流开源图标库一键导入**：
   - **Streamline HQ**：支持 Streamline Regular 几何精工核心库及 Streamline Logos 全球品牌与产品 Logo。
   - **Iconmonstr**：支持德国知名设计师 Alexander Kahlkopf 打造的黑白极简矢量图标库（离线本地归档 4,784 款官方矢量图标，毫秒级极速扩容安装）。
   - **创造狮草莓图标库 (Caomei Icon)**：原生 ZIP 下载与内置高保真离线归档，380+ 款精美设计图标。
   - **Iconify 全生态互通**：支持实时在线探测与一键导入任意 Iconify 开源图标集（Lucide、Remix Icon、Tabler、Simple Icons 等 150+ 热门图集，覆盖 200,000+ 矢量图标）。

2. **独立 JSON 配置驱动**：
   - 官方仓库列表与扩展库全面收录于 `src/server/assets/official-repos.json`；
   - 支持动态热加载，修改配置即刻生效，解耦架构清晰简洁。

3. **双重持久化与高可用保障**：
   - 安装的图标同时持久化至 NocoBase 系统核心数据库与本地资产文件；
   - 系统重启、升级或迁移时图标资产永久保留，杜绝失效。

4. **选择器搜索栏原生无缝增强**：
   - 在菜单编辑、页面 Tab、操作按钮等原生选择图标浮层中，搜索栏右侧新增「+ 自定义SVG」快捷入口；
   - 支持粘贴任意 `<svg>...</svg>` 代码，输入唯一标识及中文名称，实时预览渲染效果（16px / 24px / 32px 及色彩），一键保存入库。

5. **多风格分类栏动态扩展与筛选**：
   - 在原生的 `[线框风格] [实底风格] [双色风格]` 旁边，动态追加 `[自定义]` 及导入库（如 `iconmonstr`、`streamline` 等）专属分类标签；
   - 在分类网格中直观预览、点击选中，支持鼠标悬浮查看标识及快捷删除维护。

6. **全端原生自适应渲染**：
   - 深度集成 `@nocobase/client-v2` 的 `registerIcon` 机制；
   - 系统左侧/顶部菜单项、面包屑导航、标签页、按钮操作项、数据表字段等任意用到 `<Icon type={...} />` 的地方均能原生渲染；
   - 自动清洗和适配 `1em` 尺寸与 `currentColor` 主题色彩，保证与系统原生图标的对齐与变色行为 100% 一致。

---

## 🚀 安装与部署

### 方式 1：源码环境编译与启用
在 NocoBase 根目录下执行：

```bash
# 构建插件
yarn nocobase build @nocobase/plugin-custom-icons

# 启用插件
yarn pm enable @nocobase/plugin-custom-icons
```
### 方式 2：使用官方打包产物 (.tgz) 导入
在生产环境或其他 NocoBase 应用中，可通过官方命令行或插件管理器导入：

```bash
# 通过官方命令行导入插件包
yarn nocobase plugin import storage/tar/@nocobase/plugin-custom-icons-0.1.4.tgz

# 激活启用插件
yarn pm enable @nocobase/plugin-custom-icons
```

也可以直接解压到目标系统的 `./storage/plugins/@nocobase/plugin-custom-icons` 目录下。

---

## 📦 官方标准打包构建

本插件完全遵循 [NocoBase 官方插件构建规范](https://docs.nocobase.com/cn/plugin-development/build)。

在项目根目录下执行以下命令即可生成官方标准插件发布包：

```bash
# 方案 A：一步构建并打包生成 .tgz
yarn nocobase build @nocobase/plugin-custom-icons --tar

# 方案 B：独立打包已构建插件
yarn nocobase tar @nocobase/plugin-custom-icons
```

打包成功后，产物归档文件将自动生成于：
`storage/tar/@nocobase/plugin-custom-icons-0.1.4.tgz`

---

## 📄 开源许可

[AGPL-3.0 License](LICENSE)
