import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  Table,
  Input,
  Select,
  Space,
  Button,
  Typography,
  Tag,
  message,
  Popconfirm,
  Row,
  Col,
  Switch,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  ClearOutlined,
} from '@ant-design/icons';
import { api } from '../services/api';
import io, { Socket } from 'socket.io-client';

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

interface LogEntry {
  line: string;
  level?: string;
  timestamp?: string;
}

export default function Logs() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [levelFilter, setLevelFilter] = useState<string | undefined>();
  const [searchText, setSearchText] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Fetch logs
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['logs', page, pageSize, levelFilter, searchText],
    queryFn: () =>
      api.getLogs({
        page,
        limit: pageSize,
        level: levelFilter,
        search: searchText || undefined,
      }),
    refetchInterval: autoRefresh ? 5000 : false,
  });

  // Clear logs mutation
  const clearLogsMutation = useMutation({
    mutationFn: () => api.clearLogs(),
    onSuccess: () => {
      message.success('日志已清空');
      queryClient.invalidateQueries({ queryKey: ['logs'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || '清空日志失败');
    },
  });

  // WebSocket connection for real-time logs
  useEffect(() => {
    if (autoRefresh) {
      const newSocket = io('http://localhost:3000', {
        transports: ['websocket', 'polling'],
      });

      newSocket.on('connect', () => {
        console.log('WebSocket connected');
        newSocket.emit('subscribe', 'logs');
      });

      newSocket.on('log', (_logData: { message: string }) => {
        // Invalidate query to refresh logs
        queryClient.invalidateQueries({ queryKey: ['logs'] });
      });

      newSocket.on('disconnect', () => {
        console.log('WebSocket disconnected');
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    } else {
      if (socket) {
        socket.close();
        setSocket(null);
      }
    }
  }, [autoRefresh, queryClient]);

  // Parse log line to extract level and timestamp
  const parseLogLine = (line: string): LogEntry => {
    const levelMatch = line.match(/\[(DEBUG|INFO|WARN|ERROR|FATAL)\]/i);
    const timestampMatch = line.match(/\[(\d{4}-\d{2}-\d{2}T[\d:\.]+Z)\]/);
    
    return {
      line,
      level: levelMatch ? levelMatch[1].toUpperCase() : undefined,
      timestamp: timestampMatch ? timestampMatch[1] : undefined,
    };
  };

  // Get level color
  const getLevelColor = (level?: string): string => {
    switch (level) {
      case 'ERROR':
      case 'FATAL':
        return 'red';
      case 'WARN':
        return 'orange';
      case 'INFO':
        return 'blue';
      case 'DEBUG':
        return 'default';
      default:
        return 'default';
    }
  };

  // Format log line for display
  const formatLogLine = (line: string): string => {
    // Remove timestamp and level markers for cleaner display
    return line
      .replace(/\[\d{4}-\d{2}-\d{2}T[\d:\.]+Z\]/g, '')
      .replace(/\[(DEBUG|INFO|WARN|ERROR|FATAL)\]/gi, '')
      .trim();
  };

  const columns = [
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      width: 100,
      render: (level: string | undefined) => {
        if (!level) return '-';
        return <Tag color={getLevelColor(level)}>{level}</Tag>;
      },
    },
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 200,
      render: (timestamp: string | undefined) => {
        if (!timestamp) return '-';
        try {
          return new Date(timestamp).toLocaleString();
        } catch {
          return timestamp;
        }
      },
    },
    {
      title: '内容',
      dataIndex: 'line',
      key: 'line',
      render: (line: string) => (
        <code style={{ fontSize: '12px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
          {formatLogLine(line)}
        </code>
      ),
    },
  ];

  // Use data to avoid unused variable warning
  const logEntries: LogEntry[] =
    (data?.data?.logs?.map((line: string) => parseLogLine(line)) || []);

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            日志查看
          </Title>
        </Col>
        <Col>
          <Space>
            <Switch
              checked={autoRefresh}
              onChange={setAutoRefresh}
              checkedChildren="自动刷新"
              unCheckedChildren="手动刷新"
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={() => refetch()}
              loading={isLoading}
            >
              刷新
            </Button>
            <Popconfirm
              title="确定要清空所有日志吗？"
              onConfirm={() => clearLogsMutation.mutate()}
              okText="确定"
              cancelText="取消"
            >
              <Button
                danger
                icon={<ClearOutlined />}
                loading={clearLogsMutation.isPending}
              >
                清空日志
              </Button>
            </Popconfirm>
          </Space>
        </Col>
      </Row>

      <Card>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Row gutter={16}>
            <Col span={8}>
              <Search
                placeholder="搜索日志内容"
                allowClear
                enterButton={<SearchOutlined />}
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  setPage(1);
                }}
                onSearch={() => {
                  setPage(1);
                  refetch();
                }}
              />
            </Col>
            <Col span={6}>
              <Select
                placeholder="筛选日志级别"
                allowClear
                style={{ width: '100%' }}
                value={levelFilter}
                onChange={(value) => {
                  setLevelFilter(value);
                  setPage(1);
                }}
              >
                <Option value="DEBUG">DEBUG</Option>
                <Option value="INFO">INFO</Option>
                <Option value="WARN">WARN</Option>
                <Option value="ERROR">ERROR</Option>
                <Option value="FATAL">FATAL</Option>
              </Select>
            </Col>
            <Col span={4}>
              <Select
                value={pageSize}
                onChange={(value) => {
                  setPageSize(value);
                  setPage(1);
                }}
                style={{ width: '100%' }}
              >
                <Option value={50}>50 条/页</Option>
                <Option value={100}>100 条/页</Option>
                <Option value={200}>200 条/页</Option>
                <Option value={500}>500 条/页</Option>
              </Select>
            </Col>
          </Row>

          <Table
            columns={columns}
            dataSource={logEntries.map((entry, index) => ({
              ...entry,
              key: `${page}-${index}`,
            }))}
            loading={isLoading}
            pagination={{
              current: page,
              pageSize: pageSize,
              total: data?.data?.total || 0,
              showSizeChanger: false,
              showTotal: (total) => `共 ${total} 条日志`,
              onChange: (newPage) => setPage(newPage),
            }}
            scroll={{ y: 600 }}
            size="small"
          />
        </Space>
      </Card>
    </div>
  );
}
