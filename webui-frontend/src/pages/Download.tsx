import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  Button,
  Table,
  Tag,
  Space,
  message,
  Modal,
  Select,
  Form,
  Spin,
  Typography,
  Descriptions,
} from 'antd';
import {
  PlayCircleOutlined,
  StopOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { api } from '../services/api';

const { Title, Text } = Typography;

export default function Download() {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [showStartModal, setShowStartModal] = useState(false);

  // Poll download status every 2 seconds
  const { data: statusData, isLoading: statusLoading } = useQuery({
    queryKey: ['download', 'status'],
    queryFn: () => api.getDownloadStatus(),
    refetchInterval: 2000,
  });

  // Get config to show available targets
  const { data: configData } = useQuery({
    queryKey: ['config'],
    queryFn: () => api.getConfig(),
  });

  const startDownloadMutation = useMutation({
    mutationFn: (values: { targetId?: string; config?: any }) =>
      api.startDownload(values.targetId, values.config),
    onSuccess: () => {
      message.success('下载任务已启动');
      setShowStartModal(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['download', 'status'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || '启动下载失败');
    },
  });

  const stopDownloadMutation = useMutation({
    mutationFn: (taskId: string) => api.stopDownload(taskId),
    onSuccess: () => {
      message.success('下载任务已停止');
      queryClient.invalidateQueries({ queryKey: ['download', 'status'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || '停止下载失败');
    },
  });

  const runAllMutation = useMutation({
    mutationFn: () => api.runAllDownloads(),
    onSuccess: () => {
      message.success('已开始下载所有目标');
      queryClient.invalidateQueries({ queryKey: ['download', 'status'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || '启动下载失败');
    },
  });

  const handleStart = (values: any) => {
    startDownloadMutation.mutate(values);
  };

  const handleStop = () => {
    if (statusData?.data?.activeTask?.taskId) {
      stopDownloadMutation.mutate(statusData.data.activeTask.taskId);
    }
  };

  const handleRunAll = () => {
    runAllMutation.mutate();
  };

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; icon: any; text: string }> = {
      running: { color: 'processing', icon: <ClockCircleOutlined />, text: '运行中' },
      completed: { color: 'success', icon: <CheckCircleOutlined />, text: '已完成' },
      failed: { color: 'error', icon: <CloseCircleOutlined />, text: '失败' },
      stopped: { color: 'default', icon: <StopOutlined />, text: '已停止' },
    };
    const statusInfo = statusMap[status] || statusMap.running;
    return (
      <Tag color={statusInfo.color} icon={statusInfo.icon}>
        {statusInfo.text}
      </Tag>
    );
  };

  const taskColumns = [
    {
      title: '任务ID',
      dataIndex: 'taskId',
      key: 'taskId',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (time: string) => new Date(time).toLocaleString(),
    },
    {
      title: '结束时间',
      dataIndex: 'endTime',
      key: 'endTime',
      render: (time: string | undefined) => (time ? new Date(time).toLocaleString() : '-'),
    },
    {
      title: '错误',
      dataIndex: 'error',
      key: 'error',
      render: (error: string | undefined) => (error ? <Text type="danger">{error}</Text> : '-'),
    },
  ];

  return (
    <div>
      <Title level={2}>下载任务</Title>

      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={() => setShowStartModal(true)}
            disabled={statusData?.data?.hasActiveTask}
            loading={startDownloadMutation.isPending}
          >
            启动下载
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRunAll}
            disabled={statusData?.data?.hasActiveTask}
            loading={runAllMutation.isPending}
          >
            下载所有目标
          </Button>
          <Button
            danger
            icon={<StopOutlined />}
            onClick={handleStop}
            disabled={!statusData?.data?.hasActiveTask}
            loading={stopDownloadMutation.isPending}
          >
            停止下载
          </Button>
        </Space>
      </Card>

      {statusData?.data?.activeTask && (
        <Card title="当前任务" style={{ marginBottom: 16 }}>
          <Descriptions column={2}>
            <Descriptions.Item label="任务ID">
              {statusData.data.activeTask.taskId}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              {getStatusTag(statusData.data.activeTask.status)}
            </Descriptions.Item>
            <Descriptions.Item label="开始时间">
              {new Date(statusData.data.activeTask.startTime).toLocaleString()}
            </Descriptions.Item>
            {statusData.data.activeTask.endTime && (
              <Descriptions.Item label="结束时间">
                {new Date(statusData.data.activeTask.endTime).toLocaleString()}
              </Descriptions.Item>
            )}
            {statusData.data.activeTask.error && (
              <Descriptions.Item label="错误" span={2}>
                <Text type="danger">{statusData.data.activeTask.error}</Text>
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>
      )}

      <Card title="任务历史">
        {statusLoading ? (
          <Spin />
        ) : (
          <Table
            columns={taskColumns}
            dataSource={statusData?.data?.allTasks || []}
            rowKey="taskId"
            pagination={{ pageSize: 10 }}
          />
        )}
      </Card>

      <Modal
        title="启动下载任务"
        open={showStartModal}
        onCancel={() => setShowStartModal(false)}
        onOk={() => form.submit()}
        confirmLoading={startDownloadMutation.isPending}
      >
        <Form form={form} onFinish={handleStart} layout="vertical">
          <Form.Item
            name="targetId"
            label="选择目标（可选）"
            tooltip="留空则下载所有目标"
          >
            <Select placeholder="选择要下载的目标" allowClear>
              {configData?.data?.targets?.map((target: any, index: number) => (
                <Select.Option key={index} value={index.toString()}>
                  {target.tag} ({target.type})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

