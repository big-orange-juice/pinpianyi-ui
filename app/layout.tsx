import './globals.css';
import Sidebar from '@/components/Sidebar';
import AgentAssistant from '@/components/AgentAssistant';
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
        <div className='flex min-h-screen'>
          <Sidebar />
          <div className='flex-1 ml-64'>{children}</div>
          <AgentAssistant />
        </div>
      </body>
    </html>
  );
}
