// ============================================================
// 结局一览界面 —— 《晋·信》
// 玩家正式开始前展示所有结局及达成条件
// ============================================================

import { useRef, useState, useCallback, useEffect } from 'react';
import type { GameOverType, Difficulty } from '../../types';

interface EndingCard {
  id: GameOverType;
  name: string;
  category: 'failure' | 'victory' | 'special';
  description: string;
  condition: string;
  hint: string;
}

const ENDINGS: EndingCard[] = [
  {
    id: 'bankrupt',
    name: '惨淡收场',
    category: 'failure',
    description: '库银耗尽，票号周转不灵，伙计们作鸟兽散，昔日门庭若市的铺面只剩一副破匾。',
    condition: '总库银 ≤ 0 两',
    hint: '量入为出，守住现金线。切忌孤注一掷。',
  },
  {
    id: 'disgraced',
    name: '晚节不保',
    category: 'failure',
    description: '信誉扫地，商帮除名，县衙登门查封。晋商最重信义，一旦失信便永无翻身之日。',
    condition: '信誉 ≤ 0',
    hint: '汇兑违约、密押泄露、巡检懈怠皆损信誉。',
  },
  {
    id: 'golden_age',
    name: '金玉满堂',
    category: 'victory',
    description: '汇通天下，库银盈仓。朝野上下无不知「晋·信」之名，大掌柜之名载入晋商百年史册。',
    condition: '总库银 ≥ 120 万两，且年份 ≥ 1815（经营 7 年以上）',
    hint: '稳扎稳打，提高汇兑量与利润率。汉口/张家口两翼齐飞。',
  },
  {
    id: 'steady_hand',
    name: '守成之主',
    category: 'victory',
    description: '五年风雨如一，虽无惊世之举，却守住了先人基业。平遥老号灯火不灭，便是最大的功德。',
    condition: '年份 ≥ 1813（坚持经营 5 年不倒）',
    hint: '不求暴富，只求不崩。风雨飘摇时宁可收缩战线。',
  },
  {
    id: 'graceful_exit',
    name: '急流勇退',
    category: 'special',
    description: '盛极而思退，东家再三挽留，大掌柜拱手告别。携一世清名，归养林泉。',
    condition: '信誉 ≥ 85（金字招牌），且年份 ≥ 1815，可在年终主动退隐',
    hint: '功成而不居，天之道也。巅峰时机方显智慧。',
  },
  {
    id: 'early_exit',
    name: '功成身退',
    category: 'special',
    description: '大掌柜随时可以挂印而去。不求闻达于诸侯，但求自在于江湖。',
    condition: '随时点击「结束游戏」按钮，即时结算',
    hint: '无论胜败，票号故事由你亲手画上句号。',
  },
];

const CATEGORY_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  failure: { label: '失败结局', color: 'var(--color-loss)', bg: 'rgba(153,27,27,0.06)' },
  victory: { label: '胜利结局', color: 'var(--color-profit)', bg: 'rgba(22,101,52,0.06)' },
  special: { label: '特殊结局', color: 'var(--color-gold)', bg: 'rgba(158,111,10,0.06)' },
};

interface Props {
  difficulty: Difficulty;
  onStart: () => void;
}

export function EndingPreview({ difficulty, onStart }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const progress = scrollHeight - clientHeight > 0
      ? scrollTop / (scrollHeight - clientHeight)
      : 1;
    setScrollProgress(progress);
    if (progress >= 0.85) setHasScrolled(true);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollHeight <= el.clientHeight) {
      setHasScrolled(true);
      setScrollProgress(1);
    }
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'var(--color-paper)',
      }}
    >
      <div
        style={{
          maxWidth: 600,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'calc(100vh - 48px)',
        }}
      >
        <div style={{ textAlign: 'center', flexShrink: 0, marginBottom: 16 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56,
              height: 56,
              border: '3px solid var(--color-red-seal)',
              borderRadius: '50%',
              color: 'var(--color-red-seal)',
              fontSize: '1.6rem',
              fontWeight: 700,
              fontFamily: 'var(--font-heading)',
              marginBottom: 10,
            }}
          >
            终
          </div>
          <h1 style={{ color: 'var(--color-red-seal)', letterSpacing: '0.22em', marginBottom: 4, fontSize: '1.3rem' }}>
            票号结局一览
          </h1>
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>
            {difficulty === 'hard' ? '困难模式下，每一两银子都格外珍贵' : '知晓终点，方能行稳致远'}
          </p>
        </div>

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          style={{
            flex: 1,
            overflowY: 'auto',
            paddingRight: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {ENDINGS.map(ending => {
            const cat = CATEGORY_LABELS[ending.category];
            return (
              <div
                key={ending.id}
                style={{
                  background: 'rgba(253, 251, 245, 0.85)',
                  border: '1px solid var(--color-paper-border)',
                  borderRadius: 10,
                  padding: '18px 20px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                    background: cat.bg, color: cat.color, border: `1px solid ${cat.color}`, flexShrink: 0,
                  }}>
                    {cat.label}
                  </span>
                  <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-ink)', fontFamily: 'var(--font-heading)' }}>
                    {ending.name}
                  </span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-ink-light)', lineHeight: 1.75, marginBottom: 10 }}>
                  {ending.description}
                </p>
                <div style={{ background: 'rgba(31,25,14,0.04)', borderLeft: '3px solid var(--color-gold)', padding: '8px 12px', borderRadius: '0 6px 6px 0', marginBottom: 8 }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-ink-muted)', marginBottom: 4, letterSpacing: '0.08em' }}>
                    达成条件
                  </div>
                  <div style={{ fontSize: '0.83rem', color: 'var(--color-ink)' }}>{ending.condition}</div>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-ink-muted)', fontStyle: 'italic' }}>
                  💡 {ending.hint}
                </div>
              </div>
            );
          })}
          <div style={{ height: 8, flexShrink: 0 }} />
        </div>

        <div style={{ height: 3, background: 'rgba(196,184,154,0.3)', borderRadius: 2, marginTop: 10, flexShrink: 0, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${Math.round(scrollProgress * 100)}%`,
            background: hasScrolled ? 'var(--color-profit)' : 'var(--color-gold)',
            borderRadius: 2, transition: 'width 0.15s ease, background 0.3s',
          }} />
        </div>

        <div style={{ flexShrink: 0, paddingTop: 12, textAlign: 'center' }}>
          <button
            onClick={onStart}
            disabled={!hasScrolled}
            style={{
              width: '100%', padding: '14px 0', fontSize: '1.05rem', fontWeight: 700,
              fontFamily: 'var(--font-body)',
              color: hasScrolled ? 'var(--color-paper)' : 'var(--color-ink-muted)',
              background: hasScrolled ? 'var(--color-red-seal)' : 'rgba(196,184,154,0.35)',
              border: 'none', borderRadius: 10,
              cursor: hasScrolled ? 'pointer' : 'not-allowed',
              letterSpacing: '0.12em', transition: 'all 0.25s',
            }}
          >
            {hasScrolled ? '开始游戏' : '↓ 翻阅结局后方可开始'}
          </button>
          {!hasScrolled && (
            <p style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)', marginTop: 6 }}>
              请向下阅览全部结局
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
