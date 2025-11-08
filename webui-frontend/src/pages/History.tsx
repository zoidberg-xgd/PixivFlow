import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, Table, Tag, Input, Select, Space, Typography, Alert, Button, DatePicker, Tooltip } from 'antd';
import { PictureOutlined, FileTextOutlined, FolderOpenOutlined, SortAscendingOutlined, SortDescendingOutlined } from '@ant-design/icons';
import { api } from '../services/api';
import dayjs, { Dayjs } from 'dayjs';

const { Title } = Typography;
const { Search } = Input;
const { RangePicker } = DatePicker;

export default function History() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [tagFilter, setTagFilter] = useState<string | undefined>();
  const [authorFilter, setAuthorFilter] = useState<string | undefined>();
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [sortBy, setSortBy] = useState<'downloadedAt' | 'title' | 'author' | 'pixivId'>('downloadedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { data, isLoading, error } = useQuery({
    queryKey: ['download', 'history', page, pageSize, typeFilter, tagFilter, authorFilter, dateRange, sortBy, sortOrder],
    queryFn: () =>
      api.getDownloadHistory({
        page,
        limit: pageSize,
        type: typeFilter,
        tag: tagFilter,
        author: authorFilter,
        startDate: dateRange?.[0] ? dateRange[0].format('YYYY-MM-DD') : undefined,
        endDate: dateRange?.[1] ? dateRange[1].format('YYYY-MM-DD') : undefined,
        sortBy,
        sortOrder,
      }),
  });

  // Debug: Log data to console
  if (data) {
    console.log('History data:', data);
    console.log('History items:', data?.data?.items);
    console.log('History total:', data?.data?.total);
  }
  if (error) {
    console.error('History error:', error);
  }

  const handleSort = (column: 'downloadedAt' | 'title' | 'author' | 'pixivId') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
    setPage(1); // Reset to first page when sorting changes
  };

  const getSortIcon = (column: 'downloadedAt' | 'title' | 'author' | 'pixivId') => {
    if (sortBy !== column) return null;
    return sortOrder === 'asc' ? <SortAscendingOutlined /> : <SortDescendingOutlined />;
  };

  const handleOpenFile = (filePath: string) => {
    // Try to open file via API
    window.open(`/api/files/preview?path=${encodeURIComponent(filePath)}`, '_blank');
  };

  const columns = [
    {
      title: (
        <span style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('pixivId')}>
          Pixiv ID {getSortIcon('pixivId')}
        </span>
      ),
      dataIndex: 'pixivId',
      key: 'pixivId',
      width: 120,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => (
        <Tag
          color={type === 'illustration' ? 'blue' : 'green'}
          icon={type === 'illustration' ? <PictureOutlined /> : <FileTextOutlined />}
        >
          {type === 'illustration' ? '插画' : '小说'}
        </Tag>
      ),
    },
    {
      title: (
        <span style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('title')}>
          标题 {getSortIcon('title')}
        </span>
      ),
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '标签',
      dataIndex: 'tag',
      key: 'tag',
      width: 150,
      render: (tag: string) => <Tag>{tag}</Tag>,
    },
    {
      title: (
        <span style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('author')}>
          作者 {getSortIcon('author')}
        </span>
      ),
      dataIndex: 'author',
      key: 'author',
      width: 150,
      render: (author: string | null) => author || '-',
    },
    {
      title: '文件路径',
      dataIndex: 'filePath',
      key: 'filePath',
      width: 300,
      ellipsis: true,
      render: (filePath: string) => (
        <Tooltip title={filePath}>
          <Space>
            <span style={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis' }}>{filePath}</span>
            <Button
              type="link"
              size="small"
              icon={<FolderOpenOutlined />}
              onClick={() => handleOpenFile(filePath)}
            >
              打开
            </Button>
          </Space>
        </Tooltip>
      ),
    },
    {
      title: (
        <span style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('downloadedAt')}>
          下载时间 {getSortIcon('downloadedAt')}
        </span>
      ),
      dataIndex: 'downloadedAt',
      key: 'downloadedAt',
      width: 180,
      render: (time: string) => new Date(time).toLocaleString(),
    },
  ];

  return (
    <div>
      <Title level={2}>下载历史</Title>

      <Card style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Space wrap>
            <Select
              placeholder="筛选类型"
              allowClear
              style={{ width: 150 }}
              value={typeFilter}
              onChange={(value) => {
                setTypeFilter(value);
                setPage(1);
              }}
            >
              <Select.Option value="illustration">插画</Select.Option>
              <Select.Option value="novel">小说</Select.Option>
            </Select>
            <Search
              placeholder="搜索标签"
              allowClear
              style={{ width: 200 }}
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value || undefined)}
              onSearch={(value) => {
                setTagFilter(value || undefined);
                setPage(1);
              }}
            />
            <Search
              placeholder="搜索作者"
              allowClear
              style={{ width: 200 }}
              value={authorFilter}
              onChange={(e) => setAuthorFilter(e.target.value || undefined)}
              onSearch={(value) => {
                setAuthorFilter(value || undefined);
                setPage(1);
              }}
            />
            <RangePicker
              placeholder={['开始日期', '结束日期']}
              value={dateRange}
              onChange={(dates) => {
                setDateRange(dates as [Dayjs | null, Dayjs | null] | null);
                setPage(1);
              }}
              allowClear
            />
            <Button
              onClick={() => {
                setTypeFilter(undefined);
                setTagFilter(undefined);
                setAuthorFilter(undefined);
                setDateRange(null);
                setSortBy('downloadedAt');
                setSortOrder('desc');
                setPage(1);
              }}
            >
              重置筛选
            </Button>
          </Space>
          <Space>
            <span>排序方式：</span>
            <Select
              value={sortBy}
              onChange={(value) => {
                setSortBy(value);
                setPage(1);
              }}
              style={{ width: 150 }}
            >
              <Select.Option value="downloadedAt">下载时间</Select.Option>
              <Select.Option value="title">标题</Select.Option>
              <Select.Option value="author">作者</Select.Option>
              <Select.Option value="pixivId">Pixiv ID</Select.Option>
            </Select>
            <Select
              value={sortOrder}
              onChange={(value) => {
                setSortOrder(value);
                setPage(1);
              }}
              style={{ width: 100 }}
            >
              <Select.Option value="desc">降序</Select.Option>
              <Select.Option value="asc">升序</Select.Option>
            </Select>
          </Space>
        </Space>
      </Card>

      <Card>
        {error && (
          <Alert
            message="加载失败"
            description={error instanceof Error ? error.message : '无法加载下载历史'}
            type="error"
            style={{ marginBottom: 16 }}
          />
        )}
        <Table
          columns={columns}
          dataSource={data?.data?.items || []}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: page,
            pageSize: pageSize,
            total: data?.data?.total || 0,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (newPage, newPageSize) => {
              setPage(newPage);
              setPageSize(newPageSize);
            },
          }}
        />
      </Card>
    </div>
  );
}

