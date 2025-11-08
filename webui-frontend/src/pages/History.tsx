import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, Table, Tag, Input, Select, Space, Typography } from 'antd';
import { PictureOutlined, FileTextOutlined } from '@ant-design/icons';
import { api } from '../services/api';

const { Title } = Typography;
const { Search } = Input;

export default function History() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [tagFilter, setTagFilter] = useState<string | undefined>();

  const { data, isLoading } = useQuery({
    queryKey: ['download', 'history', page, pageSize, typeFilter, tagFilter],
    queryFn: () =>
      api.getDownloadHistory({
        page,
        limit: pageSize,
        type: typeFilter,
        tag: tagFilter,
      }),
  });

  const columns = [
    {
      title: 'Pixiv ID',
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
      title: '标题',
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
      title: '作者',
      dataIndex: 'author',
      key: 'author',
      width: 150,
      render: (author: string | null) => author || '-',
    },
    {
      title: '下载时间',
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
        <Space>
          <Select
            placeholder="筛选类型"
            allowClear
            style={{ width: 150 }}
            value={typeFilter}
            onChange={setTypeFilter}
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
            onSearch={(value) => setTagFilter(value || undefined)}
          />
        </Space>
      </Card>

      <Card>
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

