# -*- coding: utf-8 -*-
"""
聚宽策略：A 股多因子优化版 v2

研究目标：
1. 标的与基准一致：在中证 500 成分股中选股，基准也是中证 500。
2. 降低换手：每周调仓，并忽略组合净值 2% 以内的小额偏差。
3. 避免单因子追涨：价值、质量、中期动量、低波动四类因子共同打分。
4. 保留市场暴露：指数跌破 120 日均线时降到半仓，而不是长期完全空仓。
5. 可审计：收盘前撤销未成交订单，收盘后记录订单和成交数量。

这是研究和回测代码，不承诺跑赢指数。请分别做训练期、验证期、样本外测试。
"""

from jqdata import *
import datetime as dt
import numpy as np
import pandas as pd


def initialize(context):
    g.benchmark = '000905.XSHG'
    g.target_count = 10
    g.single_position_cap = 0.10
    g.min_rebalance_gap = 0.02
    g.full_exposure = 1.00
    g.defensive_exposure = 0.50

    set_benchmark(g.benchmark)
    set_option('avoid_future_data', True)
    set_option('use_real_price', True)
    set_order_cost(OrderCost(
        open_tax=0,
        close_tax=0.0005,
        open_commission=0.0003,
        close_commission=0.0003,
        min_commission=5
    ), type='stock')
    set_slippage(FixedSlippage(0.01))
    set_log_level('order', 'error')

    run_weekly(rebalance, weekday=1, time='10:00', reference_security=g.benchmark)
    run_daily(cancel_unfilled_orders, time='14:50', reference_security=g.benchmark)
    run_daily(after_close_audit, time='after_close', reference_security=g.benchmark)


def market_exposure(context):
    """用上一交易日数据判断仓位，避免使用未来数据。"""
    bars = attribute_history(
        g.benchmark, 121, '1d', ['close'],
        skip_paused=False, df=True, fq='pre'
    )
    if bars is None or len(bars) < 121:
        return g.defensive_exposure

    last_close = float(bars['close'].iloc[-1])
    ma120 = float(bars['close'].iloc[-120:].mean())
    return g.full_exposure if last_close >= ma120 else g.defensive_exposure


def build_stock_pool(context):
    """中证 500 成分股，过滤 ST、停牌、退市、新股和当前涨跌停。"""
    universe = get_index_stocks(g.benchmark, date=context.previous_date)
    current_data = get_current_data()
    all_stocks = get_all_securities(types=['stock'], date=context.previous_date)
    listing_cutoff = context.previous_date - dt.timedelta(days=180)
    pool = []

    for stock in universe:
        if stock not in all_stocks.index or stock not in current_data:
            continue
        if all_stocks.loc[stock, 'start_date'] > listing_cutoff:
            continue

        snapshot = current_data[stock]
        name = snapshot.name or ''
        if snapshot.paused or snapshot.is_st or 'ST' in name or '退' in name:
            continue
        if not np.isfinite(snapshot.last_price) or snapshot.last_price <= 0:
            continue
        if snapshot.last_price >= snapshot.high_limit or snapshot.last_price <= snapshot.low_limit:
            continue
        pool.append(stock)

    return pool


def get_factor_table(context, pool):
    """财务数据使用 previous_date；行情使用已经完成的日线。"""
    if not pool:
        return pd.DataFrame()

    q = query(
        valuation.code,
        valuation.pe_ratio,
        valuation.pb_ratio,
        valuation.market_cap,
        indicator.roe
    ).filter(
        valuation.code.in_(pool),
        valuation.pe_ratio > 0,
        valuation.pe_ratio < 60,
        valuation.pb_ratio > 0,
        valuation.pb_ratio < 8,
        valuation.market_cap > 30,
        indicator.roe > 8
    )
    fundamental = get_fundamentals(q, date=context.previous_date)
    if fundamental is None or fundamental.empty:
        return pd.DataFrame()

    fundamental = fundamental.drop_duplicates('code').set_index('code')
    candidates = list(fundamental.index)
    prices = history(
        61, unit='1d', field='close', security_list=candidates,
        df=True, skip_paused=False, fq='pre'
    )
    if prices is None or prices.empty:
        return pd.DataFrame()

    rows = []
    for stock in candidates:
        if stock not in prices.columns:
            continue
        close = prices[stock].dropna()
        if len(close) < 55 or close.iloc[0] <= 0:
            continue

        # 跳过最近 5 个交易日，减少短线冲高后的反转影响。
        momentum_60_5 = close.iloc[-6] / close.iloc[0] - 1
        daily_return = close.pct_change().replace([np.inf, -np.inf], np.nan).dropna()
        annual_volatility = daily_return.std() * np.sqrt(250)
        if not np.isfinite(momentum_60_5) or not np.isfinite(annual_volatility):
            continue

        item = fundamental.loc[stock]
        rows.append({
            'code': stock,
            'pe': float(item['pe_ratio']),
            'pb': float(item['pb_ratio']),
            'roe': float(item['roe']),
            'momentum': float(momentum_60_5),
            'volatility': float(annual_volatility),
        })

    return pd.DataFrame(rows).set_index('code') if rows else pd.DataFrame()


def percentile_score(series, higher_is_better=True):
    """5%/95% 缩尾后做横截面百分位，降低极端值影响。"""
    clean = series.replace([np.inf, -np.inf], np.nan)
    low, high = clean.quantile(0.05), clean.quantile(0.95)
    clipped = clean.clip(lower=low, upper=high)
    score = clipped.rank(pct=True)
    return score if higher_is_better else 1 - score


def select_stocks(context):
    factors = get_factor_table(context, build_stock_pool(context))
    if factors.empty or len(factors) < g.target_count:
        log.warn('有效候选不足，本周不调仓：%s', len(factors))
        return []

    factors['value_score'] = (
        percentile_score(factors['pe'], False) * 0.50
        + percentile_score(factors['pb'], False) * 0.50
    )
    factors['quality_score'] = percentile_score(factors['roe'], True)
    factors['momentum_score'] = percentile_score(factors['momentum'], True)
    factors['low_vol_score'] = percentile_score(factors['volatility'], False)
    factors['total_score'] = (
        factors['value_score'] * 0.25
        + factors['quality_score'] * 0.30
        + factors['momentum_score'] * 0.30
        + factors['low_vol_score'] * 0.15
    )

    ranked = factors.sort_values('total_score', ascending=False)
    selected = list(ranked.head(g.target_count).index)
    log.info('本周候选：%s', selected)
    return selected


def rebalance(context):
    targets = select_stocks(context)
    if not targets:
        return

    exposure = market_exposure(context)
    total_value = context.portfolio.total_value
    target_value = min(
        total_value * g.single_position_cap,
        total_value * exposure / len(targets)
    )
    current_data = get_current_data()

    # 先卖出落选股票。跌停或当日不可卖时保留并记录，不能假装成交。
    for stock, position in list(context.portfolio.positions.items()):
        if stock in targets:
            continue
        if position.closeable_amount <= 0:
            log.warn('不可卖出（可卖数量为 0）：%s', stock)
            continue
        if current_data[stock].last_price <= current_data[stock].low_limit:
            log.warn('跌停无法卖出：%s', stock)
            continue
        order = order_target_value(stock, 0)
        if order is None:
            log.warn('卖出订单未创建：%s', stock)

    # 再按目标市值买入；小于总资产 2% 的偏差不交易，降低无效换手。
    for stock in targets:
        snapshot = current_data[stock]
        if snapshot.paused or snapshot.last_price >= snapshot.high_limit:
            log.warn('暂停买入（停牌或涨停）：%s', stock)
            continue

        position = context.portfolio.positions.get(stock)
        current_value = position.value if position is not None else 0
        if abs(target_value - current_value) < total_value * g.min_rebalance_gap:
            continue
        order = order_target_value(stock, target_value)
        if order is None:
            log.warn('买入/调仓订单未创建：%s', stock)

    record(
        target_count=len(targets),
        target_exposure=exposure,
        position_count=len(context.portfolio.positions)
    )


def cancel_unfilled_orders(context):
    open_orders = get_open_orders()
    for order_id, order in open_orders.items():
        cancel_order(order)
        log.warn('收盘前撤销未成交订单：%s %s', order_id, order.security)


def after_close_audit(context):
    orders = get_orders()
    trades = get_trades()
    log.info(
        '收盘审计：订单 %s 笔，成交 %s 笔，持仓 %s 只，总资产 %.2f',
        len(orders), len(trades), len(context.portfolio.positions),
        context.portfolio.total_value
    )

