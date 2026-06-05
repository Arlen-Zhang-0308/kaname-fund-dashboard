'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Holding, PortfolioState, SoldPosition } from '@/lib/portfolio';

const fmt = (n: number | null | undefined) =>
  n === null || n === undefined || Number.isNaN(Number(n))
    ? '—'
    : '¥' + Number(n).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtNum = (n: number | null | undefined, digits = 4) =>
  n === null || n === undefined || Number.isNaN(Number(n))
    ? '—'
    : Number(n).toLocaleString('zh-CN', { minimumFractionDigits: digits, maximumFractionDigits: digits });
const fmtPct = (n: number | null | undefined) =>
  n === null || n === undefined || Number.isNaN(Number(n)) ? '—' : (Number(n) * 100).toFixed(2) + '%';
const pnlClass = (n: number | null | undefined) => (Number(n) >= 0 ? 'green' : 'red');

function CountUp({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start: number | null = null;
    let frame = 0;
    const step = (timestamp: number) => {
      if (start === null) start = timestamp;
      const p = Math.min((timestamp - start) / 900, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(value * eased);
      if (p < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <>{fmt(display)}</>;
}

function tag(layer: string, sold = false) {
  if (sold) return <span className="tag">已卖出观察</span>;
  if (layer === 'main_plan') return <span className="tag active">主计划</span>;
  return <span className="tag watch">独立追踪</span>;
}

function WeightBar({ weight }: { weight?: number | null }) {
  if (!weight) return <span className="muted">—</span>;
  return (
    <div className="bar">
      <i style={{ width: `${Math.max(2, weight * 100).toFixed(1)}%` }} />
    </div>
  );
}

function HoldingRow({ holding }: { holding: Holding }) {
  return (
    <tr>
      <td>{tag(holding.portfolio_layer)}</td>
      <td className="code">{holding.code}</td>
      <td><span className="name">{holding.name}</span><span className="sub">{holding.industry}</span></td>
      <td>{fmtNum(holding.units, holding.unit_label === '克' ? 4 : 1)} {holding.unit_label}</td>
      <td>{fmtNum(holding.cost_unit_price, 4)} / {holding.unit_label}<br /><span className="sub">成本 {fmt(holding.cost_amount)}</span></td>
      <td className="amount">{fmt(holding.current_amount)}</td>
      <td className={pnlClass(holding.unrealized_pnl)}>{fmt(holding.unrealized_pnl)}<span className="sub">{fmtPct(holding.unrealized_pnl_rate)}</span></td>
      <td><WeightBar weight={holding.current_amount_weight} /></td>
      <td><span className="sub">{holding.price_source || '—'}</span><span className="sub">{holding.price_updated_at || '—'}</span></td>
    </tr>
  );
}

function SoldRow({ sold }: { sold: SoldPosition }) {
  return (
    <tr>
      <td>{tag('', true)}</td>
      <td className="code">{sold.code}</td>
      <td><span className="name">{sold.name}</span><span className="sub">{sold.industry}</span></td>
      <td>{fmtNum(sold.sold_units, 2)} {sold.unit_label}</td>
      <td><span className="sub">原成本 {fmt(sold.cost_amount)}</span><br /><span className="sub">卖出单价 {fmtNum(sold.sell_unit_price, 4)}</span></td>
      <td className="amount">到账 {fmt(sold.proceeds_amount)}</td>
      <td className={pnlClass(sold.realized_pnl)}>{fmt(sold.realized_pnl)}<span className="sub">{fmtPct(sold.realized_pnl_rate)}</span></td>
      <td><span className="muted">不参与</span></td>
      <td><span className="sub">{sold.price_source || '—'}</span><span className="sub">{sold.sell_date || '—'}</span></td>
    </tr>
  );
}

export function DashboardClient({ state }: { state: PortfolioState }) {
  const mainRef = useRef<HTMLElement | null>(null);
  const mainHoldings = useMemo(() => state.holdings.filter((x) => x.portfolio_layer === 'main_plan'), [state]);
  const independentHoldings = useMemo(() => state.holdings.filter((x) => x.portfolio_layer === 'independent_tracking'), [state]);
  const mainAmount = mainHoldings.reduce((sum, item) => sum + (item.current_amount ?? 0), 0);
  const independentAmount = independentHoldings.reduce((sum, item) => sum + (item.current_amount ?? 0), 0);
  const groups = [
    ['主计划', mainAmount],
    ['独立追踪', independentAmount],
    ['已卖出到账', state.sold_positions.reduce((sum, item) => sum + (item.proceeds_amount ?? 0), 0)]
  ] as const;
  const groupMax = Math.max(...groups.map(([, value]) => value), 1);

  useEffect(() => {
    const progress = document.getElementById('progress');
    const glow = document.getElementById('glow');
    const onScroll = () => {
      const h = document.documentElement;
      if (progress) progress.style.width = `${(h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100}%`;
    };
    const onPointerMove = (event: PointerEvent) => {
      if (glow) {
        glow.style.left = `${event.clientX}px`;
        glow.style.top = `${event.clientY}px`;
      }
      document.querySelectorAll<HTMLElement>('.card,.table-card').forEach((card) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--x', `${event.clientX - rect.left}px`);
        card.style.setProperty('--y', `${event.clientY - rect.top}px`);
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pointermove', onPointerMove);
    };
  }, []);

  return (
    <>
      <div className="progress" id="progress" />
      <div className="cursor-glow" id="glow" />
      <main className="wrap" ref={mainRef}>
        <nav className="nav reveal">
          <div className="brand"><div className="mark"><svg viewBox="0 0 32 32"><path d="M6 22l7-10 6 5 7-11" fill="none" stroke="#d8b45f" strokeWidth="3" strokeLinecap="round" /></svg></div> KANAME LEDGER</div>
          <div><a href="#holdings">主计划</a><a href="#independent">独立追踪</a><a href="#allocation">资产分布</a><a href="/api/portfolio">API</a></div>
        </nav>

        <section className="hero">
          <div className="hero-main reveal">
            <div className="eyebrow">Vercel-backed private holdings cockpit</div>
            <h1>所有仓位，<br />由后端服务。</h1>
            <p>页面已从静态 HTML 升级为 Next.js 服务：前端负责驾驶舱体验，后端 API 统一输出 portfolio 状态，后续可以接入自动刷新、数据库或外部权威数据源。</p>
            <div className="hero-actions"><a className="btn magnetic" href="#holdings">查看主计划</a><a className="btn secondary magnetic" href="/api/portfolio/summary">查看摘要 API</a></div>
          </div>
          <aside className="hero-side reveal">
            <div><div className="total-label">当前总金额 / API-backed state</div><div className="total"><CountUp value={state.current_total_amount} /></div><div className="pill-row"><span className="pill green">当前持仓：{state.holdings.map((h) => h.code).join(' / ')}</span><span className="pill">已卖出：{state.sold_positions.map((s) => s.code).join(' / ')}</span><span className="pill red">数据源：/api/portfolio</span></div></div>
            <div className="mini-bars">{groups.map(([label, value]) => <div className="mini" key={label}><span>{label}</span><div className="bar"><i style={{ width: `${Math.max(3, (value / groupMax) * 100).toFixed(1)}%` }} /></div><b>{fmt(value)}</b></div>)}</div>
          </aside>
        </section>

        <section className="kpis">
          {[
            ['主基金当前金额', mainAmount, 'gold', '主计划资产组合，当前决策主视图。'],
            ['独立追踪当前金额', independentAmount, 'blue', '独立追踪资产组合，单独跟踪。'],
            ['当前持仓总盈亏', state.holding_total_pnl, pnlClass(state.holding_total_pnl), '由所有当前持仓的 unrealized_pnl 汇总。'],
            ['已卖出确认盈亏', state.sold_realized_pnl, pnlClass(state.sold_realized_pnl), '008327 与 020723 的 realized_pnl 汇总。']
          ].map(([label, value, cls, hint]) => <div className="card reveal" key={String(label)}><div className="label">{label}</div><div className={`value ${cls}`}>{fmt(Number(value))}</div><div className="hint">{hint}</div></div>)}
        </section>

        <section id="holdings">
          <div className="section-title"><h2>主计划与观察明细</h2><span>当前决策主视图，优先展示</span></div>
          <p className="main-only-note">这里由后端 PortfolioState 生成：主基金计划和已卖出观察标的；独立追踪资产放在后方独立追踪区。</p>
          <div className="table-card"><div className="table-wrap"><table><thead><tr><th>类别</th><th>代码/资产</th><th>名称</th><th>份额/数量</th><th>成本/成本价</th><th>当前/到账金额</th><th>盈亏</th><th>金额占比</th><th>价格来源</th></tr></thead><tbody>{mainHoldings.map((h) => <HoldingRow key={h.code} holding={h} />)}{state.sold_positions.map((s) => <SoldRow key={s.code} sold={s} />)}</tbody></table></div></div>
        </section>

        <section id="independent" className="independent-zone reveal">
          <div className="independent-head"><div><div className="eyebrow">Independent trackers · secondary layer</div><h2>独立追踪投资专区</h2><p>这一区只放不并入主基金计划的资产，由后端数据源动态生成。它们单独看成本、金额、风控线和浮盈，不影响主计划纪律。</p></div><div className="independent-total"><span>独立追踪当前金额</span><b>{fmt(independentAmount)}</b></div></div>
          <div className="independent-grid">{independentHoldings.map((h) => <article className="asset-card" key={h.code}><div className="asset-title"><div><h3>{h.name}</h3><span className="sub">{h.industry}</span></div><span className="code">{h.code}</span></div><div className="metric-grid"><div className="metric"><span>持有数量</span><b>{fmtNum(h.units, h.unit_label === '克' ? 4 : 1)} {h.unit_label}</b></div><div className="metric"><span>当前金额</span><b>{fmt(h.current_amount)}</b></div><div className="metric"><span>成本金额</span><b>{fmt(h.cost_amount)}</b></div><div className="metric"><span>当前盈亏</span><b className={pnlClass(h.unrealized_pnl)}>{fmt(h.unrealized_pnl)}</b></div></div><p className="asset-note">当前单价：{fmtNum(h.current_unit_price, 4)} / {h.unit_label}；收益率：{fmtPct(h.unrealized_pnl_rate)}；价格来源：{h.price_source}，日期：{h.price_updated_at}。{h.note ? ` ${h.note}` : ''}</p></article>)}</div>
        </section>

        <section id="allocation" className="grid-2">
          <div className="note"><h3>资产分层</h3><ul><li>主基金计划：{mainHoldings.map((x) => x.code).join('、')}，作为页面第一展示依据。</li><li>独立追踪：{independentHoldings.map((x) => x.code).join('、')}，单独看成本、金额和风控。</li><li>已卖出观察：{state.sold_positions.map((x) => x.code).join('、')}，只记录已确认收益，不参与当前金额占比。</li></ul></div>
          <div className="note"><h3>风险视图</h3><ul><li>当前持仓总盈亏 {fmt(state.holding_total_pnl)}，已卖出确认盈亏 {fmt(state.sold_realized_pnl)}。</li><li>服务端接口支持缓存策略，后续可以接入定时刷新和数据库。</li><li>页面所有数值来自 API-backed PortfolioState，而不是写死在 HTML DOM 中。</li></ul></div>
        </section>

        <section className="note data-note"><h3>后端接口</h3><ul><li><a href="/api/portfolio">GET /api/portfolio</a>：返回完整持仓状态。</li><li><a href="/api/portfolio/summary">GET /api/portfolio/summary</a>：返回驾驶舱摘要指标。</li><li>Snapshot：{state.updated_at}，schema_version：{state.schema_version}。</li></ul></section>
        <footer className="footer">Kaname Private Ledger · Vercel Service · Snapshot {state.updated_at}</footer>
      </main>
    </>
  );
}
