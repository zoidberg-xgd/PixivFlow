import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Breadcrumb,
  Image,
  Modal,
  message,
  Select,
  Typography,
  Popconfirm,
  Row,
  Col,
  Spin,
} from 'antd';
import {
  FolderOutlined,
  FileOutlined,
  DeleteOutlined,
  EyeOutlined,
  HomeOutlined,
  LeftOutlined,
  PictureOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { api } from '../services/api';

const { Title } = Typography;
const { Option } = Select;

interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: string;
  extension?: string;
}

interface FilesResponse {
  files: FileItem[];
  directories: FileItem[];
  currentPath: string;
}

const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
const textExtensions = ['.txt', '.md', '.text'];

export default function Files() {
  const queryClient = useQueryClient();
  const [currentPath, setCurrentPath] = useState<string>('');
  const [fileType, setFileType] = useState<'illustration' | 'novel'>('illustration');
  const [sortBy, setSortBy] = useState<'name' | 'time'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [previewContent, setPreviewContent] = useState<string>('');
  const [loadingPreview, setLoadingPreview] = useState(false);

  const { data, isLoading } = useQuery<{ data: FilesResponse }>({
    queryKey: ['files', currentPath, fileType, sortBy, sortOrder],
    queryFn: () => api.listFiles({ path: currentPath, type: fileType, sort: sortBy, order: sortOrder }),
  });

  const deleteFileMutation = useMutation({
    mutationFn: (file: FileItem) =>
      api.deleteFile(file.name, { path: file.path, type: fileType }),
    onSuccess: () => {
      message.success('文件删除成功');
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || '删除文件失败');
    },
  });

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
  };

  const handlePreview = async (file: FileItem) => {
    if (file.type === 'directory') {
      handleNavigate(file.path);
      return;
    }

    const ext = file.extension?.toLowerCase() || '';
    const isImage = imageExtensions.includes(ext);
    const isText = textExtensions.includes(ext);

    if (isImage) {
      setPreviewFile(file);
      setPreviewContent('');
      setPreviewVisible(true);
    } else if (isText) {
      setPreviewFile(file);
      setPreviewContent('');
      setLoadingPreview(true);
      setPreviewVisible(true);
      
      try {
        const previewUrl = getPreviewUrl(file);
        const response = await fetch(previewUrl);
        if (response.ok) {
          const text = await response.text();
          setPreviewContent(text);
        } else {
          message.error('无法加载文件内容');
          setPreviewVisible(false);
        }
      } catch (error) {
        message.error('加载文件内容失败');
        setPreviewVisible(false);
      } finally {
        setLoadingPreview(false);
      }
    } else {
      message.info('该文件类型不支持预览');
    }
  };

  const handleDelete = (file: FileItem) => {
    deleteFileMutation.mutate(file);
  };

  const getPreviewUrl = (file: FileItem) => {
    return `/api/files/preview?path=${encodeURIComponent(file.path)}&type=${fileType}`;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const breadcrumbItems = [
    {
      title: (
        <Button
          type="link"
          icon={<HomeOutlined />}
          onClick={() => handleNavigate('')}
          style={{ padding: 0 }}
        >
          根目录
        </Button>
      ),
    },
    ...(currentPath
      ? currentPath.split('/').map((segment, index, arr) => {
          const path = arr.slice(0, index + 1).join('/');
          return {
            title: (
              <Button
                type="link"
                onClick={() => handleNavigate(path)}
                style={{ padding: 0 }}
              >
                {segment}
              </Button>
            ),
          };
        })
      : []),
  ];

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 300,
      ellipsis: {
        showTitle: true,
      },
      render: (name: string, record: FileItem) => (
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', minWidth: 0 }}>
          <span style={{ flexShrink: 0, marginRight: 8 }}>
            {record.type === 'directory' ? (
              <FolderOutlined style={{ color: '#1890ff' }} />
            ) : imageExtensions.includes(record.extension?.toLowerCase() || '') ? (
              <PictureOutlined style={{ color: '#52c41a' }} />
            ) : (
              <FileTextOutlined />
            )}
          </span>
          <Button
            type="link"
            onClick={() => handlePreview(record)}
            style={{ 
              padding: 0, 
              height: 'auto',
              flex: 1,
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              textAlign: 'left',
            }}
            title={name}
          >
            {name}
          </Button>
        </div>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => (
        <Tag color={type === 'directory' ? 'blue' : 'default'}>
          {type === 'directory' ? '目录' : '文件'}
        </Tag>
      ),
    },
    {
      title: '大小',
      dataIndex: 'size',
      key: 'size',
      width: 120,
      render: (size: number) => formatFileSize(size),
    },
    {
      title: '修改时间',
      dataIndex: 'modified',
      key: 'modified',
      width: 180,
      render: (time: string) => (time ? new Date(time).toLocaleString() : '-'),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: FileItem) => (
        <Space>
          {record.type === 'file' && 
           (imageExtensions.includes(record.extension?.toLowerCase() || '') ||
            textExtensions.includes(record.extension?.toLowerCase() || '')) && (
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => handlePreview(record)}
              size="small"
            >
              预览
            </Button>
          )}
          {record.type === 'file' && (
            <Popconfirm
              title="确定要删除这个文件吗？"
              onConfirm={() => handleDelete(record)}
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
          )}
        </Space>
      ),
    },
  ];

  const allItems = [
    ...(data?.data?.directories || []),
    ...(data?.data?.files || []),
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            文件浏览
          </Title>
        </Col>
        <Col>
          <Space>
            <Select
              value={sortBy}
              onChange={(value) => setSortBy(value)}
              style={{ width: 120 }}
            >
              <Option value="name">按名称</Option>
              <Option value="time">按时间</Option>
            </Select>
            <Select
              value={sortOrder}
              onChange={(value) => setSortOrder(value)}
              style={{ width: 100 }}
            >
              <Option value="asc">升序</Option>
              <Option value="desc">降序</Option>
            </Select>
            <Select
              value={fileType}
              onChange={(value) => {
                setFileType(value);
                setCurrentPath('');
              }}
              style={{ width: 150 }}
            >
              <Option value="illustration">
                <PictureOutlined /> 插画
              </Option>
              <Option value="novel">
                <FileTextOutlined /> 小说
              </Option>
            </Select>
          </Space>
        </Col>
      </Row>

      <Card style={{ overflow: 'hidden' }}>
        <Breadcrumb items={breadcrumbItems} style={{ marginBottom: 16 }} />
        
        {currentPath && (
          <Button
            icon={<LeftOutlined />}
            onClick={() => {
              const parts = currentPath.split('/');
              parts.pop();
              handleNavigate(parts.join('/'));
            }}
            style={{ marginBottom: 16 }}
          >
            返回上级
          </Button>
        )}

        <div style={{ overflowX: 'auto' }}>
          <Table
            columns={columns}
            dataSource={allItems}
            rowKey="path"
            loading={isLoading}
            scroll={{ x: 850 }}
            pagination={{
              pageSize: 50,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 项`,
            }}
          />
        </div>
      </Card>

      <Modal
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={null}
        width={800}
        centered
        title={previewFile?.name}
      >
        {previewFile && (
          <>
            {imageExtensions.includes(previewFile.extension?.toLowerCase() || '') ? (
              <Image
                src={getPreviewUrl(previewFile)}
                alt={previewFile.name}
                style={{ width: '100%' }}
                preview={false}
              />
            ) : textExtensions.includes(previewFile.extension?.toLowerCase() || '') ? (
              <Spin spinning={loadingPreview}>
                <div
                  style={{
                    maxHeight: '70vh',
                    overflow: 'auto',
                    padding: '16px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '4px',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    lineHeight: '1.6',
                  }}
                >
                  {previewContent || (loadingPreview ? '加载中...' : '')}
                </div>
              </Spin>
            ) : null}
          </>
        )}
      </Modal>
    </div>
  );
}
