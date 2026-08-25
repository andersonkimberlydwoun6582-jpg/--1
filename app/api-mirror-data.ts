export type ApiMirrorImage = { src: string; alt: string; caption: string };

export type ApiMirrorSection = {
  key: string;
  title: string;
  group: string;
  summary: string;
  bullets: string[];
  images?: ApiMirrorImage[];
};

export const apiMirrorSections: ApiMirrorSection[] = [
  { key: "api", title: "API 文档", group: "总览", summary: "聚宽策略 API 的使用地图：先了解运行环境和数据，再进入策略函数、交易对象与示例。带有 ♠ 的接口只适用于回测或模拟环境，不能直接放进投资研究。", bullets: ["先用目录或浏览器搜索定位函数", "区分研究环境、回测环境和模拟环境", "遇到接口疑问优先以官方函数说明和最小样例核验"] },
  { key: "start-simple", title: "简单但是完整的策略", group: "开始写策略", summary: "一个最小策略由初始化函数和执行函数组成。初始化阶段保存标的、设置基准和运行频率，执行阶段读取数据并决定是否下单。", bullets: ["先让策略能启动、能读数据、能下单", "把无意义的买卖示例当作 API 验证，不当作投资建议", "再把价格条件或基本面条件接入交易逻辑"] },
  { key: "start-useful", title: "实用的策略", group: "开始写策略", summary: "文档用五日均线和上一时点价格演示从数据到信号的完整链路：读取历史收盘价、计算均值、判断阈值、下单并记录曲线。", bullets: ["数据窗口和当前价格必须对齐", "交易前确认现金、持仓和可卖数量", "record 与 log 用来解释策略为什么做了交易"] },
  { key: "engine-safe", title: "安全", group: "策略引擎介绍", summary: "策略运行在隔离环境中，平台限制文件、资源和运行时间，以降低代码互相影响和攻击平台的风险。", bullets: ["只使用平台允许的库和文件接口", "不要把账号、密钥或私有数据写进公开策略", "超时、内存和网络限制会影响分钟级研究"] },
  { key: "engine-data", title: "数据", group: "策略引擎介绍", summary: "平台覆盖股票、基金、期货、指数、行业和概念等数据，并包含退市标的以减少幸存者偏差。行情时间、前复权和 T+1 更新规则必须写进研究记录。", bullets: ["股票行情、财务、公司概况和融资融券是常用数据层", "指数成分股要按历史时点读取，避免未来函数", "分钟 K 线的时间标记是结束时间，不能凭直觉解释"] },
  { key: "engine-frequency", title: "运行频率", group: "策略引擎介绍", summary: "Bar 是一个时间区间内的价格数据单元。策略可以按天、分钟或 Tick 运行；频率决定函数被调用的节奏，也决定可观察到的数据粒度。", bullets: ["日频适合低频择时和组合调仓", "分钟频率每天触发多次，要处理午间和收盘边界", "Tick 频率更细，但数据、资源和订阅成本更高"], images: [
    { src: "https://image.joinquant.com/b73b2812aa69e60efdfb5beadf3dd6f4", alt: "Bar 的示意图", caption: "Bar 的示意图" },
    { src: "https://image.joinquant.com/21ca2d28fc95f03d2dee19167c852cc5", alt: "K线序列", caption: "多个 Bar 组成时间序列" },
    { src: "https://image.joinquant.com/a4c07b34af5e739e47072dd5049c3666", alt: "日K线", caption: "日频运行示意" },
    { src: "https://image.joinquant.com/5c772a9f8a9d9eeb57e9eca24d368315", alt: "分钟K线", caption: "分钟频率运行示意" },
    { src: "https://image.joinquant.com/6fbe6f917d9e2397790ad98ed4442e20", alt: "Tick序列", caption: "Tick 触发示意" },
  ] },
  { key: "engine-time", title: "运行时间", group: "策略引擎介绍", summary: "run_daily、run_weekly、run_monthly 与 before_trading_start、handle_data、after_trading_end 共同决定策略在开盘前、盘中和收盘后的执行顺序。", bullets: ["明确使用具体时间还是 every_bar", "同一时点先执行定时函数，再执行生命周期函数", "不要在同一策略里混用 handle_data 和 run_xxx"] },
  { key: "engine-orders", title: "订单处理", group: "策略引擎介绍", summary: "委托会经历创建、检查、报单、确认和撮合。市价单与限价单在天、分钟、Tick 频率下有不同的成交和挂单规则，回测还会受到成交量比例限制。", bullets: ["未完成订单会在交易日结束后撤销", "滑点、涨跌停、盘口和 order_volume_ratio 会改变成交结果", "信号、委托、成交和持仓要分开记录"], images: [
    { src: "https://image.joinquant.com/10214ebd70458d23838382a1a8e0f7cd", alt: "图解订单处理", caption: "订单处理流程图" },
  ] },
  { key: "engine-adjust", title: "拆分合并与分红", group: "策略引擎介绍", summary: "传统前复权保持价格连续；真实价格模式则在账户层面处理分红、拆分和合并。两种模式会影响价格、现金、持仓数量和回测解释。", bullets: ["记录回测使用的复权模式", "比较策略时不能混用不同复权口径", "分红现金和持仓变化要和交易日志核对"], images: [
    { src: "https://image.joinquant.com/cfa8e207b0590a821c236f374eaed457", alt: "传统回测模式", caption: "传统前复权模式" },
    { src: "https://image.joinquant.com/b85f579811e3ee8209ac311761ee5d74", alt: "开启真实价格回测", caption: "真实价格（动态复权）模式" },
  ] },
  { key: "engine-tax", title: "股息红利税的计算", group: "策略引擎介绍", summary: "真实交易会根据持有期限和先进先出规则计算红利税；回测和模拟为了在分红日结算，通常采用统一税率的近似口径。", bullets: ["分次买入要按先进先出对应持仓时间", "盘中做 T 后的净额会影响持仓时间判断", "研究报告中标注税费近似，避免误读收益"] },
  { key: "engine-cost", title: "滑点与交易税费", group: "策略引擎介绍", summary: "滑点用于模拟预期价与最终成交价之间的偏差；交易税费由券商手续费和印花税构成，应通过设置函数明确写入回测。", bullets: ["保守滑点比零滑点更接近实盘压力测试", "手续费有最低收费，不能只按比例估算", "印花税通常按卖方单边计入"] },
  { key: "engine-risk", title: "风险指标", group: "策略引擎介绍", summary: "收益、年化收益、Alpha、Beta、Sharpe、Sortino、波动率、最大回撤和胜率等指标要一起看。指标按什么时间粒度更新，也会影响解读。", bullets: ["先看最大回撤和回撤持续时间，再看收益", "Alpha、Beta 和 Sharpe 依赖基准和样本区间", "盘中收益与日终风险指标可能不同"] },
  { key: "engine-backtest", title: "回测环境与回测过程", group: "策略引擎介绍", summary: "回测流程是准备策略、选择股票池和日期、设定资金与频率、逐时调用策略、撮合订单、输出净值与风险指标。", bullets: ["先用短区间和单只标的做最小回测", "核对数据、信号、订单、成交和持仓五层结果", "回测结果不等于未来收益，也不替代模拟盘验证"] },
  { key: "engine-other", title: "模拟盘、期货交割、还券与组合优化", group: "策略引擎介绍", summary: "模拟交易要注意与回测的差别；期货策略要处理交割日；融券策略要关注还券细则；组合优化器则用于在约束条件下生成权重。", bullets: ["模拟盘要记录真实运行时刻和成交状态", "期货和融券不能直接套用股票策略假设", "优化器输出仍需检查约束、换手和可交易性"] },
  { key: "architecture", title: "策略程序架构", group: "策略程序架构", summary: "把策略拆成初始化、开盘前、盘中、收盘后、数据读取、信号、订单和日志几个职责清晰的阶段，便于测试和排错。", bullets: ["初始化只做一次性配置", "信号计算与下单执行分离", "任何一次交易都留下可追溯日志"] },
  { key: "api-settings", title: "策略设置函数", group: "策略 API 介绍", summary: "基准、复权、滑点、交易成本、运行时间和日志等设置决定策略的研究口径。设置要集中、明确，并写入实验记录。", bullets: ["先设定基准、真实价格和成本", "把频率和运行时间当作策略的一部分", "不要复制没有验证过的参数"] },
  { key: "api-data", title: "数据获取函数与 jqlib", group: "策略 API 介绍", summary: "行情、历史数据、财务数据、指数成分股、行业概念和技术指标接口构成策略的数据层。jqlib 提供部分因子、技术分析与组合工具。", bullets: ["检查返回对象的日期、股票代码、字段和缺失值", "查询历史数据时显式给出结束日期和窗口", "研究和回测环境的可用函数要分别核验"] },
  { key: "api-process", title: "数据处理与组合优化函数", group: "策略 API 介绍", summary: "数据处理函数负责清洗、排序、分组和对齐；组合优化函数把收益、风险、行业、个股和换手约束转成目标权重。", bullets: ["先对齐因子日期和交易日期", "优化前处理缺失值、极端值和不可交易标的", "输出权重后再次检查总权重、单票上限和换手"] },
  { key: "api-trade", title: "交易函数与对象", group: "策略 API 介绍", summary: "交易函数负责创建订单、查询未完成订单、撤单和调整目标仓位；订单、持仓、账户和上下文对象记录执行结果。", bullets: ["下单后不能假设立即成交", "使用对象状态确认可卖数量和现金", "给重复信号和重复委托加保护"] },
  { key: "api-special", title: "策略组合、Tick、融资融券与期货接口", group: "策略 API 介绍", summary: "这些是特定交易场景的扩展接口，适用于组合策略、Tick 级策略、融资融券和期货。使用前要确认账户类型和运行环境。", bullets: ["不同资产的交易规则、保证金和结算不同", "Tick 数据量更大，先做小范围验证", "专用接口不能跨环境直接照搬"] },
  { key: "api-attribution", title: "归因分析说明", group: "策略 API 介绍", summary: "净值分析、Brinson 归因和因子归因帮助回答收益来自哪里、超额收益是否稳定，以及组合暴露了哪些风险。", bullets: ["先确认基准、持仓和收益口径", "把配置、选股和交互贡献分开看", "归因结果用于解释和复盘，不是未来收益承诺"] },
  { key: "examples", title: "策略示例", group: "策略示例", summary: "均线、多股票持仓、多股票追涨和节日效应示例，把前面的生命周期、数据、交易和风险规则串成可运行的参考。", bullets: ["先读懂示例的调用顺序", "替换标的和参数前先做最小回测", "示例是学习模板，不是直接买卖信号"] },
];
