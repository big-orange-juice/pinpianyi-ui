'use client';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
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
import { CodeHighlighter, Think } from '@ant-design/x';
import XMarkdown from '@ant-design/x-markdown';
import { GPTVis, withDefaultChartCode } from '@antv/gpt-vis';
import { Bar, Line, Pie, Scatter } from '@antv/gpt-vis';
import ReactECharts from 'echarts-for-react';
import { MessageCircle, Plus } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export const dynamic = 'force-dynamic';

const { Title, Text } = Typography;

type XBubbleRole = 'ai' | 'user' | 'think';

const THINK_BLOCK_START = '__THINK_BLOCK_START__';
const THINK_BLOCK_END = '__THINK_BLOCK_END__';

type ThinkBlockPayload = {
  status: 'loading' | 'done';
  title: string;
  content: string;
};

const buildThinkBlock = (payload: ThinkBlockPayload) => {
  return [THINK_BLOCK_START, JSON.stringify(payload), THINK_BLOCK_END].join(
    '\n'
  );
};

const parseThinkBlock = (text: string) => {
  if (!text.startsWith(THINK_BLOCK_START)) return null;
  const endIndex = text.indexOf(THINK_BLOCK_END);
  if (endIndex === -1) return null;

  const jsonStart = THINK_BLOCK_START.length + 1;
  const json = text.slice(jsonStart, endIndex).trim();
  try {
    const payload = JSON.parse(json) as ThinkBlockPayload;
    const rest = text
      .slice(endIndex + THINK_BLOCK_END.length)
      .replace(/^\n/, '');
    return { payload, rest };
  } catch {
    return null;
  }
};

const renderThinkLines = (content: string) => {
  const lines = String(content ?? '')
    .split('\n')
    .map((x) => x.trimEnd())
    .filter((x) => x.length > 0);

  return (
    <span className='text-xs leading-5'>
      {lines.map((line, idx) => (
        <React.Fragment key={idx}>
          {line}
          {idx < lines.length - 1 ? <br /> : null}
        </React.Fragment>
      ))}
    </span>
  );
};

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

const BarCompt = (props: Record<string, any>) => {
  const { children, axisXTitle, axisYTitle, streamStatus } = props;

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
    <div style={{ width: '100%' }}>
      <Bar
        data={data as any}
        xField='value'
        yField='category'
        xAxis={axisXTitle ? { title: { text: String(axisXTitle) } } : undefined}
        yAxis={axisYTitle ? { title: { text: String(axisYTitle) } } : undefined}
      />
    </div>
  );
};

const PieCompt = (props: Record<string, any>) => {
  const { children, streamStatus } = props;

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
    <div style={{ width: '100%' }}>
      <Pie
        data={data as any}
        angleField='value'
        colorField='category'
        innerRadius={0.55}
      />
    </div>
  );
};

const ScatterCompt = (props: Record<string, any>) => {
  const { children, streamStatus } = props;

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
    <div style={{ width: '100%' }}>
      <Scatter data={data as any} xField='x' yField='y' />
    </div>
  );
};

const BubbleCompt = (props: Record<string, any>) => {
  const { children, axisXTitle, axisYTitle, streamStatus } = props;

  if (streamStatus === 'loading') {
    return (
      <Skeleton.Image
        active
        style={{ width: 640, height: 280, maxWidth: '100%' }}
      />
    );
  }

  const raw = String(children ?? '').trim();
  let data: Array<{ x: number; y: number; size: number; name?: string }> = [];
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

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const v = params?.value;
        if (!Array.isArray(v)) return '';
        const [x, y, s, name] = v;
        const title = name ? `${name}<br/>` : '';
        return `${title}x: ${x}<br/>y: ${y}<br/>size: ${s}`;
      }
    },
    grid: { left: 48, right: 24, top: 24, bottom: 40 },
    xAxis: {
      type: 'value',
      name: axisXTitle ? String(axisXTitle) : undefined,
      nameLocation: 'middle',
      nameGap: 28,
      splitLine: { lineStyle: { type: 'dashed' } }
    },
    yAxis: {
      type: 'value',
      name: axisYTitle ? String(axisYTitle) : undefined,
      nameLocation: 'middle',
      nameGap: 38,
      splitLine: { lineStyle: { type: 'dashed' } }
    },
    series: [
      {
        type: 'scatter',
        data: data.map((d) => [d.x, d.y, d.size, d.name ?? '']),
        symbolSize: (val: any) => {
          const s = Number(Array.isArray(val) ? val[2] : 0);
          const base = Math.sqrt(Math.max(0, s));
          return Math.max(8, Math.min(48, base * 6));
        },
        emphasis: { focus: 'series' }
      }
    ]
  };

  return (
    <ReactECharts
      option={option as any}
      style={{ width: '100%', height: 280 }}
      notMerge
      lazyUpdate
    />
  );
};

const getDomNodeText = (node: any): string => {
  if (!node) return '';
  if (node.type === 'text') return String(node.data ?? '');
  const children = node.children;
  if (Array.isArray(children)) return children.map(getDomNodeText).join('');
  return '';
};

const MarkdownPre = (props: Record<string, any>) => {
  const { domNode } = props;
  const preNode = domNode as any;
  const codeNode =
    Array.isArray(preNode?.children) &&
    preNode.children.find((c: any) => c?.name === 'code')
      ? preNode.children.find((c: any) => c?.name === 'code')
      : null;

  const className = String(codeNode?.attribs?.class ?? '');
  const langMatch = /language-([^\s]+)/.exec(className);
  const language = langMatch?.[1];
  const code = getDomNodeText(codeNode ?? preNode);

  return <CodeHighlighter lang={language}>{code}</CodeHighlighter>;
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

  const barData = JSON.stringify(
    [
      { category: '零食', value: 120 },
      { category: '饮料', value: 98 },
      { category: '乳品', value: 86 },
      { category: '粮油', value: 64 },
      { category: '日化', value: 42 }
    ],
    null,
    0
  );

  const pieData = JSON.stringify(
    [
      { category: '京东万商', value: 38 },
      { category: '易久批', value: 28 },
      { category: '鲜世纪', value: 18 },
      { category: '其他', value: 16 }
    ],
    null,
    0
  );

  const scatterData = JSON.stringify(
    [
      { x: 1.2, y: 3.1 },
      { x: 1.9, y: 2.6 },
      { x: 2.3, y: 3.8 },
      { x: 2.9, y: 3.0 },
      { x: 3.4, y: 4.2 },
      { x: 3.8, y: 3.6 }
    ],
    null,
    0
  );

  const bubbleData = JSON.stringify(
    [
      { name: 'A', x: 12, y: 36, size: 18 },
      { name: 'B', x: 18, y: 22, size: 42 },
      { name: 'C', x: 25, y: 28, size: 30 },
      { name: 'D', x: 31, y: 18, size: 55 },
      { name: 'E', x: 38, y: 41, size: 26 }
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
    '再插入四种图表（柱状图 / 饼图 / 散点图 / 气泡图）：',
    '',
    `### 1) 柱状图\n\n<custom-bar axisXTitle="销量" axisYTitle="品类">${barData}</custom-bar>`,
    '',
    `### 2) 饼图\n\n<custom-pie>${pieData}</custom-pie>`,
    '',
    `### 3) 散点图\n\n<custom-scatter axisXTitle="曝光" axisYTitle="转化">${scatterData}</custom-scatter>`,
    '',
    `### 4) 气泡图\n\n<custom-bubble axisXTitle="价格" axisYTitle="销量">${bubbleData}</custom-bubble>`,
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
  const [isThinking, setIsThinking] = useState(false);

  const [markdownOpen, setMarkdownOpen] = useState(false);
  const [markdownText, setMarkdownText] = useState('');

  const streamTimerRef = useRef<number | null>(null);
  const thinkTimerRef = useRef<number | null>(null);

  const stopStream = useCallback(() => {
    if (streamTimerRef.current) {
      window.clearInterval(streamTimerRef.current);
      streamTimerRef.current = null;
    }
    setHasNextChunk(false);
  }, []);

  const stopThink = useCallback(() => {
    if (thinkTimerRef.current) {
      window.clearInterval(thinkTimerRef.current);
      thinkTimerRef.current = null;
    }
    setIsThinking(false);
  }, []);

  const stopAll = useCallback(() => {
    stopStream();
    stopThink();
  }, [stopStream, stopThink]);

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
      stopAll();
    };
  }, [stopAll]);

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
      const role: XBubbleRole =
        m.role === 'user'
          ? 'user'
          : String(m.content ?? '').startsWith(THINK_BLOCK_START)
          ? 'think'
          : 'ai';
      const key = `${idx}`;
      return {
        key,
        role,
        content: m.content
      };
    });
  }, [chatHistory]);

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
    stopStream();
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
        stopStream();
      }
    }, intervalMs);
  };

  const thinkThenStreamLastAssistantMessage = (fullText: string) => {
    stopAll();
    setIsThinking(true);

    const demoThinkLines = [
      '[00.05s] 接收输入：Markdown 流式 Demo',
      '[00.10s] 识别场景：流式渲染 + 图表 + 高亮',
      '[00.18s] 读取渲染能力：XMarkdown / GPTVis / ECharts',
      '[00.25s] 规划结构：标题 / 要点 / 代码块 / 图表区块',
      '[00.32s] 规划 Think 展示：独立气泡 / 逐行增长 / 5s 固定完成',
      '[00.40s] 选择 Markdown 渲染：XMarkdown + 自定义标签 custom-*',
      '[00.48s] 选择代码高亮：@ant-design/x CodeHighlighter',
      '[00.55s] 准备图表 1：折线图数据（year-sale）',
      '[00.62s] 准备图表 2：柱状图数据（category-value）',
      '[00.70s] 准备图表 3：饼图数据（渠道占比）',
      '[00.78s] 准备图表 4：散点图数据（曝光-转化）',
      '[00.86s] 准备图表 5：气泡图数据（价格-销量-size）',
      '[00.95s] 生成折线图：构造 x/y 序列',
      '[01.05s] 生成柱状图：聚合类目与数值',
      '[01.15s] 生成饼图：归一化占比',
      '[01.25s] 生成散点图：模拟分布 + 噪声',
      '[01.35s] 生成气泡图：计算 symbolSize 映射',
      '[01.45s] 组装 Markdown：标题与导语',
      '[01.55s] 组装 Markdown：要点列表与提示语',
      '[01.65s] 插入标签：custom-line / custom-bar / custom-pie',
      '[01.75s] 插入标签：custom-scatter / custom-bubble',
      '[01.90s] 生成代码块：TypeScript 示例',
      '[02.05s] 校验：JSON 可解析性 / 标签闭合',
      '[02.20s] 校验：避免块级元素嵌套（paragraphTag=div）',
      '[02.35s] 预热：准备流式输出缓冲区',
      '[02.50s] 设定 chunk：chunkSize=6',
      '[02.65s] 设定 interval：30ms',
      '[02.80s] 设定 streaming：hasNextChunk=true',
      '[03.00s] 生成首段 token（标题+开头）',
      '[03.20s] 生成中段 token（列表+代码）',
      '[03.40s] 生成尾段 token（图表区块+总结）',
      '[03.70s] 同步 UI：Think 保持展开直到完成',
      '[04.00s] 检查：Think 完成后自动折叠',
      '[04.30s] 准备开始流式输出正文…',
      '[04.60s] 等待 5s 达成（演示固定时长）',
      '[05.00s] 启动正文 token stream'
    ];

    // 先插入一条独立的 Think 消息（只显示 Think，不承载正文）
    setChatHistory((prev) => {
      const loadingThink = buildThinkBlock({
        status: 'loading',
        title: '思考中（演示）',
        content: demoThinkLines[0] ?? ''
      });
      return [...prev, { role: 'assistant', content: loadingThink }];
    });

    // 在 5 秒内逐行追加。
    // 关键：无论行是否输出完，都保证满 5 秒才 done，并在 done 时补齐全部行。
    const totalMs = 5000;
    const tickMs = 120;
    const startedAt = Date.now();
    let lineCursor = 1;
    let finalized = false;

    const updateThink = (
      status: ThinkBlockPayload['status'],
      content: string
    ) => {
      setChatHistory((prev) => {
        if (!prev.length) return prev;
        const lastIndex = prev.length - 1;
        const last = prev[lastIndex];
        if (!last || last.role !== 'assistant') return prev;
        if (!String(last.content ?? '').startsWith(THINK_BLOCK_START))
          return prev;

        const next = [...prev];
        next[lastIndex] = {
          ...last,
          content: buildThinkBlock({
            status,
            title: status === 'loading' ? '思考中（演示）' : '思考完成（演示）',
            content
          })
        };
        return next;
      });
    };

    thinkTimerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;

      // 逐行增长：按时间进度推进行数（保证 5 秒内尽量展示更多行）
      const targetLines = Math.floor(
        (Math.min(elapsed, totalMs) / totalMs) * demoThinkLines.length
      );
      lineCursor = Math.min(
        demoThinkLines.length,
        Math.max(lineCursor, targetLines)
      );
      if (lineCursor === 0 && elapsed > 0) lineCursor = 1;
      const partial = demoThinkLines.slice(0, lineCursor).join('\n');
      updateThink('loading', partial);

      // 到点才 done（并补齐全部行）
      if (!finalized && elapsed >= totalMs) {
        finalized = true;
        stopThink();
        updateThink('done', demoThinkLines.join('\n'));

        // 另起一条 assistant 消息承载正文流式输出
        setChatHistory((prev) => [...prev, { role: 'assistant', content: '' }]);
        window.setTimeout(() => streamLastAssistantMessage(fullText), 0);
      }
    }, tickMs);
  };

  const handleSubmit = (message: string) => {
    const trimmed = message.trim();
    if (!trimmed) return;

    stopAll();

    setChatDraft('');

    const isMarkdownStreamDemo =
      trimmed === 'Markdown 流式 Demo' ||
      trimmed.toLowerCase() === 'markdown stream' ||
      trimmed.toLowerCase() === 'md stream';

    if (isMarkdownStreamDemo) {
      // 不再预插入空 assistant 占位；Think 和正文各自独立插入
      setChatHistory((prev) => [...prev, { role: 'user', content: trimmed }]);
      thinkThenStreamLastAssistantMessage(buildMarkdownStreamDemo());
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

  const renderAssistantContent = useCallback(
    (content: unknown) => {
      const text = String(content ?? '');

      const thinkParsed = parseThinkBlock(text);
      const thinkPayload = thinkParsed?.payload;
      const contentText = thinkParsed ? thinkParsed.rest : text;
      const isThinkOnly =
        !!thinkPayload && String(contentText ?? '').trim() === '';

      // 空消息不渲染（避免出现“多一行”空白气泡）
      if (!thinkPayload && String(contentText ?? '').trim() === '') {
        return null;
      }

      const last = chatHistory[chatHistory.length - 1];
      const isStreamingMessage =
        hasNextChunk &&
        last?.role === 'assistant' &&
        String(last.content ?? '') === text;

      const THINK_LOG_MAX_HEIGHT = 240;

      const shouldUseXMarkdown = /<custom-/.test(contentText);
      return (
        <div className={isThinkOnly ? 'w-full max-w-none' : 'max-w-[880px]'}>
          {thinkPayload ? (
            <div className={isThinkOnly ? '' : 'mb-3'}>
              <Think
                key={`think-${thinkPayload.status}`}
                title={thinkPayload.title}
                loading={thinkPayload.status === 'loading' ? true : false}
                blink={thinkPayload.status === 'loading'}
                defaultExpanded={thinkPayload.status === 'loading'}
                style={{ width: '100%' }}>
                <div
                  className='hide-scrollbar'
                  style={{
                    maxHeight: THINK_LOG_MAX_HEIGHT,
                    overflow: 'auto',
                    fontFamily: token.fontFamilyCode
                  }}>
                  {renderThinkLines(thinkPayload.content)}
                </div>
              </Think>
            </div>
          ) : null}

          {/* Think 消息独立展示：不渲染下方正文 */}
          {isThinkOnly ? null : (
            <>
              <div className='flex justify-end mb-2'>
                <Button
                  size='small'
                  type='text'
                  onClick={() => {
                    setMarkdownText(contentText);
                    setMarkdownOpen(true);
                  }}>
                  查看 Markdown 原文
                </Button>
              </div>

              {shouldUseXMarkdown ? (
                <XMarkdown
                  paragraphTag='div'
                  components={{
                    pre: MarkdownPre,
                    'custom-line': LineCompt,
                    'custom-bar': BarCompt,
                    'custom-pie': PieCompt,
                    'custom-scatter': ScatterCompt,
                    'custom-bubble': BubbleCompt
                  }}
                  streaming={{
                    hasNextChunk: isStreamingMessage
                  }}>
                  {contentText}
                </XMarkdown>
              ) : (
                <GPTVis components={{ code: visCodeRenderer }}>
                  {contentText}
                </GPTVis>
              )}
            </>
          )}
        </div>
      );
    },
    [chatHistory, hasNextChunk, token, visCodeRenderer]
  );

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
                    contentRender: renderAssistantContent
                  },
                  think: {
                    placement: 'start',
                    avatar: null,
                    variant: 'borderless',
                    rootClassName: 'w-full',
                    style: { width: '100%' },
                    styles: {
                      root: { width: '100%' },
                      body: { width: '100%' },
                      content: { width: '100%', maxWidth: 'none', padding: 0 }
                    },
                    contentRender: renderAssistantContent
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

            <div className='mt-4 w-full flex justify-center'>
              <div className='w-1/2 min-w-[420px] max-w-[720px]'>
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
