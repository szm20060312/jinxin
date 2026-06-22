// ============================================================
// 晨间简报面板 v2 —— 《晋·信》
//
// v2 改进（Phase A 游戏性）：
// - 单页季度摘要，关键信息一览
// - 详细简报可展开，无需逐条"知晓"
// - 一键进入季度决策
// ============================================================

import { useEffect, useState, useRef } from 'react';
import { useGameState } from '../../hooks/useGameState';
import { generateMorningBriefs } from '../../engine/morning';
import type { MorningBrief } from '../../types';
import { MorningBriefCard } from './MorningBriefCard';
import { SEASON_NAMES } from '../../data/constants';

export function MorningPanel() {
  const { state, dispatch } = useGameState();
  const [briefs, setBriefs] = useState<MorningBrief[]>([]);
  const [showDetails, setShowDetails] = useState(false);

  const briefsGeneratedRef = useRef(false);

  useEffect(() => {
    if (state.phase !== 'morning') {
      briefsGeneratedRef.current = false;
      return;
    }
    if (briefsGeneratedRef.current) return;

    const generated = generateMorningBriefs(state);
    setBriefs(generated);
    dispatch({ type: 'SET_MORNING_BRIEFS', briefs: generated });
    briefsGeneratedRef.current = true;
  }, [state.phase, state, dispatch, briefsGeneratedRef]);

  const handleProceed = () => {
    dispatch({ type: 'CLEAR_MORNING_BRIEFS' });
    dispatch({ type: 'SET_PHASE', phase: 'quarterly' });
    dispatch({ type: 'ADD_LOG', message: `${state.date.year}年${SEASON_NAMES[state.date.season - 1]}季——进入季度决策。` });
  };

  const silver = state.resources.silver;
  const rep = state.resources.reputation;
  const seasonName = SEASON_NAMES[state.date.season - 1];
  const reserveRatio = ((silver.totalSilver - silver.inTransit) / (silver.totalSilver || 1) * 100).toFixed(1);

  return (
    <div className="phase-enter">
      <img
        src="/img/banner-morning-hy.png"
        alt="晨间简报"
        className="panel-banner"
        loading="lazy"
      />

      <div style={{ marginBottom: 24 }}>
        <h2>📋 {state.date.year}年 · {seasonName}季</h2>
        <p className="text-muted" style={{ marginTop: 4 }}>
          大掌柜，请过目本季摘要。
        </p>
      </div>

      {/* HQ 枯竭紧急警告 */}
      {silver.headquarters <= 0 && (
        <div style={{
          background: 'rgba(178,34,34,0.08)',
          border: '2px solid var(--color-loss)',
          borderRadius: 8,
          padding: '16px 20px',
          marginBottom: 20,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-loss)', marginBottom: 4 }}>
            🚨 总号库银耗尽
          </div>
          <div style={{ color: 'var(--color-ink-muted)', fontSize: '0.85rem' }}>
            无法执行巡查、调拨等操作。请立即从分号调回银两，或通过「银两运营」决策回补总号。
          </div>
        </div>
      )}

      {/* 季度摘要面板 */}
      <div style={{
        background: 'var(--color-paper)',
        border: '1px solid var(--color-paper-border)',
        borderRadius: 8,
        padding: '20px 24px',
        marginBottom: 20,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px 24px',
      }}>
        <div>
          <span style={{ color: 'var(--color-ink-muted)', fontSize: '0.78rem' }}>💰 库银</span>
          <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{(silver.totalSilver / 10_000).toFixed(1)} 万两</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-ink-light)' }}>
            总号 {Math.round(silver.headquarters / 10_000)}万 · 在途 {Math.round(silver.inTransit / 10_000)}万
          </div>
        </div>
        <div>
          <span style={{ color: 'var(--color-ink-muted)', fontSize: '0.78rem' }}>📊 准备金率</span>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: Number(reserveRatio) < 20 ? 'var(--color-loss)' : 'var(--color-ink)' }}>
            {reserveRatio}%
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-ink-light)' }}>
            {Number(reserveRatio) >= 25 ? '✅ 安全' : Number(reserveRatio) >= 15 ? '⚡ 偏低' : '🚨 危险'}
          </div>
        </div>
        <div>
          <span style={{ color: 'var(--color-ink-muted)', fontSize: '0.78rem' }}>⭐ 信誉</span>
          <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{rep}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-ink-light)' }}>
            {rep >= 85 ? '金字招牌' : rep >= 70 ? '信誉卓著' : rep >= 40 ? '中规中矩' : rep >= 20 ? '风雨飘摇' : '信用破产'}
          </div>
        </div>
        <div>
          <span style={{ color: 'var(--color-ink-muted)', fontSize: '0.78rem' }}>🔐 密押</span>
          <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{state.cipher.monthsUsed} 月</div>
          <div style={{ fontSize: '0.72rem', color: state.cipher.monthsUsed > 12 ? 'var(--color-loss)' : 'var(--color-ink-light)' }}>
            {state.cipher.monthsUsed > 12 ? '⚠️ 建议更换' : '安全期内'}
          </div>
        </div>
      </div>

      {/* 详细简报（可展开） */}
      {briefs.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <button
            className="btn"
            onClick={() => setShowDetails(!showDetails)}
            style={{ fontSize: '0.85rem' }}
          >
            {showDetails ? '收起详细简报 ▲' : `查看详细简报（${briefs.length} 条） ▸`}
          </button>
          {showDetails && (
            <div style={{ marginTop: 12 }}>
              {briefs.map(brief => (
                <MorningBriefCard key={brief.id} brief={brief} onAcknowledge={() => {}} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 一键进入决策 */}
      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <button className="btn btn--primary" onClick={handleProceed}>
          进入季度决策 →
        </button>
      </div>
    </div>
  );
}
