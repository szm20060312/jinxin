// ============================================================
// 伙友人事面板 —— 《晋·信》
// v2：新增招聘功能
// ============================================================

import { useState, useMemo } from 'react';
import { useGameState } from '../../hooks/useGameState';
import { useNav } from '../layout/AppShell';
import { useToast } from '../common/Toast';
import { RECRUITABLE_POOL, generateApprentice } from '../../data/staff';

type FilterType = 'all' | 'clerk' | 'apprentice';

export function StaffPanel() {
  const { state, dispatch } = useGameState();
  const { setView } = useNav();
  const { toast } = useToast();
  const [filter, setFilter] = useState<FilterType>('all');
  const [showRecruit, setShowRecruit] = useState(false);

  const filtered = filter === 'all'
    ? state.staff
    : state.staff.filter(s => s.role === filter);

  const stationedLabel = (s: typeof state.staff[number]) =>
    s.stationedAt === 'headquarters' ? '总号' :
    s.stationedAt === 'hankou' ? '汉口' : '张家口';

  // 计算可招募角色池（排除已在号人员，按年份筛选）
  const recruitablePool = useMemo(() => {
    return RECRUITABLE_POOL.filter(p => {
      // 已入职不显示
      if (state.staff.some(s => s.id === p.id)) return false;
      // 年份筛选
      if (p.id <= 104) return state.date.year >= 1810;
      return state.date.year >= 1820;
    });
  }, [state.staff, state.date.year]);

  const totalStaff = state.staff.length;
  const nextId = useMemo(() => Math.max(0, ...state.staff.map(s => s.id)) + 1, [state.staff]);
  const newApprentice = useMemo(() => generateApprentice(nextId, 'headquarters'), [nextId]);

  const handleRecruit = (staff: typeof RECRUITABLE_POOL[number] | ReturnType<typeof generateApprentice>) => {
    const cost = staff.role === 'clerk' ? 3000 : 500;
    if (state.resources.silver.headquarters < cost) {
      toast('库银不足，无法延揽', 'error');
      return;
    }
    dispatch({ type: 'UPDATE_SILVER', payload: { headquarters: -cost } });
    dispatch({ type: 'ADD_STAFF', staff });
    dispatch({
      type: 'ADD_LOG',
      message: `「${staff.name}」加入本号（${staff.role === 'clerk' ? '伙友' : '学徒'}，${staff.talentBonus || '踏实肯干'}）。`,
    });
    toast(`「${staff.name}」正式入号！`, 'success');
  };

  return (
    <div className="phase-enter">
      <button className="back-btn" onClick={() => setView('game')}>
        ← 返回票号
      </button>
      <div className="section-title">
        <h2>👥 伙友名册</h2>
      </div>

      {/* 筛选 & 招聘按钮 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, marginTop: -12, flexWrap: 'wrap', alignItems: 'center' }}>
        {(['all', 'clerk', 'apprentice'] as FilterType[]).map(f => {
          const labels: Record<FilterType, string> = { all: '全部', clerk: '伙友', apprentice: '学徒' };
          const count: Record<FilterType, number> = {
            all: state.staff.length,
            clerk: state.staff.filter(s => s.role === 'clerk').length,
            apprentice: state.staff.filter(s => s.role === 'apprentice').length,
          };
          return (
            <button
              key={f}
              className={`btn btn--sm ${filter === f ? 'btn--primary' : ''}`}
              onClick={() => setFilter(f)}
            >
              {labels[f]} ({count[f]})
            </button>
          );
        })}
        <div style={{ flex: 1 }} />
        <button
          className={`btn btn--sm ${showRecruit ? 'btn--primary' : ''}`}
          onClick={() => setShowRecruit(!showRecruit)}
          style={{ fontWeight: 700 }}
        >
          {showRecruit ? '收起招聘' : '📢 招募伙友'} {recruitablePool.length > 0 && `(${recruitablePool.length + 1})`}
        </button>
      </div>

      {/* ── 招聘面板 ── */}
      {showRecruit && (
        <div style={{
          background: 'rgba(22,101,52,0.03)',
          border: '1px solid var(--color-paper-border)',
          borderRadius: 10,
          padding: '20px 22px',
          marginBottom: 20,
        }}>
          <h3 style={{ fontSize: '1rem', marginBottom: 8, color: 'var(--color-profit)' }}>
            📢 贤才招募
          </h3>
          <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: 16 }}>
            礼聘贤才需支取安家银两（伙友 3,000 两 / 学徒 500 两），从总号库银扣除。
            {recruitablePool.length === 0 && ' 目前暂无合适人选，稍后再来看看。'}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
            {/* 角色池候选人 */}
            {recruitablePool.map(p => {
              const cost = p.role === 'clerk' ? 3000 : 500;
              const canAfford = state.resources.silver.headquarters >= cost;
              return (
                <div key={p.id} className="card" style={{
                  marginBottom: 0,
                  padding: '14px 16px',
                  borderLeft: `3px solid ${p.role === 'clerk' ? 'var(--color-info)' : 'var(--color-gold)'}`,
                  opacity: canAfford ? 1 : 0.55,
                }}>
                  <div style={{ fontWeight: 700, marginBottom: 4, fontSize: '0.92rem' }}>
                    {p.name}
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-ink-muted)', fontWeight: 400, marginLeft: 6 }}>
                      {p.role === 'clerk' ? '伙友' : '学徒'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)', marginBottom: 6 }}>
                    {p.talentBonus && <span style={{ color: 'var(--color-gold)', fontWeight: 600 }}>{p.talentBonus} · </span>}
                    能力 {p.ability} · 忠诚 {p.loyalty} · 资质 {p.talent}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-ink-muted)', marginBottom: 8 }}>
                    聘金：{cost.toLocaleString()} 两
                  </div>
                  <button
                    className="btn btn--sm"
                    onClick={() => handleRecruit({ ...p, stationedAt: 'headquarters' })}
                    disabled={!canAfford}
                    style={{
                      width: '100%',
                      background: canAfford ? 'var(--color-profit)' : undefined,
                      color: canAfford ? '#fff' : undefined,
                      borderColor: canAfford ? 'var(--color-profit)' : undefined,
                      fontSize: '0.78rem',
                    }}
                  >
                    {canAfford ? `礼聘入号` : '库银不足'}
                  </button>
                </div>
              );
            })}

            {/* 随机学徒 */}
            {totalStaff < 12 && (
              <div className="card" style={{
                marginBottom: 0,
                padding: '14px 16px',
                borderLeft: '3px solid var(--color-gold)',
              }}>
                <div style={{ fontWeight: 700, marginBottom: 4, fontSize: '0.92rem' }}>
                  {newApprentice.name}
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-ink-muted)', fontWeight: 400, marginLeft: 6 }}>学徒</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)', marginBottom: 6 }}>
                  {newApprentice.talentBonus && <span style={{ color: 'var(--color-gold)', fontWeight: 600 }}>{newApprentice.talentBonus} · </span>}
                  资质 {newApprentice.talent} · 忠诚 {newApprentice.loyalty} · 能力 {newApprentice.ability}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-ink-muted)', marginBottom: 8 }}>
                  聘金：500 两（随机资质 30-80）
                </div>
                <button
                  className="btn btn--sm"
                  onClick={() => handleRecruit(newApprentice)}
                  disabled={state.resources.silver.headquarters < 500}
                  style={{
                    width: '100%',
                    background: state.resources.silver.headquarters >= 500 ? 'var(--color-red-seal)' : undefined,
                    color: state.resources.silver.headquarters >= 500 ? '#fff' : undefined,
                    borderColor: state.resources.silver.headquarters >= 500 ? 'var(--color-red-seal)' : undefined,
                    fontSize: '0.78rem',
                  }}
                >
                  {state.resources.silver.headquarters >= 500 ? '礼聘入号' : '库银不足'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 伙友名册 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
        {filtered.map(s => {
          const abilityColor = s.ability >= 70 ? 'var(--color-profit)' : s.ability >= 45 ? 'var(--color-warning)' : 'var(--color-loss)';
          const loyaltyColor = s.loyalty >= 70 ? 'var(--color-profit)' : s.loyalty >= 45 ? 'var(--color-warning)' : 'var(--color-loss)';

          return (
            <div key={s.id} className="card" style={{
              marginBottom: 0,
              borderLeft: `3px solid ${s.role === 'clerk' ? 'var(--color-info)' : 'var(--color-gold)'}`,
            }}>
              <div className="card__title" style={{ fontSize: '0.95rem' }}>
                {s.name}
                <span style={{ fontSize: '0.7rem', color: 'var(--color-ink-muted)', fontWeight: 400 }}>
                  {s.role === 'clerk' ? '伙友' : '学徒'} · {stationedLabel(s)}
                </span>
                {s.talentBonus && (
                  <span style={{ fontSize: '0.68rem', background: 'rgba(184,134,11,0.1)', color: 'var(--color-gold)', padding: '1px 6px', borderRadius: 3, fontWeight: 600 }}>
                    {s.talentBonus}
                  </span>
                )}
              </div>

              <div className="card__body" style={{ marginBottom: 0 }}>
                <div style={{ marginBottom: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: 2 }}>
                    <span className="text-muted">能力</span>
                    <span style={{ color: abilityColor, fontWeight: 600 }}>{s.ability}</span>
                  </div>
                  <div className="progress-bar" style={{ height: 5 }}>
                    <div
                      className={`progress-bar__fill ${s.ability >= 70 ? 'progress-bar__fill--safe' : s.ability >= 45 ? 'progress-bar__fill--warning' : 'progress-bar__fill--danger'}`}
                      style={{ width: `${s.ability}%` }}
                    />
                  </div>
                </div>
                <div style={{ marginBottom: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: 2 }}>
                    <span className="text-muted">忠诚</span>
                    <span style={{ color: loyaltyColor, fontWeight: 600 }}>{s.loyalty}</span>
                  </div>
                  <div className="progress-bar" style={{ height: 5 }}>
                    <div
                      className={`progress-bar__fill ${s.loyalty >= 70 ? 'progress-bar__fill--safe' : s.loyalty >= 45 ? 'progress-bar__fill--warning' : 'progress-bar__fill--danger'}`}
                      style={{ width: `${s.loyalty}%` }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                  <span className="text-muted">资质</span>
                  <span>{s.talent}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <img
            src="/img/empty-staff-hy.png"
            alt="无伙友"
            className="empty-state__image"
            loading="lazy"
          />
          <p className="text-muted">无符合条件的伙友。</p>
        </div>
      )}
    </div>
  );
}
