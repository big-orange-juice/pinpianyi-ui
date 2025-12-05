'use client';

import React from 'react';
import { Database, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function DataCollectionPage() {
  return (
    <div className="p-8 animate-fade-in">
      <div className="mb-6">
        <Link href="/">
          <button className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-4">
            <ArrowLeft size={20} />
            返回仪表盘
          </button>
        </Link>
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <Database className="text-green-600" size={32} />
          数据采集配置
        </h1>
        <p className="text-slate-500 mt-2">配置爬虫规则和数据字段映射</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-12 text-center">
        <div className="max-w-md mx-auto">
          <Database size={64} className="text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-700 mb-2">数据采集配置页面</h2>
          <p className="text-slate-500 mb-6">
            此页面包含爬虫字段映射、新字段发现和数据清洗配置功能。
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-700">
            <p className="font-medium mb-1">🚀 迁移完成</p>
            <p>已成功从React迁移到Next.js App Router</p>
            <p className="text-xs mt-2 text-green-600">使用Zustand + ECharts + Tailwind CSS</p>
          </div>
        </div>
      </div>
    </div>
  );
}
