// ============================================================
// 全局音频 Hook —— 《晋·信》
//
// 提供音频状态订阅、播放控制、音量/静音接口
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { audioManager } from '../utils/audioManager';
import type { AudioState, BgmTheme } from '../utils/audioManager';

/**
 * 全局音频控制 Hook
 *
 * 使用示例：
 * ```tsx
 * const { state, volume, muted, setVolume, toggleMute, setTheme } = useAudio();
 * ```
 */
export function useAudio() {
  const [state, setState] = useState<AudioState>(audioManager.getState());

  // 同步音频管理器状态到 React state
  useEffect(() => {
    const id = setInterval(() => {
      setState(audioManager.getState());
    }, 500);
    return () => clearInterval(id);
  }, []);

  // ─── Controls ──────────────────────────────

  const startPlay = useCallback(async (theme?: BgmTheme) => {
    await audioManager.startPlay(theme);
    setState(audioManager.getState());
  }, []);

  const stop = useCallback(() => {
    audioManager.stop();
    setState(audioManager.getState());
  }, []);

  const setVolume = useCallback((v: number) => {
    audioManager.volume = v;
    setState(audioManager.getState());
  }, []);

  const toggleMute = useCallback(() => {
    audioManager.toggleMute();
    setState(audioManager.getState());
  }, []);

  const setMuted = useCallback((m: boolean) => {
    audioManager.muted = m;
    setState(audioManager.getState());
  }, []);

  const setTheme = useCallback((theme: BgmTheme) => {
    audioManager.setTheme(theme);
    setState(audioManager.getState());
  }, []);

  const pause = useCallback(() => {
    audioManager.pause();
    setState(audioManager.getState());
  }, []);

  const resume = useCallback(() => {
    audioManager.resume();
    setState(audioManager.getState());
  }, []);

  return {
    state,
    volume: state.volume,
    muted: state.isMuted,
    startPlay,
    stop,
    setVolume,
    toggleMute,
    setMuted,
    setTheme,
    pause,
    resume,
  };
}
