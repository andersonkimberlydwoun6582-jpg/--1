import type { Strategy } from "./page";

export type StrategyConfig = {
  period: string;
  initialCash: string;
  frequency: "日频" | "周频" | "月频";
  maxPosition: string;
  benchmark: string;
  commission: string;
  stampDuty: string;
  slippage: string;
};

const safeNumber = (value: string, fallback: number, min: number, max: number) => {
  const parsed = Number.parseFloat(value.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
};

const buildWufuStrategy = (config: StrategyConfig, commission: number, slippage: number) => `# 聚宽教学案例：五福融合改 · 走弱期日内双选版
# 来源：用户提供的聚宽文章《别再成为别人的五福提款机》
# 学习配置：区间 ${config.period}｜初始资金 ${config.initialCash}
# 注意：固定时间和公开 ETF 池容易被套利；请先做样本外回测，不要直接实盘。

from jqdata import *
import math
import numpy as np

GLOBAL_ETF_POOL = [
    '518880.XSHG', '501018.XSHG', '161226.XSHE', '159985.XSHE',
    '159980.XSHE', '513310.XSHG', '159518.XSHE', '159509.XSHE',
    '513100.XSHG', '513520.XSHG', '513500.XSHG', '159502.XSHE',
    '513400.XSHG', '513030.XSHG', '513290.XSHG', '520830.XSHG',
    '159529.XSHE',
]
LOOKBACK_DAYS = 25
WEAK_MA_DAYS = 10
R2_THRESHOLD = 0.4


def initialize(context):
    set_option('avoid_future_data', True)
    set_option('use_real_price', True)
    set_slippage(PriceRelatedSlippage(${slippage.toFixed(6)}), type='fund')
    set_order_cost(OrderCost(
        open_tax=0, close_tax=0,
        open_commission=${commission.toFixed(6)},
        close_commission=${commission.toFixed(6)},
        min_commission=5
    ), type='fund')
    g.is_weak = False
    g.weak_streak = 0
    g.exit_streak = 0
    g.morning_symbol = None
    g.morning_bought = False
    # 原案例固定时点；这是最需要做反套利改造的地方。
    run_daily(check_market_regime, time='09:40')
    run_daily(morning_selection, time='11:25')
    run_daily(afternoon_selection, time='13:05')
    run_daily(close_all_positions, time='13:11')


def check_market_regime(context):
    indexes = ['000300.XSHG', '399101.XSHE', '399006.XSHE', '000510.XSHG']
    below = 0
    above = 0
    for index in indexes:
        data = attribute_history(index, WEAK_MA_DAYS + 1, '1d', ['close'], skip_paused=False)
        if data is None or len(data) < WEAK_MA_DAYS:
            continue
        current = data['close'].iloc[-1]
        average = data['close'].iloc[-WEAK_MA_DAYS:].mean()
        below += current < average
        above += current > average
    g.weak_streak = g.weak_streak + 1 if below >= 3 else 0
    g.exit_streak = g.exit_streak + 1 if above >= 3 else 0
    if not g.is_weak and g.weak_streak >= 2:
        g.is_weak = True
        g.exit_streak = 0
    elif g.is_weak and g.exit_streak >= 2:
        g.is_weak = False
        g.weak_streak = 0
    record(weak_status=1 if g.is_weak else 0)


def momentum_score(closes):
    if len(closes) < LOOKBACK_DAYS + 1:
        return None
    y = np.log(np.asarray(closes[-(LOOKBACK_DAYS + 1):], dtype=float))
    x = np.arange(len(y))
    slope, intercept = np.polyfit(x, y, 1)
    predicted = slope * x + intercept
    total = np.sum((y - np.mean(y)) ** 2)
    r2 = 1 - np.sum((y - predicted) ** 2) / total if total else 0
    annualized = math.exp(slope * 250) - 1
    return annualized * r2 if r2 >= R2_THRESHOLD else None


def rank_etfs(context):
    current_data = get_current_data()
    ranked = []
    for security in GLOBAL_ETF_POOL:
        if security not in current_data or current_data[security].paused:
            continue
        history = attribute_history(security, LOOKBACK_DAYS + 1, '1d', ['close'], skip_paused=True)
        if history is None or len(history) < LOOKBACK_DAYS + 1:
            continue
        closes = history['close'].dropna().values
        score = momentum_score(closes)
        if score is None or score < 0:
            continue
        # 最近三日避免单日大跌超过约 3%。
        recent = closes[-4:]
        if len(recent) == 4 and np.min(recent[1:] / recent[:-1]) < 0.97:
            continue
        ranked.append((security, score))
    ranked.sort(key=lambda item: item[1], reverse=True)
    return ranked


def morning_selection(context):
    if not g.is_weak:
        return
    ranked = rank_etfs(context)
    if not ranked:
        return
    g.morning_symbol = ranked[0][0]
    order_target_value(g.morning_symbol, context.portfolio.total_value * 0.5)
    g.morning_bought = True


def afternoon_selection(context):
    if not g.is_weak:
        return
    ranked = rank_etfs(context)
    if not ranked:
        return
    symbol = ranked[0][0]
    total_value = context.portfolio.total_value
    if g.morning_symbol and symbol != g.morning_symbol:
        order_target(g.morning_symbol, 0)
    order_target_value(symbol, total_value)
    g.morning_symbol = symbol


def close_all_positions(context):
    for security in list(context.portfolio.positions):
        order_target(security, 0)
    g.morning_symbol = None
    g.morning_bought = False


# 运行前必须检查：订单是否成交、ETF 是否支持当日卖出、涨跌停、滑点、换手和最大回撤。
`;

export function buildJoinQuantStrategy(strategy: Strategy, config: StrategyConfig) {
  const maxPosition = safeNumber(config.maxPosition, 20, 1, 100) / 100;
  const commission = safeNumber(config.commission, 0.03, 0, 1) / 100;
  const stampDuty = safeNumber(config.stampDuty, 0.05, 0, 1) / 100;
  const slippage = safeNumber(config.slippage, 0.1, 0, 5) / 100;
  if (strategy === "五福融合改") return buildWufuStrategy(config, commission, slippage);
  const schedule = config.frequency === "日频"
    ? "run_daily(rebalance, time='09:35')"
    : config.frequency === "月频"
      ? "run_monthly(rebalance, monthday=1, time='09:35')"
      : "run_weekly(rebalance, weekday=1, time='09:35')";
  const picker = strategy === "趋势择时"
    ? `def pick_stocks(context, stocks):
    prices = history(21, '1d', 'close', security_list=stocks, df=True)
    momentum = (prices.iloc[-1] / prices.iloc[0] - 1).sort_values(ascending=False)
    return list(momentum.head(20).index)`
    : strategy === "低波红利"
      ? `def pick_stocks(context, stocks):
    q = query(valuation.code, valuation.pb_ratio, indicator.roe).filter(
        valuation.code.in_(stocks), valuation.pb_ratio > 0, indicator.roe > 8
    ).order_by(valuation.pb_ratio.asc()).limit(20)
    return list(get_fundamentals(q).code)`
      : `def pick_stocks(context, stocks):
    q = query(valuation.code, valuation.pe_ratio, indicator.roe).filter(
        valuation.code.in_(stocks), valuation.pe_ratio > 0, indicator.roe > 10
    ).order_by(indicator.roe.desc()).limit(20)
    return list(get_fundamentals(q).code)`;

  return `# 聚宽策略生成器 · ${strategy}
# 学习配置：区间 ${config.period}｜初始资金 ${config.initialCash}｜${config.frequency}
# 基准 ${config.benchmark}｜单票上限 ${Math.round(maxPosition * 100)}%
# 代码用于学习和回测，请先在聚宽研究/回测环境核验字段与权限。

from jqdata import *


def initialize(context):
    g.max_position = ${maxPosition.toFixed(4)}
    g.benchmark = '${config.benchmark}'
    set_benchmark(g.benchmark)
    set_option('use_real_price', True)
    set_option('avoid_future_data', True)
    set_order_cost(OrderCost(
        open_tax=${stampDuty.toFixed(6)}, close_tax=${stampDuty.toFixed(6)},
        open_commission=${commission.toFixed(6)}, close_commission=${commission.toFixed(6)},
        min_commission=5
    ), type='stock')
    set_slippage(FixedSlippage(${slippage.toFixed(6)}))
    ${schedule}


def rebalance(context):
    universe = get_index_stocks(g.benchmark)
    universe = filter_stock_list(universe)
    target = pick_stocks(context, universe)
    if not target:
        log.warn('没有通过筛选的股票，跳过本次调仓')
        return

    for stock in list(context.portfolio.positions):
        if stock not in target:
            order_target_percent(stock, 0)

    weight = min(g.max_position, 1.0 / len(target))
    for stock in target:
        order_target_percent(stock, weight)
    record(selected_count=len(target), target_weight=weight)


def filter_stock_list(stocks):
    current_data = get_current_data()
    return [stock for stock in stocks
            if not current_data[stock].paused
            and not current_data[stock].is_st
            and current_data[stock].last_price > 0]


${picker}


# 研究提醒：回测结果要同时检查数据对齐、订单、成交、持仓、滑点和最大回撤。
# 不要把示例参数或历史收益直接当成实盘买卖建议。
`;
}
