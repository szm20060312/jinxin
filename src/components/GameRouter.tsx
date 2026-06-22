// ============================================================
// 游戏阶段路由 —— 《晋·信》
//
// 根据 GameState.phase 渲染对应面板
// ============================================================

import { useGameState } from '../hooks/useGameState';
import { MorningPanel } from './morning/MorningPanel';
import { QuarterlyPanel } from './quarterly/QuarterlyPanel';
import { AnnualPanel } from './annual/AnnualPanel';
import { EventPhase } from './events/EventPhase';
import { GameOverPanel } from './gameover/GameOverPanel';

export function GameRouter() {
  const { state } = useGameState();

  switch (state.phase) {
    case 'morning':
      return <MorningPanel />;
    case 'quarterly':
      return <QuarterlyPanel />;
    case 'simulating':
      return (
        <div className="simulating-overlay">
          <h2>⏳ 模拟进行中</h2>
          <p className="text-muted">分号正在汇算本季账目……</p>
          <div style={{ fontSize: '2rem', marginTop: 16 }}>🧮</div>
          <div className="simulating-progress">
            <div className="simulating-progress__bar" />
          </div>
        </div>
      );
    case 'annual':
      return <AnnualPanel />;
    case 'event':
      return <EventPhase />;
    case 'game_over':
      return <GameOverPanel />;
    default:
      return (
        <div className="empty-state">
          <h3>欢迎来到晋·信</h3>
          <p className="text-muted">晋商票号模拟经营游戏。</p>
        </div>
      );
  }
}
