export default {
  name: 'custom_icons',
  title: '自定义图标库',
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
      name: 'name',
      type: 'string',
      unique: true,
      index: true,
      comment: '图标全局唯一标识',
    },
    {
      name: 'title',
      type: 'string',
      comment: '图标显示名称',
    },
    {
      name: 'category',
      type: 'string',
      index: true,
      defaultValue: 'custom',
      comment: '所属分类，如 custom、iconfont 等',
    },
    {
      name: 'svg',
      type: 'text',
      comment: 'SVG 代码内容',
    },
    {
      name: 'source',
      type: 'string',
      defaultValue: 'manual',
      comment: '来源：manual(手动输入)、upload(文件上传)、iconfont(网络导入)、preset(预设)',
    },
    {
      name: 'sort',
      type: 'integer',
      defaultValue: 0,
      comment: '排序权重',
    },
  ],
};
