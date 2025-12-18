'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Avatar,
  Button,
  Divider,
  Modal,
  Skeleton,
  Typography,
  theme
} from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import {
  Bubble,
  Conversations,
  Sender,
  Prompts,
  Attachments
} from '@ant-design/x';
import XMarkdown from '@ant-design/x-markdown';
import { GPTVis, withDefaultChartCode } from '@antv/gpt-vis';
import { Line } from '@antv/gpt-vis';
import { MessageCircle, Plus } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export const dynamic = 'force-dynamic';

const { Title, Text } = Typography;

type XBubbleRole = 'ai' | 'user';

const LineCompt = (props: Record<string, any>) => {
  const { children, axisXTitle, axisYTitle, streamStatus } = props;

  // Streaming phase: show placeholder until the component is stable
  if (streamStatus === 'loading') {
    return (
      <Skeleton.Image
        active
        style={{ width: 640, height: 280, maxWidth: '100%' }}
      />
    );
  }

  const raw = String(children ?? '').trim();
  let data: unknown = null;
  let parseOk = true;
  try {
    data = JSON.parse(raw);
  } catch {
    parseOk = false;
  }

  if (!parseOk) {
    return (
      <Skeleton.Image
        active
        style={{ width: 640, height: 280, maxWidth: '100%' }}
      />
    );
  }

  return (
    <Line data={data as any} axisXTitle={axisXTitle} axisYTitle={axisYTitle} />
  );
};

function buildMarkdownStreamDemo(): string {
  const lineData = JSON.stringify(
    [
      { time: 2013, value: 59.3 },
      { time: 2014, value: 64.4 },
      { time: 2015, value: 68.9 },
      { time: 2016, value: 74.4 },
      { time: 2017, value: 82.7 },
      { time: 2018, value: 91.9 },
      { time: 2019, value: 99.1 },
      { time: 2020, value: 101.6 },
      { time: 2021, value: 114.4 },
      { time: 2022, value: 121 }
    ],
    null,
    0
  );

  return [
    '# Markdown 流式输出 Demo',
    '',
    '这段内容会 **边生成边渲染**（模拟 SSE / token stream）。',
    '',
    '## 要点',
    '- 支持标题、列表、粗体、行内代码',
    '- 支持代码块（会在流式过程中逐步出现）',
    '- 适合未来对接真实流式接口',
    '',
    '> 小提示：流式时 Markdown 可能短暂“未闭合”，属于正常现象。',
    '',
    '下面这张折线图是 **跟着数据流一起出现** 的（参考官网 demo）：',
    '',
    `<custom-line axisXTitle="year" axisYTitle="sale">${lineData}</custom-line>`,
    '',
    '```ts',
    'type StreamChunk = { delta: string; done?: boolean };',
    '',
    'export function onChunk(chunk: StreamChunk) {',
    "  console.log('delta:', chunk.delta);",
    '}',
    '```',
    '',
    '最后再来一句：**祝你今天全是好价**。'
  ].join('\n');
}

function normalizeRole(role: string): XBubbleRole {
  if (role === 'user') return 'user';
  return 'ai';
}

export default function ChatPage() {
  const router = useRouter();
  const { token } = theme.useToken();

  const {
    chatHistory,
    setChatHistory,
    sessions,
    currentSessionId,
    startNewChat,
    loadSession,
    agentOpenState,
    setAgentOpenState,
    chatDraft,
    setChatDraft
  } = useAppStore();

  const [files, setFiles] = useState<UploadFile[]>([]);
  const [attachmentsOpen, setAttachmentsOpen] = useState(false);
  const [hasNextChunk, setHasNextChunk] = useState(false);

  const [markdownOpen, setMarkdownOpen] = useState(false);
  const [markdownText, setMarkdownText] = useState('');

  const streamTimerRef = useRef<number | null>(null);
  const stopStreaming = () => {
    if (streamTimerRef.current) {
      window.clearInterval(streamTimerRef.current);
      streamTimerRef.current = null;
    }
    setHasNextChunk(false);
  };

  const visCodeRenderer = useMemo(
    () =>
      withDefaultChartCode({
        showTabs: true,
        defaultTab: 'chart',
        style: { width: '100%' }
      }),
    []
  );

  useEffect(() => {
    if (!agentOpenState) return;
    setAgentOpenState(false);
  }, [agentOpenState, setAgentOpenState]);

  useEffect(() => {
    return () => {
      stopStreaming();
    };
  }, []);

  const conversationItems = useMemo(() => {
    const base = sessions.map((s) => ({
      key: s.id,
      label: s.title || '新对话',
      group: '历史'
    }));

    if (!base.some((x) => x.key === currentSessionId)) {
      base.unshift({
        key: currentSessionId,
        label: '当前对话',
        group: '进行中'
      });
    }

    return base;
  }, [sessions, currentSessionId]);

  const bubbleItems = useMemo(() => {
    return chatHistory.map((m, idx) => {
      const role = normalizeRole(m.role);
      const key = `${currentSessionId}-${idx}`;
      return {
        key,
        role,
        content: m.content
      };
    });
  }, [chatHistory, currentSessionId]);

  const promptItems = useMemo(
    () => [
      {
        key: 'md-stream',
        label: 'Markdown 流式 Demo',
        description: '模拟 token stream（边输出边渲染）'
      }
    ],
    []
  );

  const streamLastAssistantMessage = (fullText: string) => {
    stopStreaming();
    setHasNextChunk(true);

    // 先确保存在一个“可被更新”的 assistant 占位消息
    setChatHistory((prev) => {
      const last = prev[prev.length - 1];
      if (last?.role === 'assistant') return prev;
      return [...prev, { role: 'assistant', content: '' }];
    });

    const chunkSize = 6;
    const intervalMs = 30;
    let cursor = 0;

    streamTimerRef.current = window.setInterval(() => {
      cursor = Math.min(fullText.length, cursor + chunkSize);
      const partial = fullText.slice(0, cursor);

      setChatHistory((prev) => {
        if (!prev.length) return prev;
        const lastIndex = prev.length - 1;
        const last = prev[lastIndex];
        if (!last || last.role !== 'assistant') return prev;
        if (last.content === partial) return prev;

        const next = [...prev];
        next[lastIndex] = { ...last, content: partial };
        return next;
      });

      if (cursor >= fullText.length) {
        stopStreaming();
      }
    }, intervalMs);
  };

  const handleSubmit = (message: string) => {
    const trimmed = message.trim();
    if (!trimmed) return;

    stopStreaming();

    setChatDraft('');

    const isMarkdownStreamDemo =
      trimmed === 'Markdown 流式 Demo' ||
      trimmed.toLowerCase() === 'markdown stream' ||
      trimmed.toLowerCase() === 'md stream';

    if (isMarkdownStreamDemo) {
      setChatHistory((prev) => [
        ...prev,
        { role: 'user', content: trimmed },
        { role: 'assistant', content: '' }
      ]);
      streamLastAssistantMessage(buildMarkdownStreamDemo());
    } else {
      setChatHistory((prev) => [
        ...prev,
        { role: 'user', content: trimmed },
        {
          role: 'assistant',
          content: `收到：${trimmed}\n\n（当前为 UI + 渲染演示版本：已支持 GPT-Vis 图表渲染、建议 Prompts、附件 Attachments、以及 Sender 输入。）`
        }
      ]);
    }

    if (files.length) {
      setFiles([]);
      setAttachmentsOpen(false);
    }
  };

  return (
    <div className='h-[calc(100vh-0px)] flex bg-slate-50'>
      <div className='w-72 shrink-0 border-r border-slate-200 bg-white'>
        <div className='px-4 py-4 flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <MessageCircle size={18} className='text-blue-600' />
            <Title level={5} className='!m-0'>
              AI 对话
            </Title>
          </div>
          <Button
            size='small'
            icon={<Plus size={16} />}
            onClick={() => startNewChat()}>
            新建
          </Button>
        </div>
        <Divider className='!my-0' />

        <Conversations
          items={conversationItems}
          activeKey={currentSessionId}
          onActiveChange={(key) => loadSession(key)}
          groupable={{
            label: (group) => <Text type='secondary'>{group}</Text>,
            defaultExpandedKeys: ['进行中', '历史']
          }}
          creation={{ onClick: () => startNewChat() }}
        />

        <div className='px-4 py-4 border-t border-slate-200'>
          <Button block onClick={() => router.push('/')}>
            返回仪表盘
          </Button>
        </div>
      </div>

      <div className='flex-1 flex flex-col min-w-0'>
        <div className='px-6 py-4 bg-white border-b border-slate-200'>
          <Title level={5} className='!m-0'>
            拼便宜商品运营 Agent
          </Title>
          <Text type='secondary'>建议 / 附件 / 输入框（Ant Design X 2.0）</Text>
        </div>

        <div className='flex-1 min-h-0 px-6 py-4 flex flex-col gap-4'>
          <Prompts
            title='你可以试试：'
            items={promptItems}
            wrap
            onItemClick={({ data }) => {
              const value = String(data.label ?? '');
              setChatDraft(value);
            }}
          />

          <div className='flex-1 min-h-0 flex flex-col'>
            <div className='flex-1 min-h-0 flex flex-col'>
              <Bubble.List
                autoScroll
                items={bubbleItems}
                role={{
                  ai: {
                    placement: 'start',
                    avatar: (
                      <Avatar
                        size={28}
                        style={{ backgroundColor: token.colorPrimary }}>
                        A
                      </Avatar>
                    ),
                    variant: 'filled',
                    contentRender: (content: unknown) => {
                      const text = String(content ?? '');

                      const last = chatHistory[chatHistory.length - 1];
                      const isStreamingMessage =
                        hasNextChunk &&
                        last?.role === 'assistant' &&
                        String(last.content ?? '') === text;

                      const shouldUseXMarkdown = text.includes('<custom-line');
                      return (
                        <div className='max-w-[880px]'>
                          <div className='flex justify-end mb-2'>
                            <Button
                              size='small'
                              type='text'
                              onClick={() => {
                                setMarkdownText(text);
                                setMarkdownOpen(true);
                              }}>
                              查看 Markdown 原文
                            </Button>
                          </div>

                          {shouldUseXMarkdown ? (
                            <XMarkdown
                              components={{ 'custom-line': LineCompt }}
                              streaming={{ hasNextChunk: isStreamingMessage }}>
                              {text}
                            </XMarkdown>
                          ) : (
                            <GPTVis components={{ code: visCodeRenderer }}>
                              {text}
                            </GPTVis>
                          )}
                        </div>
                      );
                    }
                  },
                  user: {
                    placement: 'end',
                    avatar: (
                      <Avatar
                        size={28}
                        style={{ backgroundColor: token.colorText }}>
                        张
                      </Avatar>
                    ),
                    variant: 'shadow'
                  }
                }}
              />
            </div>

            <div className='mt-4'>
              <Sender
                value={chatDraft}
                onChange={(val) => setChatDraft(val)}
                onSubmit={(val) => handleSubmit(val)}
                placeholder='输入消息…'
                autoSize={{ minRows: 2, maxRows: 6 }}
                header={
                  <Sender.Header
                    title='附件'
                    open={attachmentsOpen}
                    onOpenChange={(open) => setAttachmentsOpen(open)}>
                    <Attachments
                      items={files}
                      beforeUpload={() => false}
                      maxCount={5}
                      onChange={({ fileList }) => {
                        setFiles(fileList);
                        if (fileList.length) setAttachmentsOpen(true);
                      }}
                      placeholder={{
                        title: '上传文件（演示）',
                        description: '支持拖拽/点击，当前仅保留 UI，不做解析'
                      }}
                    />
                  </Sender.Header>
                }
              />
              <Text type='secondary' className='block mt-2 text-xs'>
                提示：输入“md stream”可体验流式渲染；点击“查看 Markdown
                原文”可查看整段原始文本。
              </Text>
            </div>
          </div>
        </div>
      </div>

      <Modal
        title='消息原文（Markdown）'
        open={markdownOpen}
        onCancel={() => setMarkdownOpen(false)}
        footer={null}
        width={900}
        centered
        destroyOnHidden>
        {markdownText ? (
          <pre className='text-xs bg-slate-50 border border-slate-200 rounded-lg p-3 overflow-auto max-h-[70vh] whitespace-pre-wrap'>
            {markdownText}
          </pre>
        ) : (
          <Text type='secondary'>暂无内容。</Text>
        )}
      </Modal>
    </div>
  );
}
