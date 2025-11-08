import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  Form,
  Input,
  InputNumber,
  Switch,
  Button,
  Select,
  Tabs,
  message,
  Space,
  Typography,
  Divider,
  Table,
  Tag,
  Popconfirm,
  Modal,
  Row,
  Col,
} from 'antd';
import {
  SaveOutlined,
  ReloadOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { api } from '../services/api';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface TargetConfig {
  type: 'illustration' | 'novel';
  tag?: string;
  limit?: number;
  searchTarget?: string;
  sort?: string;
  mode?: string;
  rankingMode?: string;
  rankingDate?: string;
  filterTag?: string;
  minBookmarks?: number;
  startDate?: string;
  endDate?: string;
  seriesId?: number;
  novelId?: number;
  [key: string]: any;
}

export default function Config() {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [targetForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('basic');
  const [targetModalVisible, setTargetModalVisible] = useState(false);
  const [editingTarget, setEditingTarget] = useState<TargetConfig | null>(null);

  const { data: configData, isLoading } = useQuery({
    queryKey: ['config'],
    queryFn: () => api.getConfig(),
  });

  useEffect(() => {
    if (configData?.data) {
      form.setFieldsValue(configData.data);
    }
  }, [configData, form]);

  const updateConfigMutation = useMutation({
    mutationFn: (values: any) => api.updateConfig(values),
    onSuccess: () => {
      message.success('配置保存成功');
      queryClient.invalidateQueries({ queryKey: ['config'] });
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.error || '保存配置失败';
      const details = error.response?.data?.details;
      if (details && Array.isArray(details)) {
        message.error(`${errorMsg}: ${details.join(', ')}`);
      } else {
        message.error(errorMsg);
      }
    },
  });

  const validateConfigMutation = useMutation({
    mutationFn: (values: any) => api.validateConfig(values),
    onSuccess: (data) => {
      if (data.data.valid) {
        message.success('配置验证通过');
      } else {
        message.error(`配置验证失败: ${data.data.errors?.join(', ')}`);
      }
    },
  });

  const handleSave = () => {
    form.validateFields().then((values) => {
      updateConfigMutation.mutate(values);
    });
  };

  const handleValidate = () => {
    form.validateFields().then((values) => {
      validateConfigMutation.mutate(values);
    });
  };

  const handleAddTarget = () => {
    setEditingTarget(null);
    targetForm.resetFields();
    setTargetModalVisible(true);
  };

  const handleEditTarget = (target: TargetConfig, index: number) => {
    setEditingTarget({ ...target, _index: index });
    targetForm.setFieldsValue(target);
    setTargetModalVisible(true);
  };

  const handleDeleteTarget = (index: number) => {
    const targets = form.getFieldValue('targets') || [];
    targets.splice(index, 1);
    form.setFieldsValue({ targets });
    message.success('下载目标已删除');
  };

  const handleSaveTarget = () => {
    targetForm.validateFields().then((values) => {
      const targets = form.getFieldValue('targets') || [];
      if (editingTarget && typeof editingTarget._index === 'number') {
        targets[editingTarget._index] = values;
      } else {
        targets.push(values);
      }
      form.setFieldsValue({ targets });
      setTargetModalVisible(false);
      message.success('下载目标已保存');
    });
  };

  const targets = form.getFieldValue('targets') || [];

  const targetColumns = [
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => (
        <Tag color={type === 'illustration' ? 'blue' : 'green'}>
          {type === 'illustration' ? '插画' : '小说'}
        </Tag>
      ),
    },
    {
      title: '标签/模式',
      key: 'tag',
      render: (_: any, record: TargetConfig) => {
        if (record.mode === 'ranking') {
          return `排行榜: ${record.rankingMode || 'day'}`;
        }
        if (record.seriesId) {
          return `系列: ${record.seriesId}`;
        }
        if (record.novelId) {
          return `小说: ${record.novelId}`;
        }
        return record.tag || '-';
      },
    },
    {
      title: '限制',
      dataIndex: 'limit',
      key: 'limit',
      width: 80,
      render: (limit: number) => limit || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: TargetConfig, index: number) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditTarget(record, index)}
            size="small"
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个下载目标吗？"
            onConfirm={() => handleDeleteTarget(index)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              size="small"
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (isLoading) {
    return <div>加载中...</div>;
  }

  return (
    <div>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <Title level={2} style={{ margin: 0 }}>
          配置管理
        </Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => queryClient.invalidateQueries({ queryKey: ['config'] })}>
            刷新
          </Button>
          <Button icon={<CheckCircleOutlined />} onClick={handleValidate} loading={validateConfigMutation.isPending}>
            验证配置
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={updateConfigMutation.isPending}
          >
            保存配置
          </Button>
        </Space>
      </Space>

      <Form form={form} layout="vertical">
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          {/* 基础配置 */}
          <Tabs.TabPane tab="基础配置" key="basic">
            <Card>
              <Form.Item label="日志级别" name="logLevel">
                <Select>
                  <Option value="debug">Debug</Option>
                  <Option value="info">Info</Option>
                  <Option value="warn">Warn</Option>
                  <Option value="error">Error</Option>
                </Select>
              </Form.Item>

              <Form.Item label="初始延迟 (毫秒)" name="initialDelay">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Card>
          </Tabs.TabPane>

          {/* Pixiv 凭证 */}
          <Tabs.TabPane tab="Pixiv 凭证" key="pixiv">
            <Card>
              <Text type="secondary">
                敏感信息已隐藏。如需修改，请使用命令行工具或直接编辑配置文件。
              </Text>
              <Divider />
              <Form.Item label="Client ID" name={['pixiv', 'clientId']}>
                <Input disabled />
              </Form.Item>
              <Form.Item label="Refresh Token" name={['pixiv', 'refreshToken']}>
                <Input.Password disabled placeholder="***" />
              </Form.Item>
              <Form.Item label="User Agent" name={['pixiv', 'userAgent']}>
                <Input disabled />
              </Form.Item>
            </Card>
          </Tabs.TabPane>

          {/* 网络配置 */}
          <Tabs.TabPane tab="网络配置" key="network">
            <Card>
              <Form.Item label="请求超时 (毫秒)" name={['network', 'timeoutMs']}>
                <InputNumber min={1000} style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item label="重试次数" name={['network', 'retries']}>
                <InputNumber min={0} max={10} style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item label="重试延迟 (毫秒)" name={['network', 'retryDelay']}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>

              <Divider>代理设置</Divider>

              <Form.Item label="启用代理" name={['network', 'proxy', 'enabled']} valuePropName="checked">
                <Switch />
              </Form.Item>

              <Form.Item
                noStyle
                shouldUpdate={(prevValues, currentValues) =>
                  prevValues.network?.proxy?.enabled !== currentValues.network?.proxy?.enabled
                }
              >
                {({ getFieldValue }) =>
                  getFieldValue(['network', 'proxy', 'enabled']) ? (
                    <>
                      <Form.Item label="代理主机" name={['network', 'proxy', 'host']}>
                        <Input />
                      </Form.Item>
                      <Form.Item label="代理端口" name={['network', 'proxy', 'port']}>
                        <InputNumber min={1} max={65535} style={{ width: '100%' }} />
                      </Form.Item>
                      <Form.Item label="代理协议" name={['network', 'proxy', 'protocol']}>
                        <Select>
                          <Option value="http">HTTP</Option>
                          <Option value="https">HTTPS</Option>
                          <Option value="socks4">SOCKS4</Option>
                          <Option value="socks5">SOCKS5</Option>
                        </Select>
                      </Form.Item>
                      <Form.Item label="用户名" name={['network', 'proxy', 'username']}>
                        <Input />
                      </Form.Item>
                      <Form.Item label="密码" name={['network', 'proxy', 'password']}>
                        <Input.Password />
                      </Form.Item>
                    </>
                  ) : null
                }
              </Form.Item>
            </Card>
          </Tabs.TabPane>

          {/* 存储配置 */}
          <Tabs.TabPane tab="存储配置" key="storage">
            <Card>
              <Form.Item label="数据库路径" name={['storage', 'databasePath']}>
                <Input />
              </Form.Item>

              <Form.Item label="下载目录" name={['storage', 'downloadDirectory']}>
                <Input />
              </Form.Item>

              <Form.Item label="插画目录" name={['storage', 'illustrationDirectory']}>
                <Input />
              </Form.Item>

              <Form.Item label="小说目录" name={['storage', 'novelDirectory']}>
                <Input />
              </Form.Item>

              <Form.Item label="插画组织方式" name={['storage', 'illustrationOrganization']}>
                <Select>
                  <Option value="flat">扁平结构</Option>
                  <Option value="byAuthor">按作者</Option>
                  <Option value="byTag">按标签</Option>
                  <Option value="byDate">按日期</Option>
                  <Option value="byAuthorAndTag">按作者和标签</Option>
                  <Option value="byDateAndAuthor">按日期和作者</Option>
                </Select>
              </Form.Item>

              <Form.Item label="小说组织方式" name={['storage', 'novelOrganization']}>
                <Select>
                  <Option value="flat">扁平结构</Option>
                  <Option value="byAuthor">按作者</Option>
                  <Option value="byTag">按标签</Option>
                  <Option value="byDate">按日期</Option>
                  <Option value="byAuthorAndTag">按作者和标签</Option>
                  <Option value="byDateAndAuthor">按日期和作者</Option>
                </Select>
              </Form.Item>
            </Card>
          </Tabs.TabPane>

          {/* 调度器配置 */}
          <Tabs.TabPane tab="调度器配置" key="scheduler">
            <Card>
              <Form.Item label="启用调度器" name={['scheduler', 'enabled']} valuePropName="checked">
                <Switch />
              </Form.Item>

              <Form.Item label="Cron 表达式" name={['scheduler', 'cron']}>
                <Input placeholder="例如: 0 3 * * * (每天凌晨3点)" />
              </Form.Item>

              <Form.Item label="时区" name={['scheduler', 'timezone']}>
                <Input placeholder="例如: Asia/Shanghai" />
              </Form.Item>

              <Form.Item label="最大执行次数" name={['scheduler', 'maxExecutions']}>
                <InputNumber min={1} style={{ width: '100%' }} placeholder="留空表示无限制" />
              </Form.Item>

              <Form.Item label="最小执行间隔 (毫秒)" name={['scheduler', 'minInterval']}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item label="超时时间 (毫秒)" name={['scheduler', 'timeout']}>
                <InputNumber min={1000} style={{ width: '100%' }} placeholder="留空表示无超时" />
              </Form.Item>
            </Card>
          </Tabs.TabPane>

          {/* 下载配置 */}
          <Tabs.TabPane tab="下载配置" key="download">
            <Card>
              <Form.Item label="并发数" name={['download', 'concurrency']}>
                <InputNumber min={1} max={10} style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item label="最大重试次数" name={['download', 'maxRetries']}>
                <InputNumber min={0} max={10} style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item label="重试延迟 (毫秒)" name={['download', 'retryDelay']}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item label="超时时间 (毫秒)" name={['download', 'timeout']}>
                <InputNumber min={1000} style={{ width: '100%' }} />
              </Form.Item>
            </Card>
          </Tabs.TabPane>

          {/* 下载目标 */}
          <Tabs.TabPane tab="下载目标" key="targets">
            <Card
              title="下载目标列表"
              extra={
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAddTarget}>
                  添加目标
                </Button>
              }
            >
              <Table
                columns={targetColumns}
                dataSource={targets}
                rowKey={(_, index) => String(index)}
                pagination={false}
                locale={{ emptyText: '暂无下载目标，请点击"添加目标"按钮添加' }}
              />
            </Card>
          </Tabs.TabPane>
        </Tabs>
      </Form>

      {/* 下载目标编辑模态框 */}
      <Modal
        title={editingTarget ? '编辑下载目标' : '添加下载目标'}
        open={targetModalVisible}
        onOk={handleSaveTarget}
        onCancel={() => setTargetModalVisible(false)}
        width={600}
      >
        <Form form={targetForm} layout="vertical">
          <Form.Item label="类型" name="type" rules={[{ required: true }]}>
            <Select>
              <Option value="illustration">插画</Option>
              <Option value="novel">小说</Option>
            </Select>
          </Form.Item>

          <Form.Item label="模式" name="mode">
            <Select>
              <Option value="search">搜索模式</Option>
              <Option value="ranking">排行榜模式</Option>
            </Select>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.mode !== currentValues.mode}
          >
            {({ getFieldValue }) => {
              const mode = getFieldValue('mode') || 'search';
              if (mode === 'search') {
                return (
                  <>
                    <Form.Item label="标签" name="tag">
                      <Input placeholder="搜索标签" />
                    </Form.Item>
                    <Form.Item label="搜索目标" name="searchTarget">
                      <Select>
                        <Option value="partial_match_for_tags">部分匹配标签</Option>
                        <Option value="exact_match_for_tags">精确匹配标签</Option>
                        <Option value="title_and_caption">标题和说明</Option>
                      </Select>
                    </Form.Item>
                    <Form.Item label="排序" name="sort">
                      <Select>
                        <Option value="date_desc">日期降序</Option>
                        <Option value="date_asc">日期升序</Option>
                        <Option value="popular_desc">人气降序</Option>
                      </Select>
                    </Form.Item>
                  </>
                );
              } else {
                return (
                  <>
                    <Form.Item label="排行榜模式" name="rankingMode">
                      <Select>
                        <Option value="day">日榜</Option>
                        <Option value="week">周榜</Option>
                        <Option value="month">月榜</Option>
                        <Option value="day_male">男性日榜</Option>
                        <Option value="day_female">女性日榜</Option>
                        <Option value="day_ai">AI日榜</Option>
                      </Select>
                    </Form.Item>
                    <Form.Item label="排行榜日期" name="rankingDate">
                      <Input placeholder="YYYY-MM-DD 或 YESTERDAY" />
                    </Form.Item>
                    <Form.Item label="筛选标签" name="filterTag">
                      <Input placeholder="可选：筛选排行榜结果" />
                    </Form.Item>
                  </>
                );
              }
            }}
          </Form.Item>

          <Form.Item label="下载数量限制" name="limit">
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="最小收藏数" name="minBookmarks">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="开始日期" name="startDate">
            <Input placeholder="YYYY-MM-DD" />
          </Form.Item>

          <Form.Item label="结束日期" name="endDate">
            <Input placeholder="YYYY-MM-DD" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
