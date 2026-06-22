// ============================================================
// 音频管理模块 —— 《晋·信》
//
// 功能：程序化生成中式古风背景音乐（五声音阶 + 古筝音色模拟）
//      自动播放、无缝循环、全局音量/静音、焦点感知暂停/恢复
// ============================================================

// ─── 五声音阶频率（宫商角徵羽 + 高低八度）──────────────
// 以 C 大调为基准
const PENTATONIC_SCALE = [
  // 低音区
  261.63,  // C4 宫
  293.66,  // D4 商
  329.63,  // E4 角
  392.00,  // G4 徵
  440.00,  // A4 羽
  // 中音区
  523.25,  // C5
  587.33,  // D5
  659.25,  // E5
  783.99,  // G5
  880.00,  // A5
  // 高音区
  1046.50, // C6
  1174.66, // D6
];

// ─── 音频状态接口 ──────────────────────────────
export interface AudioState {
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;        // 0.0 ~ 1.0
  theme: BgmTheme;
}

export type BgmTheme = 'menu' | 'gameplay' | 'crisis' | 'victory';

// ─── 古筝音色参数 ──────────────────────────────
const INSTRUMENT = {
  attack: 0.02,    // 起音时间（秒）
  decay: 0.8,      // 衰减时间
  sustain: 0.3,    // 维持电平
  release: 2.5,    // 释音时间
  brightness: 3,   // 亮度（谐波次数）
};

// ─── 各场景音乐主题 ─────────────────────────────
const THEME_CONFIGS: Record<BgmTheme, {
  tempo: number;          // 每分钟拍数
  noteDuration: number;   // 基础音符时长（秒）
  pauseProbability: number; // 休止符概率
  octaveSpread: number;   // 音域跨度（半音数）
  reverbMix: number;      // 混响混合比
}> = {
  menu: {
    tempo: 60,
    noteDuration: 0.8,
    pauseProbability: 0.15,
    octaveSpread: 7,
    reverbMix: 0.4,
  },
  gameplay: {
    tempo: 72,
    noteDuration: 0.6,
    pauseProbability: 0.25,
    octaveSpread: 5,
    reverbMix: 0.3,
  },
  crisis: {
    tempo: 100,
    noteDuration: 0.35,
    pauseProbability: 0.1,
    octaveSpread: 4,
    reverbMix: 0.2,
  },
  victory: {
    tempo: 54,
    noteDuration: 1.0,
    pauseProbability: 0.05,
    octaveSpread: 8,
    reverbMix: 0.5,
  },
};

/**
 * 游戏音频管理器（单例模式）
 *
 * 使用 Web Audio API 程序化生成中式古风背景音乐，
 * 无需外部音频文件，完全免版权。
 */
class GameAudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private _volume: number = 0.4;
  private _muted: boolean = false;
  private _playing: boolean = false;
  private _theme: BgmTheme = 'gameplay';
  private scheduleTimer: number | null = null;
  private nextNoteTime: number = 0;
  private currentNotes: { osc: OscillatorNode; gain: GainNode }[] = [];
  private reverbNode: ConvolverNode | null = null;
  private dryGain: GainNode | null = null;
  private wetGain: GainNode | null = null;

  // 单例
  private static instance: GameAudioManager;
  static getInstance(): GameAudioManager {
    if (!GameAudioManager.instance) {
      GameAudioManager.instance = new GameAudioManager();
    }
    return GameAudioManager.instance;
  }

  private constructor() {
    // 监听页面可见性变化
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseScheduler();
      } else if (this._playing) {
        this.resumeScheduler();
      }
    });

    // 监听窗口失焦
    window.addEventListener('blur', () => {
      this.pauseScheduler();
    });

    window.addEventListener('focus', () => {
      if (this._playing) {
        this.resumeScheduler();
      }
    });
  }

  // ─── 公开接口 ──────────────────────────────

  /** 获取当前音频状态快照 */
  getState(): AudioState {
    return {
      isPlaying: this._playing,
      isMuted: this._muted,
      volume: this._volume,
      theme: this._theme,
    };
  }

  /** 获取/设置音量 (0.0 ~ 1.0) */
  get volume(): number {
    return this._volume;
  }

  set volume(v: number) {
    this._volume = Math.max(0, Math.min(1, v));
    if (this.masterGain && !this._muted) {
      this.masterGain.gain.setTargetAtTime(this._volume, this.ctx!.currentTime, 0.1);
    }
  }

  /** 获取/设置静音 */
  get muted(): boolean {
    return this._muted;
  }

  set muted(m: boolean) {
    this._muted = m;
    if (this.masterGain && this.ctx) {
      const target = m ? 0 : this._volume;
      this.masterGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.1);
    }
  }

  /** 切换静音 */
  toggleMute(): boolean {
    this.muted = !this._muted;
    return this._muted;
  }

  /** 选择音乐主题 */
  setTheme(theme: BgmTheme): void {
    this._theme = theme;
  }

  /** 开始播放背景音乐 */
  async startPlay(theme?: BgmTheme): Promise<void> {
    if (this._playing) {
      if (theme) this.setTheme(theme);
      return;
    }

    if (theme) this.setTheme(theme);

    // 初始化 AudioContext（需要在用户交互后）
    if (!this.ctx) {
      await this.initContext();
    }

    if (this.ctx?.state === 'suspended') {
      await this.ctx.resume();
    }

    const config = THEME_CONFIGS[this._theme];
    this._playing = true;
    this.nextNoteTime = this.ctx!.currentTime + 0.1;
    this.scheduleNotes(config);
  }

  /** 暂停背景音乐 */
  pause(): void {
    this.pauseScheduler();
  }

  /** 恢复背景音乐 */
  resume(): void {
    if (!this._playing) return;
    this.resumeScheduler();
  }

  /** 完全停止并清理 */
  stop(): void {
    this.pauseScheduler();
    this.stopAllNotes();
    this._playing = false;
  }

  /** 销毁音频管理器 */
  destroy(): void {
    this.stop();
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }

  // ─── 私有方法 ──────────────────────────────

  private async initContext(): Promise<void> {
    this.ctx = new AudioContext();

    // 主音量节点
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this._muted ? 0 : this._volume;

    // 简易混响（使用延迟线模拟）
    this.reverbNode = this.ctx.createConvolver();
    this.reverbNode.buffer = this.createReverbBuffer(this.ctx, 1.8, 0.6);

    this.dryGain = this.ctx.createGain();
    this.wetGain = this.ctx.createGain();

    const config = THEME_CONFIGS[this._theme];
    this.dryGain.gain.value = 1 - config.reverbMix;
    this.wetGain.gain.value = config.reverbMix;

    this.masterGain.connect(this.dryGain).connect(this.ctx.destination);
    this.masterGain.connect(this.reverbNode).connect(this.wetGain).connect(this.ctx.destination);
  }

  /** 创建混响脉冲响应 */
  private createReverbBuffer(ctx: AudioContext, duration: number, decay: number): AudioBuffer {
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * duration;
    const buffer = ctx.createBuffer(2, length, sampleRate);

    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }
    return buffer;
  }

  /** 定时调度音符 */
  private scheduleNotes(config: typeof THEME_CONFIGS['gameplay']): void {
    if (!this.ctx || !this._playing) return;

    const now = this.ctx.currentTime;

    // 提前调度下一批音符
    while (this.nextNoteTime < now + 2.0) {
      const shouldPlay = Math.random() > config.pauseProbability;
      if (shouldPlay) {
        this.playSingleNote(this.nextNoteTime, config);
      }
      this.nextNoteTime += config.noteDuration * (0.6 + Math.random() * 0.8);
    }

    this.scheduleTimer = window.setTimeout(
      () => this.scheduleNotes(config),
      1000,
    );
  }

  /** 演奏单个音符 */
  private playSingleNote(
    startTime: number,
    _config: typeof THEME_CONFIGS['gameplay'],
  ): void {
    if (!this.ctx || !this.masterGain) return;

    // 从五声音阶中选音符（倾向邻近音符产生旋律感）
    const idx = Math.floor(Math.random() * PENTATONIC_SCALE.length);
    const freq = PENTATONIC_SCALE[idx];

    // 创建振荡器（模拟古筝拨弦泛音）
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    // 使用三角波 + 轻微方波混合模拟拨弦音色
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, startTime);

    // ADSR 包络
    const { attack, decay, sustain, release } = INSTRUMENT;
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.15, startTime + attack);
    gainNode.gain.exponentialRampToValueAtTime(0.15 * sustain, startTime + decay);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + release);

    osc.connect(gainNode).connect(this.masterGain);
    osc.start(startTime);
    osc.stop(startTime + release);

    // 清理已结束的音符
    this.currentNotes.push({ osc, gain: gainNode });
    osc.onended = () => {
      const idx2 = this.currentNotes.findIndex(n => n.osc === osc);
      if (idx2 !== -1) this.currentNotes.splice(idx2, 1);
    };

    // 限制同时发声的音符数
    while (this.currentNotes.length > 12) {
      try { this.currentNotes[0].osc.stop(); } catch { /* 已停止 */ }
      this.currentNotes.shift();
    }
  }

  /** 停止所有正在发声的音符 */
  private stopAllNotes(): void {
    for (const note of this.currentNotes) {
      try { note.osc.stop(); } catch { /* 已停止 */ }
    }
    this.currentNotes = [];
  }

  /** 暂停音符调度 */
  private pauseScheduler(): void {
    if (this.scheduleTimer !== null) {
      clearTimeout(this.scheduleTimer);
      this.scheduleTimer = null;
    }
    this.stopAllNotes();
  }

  /** 恢复音符调度 */
  private resumeScheduler(): void {
    if (!this.ctx || !this._playing) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    const config = THEME_CONFIGS[this._theme];
    this.nextNoteTime = this.ctx.currentTime + 0.1;
    this.scheduleNotes(config);
  }
}

// ─── 导出单例 ────────────────────────────────
export const audioManager = GameAudioManager.getInstance();
export default audioManager;
