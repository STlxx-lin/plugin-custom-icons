import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Table, Typography, Tag, Popconfirm, message, Input, Select, Tabs } from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  ReloadOutlined,
  AppstoreAddOutlined,
  EditOutlined,
  AppstoreOutlined,
  ShoppingOutlined,
} from '@ant-design/icons';
import { customIconsManager, CustomIconItem } from '../services/custom-icons-manager';
import { sanitizeAndFormatSvg } from '../utils/svg-helper';
import { CustomIconModal } from '../components/CustomIconModal';
import { EditIconModal } from '../components/EditIconModal';
import { IconRepoMarket } from '../components/IconRepoMarket';

const { Title, Text } = Typography;

export const CustomIconsSettingsPage: React.FC<{ api: any }> = ({ api }) => {
  const [activeTab, setActiveTab] = useState('installed');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIcon, setEditingIcon] = useState<CustomIconItem | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [icons, setIcons] = useState<CustomIconItem[]>([]);
  const [categories, setCategories] = useState<string[]>(['custom']);
  const [filterCat, setFilterCat] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      await customIconsManager.loadIcons(api);
      setIcons(customIconsManager.getAllIcons());
      setCategories(customIconsManager.getCategories());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = customIconsManager.subscribe(() => {
      setIcons(customIconsManager.getAllIcons());
      setCategories(customIconsManager.getCategories());
    });
    return unsub;
  }, []);

  const handleDelete = async (record: CustomIconItem) => {
    try {
      await customIconsManager.deleteIcon({ id: record.id, name: record.name }, api);
      message.success(`图标 [${record.name}] 已删除`);
    } catch (err: any) {
      message.error(err?.message || '删除失败');
    }
  };

  const filteredIcons = icons.filter((item) => {
    const matchCat = filterCat === 'all' || item.category === filterCat;
    const matchSearch =
      !searchText ||
      item.name.toLowerCase().includes(searchText.toLowerCase()) ||
      (item.title && item.title.toLowerCase().includes(searchText.toLowerCase()));
    return matchCat && matchSearch;
  });

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <Title level={4} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AppstoreAddOutlined style={{ color: '#1677ff' }} />
              自定义图标库与 SVG 扩展
            </Title>
            <Text type="secondary">
              支持一键安装官方与开源图标库（创造狮草莓图标库等）、自定义上传 SVG，并在系统菜单和各处原生无缝渲染。
            </Text>
          </div>

          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadData} loading={loading}>
              刷新数据
            </Button>
            {activeTab === 'installed' && (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
                添加 / 批量导入图标
              </Button>
            )}
          </Space>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'installed',
              label: (
                <span>
                  <AppstoreOutlined /> 已安装图标 ({icons.length})
                </span>
              ),
              children: (
                <div style={{ paddingTop: 8 }}>
                  <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
                    <Space>
                      <span>分类筛选：</span>
                      <Select
                        style={{ width: 180 }}
                        value={filterCat}
                        onChange={setFilterCat}
                        options={[
                          { label: '全部分类', value: 'all' },
                          ...categories.map((c) => ({
                            label: c === 'caomei' ? '草莓图标库 (caomei)' : c,
                            value: c,
                          })),
                        ]}
                      />
                    </Space>

                    <Input.Search
                      placeholder="搜索图标名称或标识"
                      style={{ width: 260 }}
                      allowClear
                      onSearch={setSearchText}
                      onChange={(e) => setSearchText(e.target.value)}
                    />
                  </div>

                  <Table
                    dataSource={filteredIcons}
                    rowKey="name"
                    loading={loading}
                    pagination={{ pageSize: 12, showTotal: (total) => `共 ${total} 个图标` }}
                    columns={[
                      {
                        title: '图标预览',
                        dataIndex: 'svg',
                        width: 90,
                        align: 'center',
                        render: (svg: string) => (
                          <span
                            style={{ fontSize: 24, display: 'inline-flex', verticalAlign: 'middle' }}
                            dangerouslySetInnerHTML={{ __html: sanitizeAndFormatSvg(svg) }}
                          />
                        ),
                      },
                      {
                        title: '唯一标识 (Name)',
                        dataIndex: 'name',
                        render: (name: string) => <Text copyable code>{name}</Text>,
                      },
                      {
                        title: '显示名称 (Title)',
                        dataIndex: 'title',
                        render: (title: string, r) => title || r.name,
                      },
                      {
                        title: '分类 (Category)',
                        dataIndex: 'category',
                        render: (cat: string) => (
                          <Tag color={cat === 'caomei' ? 'magenta' : 'blue'}>
                            {cat === 'caomei' ? '草莓图标库 (caomei)' : (cat || 'custom')}
                          </Tag>
                        ),
                      },
                      {
                        title: '来源',
                        dataIndex: 'source',
                        render: (src: string) => {
                          if (src?.startsWith('iconify:')) {
                            return <Tag color="geekblue">Iconify: {src.replace('iconify:', '')}</Tag>;
                          }
                          if (src?.startsWith('repo:')) {
                            return <Tag color="cyan">仓库: {src.replace('repo:', '')}</Tag>;
                          }
                          const map: Record<string, string> = {
                            manual: '手动输入',
                            upload: '文件上传',
                            batch: '批量导入',
                            preset: '精选预设',
                          };
                          return <Tag>{map[src] || src || '自定义'}</Tag>;
                        },
                      },
                      {
                        title: '操作',
                        width: 140,
                        align: 'center',
                        render: (_, record) => (
                          <Space size="small">
                            <Button
                              type="link"
                              size="small"
                              icon={<EditOutlined />}
                              onClick={() => {
                                setEditingIcon(record);
                                setEditModalOpen(true);
                              }}
                            >
                              编辑
                            </Button>
                            <Popconfirm
                              title="确认删除该图标？"
                              description="删除后，已引用此图标的菜单项或页面将无法显示该图标。"
                              okText="删除"
                              cancelText="取消"
                              onConfirm={() => handleDelete(record)}
                            >
                              <Button type="link" danger size="small" icon={<DeleteOutlined />}>
                                删除
                              </Button>
                            </Popconfirm>
                          </Space>
                        ),
                      },
                    ]}
                  />
                </div>
              ),
            },
            {
              key: 'repos',
              label: (
                <span>
                  <ShoppingOutlined /> Icon 仓库管理
                </span>
              ),
              children: <IconRepoMarket apiClient={api} onRepoChanged={() => loadData()} />,
            },
          ]}
        />
      </Card>

      <CustomIconModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        apiClient={api}
        onSuccess={() => loadData()}
      />

      <EditIconModal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingIcon(null);
        }}
        icon={editingIcon}
        apiClient={api}
        onSuccess={() => loadData()}
      />
    </div>
  );
};

export default CustomIconsSettingsPage;
