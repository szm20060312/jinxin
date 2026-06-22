// ============================================================
// 新手教程 —— 《晋·信》
// 分步引导、支持前后翻页、跳过、完成后不再自动弹出
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { useGameState } from '../../hooks/useGameState';
import { useAuth } from '../../hooks/useAuth';

// ---- 教程步骤定义 ----

interface GuideStep {
  icon: string;
  title: string;
  subtitle: string;
  content: string;
  bullets?: string[];
}

const STEPS: GuideStep[] = [
  {
    icon: '🏯',
    title: '大掌柜，欢迎上任',
    subtitle: '晋·信票号 · 嘉庆十三年',
    content: '你将扮演山西平遥一家票号的大掌柜，统管总号与汉口、张家口两处分号。以信义为本、汇通天下，在三十年经营中创造属于你的晋商传奇。',
    bullets: [
      '每一年分为春、夏、秋、冬四季',
      '每季有 90 天，时间会随着经营推进',
      '界面左侧边栏实时显示库银、信誉、分号状态',
    ],
  },
  {
    icon: '📋',
    title: '晨间简报',
    subtitle: '运筹帷幄，始于清晨',
    content: '每季初你会收到各地飞鸽来报。简报分为五类：',
    bullets: [
      '💰 银两——各地库银调拨与存贷情况',
      '📝 汇票——密押安全与伪票警讯',
      '🔍 情报——官府动态、商路变化、商帮消息',
      '👤 伙友——忠诚异动、学徒成长、人才推荐',
      '⚠️ 危机——突发灾祸、分号事故',
    ],
  },
  {
    icon: '📊',
    title: '季度决策',
    subtitle: '每季四项核心决策',
    content: '阅览简报后，你需要做出本季的经营决策。四项决策不可跳过：',
    bullets: [
      '💵 银两调拨——在总号、汉口、张家口之间调度库银',
      '📈 汇费定价——设定汇费率与存款利率，影响业务量',
      '👥 伙友调配——安排伙友驻场，学徒也会随季度成长',
      '🔐 密押巡查——定期更换密押方案，防止伪造汇票',
    ],
  },
  {
    icon: '🏛️',
    title: '分号管理',
    subtitle: '汉口 · 张家口',
    content: '两处远程分号由掌柜独立经营，但大掌柜需定期巡查。分号状态分为三种：',
    bullets: [
      '🟢 正常——日常汇兑、存款、放款正常运转',
      '🟡 恢复中——此前遭遇危机，业务量暂未恢复',
      '🔴 危机——账目混乱或信誉受损，业务量骤降',
      '点击左侧「分号详情」可查看掌柜能力、库银细目',
      '每年年终合账时会对分号进行评级（一等/二等）',
    ],
  },
  {
    icon: '👥',
    title: '伙友系统',
    subtitle: '选人、育人、留人',
    content: '伙友是票号的命脉。分两个层级：学徒与伙友（账房/跑街）。',
    bullets: [
      '🎓 学徒——资质决定培养上限，受训 36 个月（9 年游戏时间）可出师',
      '💼 伙友——驻场分号可提升业务量，能力与忠诚同样重要',
      '⭐ 天赋——部分伙友拥有特殊天赋（铁算盘、人脉广、过目不忘等）',
      '📋 年终评定——续任加忠诚、调离轮换减忠诚、辞退影响全员士气',
      '⚠️ 低忠诚伙友有概率携款潜逃！',
    ],
  },
  {
    icon: '⚖️',
    title: '信誉与结局',
    subtitle: '信义为晋商之本',
    content: '信誉是票号的生命线。信誉归零则字号崩塌、游戏结束。库银耗尽亦无力回天。',
    bullets: [
      '💀 信誉 ≤ 0 → 晚节不保；库银 ≤ 0 → 惨淡收场',
      '🥇 库银 ≥ 120 万两 且经营 ≥ 10 年 → 金玉满堂',
      '🛡️ 坚持 25 年不倒 → 守成之主',
      '🎭 信誉 ≥ 85（金字招牌）时可主动退隐 → 急流勇退',
      '🏁 随时可手动结束游戏，即时结算结局',
    ],
  },
  {
    icon: '🎋',
    title: '万事俱备',
    subtitle: '请大掌柜开始经营',
    content: '晋商之道，以信义为本、以审慎为基。遇事多思量，不可贪快、不可冒进。\n\n祝你汇通天下，青史留名。',
  },
];

const GUIDE_STORAGE_PREFIX = 'jinxin_guide_done_';

// ---- 组件 ----

export function NewPlayerGuide() {
  const { state, dispatch } = useGameState();
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  // 检测首次进入游戏
  useEffect(() => {
    if (!user) return;
    // 仅在游戏第一季第一天触发
    if (state.date.year !== 1808 || state.date.season !== 1 || state.date.day !== 1) return;
    if (state.phase === 'game_over') return;

    const key = GUIDE_STORAGE_PREFIX + user;
    if (localStorage.getItem(key) === '1') return;

    // 延迟弹出，等界面渲染完成
    const timer = setTimeout(() => setVisible(true), 500);
    return () => clearTimeout(timer);
  }, [user, state.date.year, state.date.season, state.date.day, state.phase]);

  const completeGuide = useCallback(() => {
    if (user) {
      localStorage.setItem(GUIDE_STORAGE_PREFIX + user, '1');
    }
    setVisible(false);
  }, [user]);

  const handleSkip = useCallback(() => {
    completeGuide();
    dispatch({ type: 'ADD_LOG', message: '大掌柜跳过了新手教程。' });
  }, [completeGuide, dispatch]);

  const handleNext = useCallback(() => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      completeGuide();
      dispatch({ type: 'ADD_LOG', message: '大掌柜阅览完毕，正式上任。' });
    }
  }, [step, completeGuide, dispatch]);

  const handlePrev = useCallback(() => {
    setStep(Math.max(0, step - 1));
  }, [step]);

  if (!visible) return null;

  const current = STEPS[step];
  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;

  return (
    <div
      className="guide-overlay"
      onClick={handleSkip}
    >
      <div
        className="guide-card guide-card--stepped"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: 520,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* ── 跳过按钮（右上角）── */}
        <button
          onClick={handleSkip}
          style={{
            position: 'absolute',
            top: 12,
            right: 14,
            background: 'none',
            border: 'none',
            fontSize: '0.78rem',
            color: 'var(--color-ink-muted)',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: 6,
            transition: 'background 0.2s',
            fontFamily: 'var(--font-body)',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(31,25,14,0.06)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
          title="跳过教程"
        >
          跳过 ✕
        </button>

        {/* ── 图标 ── */}
        <div
          style={{
            fontSize: '2.2rem',
            textAlign: 'center',
            marginBottom: 6,
            flexShrink: 0,
          }}
        >
          {current.icon}
        </div>

        {/* ── 标题 ── */}
        <h2
          style={{
            textAlign: 'center',
            fontSize: '1.25rem',
            marginBottom: 2,
            color: 'var(--color-ink)',
            flexShrink: 0,
          }}
        >
          {current.title}
        </h2>
        <p
          style={{
            textAlign: 'center',
            fontSize: '0.8rem',
            color: 'var(--color-ink-muted)',
            marginBottom: 18,
            flexShrink: 0,
          }}
        >
          {current.subtitle}
        </p>

        {/* ── 正文（可滚动）── */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            marginBottom: 16,
            paddingRight: 4,
          }}
        >
          <p
            style={{
              fontSize: '0.88rem',
              color: 'var(--color-ink-light)',
              lineHeight: 1.8,
              marginBottom: current.bullets ? 14 : 0,
              whiteSpace: 'pre-line',
            }}
          >
            {current.content}
          </p>

          {current.bullets && (
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              {current.bullets.map((b, i) => (
                <li
                  key={i}
                  style={{
                    fontSize: '0.83rem',
                    color: 'var(--color-ink)',
                    lineHeight: 1.7,
                    padding: '6px 12px',
                    background: 'rgba(31,25,14,0.03)',
                    borderRadius: 8,
                    borderLeft: '3px solid var(--color-paper-border)',
                  }}
                >
                  {b}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── 步骤圆点指示器 ── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 8,
            marginBottom: 16,
            flexShrink: 0,
          }}
        >
          {STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === step ? 20 : 8,
                height: 8,
                borderRadius: 4,
                background:
                  i === step
                    ? 'var(--color-red-seal)'
                    : i < step
                    ? 'var(--color-paper-border)'
                    : 'rgba(196,184,154,0.35)',
                transition: 'all 0.3s',
              }}
            />
          ))}
        </div>

        {/* ── 底部按钮 ── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <button
            onClick={handlePrev}
            disabled={isFirst}
            style={{
              padding: '8px 20px',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: isFirst ? 'rgba(107,93,72,0.35)' : 'var(--color-ink-muted)',
              background: 'transparent',
              border: `1px solid ${isFirst ? 'rgba(196,184,154,0.25)' : 'var(--color-paper-border)'}`,
              borderRadius: 8,
              cursor: isFirst ? 'default' : 'pointer',
              fontFamily: 'var(--font-body)',
              transition: 'all 0.2s',
            }}
          >
            ← 上一步
          </button>

          <span
            style={{
              fontSize: '0.75rem',
              color: 'var(--color-ink-muted)',
            }}
          >
            {step + 1} / {STEPS.length}
          </span>

          <button
            onClick={handleNext}
            style={{
              padding: '8px 24px',
              fontSize: '0.85rem',
              fontWeight: 700,
              color: 'var(--color-paper)',
              background: isLast
                ? 'var(--color-profit)'
                : 'var(--color-red-seal)',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              letterSpacing: '0.05em',
              transition: 'all 0.2s',
            }}
          >
            {isLast ? '✓ 开始经营' : '下一步 →'}
          </button>
        </div>
      </div>
    </div>
  );
}
