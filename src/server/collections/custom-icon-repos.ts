export default {
  name: 'custom_icon_repos',
  title: '图标仓库与市场',
  category: 'system',
  hidden: false,
  fields: [
    {
      name: 'id',
      type: 'bigInt',
      autoIncrement: true,
      primaryKey: true,
    },
    {
      name: 'key',
      type: 'string',
      unique: true,
      index: true,
      comment: '仓库全局唯一标识，如 caomei',
    },
    {
      name: 'title',
      type: 'string',
      comment: '仓库标题，如 草莓图标库 (Caomei)',
    },
    {
      name: 'category',
      type: 'string',
      comment: '关联图标分类',
    },
    {
      name: 'version',
      type: 'string',
      comment: '版本号，如 2.0.0',
    },
    {
      name: 'homepage',
      type: 'string',
      comment: '官方主页链接',
    },
    {
      name: 'description',
      type: 'text',
      comment: '仓库说明描述',
    },
    {
      name: 'iconCount',
      type: 'integer',
      defaultValue: 0,
      comment: '包含图标总数',
    },
    {
      name: 'status',
      type: 'string',
      defaultValue: 'not_installed',
      comment: '安装状态：not_installed(未安装)、installing(安装中)、installed(已安装)',
    },
    {
      name: 'installedAt',
      type: 'date',
      comment: '安装时间',
    },
  ],
};
