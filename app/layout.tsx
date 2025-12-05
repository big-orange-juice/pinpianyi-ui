'use client';

import './globals.css';
import Sidebar from '@/components/Sidebar';
import AgentAssistant from '@/components/AgentAssistant';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <head>
        <title>拼便宜商品运营Agent</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-slate-50">
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 ml-64">
            {children}
          </div>
          <AgentAssistant />
        </div>
      </body>
    </html>
  );
}
