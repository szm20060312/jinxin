// ============================================================
// AppShell 布局框架 —— 《晋·信》
// ============================================================

import { useState, createContext, useContext, useCallback, useEffect, useRef } from 'react';
import { useGameState } from '../../hooks/useGameState';
import { useAuth } from '../../hooks/useAuth';
import { useRestartGame } from '../../App';
import { SEASON_NAMES, SAVE_VERSION } from '../../data/constants';
import { audioManager } from '../../utils/audioManager';
import { BranchPanel } from '../branch/BranchPanel';
import { StaffPanel } from '../staff/StaffPanel';
import { LogPanel } from '../logs/LogPanel';
import { NewPlayerGuide } from '../guide/NewPlayerGuide';
import { showConfirm } from '../common/Confirm';
import { useToast } from '../common/Toast';
import { determineEnding } from '../../engine/gameState';
import type { SaveData } from '../../types';

// ---- 导航视图上下文 ----

type NavView = 'game' | 'branches' | 'staff' | 'logs';

const NavContext = createContext<{
  view: NavView;
  setView: (v: NavView) => void;
}>({ view: 'game', setView: () => {} });

export function useNav() {
  return useContext(NavContext);
}

// ---- Header ----

function Header() {
  const { state, dispatch } = useGameState();
  const { user, logout } = useAuth();
  const { setView } = useNav();
  const { toast } = useToast();
  const { date } = state;
  const restartGame = useRestartGame();

  const handleSave = useCallback(() => {
    // 直接写 localStorage，避免引擎 currentUser 时序依赖
    try {
      const saveData: SaveData = {
        state,
        savedAt: new Date().toISOString(),
        version: SAVE_VERSION,
      };
      localStorage.setItem(`jinxin_save_${user}`, JSON.stringify(saveData));

      toast('存档已保存', 'success');
    } catch (e) {
      console.error('❌ 手动存档失败：', e);
      toast('存档失败，请重试', 'error');
    }
  }, [state, user, toast]);

  const handleNewGame = useCallback(async () => {
    const ok = await showConfirm({
      title: '重新开局',
      message: '确定要放弃当前进度，重新选择难度开始新游戏吗？',
      confirmText: '重新开局',
      danger: true,
    });
    if (ok) {
      restartGame();
    }
  }, [restartGame]);

  const handleLogout = () => {
    dispatch({ type: 'SAVE_GAME' });
    logout();
  };

  const handleEndGame = useCallback(async () => {
    const ok = await showConfirm({
      title: '结束经营',
      message: '大掌柜确定要结束本次经营吗？\n\n游戏将根据您当前的信誉、库银与经营年份结算最终结局。',
      confirmText: '结算结局',
      danger: true,
    });
    if (!ok) return;

    const endingType = determineEnding(state);
    dispatch({ type: 'SET_ENDING', endingType });
    dispatch({ type: 'SAVE_GAME' });
    dispatch({ type: 'SET_PHASE', phase: 'game_over' });
  }, [state, dispatch]);

  return (
    <header className="app-header">
      <div className="app-header__title">
        <h1 style={{ cursor: 'pointer' }} onClick={() => setView('game')}>晋·信</h1>
        <span className="app-header__date">
          {date.year}年 · {SEASON_NAMES[date.season - 1]}季 · 第{date.day}日
        </span>
      </div>
      <div className="app-header__actions">
        <span className="app-header__user">大掌柜：{user}</span>
        <button className="btn btn--sm" onClick={handleSave}>
          💾 存档
        </button>
        <button className="btn btn--sm" onClick={handleNewGame}>
          新局
        </button>
        <button
          className="btn btn--sm btn--danger"
          onClick={handleEndGame}
          style={{ fontWeight: 700 }}
          title="结算当前结局"
        >
          🏁 结束游戏
        </button>
        <button className="btn btn--sm" onClick={handleLogout}>
          退出
        </button>
      </div>
    </header>
  );
}

// ---- Sidebar ----

function Sidebar() {
  const { state } = useGameState();
  const { view, setView } = useNav();
  const { resources, branches } = state;
  const [bgmVolume, setBgmVolume] = useState(0.4);
  const [bgmMuted, setBgmMuted] = useState(false);

  const totalSilver = resources.silver.totalSilver.toLocaleString();
  const hqSilver = resources.silver.headquarters.toLocaleString();
  const hkSilver = resources.silver.hankou.toLocaleString();
  const zjkSilver = resources.silver.zhangjiakou.toLocaleString();

  const repStars = (() => {
    const r = resources.reputation;
    if (r >= 85) return '★★★★★';
    if (r >= 70) return '★★★★';
    if (r >= 40) return '★★★';
    if (r >= 20) return '★★';
    return '★';
  })();

  return (
    <aside className="app-sidebar">
      <div className="sidebar-section">
        <h3>库银</h3>
        <div className="sidebar-section__value">{totalSilver} 两</div>
        <div className="sidebar-section__sub">
          总号 {hqSilver} | 汉口 {hkSilver} | 张家口 {zjkSilver}
        </div>
      </div>

      <div className="sidebar-section">
        <h3>信誉</h3>
        <div className="sidebar-section__value">
          {resources.reputation}
          <span className="sidebar-stars" style={{ marginLeft: 8 }}>{repStars}</span>
        </div>
        <div className="sidebar-section__sub">
          官府 {resources.connections.government} · 商帮 {resources.connections.merchantGuild} · 东家 {resources.connections.owner}
        </div>
      </div>

      <div className="sidebar-section">
        <h3>分号</h3>
        {(['hankou', 'zhangjiakou'] as const).map(bid => {
          const b = branches[bid];
          const statusText = b.status === 'crisis' ? '危机' : b.status === 'recovering' ? '恢复中' : '正常';
          const dotClass = b.status === 'crisis' ? 'status-dot--crisis' : b.status === 'recovering' ? 'status-dot--recovering' : 'status-dot--normal';
          return (
            <div key={bid} className="sidebar-section__sub" style={{ marginBottom: 4 }}>
              <span className={`status-dot ${dotClass}`} />
              {b.name} · {statusText}
            </div>
          );
        })}
        <button
          className={`btn btn--sm btn--block sidebar-nav-btn ${view === 'branches' ? 'sidebar-nav-btn--active' : ''}`}
          style={{ marginTop: 8, fontSize: '0.75rem' }}
          onClick={() => setView('branches')}
        >
          🏛️ 分号详情
        </button>
      </div>

      <div className="sidebar-section">
        <h3>伙友</h3>
        <div className="sidebar-section__value">{state.staff.length} 人</div>
        <div className="sidebar-section__sub">
          学徒 {state.staff.filter(s => s.role === 'apprentice').length} · 伙友 {state.staff.filter(s => s.role === 'clerk').length}
        </div>
        <button
          className={`btn btn--sm btn--block sidebar-nav-btn ${view === 'staff' ? 'sidebar-nav-btn--active' : ''}`}
          style={{ marginTop: 8, fontSize: '0.75rem' }}
          onClick={() => setView('staff')}
        >
          👥 伙友名册
        </button>
      </div>

      <div className="sidebar-section">
        <button
          className={`btn btn--sm btn--block sidebar-nav-btn ${view === 'logs' ? 'sidebar-nav-btn--active' : ''}`}
          style={{ fontSize: '0.75rem' }}
          onClick={() => setView('logs')}
        >
          📜 经营日志
        </button>
      </div>

      {/* 音频控制 */}
      <div className="sidebar-section" style={{ borderTop: '1px solid var(--color-paper-border)', paddingTop: 12 }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          🎵 背景音乐
          <button
            onClick={() => {
              const m = audioManager.toggleMute();
              setBgmMuted(m);
            }}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1rem',
              opacity: bgmMuted ? 0.4 : 1,
              color: 'var(--color-ink)',
            }}
            title={bgmMuted ? '取消静音' : '静音'}
          >
            {bgmMuted ? '🔇' : '🔊'}
          </button>
        </h3>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={bgmVolume}
          disabled={bgmMuted}
          onChange={e => {
            const v = parseFloat(e.target.value);
            setBgmVolume(v);
            audioManager.volume = v;
          }}
          style={{
            width: '100%',
            height: 4,
            marginTop: 8,
            accentColor: 'var(--color-gold)',
            opacity: bgmMuted ? 0.3 : 1,
            cursor: bgmMuted ? 'not-allowed' : 'pointer',
          }}
        />
        <div className="sidebar-section__sub" style={{ fontSize: '0.65rem', marginTop: 4 }}>
          程序化生成 · 五声音阶 · 古筝音色
        </div>
      </div>
    </aside>
  );
}

// ---- MainPanel ----

function MainPanel({ children }: { children: React.ReactNode }) {
  const { view } = useNav();

  if (view === 'branches') return <main className="app-main"><BranchPanel /></main>;
  if (view === 'staff') return <main className="app-main"><StaffPanel /></main>;
  if (view === 'logs') return <main className="app-main"><LogPanel /></main>;

  return <main className="app-main">{children}</main>;
}

// ---- AppShell ----

export function AppShell({ children }: { children: React.ReactNode }) {
  const { state } = useGameState();
  const [view, setView] = useState<NavView>('game');
  const audioStarted = useRef(false);

  // 首次挂载时自动启动背景音乐（需用户交互后才能播放）
  useEffect(() => {
    if (!audioStarted.current) {
      audioStarted.current = true;
      // 延迟 500ms 确保 AudioContext 在用户交互上下文中初始化
      const timer = setTimeout(() => {
        audioManager.startPlay('gameplay');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  // 游戏结束时简化为全屏面板
  if (state.phase === 'game_over') {
    return (
      <NavContext.Provider value={{ view, setView }}>
        <main className="app-main">{children}</main>
      </NavContext.Provider>
    );
  }

  return (
    <NavContext.Provider value={{ view, setView }}>
      <div className="app-shell">
        <Header />
        <Sidebar />
        <MainPanel>{children}</MainPanel>
      </div>
      <NewPlayerGuide />
    </NavContext.Provider>
  );
}
