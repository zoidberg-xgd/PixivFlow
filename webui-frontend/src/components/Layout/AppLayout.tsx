import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, theme } from 'antd';
import {
  DashboardOutlined,
  SettingOutlined,
  DownloadOutlined,
  HistoryOutlined,
  FileTextOutlined,
  FolderOutlined,
} from '@ant-design/icons';
import { useState } from 'react';

const { Header, Sider, Content } = Layout;

const menuItems = [
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: '仪表盘',
  },
  {
    key: '/config',
    icon: <SettingOutlined />,
    label: '配置管理',
  },
  {
    key: '/download',
    icon: <DownloadOutlined />,
    label: '下载任务',
  },
  {
    key: '/history',
    icon: <HistoryOutlined />,
    label: '下载历史',
  },
  {
    key: '/logs',
    icon: <FileTextOutlined />,
    label: '日志查看',
  },
  {
    key: '/files',
    icon: <FolderOutlined />,
    label: '文件浏览',
  },
];

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
      >
        <div
          style={{
            height: 32,
            margin: 16,
            background: 'rgba(255, 255, 255, 0.3)',
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
          }}
        >
          {collapsed ? 'PF' : 'PixivFlow'}
        </div>
        <Menu
          theme="dark"
          selectedKeys={[location.pathname]}
          mode="inline"
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer }}>
          <div style={{ padding: '0 24px', lineHeight: '64px' }}>
            <h1 style={{ margin: 0, fontSize: '20px' }}>PixivFlow WebUI</h1>
          </div>
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

