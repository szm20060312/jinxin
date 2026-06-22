// ============================================================
// 游戏结束面板 —— 《晋·信》
//
// 5 种结局：
//   bankrupt     / 惨淡收场（库银耗尽）
//   disgraced    / 晚节不保（信誉归零）
//   golden_age   / 金玉满堂（银两 ≥ 120 万 + 年份 ≥ 1815）★ 胜利
//   steady_hand  / 守成之主（经营 ≥ 5 年）★ 胜利
//   graceful_exit / 急流勇退（主动退隐）★ 胜利
// ============================================================

import { useGameState } from '../../hooks/useGameState';
import { useAuth } from '../../hooks/useAuth';
import { useRestartGame } from '../../App';
import type { GameOverType } from '../../types';

// ================================================================
// 结局配置
// ================================================================

interface EndingConfig {
  title: string;
  subtitle: string;
  reason: string;
  verdict: string;
  verdictDetail: string;
  tone: 'tragic' | 'heroic' | 'peaceful' | 'wise';
}

const ENDING_CONFIGS: Record<GameOverType, EndingConfig> = {
  bankrupt: {
    title: '镜花水月',
    subtitle: '惨淡收场',
    reason: '库银耗尽，无力兑付。',
    verdict: '一代票号，终成镜花水月。',
    verdictDetail:
      '拆东墙补西墙终有尽时。号门紧闭之日，存户围堵号外，哭喊声三日不绝。\n官府查封票号，东家倾尽家财偿债，大掌柜自此销声匿迹。',
    tone: 'tragic',
  },
  disgraced: {
    title: '晚节不保',
    subtitle: '信誉崩塌',
    reason: '票号信誉扫地，无人再敢托付银两。',
    verdict: '百年字号，一夜之间门可罗雀。',
    verdictDetail:
      '商帮除名，官府查封。曾以"一纸汇天下"闻名的金字招牌，如今成了街头巷尾的笑柄。\n东家怒而撤资，伙友四散，曾经往来无白丁的大掌柜，如今连一碗茶都赊不到。',
    tone: 'tragic',
  },
  golden_age: {
    title: '金玉满堂',
    subtitle: '汇通天下',
    reason: '库银如山，富可敌国。',
    verdict: '商界巨擘，名利双收，青史留名。',
    verdictDetail:
      '银窖之中，白银堆积如山，各地商帮望风来朝。\n东家以你为傲，伙友以你为荣——大掌柜之名，从口外商路传到江南水乡，无人不知晋商有一位经营之神。\n这一世，你活成了传奇。',
    tone: 'heroic',
  },
  steady_hand: {
    title: '守成之主',
    subtitle: '平安是福',
    reason: '五载经营，根基不动如山。',
    verdict: '无过便是功，平安即是福。',
    verdictDetail:
      '五年风雨，一千八百多个日夜的坚守。你从未激进扩张，也从未让票号陷入存亡危机。\n同行起起落落，唯有你的字号风雨不动。东家敬你如师，伙友视你如父——\n在这个乱世，稳，就是最大的本事。',
    tone: 'peaceful',
  },
  graceful_exit: {
    title: '急流勇退',
    subtitle: '善始善终',
    reason: '在巅峰之际主动交班，挂印归乡。',
    verdict: '大智慧，善始善终。',
    verdictDetail:
      '长江后浪推前浪。你深知经营之道不在霸住不放，而在适时放手。\n传印之日，满堂伙友垂泪相送。你留给后人的不仅是一座票号，更是一套做人做事的规矩。\n归隐田园，含饴弄孙，此生足矣。',
    tone: 'wise',
  },
  early_exit: {
    title: '功成身退',
    subtitle: '大掌柜请辞',
    reason: '由大掌柜主动结束经营。',
    verdict: '来去由心，此去江湖路远，后会有期。',
    verdictDetail:
      '你将号印郑重交还东家，整理了最后一本账册，合上了那扇每天清晨亲手推开的票号大门。\n伙友们列队相送，老街坊驻足寒暄——这票号的一砖一瓦，都刻着你的名字。\n你走出很远，又回头望了一眼。匾额上的"晋·信"二字在夕阳下泛着金光。',
    tone: 'peaceful',
  },
};

// ================================================================
// 主组件
// ================================================================

export function GameOverPanel() {
  const { state } = useGameState();
  const { user } = useAuth();
  const restartGame = useRestartGame();

  const endingType: GameOverType = state.endingType ?? 'bankrupt';
  const cfg = ENDING_CONFIGS[endingType];

  const toneStyles = {
    tragic: {
      borderColor: 'var(--color-loss)',
      accent: '#991b1b',
      bg: 'rgba(153,27,27,0.03)',
      icon: '📜',
    },
    heroic: {
      borderColor: 'var(--color-gold)',
      accent: '#9e6f0a',
      bg: 'rgba(158,111,10,0.04)',
      icon: '🏆',
    },
    peaceful: {
      borderColor: 'var(--color-profit)',
      accent: '#166534',
      bg: 'rgba(22,101,52,0.03)',
      icon: '🏡',
    },
    wise: {
      borderColor: 'var(--color-info)',
      accent: '#1e4a6b',
      bg: 'rgba(30,74,107,0.03)',
      icon: '🌅',
    },
  };

  const tone = toneStyles[cfg.tone];

  const handleRestart = () => {
    restartGame();
  };

  return (
    <div className="game-over">
      <div className="game-over__card" style={{ borderColor: tone.borderColor }}>

        {/* 印章 / 结局图标 */}
        <div className="game-over__seal" style={{ borderColor: tone.borderColor, color: tone.borderColor }}>
          {tone.icon}
        </div>

        {/* 结局标题 */}
        <div className="game-over__title" style={{ color: tone.accent }}>
          {cfg.title}
        </div>
        <p style={{ color: 'var(--color-ink-muted)', fontSize: '1rem', marginBottom: 16 }}>
          · {cfg.subtitle} ·
        </p>

        {/* 经营概览 */}
        <div className="game-over__summary">
          <p>
            大掌柜 <strong>{user}</strong>，于
            <strong> {state.date.year}年</strong>
            结束了经营。
          </p>
          <p style={{ marginTop: 8 }}>
            难度：
            <strong style={{ color: state.difficulty === 'hard' ? 'var(--color-loss)' : 'var(--color-ink)' }}>
              {state.difficulty === 'hard' ? '⚔️ 困难' : '📜 普通'}
            </strong>
            &nbsp;· 历时 {state.date.year - 1808} 年 ·
            总号存银 {state.resources.silver.totalSilver.toLocaleString()} 两 ·
            信誉 {state.resources.reputation}
          </p>
        </div>

        {/* 结语 */}
        <div
          className="game-over__reason"
          style={{
            borderLeftColor: tone.borderColor,
            background: tone.bg,
          }}
        >
          <div style={{ fontSize: '1.3rem', marginBottom: 8 }}>{tone.icon}</div>
          <p style={{ fontWeight: 700, marginBottom: 8 }}>{cfg.verdict}</p>
          <p style={{ whiteSpace: 'pre-line', color: 'var(--color-ink-light)', lineHeight: 1.9 }}>
            {cfg.verdictDetail}
          </p>
        </div>

        {/* 经营回顾 */}
        <div className="game-over__logs">
          <h3>📋 经营回顾</h3>
          <div className="game-over__log-list">
            {state.logs.slice(0, 12).map((log, i) => (
              <p
                key={i}
                className="text-muted"
                style={{ fontSize: '0.85rem', padding: '3px 0' }}
              >
                {log}
              </p>
            ))}
            {state.logs.length === 0 && (
              <p className="text-muted">尚无日志记录。</p>
            )}
          </div>
        </div>

        {/* 操作 */}
        <div className="game-over__actions">
          <button
            className="btn btn--primary btn--lg"
            onClick={handleRestart}
            style={{
              background: tone.accent,
              borderColor: tone.accent,
            }}
          >
            🔄 东山再起 · 重新开号
          </button>
        </div>

      </div>
    </div>
  );
}
