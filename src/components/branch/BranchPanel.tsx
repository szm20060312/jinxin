// ============================================================
// 分号详情面板 —— 《晋·信》
// ============================================================

import { useGameState } from '../../hooks/useGameState';
import { useNav } from '../layout/AppShell';
import { BRANCH_LOCATIONS } from '../../data/branches';
import { calcReserveRatio } from '../../engine/resources';
import type { BranchId } from '../../types';

function BranchDetailCard({ branchId }: { branchId: BranchId }) {
  const { state } = useGameState();
  const branch = state.branches[branchId];
  const loc = BRANCH_LOCATIONS[branchId];
  const name = branchId === 'hankou' ? '汉口分号' : '张家口分号';

  const statusMap = {
    normal: { label: '正常运转', color: 'var(--color-profit)' },
    crisis: { label: '⚠️ 危机中', color: 'var(--color-loss)' },
    recovering: { label: '恢复中', color: 'var(--color-warning)' },
  };
  const status = statusMap[branch.status];

  return (
    <div
      className="card"
      style={{ borderLeft: `4px solid ${status.color}` }}
    >
      <img
        src="/img/badge-ruyi-hy.png"
        alt=""
        className="card-corner-badge"
        loading="lazy"
      />
      <div className="card__title">
        {branchId === 'hankou' ? '🌊' : '🏔️'} {name}
        <span style={{ fontSize: '0.75rem', color: status.color, fontWeight: 700, marginLeft: 8 }}>
          {status.label}
        </span>
        <span style={{ fontSize: '0.7rem', color: 'var(--color-ink-muted)', marginLeft: 'auto' }}>
          {branch.tier === 1 ? '一等分号' : '二等分号'}
        </span>
      </div>

      <div className="card__body">
        <p style={{ marginBottom: 8, fontStyle: 'italic', fontSize: '0.85rem' }}>
          {loc.description}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: '0.9rem' }}>
          <div>
            <span className="text-muted">库银：</span>
            <strong>{branch.silver.toLocaleString()} 两</strong>
          </div>
          <div>
            <span className="text-muted">本季业务量：</span>
            <strong>{branch.businessVolume.toLocaleString()} 两</strong>
          </div>
          <div>
            <span className="text-muted">掌柜能力：</span>
            <strong>{branch.managerAbility}</strong>
          </div>
          <div>
            <span className="text-muted">掌柜忠诚：</span>
            <strong style={{ color: branch.managerLoyalty < 50 ? 'var(--color-loss)' : branch.managerLoyalty >= 70 ? 'var(--color-profit)' : 'var(--color-warning)' }}>
              {branch.managerLoyalty}
            </strong>
          </div>
        </div>

        {/* 能力条 */}
        <div style={{ marginTop: 12 }}>
          <div className="text-muted" style={{ fontSize: '0.75rem', marginBottom: 4 }}>掌柜能力</div>
          <div className="progress-bar">
            <div
              className={`progress-bar__fill ${branch.managerAbility >= 70 ? 'progress-bar__fill--safe' : branch.managerAbility >= 50 ? 'progress-bar__fill--warning' : 'progress-bar__fill--danger'}`}
              style={{ width: `${branch.managerAbility}%` }}
            />
          </div>
        </div>
        <div style={{ marginTop: 6 }}>
          <div className="text-muted" style={{ fontSize: '0.75rem', marginBottom: 4 }}>掌柜忠诚</div>
          <div className="progress-bar">
            <div
              className={`progress-bar__fill ${branch.managerLoyalty >= 70 ? 'progress-bar__fill--safe' : branch.managerLoyalty >= 50 ? 'progress-bar__fill--warning' : 'progress-bar__fill--danger'}`}
              style={{ width: `${branch.managerLoyalty}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function BranchPanel() {
  const { setView } = useNav();

  return (
    <div className="phase-enter">
      <button className="back-btn" onClick={() => setView('game')}>
        ← 返回票号
      </button>
      <div className="section-title">
        <h2>🏛️ 分号网络</h2>
      </div>
      <p className="text-muted" style={{ marginBottom: 20, marginTop: -12 }}>
        总号平遥 · 分号二处，汇通天下之路由此展开。
      </p>

      {/* 总号概览 */}
      <TotalHeadquarters />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <BranchDetailCard branchId="hankou" />
        <BranchDetailCard branchId="zhangjiakou" />
      </div>
    </div>
  );
}

function TotalHeadquarters() {
  const { state } = useGameState();
  const hq = state.resources.silver.headquarters;
  const ratio = (calcReserveRatio(state.resources.silver) * 100).toFixed(1);

  return (
    <div className="card" style={{ borderLeft: '4px solid var(--color-red-seal)', marginBottom: 16 }}>
      <div className="card__title">🏯 平遥总号</div>
      <div className="card__body">
        <p style={{ marginBottom: 4 }}>
          库银：<strong>{hq.toLocaleString()} 两</strong>
          <span className="text-muted" style={{ marginLeft: 12 }}>准备金率 {ratio}%</span>
        </p>
        <p className="text-muted" style={{ fontSize: '0.85rem' }}>
          决策中枢 · 银库总部 · 密押中心
        </p>
      </div>
    </div>
  );
}
