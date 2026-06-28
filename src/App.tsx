// ============================================================
// 应用入口 —— 《晋·信》
// ============================================================

import { useState, createContext, useContext, useCallback } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { GameProvider } from './hooks/useGameState';
import { ToastProvider } from './components/common/Toast';
import { ConfirmProvider } from './components/common/Confirm';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AppShell } from './components/layout/AppShell';
import { GameRouter } from './components/GameRouter';
import { LoginPage } from './components/auth/LoginPage';
import { DifficultySelect } from './components/auth/DifficultySelect';
import { EndingPreview } from './components/auth/EndingPreview';
import { StoryIntro } from './components/auth/StoryIntro';
import { SAVE_VERSION } from './data/constants';
import { audioManager } from './utils/audioManager';
import type { Difficulty, GameState } from './types';

// 重新开局上下文——深层次组件（Header/GameOverPanel）通知顶层重置难度
const RestartContext = createContext<() => void>(() => {});

export function useRestartGame() {
  return useContext(RestartContext);
}

/** 从 localStorage 读取已存档的难度（不依赖引擎 currentUser 设置） */
function getDifficultyFromSave(username: string): Difficulty | null {
  try {
    const key = `jinxin_save_${username}`;
    const json = localStorage.getItem(key);
    if (!json) return null;
    const data: { state: GameState; version: string } = JSON.parse(json);
    if (data.version !== SAVE_VERSION) return null;
    if (data.state?.difficulty) return data.state.difficulty;
    return null;
  } catch {
    return null;
  }
}

function GameApp() {
  const { user } = useAuth();
  const savedDifficulty = user ? getDifficultyFromSave(user) : null;
  const [difficulty, setDifficulty] = useState<Difficulty | null>(savedDifficulty);
  const [showPreview, setShowPreview] = useState(false);
  const [showIntro, setShowIntro] = useState(savedDifficulty === null);
  const [gameKey, setGameKey] = useState(0);

  const handleResetToMenu = useCallback(() => {
    // 停止上一局的背景音乐
    audioManager.stop();
    // 删除旧存档，防止新局读回旧进度
    try {
      localStorage.removeItem(`jinxin_save_${user}`);
    } catch { /* ignore */ }
    setDifficulty(null);
    setShowPreview(false);
    setShowIntro(true);
    setGameKey(k => k + 1);
  }, [user]);

  if (!user) {
    return <LoginPage />;
  }

  // 有存档→直接进游戏，跳过故事和难度选择
  if (savedDifficulty) {
    return (
      <RestartContext.Provider value={handleResetToMenu}>
        <GameProvider key={gameKey} username={user} difficulty={savedDifficulty}>
          <AppShell>
            <GameRouter />
          </AppShell>
        </GameProvider>
      </RestartContext.Provider>
    );
  }

  // 新游戏：故事过渡 → 选难度
  if (showIntro) {
    return <StoryIntro onFinish={() => setShowIntro(false)} />;
  }

  if (!difficulty) {
    return <DifficultySelect onSelect={(d) => { setDifficulty(d); setShowPreview(true); }} />;
  }

  if (showPreview) {
    return <EndingPreview difficulty={difficulty} onStart={() => setShowPreview(false)} />;
  }

  return (
    <RestartContext.Provider value={handleResetToMenu}>
      <GameProvider key={gameKey} username={user} difficulty={difficulty}>
        <AppShell>
          <GameRouter />
        </AppShell>
      </GameProvider>
    </RestartContext.Provider>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <ConfirmProvider>
            <GameApp />
          </ConfirmProvider>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
