import './globals.css';
import 'antd/dist/reset.css';

import AgentAssistant from '@/components/AgentAssistant';
import AntdProvider from '@/components/AntdProvider';
import Sidebar from '@/components/Sidebar';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap'
});

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='zh-CN'>
      <head>
        <title>拼便宜商品运营Agent</title>
      </head>
      <body className={`bg-slate-50 ${inter.className}`}>
        <AntdProvider>
          <div className='flex min-h-screen bg-slate-50'>
            <Sidebar />
            <main className='flex-1 ml-64'>{children}</main>
            <AgentAssistant />
          </div>
        </AntdProvider>
      </body>
    </html>
  );
}
