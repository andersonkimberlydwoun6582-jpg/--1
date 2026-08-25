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

export function buildJoinQuantStrategy(strategy: Strategy, config: StrategyConfig) {
  const maxPosition = safeNumber(config.maxPosition, 20, 1, 100) / 100;
  const commission = safeNumber(config.commission, 0.03, 0, 1) / 100;
  const stampDuty = safeNumber(config.stampDuty, 0.05, 0, 1) / 100;
  const slippage = safeNumber(config.slippage, 0.1, 0, 5) / 100;
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
