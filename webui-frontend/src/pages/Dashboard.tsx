import { useQuery } from '@tanstack/react-query';
import { Card, Row, Col, Statistic, Spin } from 'antd';
import { DownloadOutlined, PictureOutlined, FileTextOutlined } from '@ant-design/icons';
import { api } from '../services/api';

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['stats', 'overview'],
    queryFn: () => api.getStatsOverview(),
  });

  if (isLoading) {
    return <Spin size="large" style={{ display: 'block', textAlign: 'center', marginTop: 50 }} />;
  }

  return (
    <div>
      <h2>仪表盘</h2>
      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="总下载数"
              value={data?.totalDownloads || 0}
              prefix={<DownloadOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="插画"
              value={data?.illustrations || 0}
              prefix={<PictureOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="小说"
              value={data?.novels || 0}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
      </Row>
      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title="最近下载">
            <p>最近 7 天下载: {data?.recentDownloads || 0} 个作品</p>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

