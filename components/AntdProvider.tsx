'use client';

import { App as AntdApp, ConfigProvider } from 'antd';
import type { ThemeConfig } from 'antd';
import type { ReactNode } from 'react';

const palette = {
  primary: '#2563eb',
  background: '#f8fafc',
  surface: '#ffffff',
  border: '#e2e8f0'
};

const themeConfig: ThemeConfig = {
  token: {
    colorPrimary: palette.primary,
    colorInfo: palette.primary,
    colorBgBase: palette.background,
    colorBgContainer: palette.surface,
    colorBorder: palette.border,
    fontFamily:
      '"Heiti SC", "Hiragino Sans GB", "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", "Noto Sans SC", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: 14,
    borderRadius: 12
  },
  components: {
    Button: {
      controlHeight: 40,
      fontWeight: 600,
      borderRadius: 10
    },
    Card: {
      borderRadiusLG: 16,
      paddingLG: 24,
      colorBorderSecondary: palette.border
    },
    Input: {
      borderRadiusLG: 12,
      controlHeightLG: 44
    },
    Select: {
      borderRadiusLG: 12,
      controlHeightLG: 44
    },
    Segmented: {
      borderRadius: 12
    },
    Table: {
      borderRadiusLG: 16,
      colorBorderSecondary: palette.border
    },
    Layout: {
      bodyBg: palette.background,
      siderBg: '#0f172a'
    },
    Menu: {
      itemBorderRadius: 12
    }
  }
};

interface AntdProviderProps {
  children: ReactNode;
}

const AntdProvider = ({ children }: AntdProviderProps) => {
  return (
    <ConfigProvider
      theme={themeConfig}
      wave={{ disabled: true }}
      form={{ colon: false }}>
      <AntdApp>{children}</AntdApp>
    </ConfigProvider>
  );
};

export default AntdProvider;
