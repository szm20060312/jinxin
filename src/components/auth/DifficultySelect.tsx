// ============================================================
// 难度选择界面 —— 《晋·信》
// 普通 / 困难 两种模式
// ============================================================

import type { Difficulty } from '../../types';

interface DifficultyOption {
  id: Difficulty;
  title: string;
  subtitle: string;
  desc: string;
  stats: { label: string; normal: string; hard: string }[];
}

const OPTIONS: DifficultyOption[] = [
  {
    id: 'normal',
    title: '📜 普通模式',
    subtitle: '家底尚可，稳扎稳打',
    desc: '东家给了本分银两，商帮略有照应，县衙也说得上话。\n信誉中规中矩，汇兑业务平稳——适合初涉票号经营，体验晋商汇通天下的传奇。',
    stats: [
      { label: '库银', normal: '77 万两', hard: '31 万两' },
      { label: '信誉', normal: '60（中规中矩）', hard: '40（勉强维持）' },
      { label: '东家信任', normal: '70', hard: '45' },
      { label: '商帮好感', normal: '55', hard: '30' },
      { label: '官府交情', normal: '40', hard: '20' },
    ],
  },
  {
    id: 'hard',
    title: '⚔️ 困难模式',
    subtitle: '银根吃紧，如履薄冰',
    desc: '东家半信半疑只给了微薄本钱，商帮冷眼旁观，官府尚无交情。\n库银仅四成，人脉凋零，一步踏错便可能库银耗尽——适合寻求真正挑战的大掌柜。',
    stats: [
      { label: '库银', normal: '77 万两', hard: '31 万两' },
      { label: '信誉', normal: '60（中规中矩）', hard: '40（勉强维持）' },
      { label: '东家信任', normal: '70', hard: '45' },
      { label: '商帮好感', normal: '55', hard: '30' },
      { label: '官府交情', normal: '40', hard: '20' },
    ],
  },
];

interface Props {
  onSelect: (difficulty: Difficulty) => void;
}

export function DifficultySelect({ onSelect }: Props) {
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
          maxWidth: 640,
          width: '100%',
          textAlign: 'center',
        }}
      >
        {/* 标题 */}
        <div style={{ marginBottom: 32 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 64,
              height: 64,
              border: '3px solid var(--color-red-seal)',
              borderRadius: '50%',
              color: 'var(--color-red-seal)',
              fontSize: '2rem',
              fontWeight: 700,
              fontFamily: 'var(--font-heading)',
              marginBottom: 16,
            }}
          >
            晋
          </div>
          <h1 style={{ color: 'var(--color-red-seal)', letterSpacing: '0.22em', marginBottom: 8 }}>
            选择难度
          </h1>
          <p className="text-muted">不同难度下初始资源与局势截然不同，请大掌柜量力而行。</p>
        </div>

        {/* 两张选项卡 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {OPTIONS.map(opt => (
            <button
              key={opt.id}
              onClick={() => onSelect(opt.id)}
              style={{
                textAlign: 'left',
                padding: '28px 24px',
                background: 'rgba(253, 251, 245, 0.9)',
                border: opt.id === 'hard'
                  ? '2px solid var(--color-paper-border)'
                  : '2px solid var(--color-paper-border)',
                borderRadius: 12,
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: 'var(--font-body)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor =
                  opt.id === 'hard' ? 'var(--color-loss)' : 'var(--color-red-seal)';
                e.currentTarget.style.boxShadow =
                  opt.id === 'hard'
                    ? '0 4px 20px rgba(153,27,27,0.12)'
                    : '0 4px 20px rgba(122,31,0,0.12)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--color-paper-border)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* 标题 */}
              <div style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 4, color: 'var(--color-ink)' }}>
                {opt.title}
              </div>
              <div
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  marginBottom: 14,
                  color: opt.id === 'hard' ? 'var(--color-loss)' : 'var(--color-ink-muted)',
                }}
              >
                {opt.subtitle}
              </div>

              {/* 描述 */}
              <p
                style={{
                  fontSize: '0.85rem',
                  color: 'var(--color-ink-light)',
                  lineHeight: 1.7,
                  marginBottom: 18,
                  whiteSpace: 'pre-line',
                }}
              >
                {opt.desc}
              </p>

              {/* 数值对比 */}
              <div
                style={{
                  background: opt.id === 'hard'
                    ? 'rgba(153,27,27,0.04)'
                    : 'rgba(22,101,52,0.04)',
                  borderRadius: 8,
                  padding: '14px 16px',
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px 12px',
                    fontSize: '0.8rem',
                    color: 'var(--color-ink-muted)',
                  }}
                >
                  {opt.stats.map(s => (
                    <div key={s.label}>
                      <div style={{ fontWeight: 600, marginBottom: 2 }}>{s.label}</div>
                      <div style={{ color: opt.id === 'hard' ? 'var(--color-loss)' : 'var(--color-ink)' }}>
                        {opt.id === 'hard' ? s.hard : s.normal}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
