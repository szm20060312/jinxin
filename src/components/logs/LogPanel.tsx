// ============================================================
// 日志面板 —— 《晋·信》
//
// 展示最近 50 条经营日志，按时间倒序
// ============================================================

import { useState } from 'react';
import { useGameState } from '../../hooks/useGameState';
import { useNav } from '../layout/AppShell';

type FilterType = 'all' | 'decision' | 'event' | 'finance';

const FILTER_KEYWORDS: Record<FilterType, string[]> = {
  all: [],
  decision: ['决策', '颁布', '号规', '确认', '采纳'],
  event: ['【', '事件', '突发'],
  finance: ['汇兑', '分红', '利润', '利息'],  // BUG-025: 移除过于宽泛的 '两' 和 '银'
};

export function LogPanel() {
  const { state } = useGameState();
  const { setView } = useNav();
  const [filter, setFilter] = useState<FilterType>('all');

  const filtered = (() => {
    if (filter === 'all') return state.logs;
    const keywords = FILTER_KEYWORDS[filter];
    return state.logs.filter(log =>
      keywords.some(kw => log.includes(kw))
    );
  })();

  return (
    <div className="phase-enter">
      <button className="back-btn" onClick={() => setView('game')}>
        ← 返回票号
      </button>
      <div className="section-title">
        <h2>📜 经营日志</h2>
        <span style={{ fontSize: '0.85rem', color: 'var(--color-ink-muted)', marginLeft: 'auto' }}>
          共 {state.logs.length} 条
        </span>
      </div>

      {/* 筛选 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, marginTop: -12 }}>
        {(['all', 'decision', 'event', 'finance'] as FilterType[]).map(f => {
          const labels: Record<FilterType, string> = {
            all: '全部',
            decision: '决策',
            event: '事件',
            finance: '银钱',
          };
          return (
            <button
              key={f}
              className={`btn btn--sm ${filter === f ? 'btn--primary' : ''}`}
              onClick={() => setFilter(f)}
            >
              {labels[f]}
            </button>
          );
        })}
      </div>

      {/* 日志列表 */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <img
            src="/img/empty-log-hy.png"
            alt="暂无日志"
            className="empty-state__image"
            loading="lazy"
          />
          <h3>暂无日志</h3>
          <p className="text-muted">开始经营后将在此记录每一步决策。</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {filtered.map((log, i) => (
            <div
              key={`log-${filtered.length - i}-${log.substring(0, 16)}`}
              className="log-entry"
              style={{
                borderLeft: log.includes('【') ? '3px solid var(--color-red-seal)' :
                  log.includes('两') ? '3px solid var(--color-gold)' :
                  '3px solid transparent',
              }}
            >
              <span className="log-entry__index" style={{ color: 'var(--color-ink-muted)' }}>
                {filtered.length - i}
              </span>
              <span>{log}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
