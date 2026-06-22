// ============================================================
// 年终合账面板 —— 《晋·信》
//
// 四步流程：对账 → 分红 → 人事评定 → 来年规划
// ============================================================

import { useMemo, useState, useCallback, useEffect } from 'react';
import type { Staff } from '../../types';
import { useGameState } from '../../hooks/useGameState';
import { useToast } from '../common/Toast';
import { calcDividendOptions, calcStaffPerformance, getBranchName, getRatingLabel, getRatingColor } from '../../engine/annual';
import type { DividendPlan } from '../../engine/annual';
import type { LedgerDiscrepancy } from '../../types';

type Step = 1 | 2 | 3 | 4;

// ================================================================
// 步骤指示器
// ================================================================

function StepIndicator({ current }: { current: Step }) {
  const steps = ['对账', '分红留利', '人事评定', '来年规划'];
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
      {steps.map((label, i) => {
        const n = (i + 1) as Step;
        const active = n === current;
        const done = n < current;
        return (
          <div
            key={n}
            style={{
              flex: 1,
              textAlign: 'center',
              padding: '10px 8px',
              borderRadius: 6,
              background: active ? 'rgba(139,37,0,0.08)' : done ? 'rgba(139,37,0,0.03)' : 'transparent',
              border: active ? '2px solid var(--color-red-seal)' : '1px solid var(--color-paper-border)',
              fontWeight: active ? 700 : 400,
              color: done ? 'var(--color-ink-muted)' : active ? 'var(--color-red-seal)' : 'var(--color-ink-muted)',
              fontSize: '0.85rem',
            }}
          >
            {done ? '✓' : n} {label}
          </div>
        );
      })}
    </div>
  );
}

// ================================================================
// 步骤一：对账
// ================================================================

function StepAudit({ onNext }: { onNext: () => void }) {
  const { state, dispatch } = useGameState();
  const ledger = state.annualLedger;
  if (!ledger) return null;

  const [resolved, setResolved] = useState<Record<string, boolean>>({});

  const handleInvestigate = (d: LedgerDiscrepancy) => {
    // 查账消耗银两，揭示真相
    dispatch({ type: 'UPDATE_SILVER', payload: { headquarters: -1500 } });
    dispatch({
      type: 'ADD_LOG',
      message: `年终查账：${getBranchName(d.branchId)}账目差异${d.amount.toLocaleString()}两——${d.actualReason || d.explanation}`,
    });
    setResolved(prev => ({ ...prev, [d.branchId + d.amount]: true }));
  };

  const handleAccept = (d: LedgerDiscrepancy) => {
    dispatch({
      type: 'ADD_LOG',
      message: `年终对账：采信${getBranchName(d.branchId)}掌柜解释（${d.explanation}）`,
    });
    setResolved(prev => ({ ...prev, [d.branchId + d.amount]: true }));
  };

  const allResolved = ledger.discrepancies.every(d => resolved[d.branchId + d.amount]);

  return (
    <div>
      <div className="section-title"><h2>🧾 第一步：对账</h2></div>
      <p className="text-muted" style={{ marginBottom: 20, marginTop: -12 }}>
        {ledger.year}年各分号账目已汇至总号，请大掌柜逐项核对。
      </p>

      {/* 分号报表 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        {ledger.branchReports.map(r => {
          const bname = getBranchName(r.branchId);
          const profitClass = r.profit >= 0 ? 'text-profit' : 'text-loss';
          return (
            <div key={r.branchId} className="card" style={{ marginBottom: 0 }}>
              <div className="card__title">{bname}</div>
              <div className="card__body">
                <p>收入：{r.revenue.toLocaleString()} 两</p>
                <p>支出：{r.expenses.toLocaleString()} 两</p>
                <p>利润：<span className={profitClass}>{r.profit.toLocaleString()} 两</span></p>
                <p>业务：{r.businessCount} 笔 · 问题：{r.issueCount} 处</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 年度汇总 */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card__title">年度汇总</div>
        <div className="card__body">
          <p>
            全年净利润：
            <span className={ledger.totalProfit >= 0 ? 'text-profit' : 'text-loss'} style={{ fontWeight: 700, fontSize: '1.2rem' }}>
              {ledger.totalProfit.toLocaleString()} 两
            </span>
          </p>
        </div>
      </div>

      {/* 差异项 */}
      {ledger.discrepancies.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ marginBottom: 12 }}>⚠️ 账目差异</h3>
          {ledger.discrepancies.map(d => {
            const key = d.branchId + d.amount;
            const done = resolved[key];
            return (
              <div key={key} className="card" style={{
                borderLeft: done ? '4px solid var(--color-profit)' : '4px solid var(--color-warning)',
                marginBottom: 12,
              }}>
                <div className="card__title">
                  {getBranchName(d.branchId)} · 差异 {d.amount.toLocaleString()} 两
                  {done && <span style={{ color: 'var(--color-profit)', marginLeft: 8 }}>✓ 已处理</span>}
                </div>
                <div className="card__body">
                  <p>掌柜解释：{d.explanation}</p>
                  {done && d.actualReason && (
                    <p style={{ color: 'var(--color-warning)', marginTop: 4 }}>
                      {d.actualReason}
                    </p>
                  )}
                </div>
                {!done && (
                  <div className="card__actions">
                    <button className="btn btn--sm" onClick={() => handleAccept(d)}>
                      采信解释
                    </button>
                    <button className="btn btn--sm" onClick={() => handleInvestigate(d)}>
                      🔍 亲自查账（1,500 两）
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {ledger.discrepancies.length === 0 && (
        <div className="card" style={{ borderLeft: '4px solid var(--color-profit)', marginBottom: 20 }}>
          <div className="card__body" style={{ textAlign: 'center' }}>
            ✅ 本年账目清晰，无差异。
          </div>
        </div>
      )}

      {/* 下一步按钮 */}
      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <button
          className="btn btn--primary"
          onClick={onNext}
          disabled={!allResolved}
        >
          {allResolved ? '对账完毕，进入分红 →' : '请先处理所有差异项'}
        </button>
      </div>
    </div>
  );
}

// ================================================================
// 步骤二：分红留利
// ================================================================

function StepDividend({ onNext }: { onNext: (plan: DividendPlan) => void }) {
  const { state } = useGameState();
  const ledger = state.annualLedger;
  if (!ledger) return null;

  const plans = useMemo(() => calcDividendOptions(ledger), [ledger]);

  return (
    <div>
      <div className="section-title"><h2>💰 第二步：分红留利</h2></div>
      <p className="text-muted" style={{ marginBottom: 20, marginTop: -12 }}>
        本年净利 {ledger.totalProfit.toLocaleString()} 两，请大掌柜定夺分配方案。
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {plans.map(plan => (
          <button
            key={plan.id}
            className="btn"
            onClick={() => onNext(plan)}
            style={{
              textAlign: 'left',
              justifyContent: 'flex-start',
              padding: '16px 20px',
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 6 }}>
                {plan.name}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--color-ink-muted)', marginBottom: 8 }}>
                {plan.description}
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: '0.85rem' }}>
                <span>东家：<strong>{plan.ownerAmount.toLocaleString()}</strong> 两</span>
                <span>留存：<strong>{plan.reserveAmount.toLocaleString()}</strong> 两</span>
                <span>伙友花红：<strong>{plan.staffAmount.toLocaleString()}</strong> 两</span>
              </div>
            </div>
            <span style={{ fontSize: '1.2rem', color: 'var(--color-ink-muted)' }}>→</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ================================================================
// 步骤三：人事评定
// ================================================================

function StepStaff({ onNext }: { onNext: (decisions: Record<number, string>) => void }) {
  const { state } = useGameState();
  const reviews = useMemo(() => calcStaffPerformance(state), [state]);
  // 默认所有伙友「续任」
  const [decisions, setDecisions] = useState<Record<number, string>>(() => {
    const defaults: Record<number, string> = {};
    for (const r of calcStaffPerformance(state)) {
      defaults[r.staff.id] = 'keep';
    }
    return defaults;
  });

  const handleDecide = (staffId: number, action: string) => {
    setDecisions(prev => ({ ...prev, [staffId]: action }));
  };

  const allDecided = reviews.every(r => decisions[r.staff.id]);

  return (
    <div>
      <div className="section-title"><h2>👤 第三步：人事评定</h2></div>
      <p className="text-muted" style={{ marginBottom: 20, marginTop: -12 }}>
        一年功过，在此一评。请大掌柜对每位伙友做出裁定。
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {reviews.map(r => {
          const s = r.staff;
          const chosen = decisions[s.id];
          return (
            <div key={s.id} className="card" style={{
              marginBottom: 0,
              borderLeft: `4px solid ${getRatingColor(r.rating)}`,
            }}>
              <div className="card__title">
                <span>{s.name}</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-ink-muted)' }}>
                  {s.role === 'clerk' ? '伙友' : '学徒'} · {s.stationedAt === 'headquarters' ? '总号' : s.stationedAt === 'hankou' ? '汉口' : '张家口'}
                </span>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: getRatingColor(r.rating),
                  marginLeft: 'auto',
                }}>
                  {getRatingLabel(r.rating)}
                </span>
              </div>
              <div className="card__body">
                <p style={{ marginBottom: 8 }}>{r.comment}</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)' }}>
                  能力 {s.ability} · 忠诚 {s.loyalty} · 资质 {s.talent}
                  {s.talentBonus && ` · ${s.talentBonus}`}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {['keep', 'transfer', 'dismiss'].map(action => {
                  const labels: Record<string, string> = { keep: '续任', transfer: '调离', dismiss: '辞退' };
                  const selected = chosen === action;
                  return (
                    <button
                      key={action}
                      className={`btn btn--sm ${selected ? 'btn--primary' : ''}`}
                      onClick={() => handleDecide(s.id, action)}
                    >
                      {labels[action]}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <button
          className="btn btn--primary"
          onClick={() => onNext(decisions)}
          disabled={!allDecided}
        >
          {allDecided ? '评定完毕，进入来年规划 →' : '请为每位伙友做出裁定'}
        </button>
      </div>
    </div>
  );
}

// ================================================================
// 步骤四：来年规划
// ================================================================

function StepPlan({ onFinish, onRetire }: { onFinish: (goal: string) => void; onRetire: () => void }) {
  const { state } = useGameState();

  const goals = [
    {
      id: 'expand',
      title: '开疆拓土',
      desc: '来年在现有商路上增设代办处，扩大汇兑网络。',
      target: '信誉 +3，需预备扩张银两',
    },
    {
      id: 'consolidate',
      title: '固本培元',
      desc: '夯实内功，提升准备金率，降低经营风险。',
      target: '准备金率安全线优先',
    },
    {
      id: 'reputation',
      title: '信誉至上',
      desc: '以金字招牌为目标，宁可少赚也要保兑付。',
      target: '年末信誉 ≥ 80',
    },
  ];

  // 急流勇退条件：信誉 ≥ 80、银两 ≥ 90万（高于初始 77 万）、经营 ≥ 10 年
  const canRetire =
    state.resources.reputation >= 80 &&
    state.resources.silver.totalSilver >= 900_000 &&
    state.date.year >= 1818;

  return (
    <div>
      <div className="section-title"><h2>🎯 第四步：来年规划</h2></div>
      <p className="text-muted" style={{ marginBottom: 20, marginTop: -12 }}>
        {state.date.year + 1}年即将开始，请大掌柜为新的一年选定方向。
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {goals.map(g => (
          <button
            key={g.id}
            className="btn"
            onClick={() => onFinish(g.id)}
            style={{ textAlign: 'left', justifyContent: 'flex-start', padding: '16px 20px' }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 4 }}>{g.title}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-ink-light)' }}>{g.desc}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-ink-muted)', marginTop: 4 }}>
                目标：{g.target}
              </div>
            </div>
            <span style={{ fontSize: '1.2rem', color: 'var(--color-ink-muted)' }}>→</span>
          </button>
        ))}

        {/* 急流勇退 —— 仅在条件满足时出现 */}
        {canRetire && (
          <>
            <div className="decorative-line" />
            <button
              className="btn"
              onClick={onRetire}
              style={{
                textAlign: 'left',
                justifyContent: 'flex-start',
                padding: '16px 20px',
                border: '2px solid var(--color-gold)',
                background: 'rgba(158, 111, 10, 0.04)',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 4, color: 'var(--color-gold)' }}>
                  🌅 急流勇退
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-ink-light)' }}>
                  功成身退，天之道也。将号务交予后人，安然归隐。
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-ink-muted)', marginTop: 4 }}>
                  大智慧，善始善终。游戏就此终结。
                </div>
              </div>
              <span style={{ fontSize: '1.2rem', color: 'var(--color-gold)' }}>→</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ================================================================
// 主面板
// ================================================================

export function AnnualPanel() {
  const { state, dispatch } = useGameState();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>(1);
  // BUG-017 修复：防止快速双击导致重复提交 + 步骤切换时自动重置
  const [isProcessing, setIsProcessing] = useState(false);
  useEffect(() => { setIsProcessing(false); }, [step]);

  const ledger = state.annualLedger;
  if (!ledger) {
    return (
      <div className="empty-state">
        <h3>无年度账目数据</h3>
        <p className="text-muted">请先完成一年的经营。</p>
      </div>
    );
  }

  const handleDividend = useCallback((plan: DividendPlan) => {
    if (isProcessing) return;
    setIsProcessing(true);
    // 应用分红效果
    dispatch({ type: 'UPDATE_SILVER', payload: plan.effects.silver });
    dispatch({ type: 'UPDATE_CONNECTIONS', payload: plan.effects.connections });
    dispatch({ type: 'UPDATE_REPUTATION', delta: plan.effects.reputation });
    // 设置来年规划方向
    dispatch({ type: 'SET_ANNUAL_DIRECTIVE', directive: plan.directive });
    dispatch({
      type: 'ADD_LOG',
      message: `${ledger.year}年年终分红：${plan.name}——东家${plan.ownerAmount.toLocaleString()}两、留存${plan.reserveAmount.toLocaleString()}两、花红${plan.staffAmount.toLocaleString()}两。来年方略：${plan.directive === 'expand' ? '开疆拓土' : plan.directive === 'consolidate' ? '固本培元' : '信誉至上'}。`,
    });
    toast('分红方案已颁布', 'success');
    setStep(3);
  }, [dispatch, toast, ledger, isProcessing]);

  const handleStaff = useCallback((decisions: Record<number, string>) => {
    if (isProcessing) return;
    setIsProcessing(true);

    const stationCycle: Record<string, string> = {
      headquarters: 'hankou',
      hankou: 'zhangjiakou',
      zhangjiakou: 'headquarters',
    };
    const labels: Record<string, string> = { keep: '续任', transfer: '调离', dismiss: '辞退' };
    const summaryParts: string[] = [];
    let hasDismiss = false;

    for (const [idStr, action] of Object.entries(decisions)) {
      const id = Number(idStr);
      const staff = state.staff.find(s => s.id === id);
      const name = staff?.name || '?';
      summaryParts.push(`${name}: ${labels[action]}`);

      if (action === 'keep') {
        dispatch({ type: 'UPDATE_STAFF', id, changes: { loyalty: Math.min(100, (staff?.loyalty || 50) + 5) } });
      } else if (action === 'transfer' && staff) {
        const from = staff.stationedAt || 'headquarters';
        const newStation = (stationCycle[from] || 'headquarters') as Staff['stationedAt'];
        dispatch({ type: 'UPDATE_STAFF', id, changes: { stationedAt: newStation, loyalty: Math.max(0, (staff.loyalty || 50) - 5) } });
      } else if (action === 'dismiss') {
        hasDismiss = true;
        dispatch({ type: 'REMOVE_STAFF', id });
      }
    }

    // 辞退一人，全员（不含已辞退者）loyalty-3、信誉-2
    if (hasDismiss) {
      const dismissedIds = new Set(
        Object.entries(decisions)
          .filter(([, action]) => action === 'dismiss')
          .map(([idStr]) => Number(idStr))
      );
      state.staff.forEach(s => {
        if (!dismissedIds.has(s.id)) {
          dispatch({ type: 'UPDATE_STAFF', id: s.id, changes: { loyalty: Math.max(0, s.loyalty - 3) } });
        }
      });
      dispatch({ type: 'UPDATE_REPUTATION', delta: -2 });
      summaryParts.push('辞退之举，人心浮动');
    }

    dispatch({ type: 'ADD_LOG', message: `${ledger.year}年人事评定：${summaryParts.join('；')}` });
    toast('人事评定已生效', 'success');
    setStep(4);
  }, [dispatch, toast, state.staff, ledger, isProcessing]);

  const handleFinish = useCallback((goal: string) => {
    if (isProcessing) return;
    setIsProcessing(true);
    const goalLabels: Record<string, string> = {
      expand: '开疆拓土',
      consolidate: '固本培元',
      reputation: '信誉至上',
    };
    dispatch({ type: 'ADD_LOG', message: `${state.date.year + 1}年来年规划：${goalLabels[goal] || goal}` });
    toast(`来年方针已定：${goalLabels[goal] || goal}`, 'success');
    dispatch({ type: 'SET_PHASE', phase: 'morning' });
  }, [dispatch, toast, state.date.year, isProcessing]);

  const handleRetire = useCallback(() => {
    if (isProcessing) return;
    setIsProcessing(true);
    dispatch({ type: 'SET_ENDING', endingType: 'graceful_exit' });
    dispatch({ type: 'ADD_LOG', message: '急流勇退——功成名就，大掌柜挂印归乡，青史留名。' });
    toast('急流勇退，善始善终', 'success');
    dispatch({ type: 'SAVE_GAME' });
    dispatch({ type: 'SET_PHASE', phase: 'game_over' });
  }, [dispatch, toast, isProcessing]);

  return (
    <div className="phase-enter">
      <img
        src="/img/banner-yearend-hy.png"
        alt="年终合账"
        className="panel-banner"
        loading="lazy"
      />
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ display: 'inline', marginRight: 12 }}>🧾 年终合账</h2>
        <span style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem' }}>
          {ledger.year}年腊月
        </span>
      </div>

      <StepIndicator current={step} />

      {step === 1 && (
        <StepAudit onNext={() => setStep(2)} />
      )}
      {step === 2 && (
        <StepDividend onNext={handleDividend} />
      )}
      {step === 3 && (
        <StepStaff onNext={handleStaff} />
      )}
      {step === 4 && (
        <StepPlan onFinish={handleFinish} onRetire={handleRetire} />
      )}
    </div>
  );
}
