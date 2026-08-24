"use client";

import { useMemo, useState } from "react";
import "./lesson-review.css";

type Strategy = "价值成长" | "趋势择时" | "低波红利";

const stocks = [
  { code: "600519", name: "贵州茅台", sector: "消费", price: "1,462.00", change: "+1.18%", score: 91, tags: ["ROE", "现金流"] },
  { code: "300750", name: "宁德时代", sector: "新能源", price: "284.60", change: "+2.46%", score: 88, tags: ["成长", "动量"] },
  { code: "601318", name: "中国平安", sector: "金融", price: "46.72", change: "+0.71%", score: 84, tags: ["低估", "红利"] },
  { code: "000858", name: "五粮液", sector: "消费", price: "128.31", change: "-0.32%", score: 79, tags: ["质量", "价值"] },
  { code: "688981", name: "中芯国际", sector: "半导体", price: "93.10", change: "+3.25%", score: 76, tags: ["趋势", "突破"] },
];

const lessons = [
  { n: "01", title: "AI 辅助写策略：先跑通，再修错", desc: "识别平台错配、AI 幻觉和最小可运行闭环", state: "已看完", color: "mint" },
  { n: "02", title: "NumPy / Pandas 数据分析", desc: "用表格和向量把行情变成可以计算的因子", state: "进行中", color: "blue" },
  { n: "03", title: "策略编写与数据获取", desc: "把买卖规则拆成可复现的入场与退出条件", state: "待开始", color: "sand" },
  { n: "04", title: "基本面选股与技术择时", desc: "财务因子、估值因子与 MACD / RSI 的组合", state: "待开始", color: "violet" },
  { n: "05", title: "回测、归因与风险控制", desc: "识别过拟合，检查回撤、换手与交易成本", state: "待开始", color: "rose" },
];

const chart = [46, 52, 49, 57, 61, 59, 68, 73, 69, 78, 84, 91, 88, 96, 100];

export default function Home() {
  const [active, setActive] = useState("总览");
  const [strategy, setStrategy] = useState<Strategy>("价值成长");
  const [running, setRunning] = useState(false);
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState<string[]>(["600519", "601318"]);

  const filteredStocks = useMemo(
    () => stocks.filter((stock) => `${stock.code}${stock.name}${stock.sector}`.includes(query.trim())),
    [query],
  );

  const toggleSaved = (code: string) => {
    setSaved((current) => current.includes(code) ? current.filter((item) => item !== code) : [...current, code]);
  };

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">⟐</span><span>Alpha 研习社</span></div>
        <div className="workspace-pill"><span className="status-dot" />个人研究台<span className="chevron">⌄</span></div>
        <p className="nav-label">工作区</p>
        <nav className="nav-list" aria-label="主导航">
          {["总览", "股票筛选", "回测实验室", "复盘记录"].map((item) => (
            <button key={item} className={`nav-item ${active === item ? "active" : ""}`} onClick={() => setActive(item)}>
              <span className="nav-icon">{item === "总览" ? "◈" : item === "股票筛选" ? "⌕" : item === "回测实验室" ? "◒" : "▤"}</span>{item}
              {item === "股票筛选" && <span className="nav-badge">12</span>}
            </button>
          ))}
        </nav>
        <p className="nav-label learn-label">学习与资料</p>
        <nav className="nav-list">
          <button className={`nav-item ${active === "学习路径" ? "active" : ""}`} onClick={() => setActive("学习路径")}><span className="nav-icon">▣</span>教程学习路径</button>
          <button className="nav-item"><span className="nav-icon">◇</span>因子库 <span className="soon">Soon</span></button>
          <button className="nav-item"><span className="nav-icon">⚙</span>数据设置</button>
        </nav>
        <div className="sidebar-footer"><div className="avatar">L</div><div><strong>林同学</strong><span>本地模式 · 未同步</span></div><span className="more">•••</span></div>
      </aside>

      <section className="main-panel">
        <header className="topbar">
          <div className="crumbs"><span>个人研究台</span><span>/</span><strong>{active}</strong></div>
          <div className="top-actions"><span className="market-status"><i /> 沪深市场 · 交易日</span><button className="icon-button" aria-label="搜索">⌕</button><button className="icon-button" aria-label="通知">♢</button><button className="primary-button" onClick={() => setActive("回测实验室")}>＋ 新建实验</button></div>
        </header>

        <div className="content">
          {active === "学习路径" ? <LearningPath /> : active === "股票筛选" ? <Screener query={query} setQuery={setQuery} filteredStocks={filteredStocks} saved={saved} toggleSaved={toggleSaved} /> : active === "回测实验室" ? <Backtest strategy={strategy} setStrategy={setStrategy} running={running} setRunning={setRunning} /> : <Overview onOpen={(item) => setActive(item)} strategy={strategy} setStrategy={setStrategy} running={running} setRunning={setRunning} />}
        </div>
      </section>
    </main>
  );
}

function Overview({ onOpen, strategy, setStrategy, running, setRunning }: { onOpen: (item: string) => void; strategy: Strategy; setStrategy: (value: Strategy) => void; running: boolean; setRunning: (value: boolean) => void }) {
  return <>
    <div className="hero-row"><div><p className="eyebrow">MONDAY · 2026.08.24</p><h1>把每一次判断，<em>变成可验证的策略。</em></h1><p className="hero-copy">从教程里的知识点，到你自己的研究结论。这里是一个只属于你的 A 股量化工作台。</p></div><div className="hero-actions"><button className="secondary-button" onClick={() => onOpen("学习路径")}>继续学习 <span>→</span></button><button className="primary-button" onClick={() => onOpen("股票筛选")}>开始选股 <span>↗</span></button></div></div>
    <div className="insight-card"><div className="insight-icon">✦</div><div><span className="card-kicker">今日研究提示 · 基于教程第 37–42 节</span><h3>先控制回撤，再追求收益。</h3><p>把质量、估值和趋势拆开观察，避免只用单一技术指标做决定。</p></div><button className="text-button" onClick={() => onOpen("回测实验室")}>去实验室验证 →</button></div>
    <div className="section-heading"><div><p className="eyebrow">RESEARCH SNAPSHOT</p><h2>研究概览</h2></div><span className="muted">数据更新于 08:56 · 示例数据</span></div>
    <div className="metric-grid"><Metric label="策略组合净值" value="1.284" delta="+28.4%" note="过去 12 个月" positive /><Metric label="最大回撤" value="-8.7%" delta="↓ 2.1%" note="较上月改善" positive /><Metric label="今日候选" value="12" delta="+4" note="符合当前筛选器" positive /><Metric label="学习进度" value="24 / 108" delta="22%" note="已完成 24 个章节" /></div>
    <div className="dashboard-grid"><div className="panel performance-panel"><div className="panel-head"><div><p className="eyebrow">PORTFOLIO CURVE</p><h3>策略净值走势</h3></div><div className="segmented"><button className="selected">1Y</button><button>6M</button><button>1M</button></div></div><div className="chart-wrap"><div className="y-labels"><span>1.30</span><span>1.20</span><span>1.10</span><span>1.00</span></div><div className="bar-chart">{chart.map((height, index) => <div className="chart-col" key={index}><div className="bar" style={{ height: `${height}%` }} /><span>{index % 3 === 0 ? ["08/25", "11/25", "02/26", "05/26", "08/26"][index / 3] : ""}</span></div>)}</div></div><div className="chart-legend"><span><i className="legend-dot primary" />我的组合 <strong>+28.4%</strong></span><span><i className="legend-dot gray" />沪深 300 <strong className="dark">+11.6%</strong></span></div></div><div className="panel strategy-panel"><div className="panel-head"><div><p className="eyebrow">ACTIVE STRATEGY</p><h3>当前策略</h3></div><button className="dots">•••</button></div><div className="strategy-name"><span className="strategy-mark">◒</span><div><strong>{strategy}</strong><span>多因子 · 周频调仓</span></div><span className="live-tag">运行中</span></div><div className="factor-list"><div><span>价值因子</span><strong>30%</strong><div className="progress"><i style={{ width: "30%" }} /></div></div><div><span>质量因子</span><strong>40%</strong><div className="progress"><i style={{ width: "40%" }} /></div></div><div><span>趋势因子</span><strong>30%</strong><div className="progress"><i style={{ width: "30%" }} /></div></div></div><button className={`run-button ${running ? "running" : ""}`} onClick={() => { setRunning(true); setTimeout(() => setRunning(false), 1200); }}>{running ? "正在运行回测…" : "运行一次回测"}<span>→</span></button></div></div>
    <div className="section-heading lower"><div><p className="eyebrow">LEARNING PATH</p><h2>教程 → 工具</h2></div><button className="text-button" onClick={() => onOpen("学习路径")}>查看完整路径 →</button></div>
    <div className="lesson-grid">{lessons.slice(0, 3).map((lesson) => <LessonCard key={lesson.n} lesson={lesson} />)}</div>
  </>;
}

function Metric({ label, value, delta, note, positive }: { label: string; value: string; delta: string; note: string; positive?: boolean }) { return <div className="metric-card"><span className="metric-label">{label}</span><strong>{value}</strong><div><span className={positive ? "up" : "neutral"}>{delta}</span><span className="metric-note">{note}</span></div></div>; }

function Screener({ query, setQuery, filteredStocks, saved, toggleSaved }: { query: string; setQuery: (value: string) => void; filteredStocks: typeof stocks; saved: string[]; toggleSaved: (code: string) => void }) { return <><div className="page-heading"><div><p className="eyebrow">STOCK SCREENER</p><h1>股票筛选</h1><p>把教程里的因子，组合成今天可解释的候选池。</p></div><button className="primary-button">保存筛选器</button></div><div className="filter-strip"><div className="search-field"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索股票代码、名称或行业" /></div><span className="filter-chip">沪深 A 股 ×</span><span className="filter-chip">ROE ≥ 15% ×</span><span className="filter-chip">近 20 日动量 ↑ ×</span><button className="text-button">＋ 添加条件</button></div><div className="screener-summary"><div><span>符合条件</span><strong>{filteredStocks.length} <small>/ 5,218</small></strong></div><div><span>组合逻辑</span><strong>价值 + 质量 + 趋势</strong></div><div><span>调仓频率</span><strong>每周一</strong></div></div><div className="table-panel"><div className="table-head"><h3>候选股票</h3><span>排序：综合评分 ↓</span></div><div className="stock-table"><div className="table-row table-header"><span>股票</span><span>行业</span><span>最新价</span><span>今日涨跌</span><span>综合评分</span><span /></div>{filteredStocks.map((stock) => <div className="table-row" key={stock.code}><div className="stock-name"><button className={`star ${saved.includes(stock.code) ? "saved" : ""}`} onClick={() => toggleSaved(stock.code)} aria-label={`收藏 ${stock.name}`}>★</button><div><strong>{stock.name}</strong><span>{stock.code}</span></div></div><span className="sector-pill">{stock.sector}</span><strong>{stock.price}</strong><span className={stock.change.startsWith("+") ? "up" : "down"}>{stock.change}</span><div className="score"><strong>{stock.score}</strong><div><i style={{ width: `${stock.score}%` }} /></div></div><button className="row-arrow">↗</button></div>)}</div></div></>; }

function Backtest({ strategy, setStrategy, running, setRunning }: { strategy: Strategy; setStrategy: (value: Strategy) => void; running: boolean; setRunning: (value: boolean) => void }) { return <><div className="page-heading"><div><p className="eyebrow">BACKTEST LAB</p><h1>回测实验室</h1><p>把一个想法变成一组能被复盘的数字。</p></div><button className="primary-button" onClick={() => { setRunning(true); setTimeout(() => setRunning(false), 1400); }}>{running ? "运行中…" : "运行回测"}</button></div><div className="backtest-grid"><div className="panel config-panel"><div className="panel-head"><div><p className="eyebrow">CONFIGURATION</p><h3>实验设置</h3></div><span className="draft-tag">草稿</span></div><label>选择策略</label><div className="strategy-options">{(["价值成长", "趋势择时", "低波红利"] as Strategy[]).map((item) => <button key={item} className={strategy === item ? "selected" : ""} onClick={() => setStrategy(item)}>{item}<span>{item === "价值成长" ? "多因子" : item === "趋势择时" ? "技术指标" : "股息质量"}</span></button>)}</div><div className="form-grid"><label>回测区间<select defaultValue="近 3 年"><option>近 3 年</option><option>近 5 年</option><option>全历史</option></select></label><label>初始资金<input defaultValue="100,000" /></label><label>调仓周期<select defaultValue="周频"><option>周频</option><option>日频</option><option>月频</option></select></label><label>单票上限<input defaultValue="20%" /></label></div><div className="cost-row"><span>交易成本</span><span>佣金 0.03% · 印花税 0.05% · 滑点 0.10%</span></div></div><div className="panel result-panel"><div className="panel-head"><div><p className="eyebrow">RESULT PREVIEW</p><h3>{strategy} · 回测结果</h3></div><span className="date-tag">2023.08 — 2026.08</span></div><div className="result-metrics"><div><span>累计收益</span><strong className="up">+28.40%</strong></div><div><span>年化收益</span><strong>+9.03%</strong></div><div><span>最大回撤</span><strong className="down">-8.70%</strong></div><div><span>夏普比率</span><strong>1.42</strong></div></div><div className="mini-chart"><div className="mini-grid" />{chart.map((height, index) => <i key={index} style={{ height: `${height * .74}%` }} />)}</div><div className="result-footer"><span>胜率 58.3%</span><span>交易次数 86</span><span>换手率 112%</span><button className="text-button">查看完整报告 →</button></div></div></div><div className="callout"><span>ⓘ</span><p>这是示例回测结果，接入真实行情数据后才会计算真实表现。历史收益不代表未来收益。</p></div></>; }

function LearningPath() { return <><div className="page-heading"><div><p className="eyebrow">COURSE MAP</p><h1>教程学习路径</h1><p>把 B 站 108 集课程，压缩成一条能真正做出东西的个人路线。</p></div><div className="progress-ring"><strong>22%</strong><span>已完成</span></div></div><div className="course-note"><div className="course-avatar">B</div><div><strong>参考课程：B站 Python 官方资源 · 量化交易教程</strong><p>课程目录覆盖基础、数据分析、策略、选股、择时与回测；网站只提炼方法，不转载视频内容。</p></div><a href="https://www.bilibili.com/video/BV1bXCTBGE42" target="_blank" rel="noreferrer">打开原课程 ↗</a></div><LessonReview /><div className="lesson-list">{lessons.map((lesson, index) => <div className={`lesson-row ${index === 1 ? "current" : ""}`} key={lesson.n}><div className={`lesson-number ${lesson.color}`}>{lesson.n}</div><div className="lesson-info"><strong>{lesson.title}</strong><span>{lesson.desc}</span></div><div className="lesson-status">{lesson.state}{index < 2 && <i />}</div><button className="row-arrow">→</button></div>)}</div><div className="method-grid"><div><span>每节课的输出</span><strong>一条可运行的研究笔记</strong></div><div><span>每周的复盘</span><strong>策略 · 交易 · 风险三栏</strong></div><div><span>最终目标</span><strong>形成自己的投资流程</strong></div></div></>; }

function LessonReview() { return <section className="lesson-review"><div className="review-head"><div><p className="eyebrow">LESSON 01 · WATCHED</p><h3>AI 能帮你写代码，但不能替你判断代码</h3></div><span className="review-tag">我的思考</span></div><div className="review-columns"><div><span className="review-label">这节课讲清楚了</span><ul><li>QMT、MiniQMT、PTrade 等平台的函数不能混着用。</li><li>先拿一个现成策略跑通框架，再逐步增加规则。</li><li>报错时先看错误行、函数是否存在，不要让 AI 一次重写几百行。</li></ul></div><div><span className="review-label">视频里的示例规则</span><p>20 日高点回撤 ≥ 20%，连续 3 天不创新低后买入；冲高 8% 且从高点回落 4% 卖出；亏损 8% 止损，最多持有 10 天。</p><span className="review-label">我的判断</span><p className="review-opinion">最有价值的不是这些参数，而是“先验证框架，再让 AI 改小块”的工作方法。参数必须经过回测，不能直接当成买卖建议。</p></div></div></section>; }

function LessonCard({ lesson }: { lesson: (typeof lessons)[number] }) { return <div className="lesson-card"><div className={`lesson-number ${lesson.color}`}>{lesson.n}</div><div><span className="lesson-state">{lesson.state}</span><h3>{lesson.title}</h3><p>{lesson.desc}</p></div><span className="card-arrow">↗</span></div>; }

