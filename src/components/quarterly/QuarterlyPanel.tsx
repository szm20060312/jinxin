// ============================================================
// 季度决策面板 v2 —— 《晋·信》
//
// v2 改进：
// - 进入时概率触发突发事件（优先处理）
// - 决策卡片动态组合（4 核心 + 1~2 动态）
// - 精美选项按钮样式 + 动画过渡
// ============================================================

import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { useGameState } from '../../hooks/useGameState';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../common/Toast';
import { generateQuarterlyDecisions } from '../../engine/decisions';
import { simulateSeason, applySimulation } from '../../engine/simulation';
import { shouldTriggerQuarterlyEvent, generateQuarterlyEvent } from '../../engine/quarterlyEvents';
import { generateAnnualLedger } from '../../engine/annual';
import { getFirstPendingStoryEvent } from '../../engine/events';
import { checkAchievements } from '../../engine/achievements';
import { SAVE_VERSION } from '../../data/constants';
import type { QuarterlyDecision, DecisionOption, GameEvent, SaveData } from '../../types';
import { EventDialog } from '../events/EventDialog';

// ---- 分类元数据 ----
const CATEGORY_META: Record<string, { icon: string; label: string; cssClass: string }> = {
  fund: { icon: '💰', label: '银两', cssClass: 'decision-card--fund' },
  pricing: { icon: '📊', label: '费率', cssClass: 'decision-card--pricing' },
  staff: { icon: '👤', label: '人事', cssClass: 'decision-card--staff' },
  inspection: { icon: '🔍', label: '巡查', cssClass: 'decision-card--inspection' },
};

// ================================================================
// 决策卡片
// ================================================================

interface DecisionCardProps {
  decision: QuarterlyDecision;
  selectedIds: string[];
  onSelect: (decision: QuarterlyDecision, option: DecisionOption) => void;
  index: number;
}

function DecisionCard({ decision, selectedIds, onSelect, index }: DecisionCardProps) {
  const meta = CATEGORY_META[decision.category] || { icon: '📋', label: '其他', cssClass: '' };
  const isMulti = decision.multiSelect === true;

  const isUrgent = decision.title.includes('⚠️') || decision.title.includes('⚡');

  return (
    <div
      className={`card ${meta.cssClass}${isUrgent ? ' decision-card--urgent' : ''}`}
      style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'both' }}
    >
      <div className="card__title">
        <span style={{ fontSize: '1.1rem' }}>{meta.icon}</span>
        <span style={{ fontSize: '0.72rem', color: 'var(--color-ink-muted)', fontWeight: 400 }}>
          [{meta.label}]
        </span>
        <span style={{ fontWeight: 700 }}>{decision.title}</span>

        {isUrgent && <span className="urgent-badge">紧急</span>}

        {decision.currentValue !== undefined && (
          <span style={{
            fontSize: '0.78rem',
            color: 'var(--color-ink-light)',
            fontWeight: 400,
            marginLeft: 'auto',
          }}>
            当前：{decision.currentValue}
          </span>
        )}
      </div>

      <div className="card__body" style={{ whiteSpace: 'pre-line' }}>
        {decision.description}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {decision.options.map(opt => {
          const isSelected = selectedIds.includes(opt.id);
          const isDefault =
            opt.id === 'keep' ||
            opt.id === 'silver_none' ||
            opt.id === 'keep_pricing';

          return (
            <button
              key={opt.id}
              disabled={opt.disabled === true}
              title={opt.disabled ? (opt.disabledReason || '条件不满足') : undefined}
              className={`option-btn ${isSelected ? 'option-btn--selected' : ''} ${isDefault && !isSelected ? 'option-btn--default' : ''}`}
              onClick={() => !opt.disabled && onSelect(decision, opt)}
              style={opt.disabled ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
            >
              {isMulti ? (
                <span className="option-radio">{isSelected ? '☑' : '☐'}</span>
              ) : (
                <span className="option-radio">{isSelected ? '●' : '○'}</span>
              )}
              <span className="option-text">
                <div>{opt.label}</div>
                {opt.predictedImpact && (
                  <div className="option-impact">{opt.predictedImpact}</div>
                )}
              </span>
              {isDefault && !isSelected && !isMulti && (
                <span className="option-badge">默认</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ================================================================
// 模拟动画
// ================================================================

function SimulatingOverlay() {
  return (
    <div className="simulating-overlay">
      <h2>⏳ 本季经营中……</h2>
      <p className="text-muted">
        各分号正在汇算汇兑、收放银两，请稍候。
      </p>
      <div style={{ fontSize: '2rem', marginTop: 16 }}>🧮</div>
      <div className="simulating-progress">
        <div className="simulating-progress__bar" />
      </div>
    </div>
  );
}

// ================================================================
// 主面板
// ================================================================

export function QuarterlyPanel() {
  const { state, dispatch } = useGameState();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSimulating, setIsSimulating] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  // 突发事件状态
  const [urgentEvent, setUrgentEvent] = useState<GameEvent | null>(null);
  const [eventResolved, setEventResolved] = useState(false);

  // BUG-008 修复：用 ref 记录已检测过的赛季，防止组件重挂载时重复生成事件
  const checkedSeasonRef = useRef('');

  const [selections, setSelections] = useState<Record<string, DecisionOption[]>>({});

  // 进入时检测突发事件（同一赛季只检测一次）
  useEffect(() => {
    const seasonKey = `${state.date.year}-${state.date.season}`;
    if (checkedSeasonRef.current === seasonKey) return;

    if (!eventResolved && urgentEvent === null) {
      if (shouldTriggerQuarterlyEvent(state)) {
        const evt = generateQuarterlyEvent(state);
        setUrgentEvent(evt);
        dispatch({ type: 'ADD_LOG', message: `突发事件：${evt.title}` });
      } else {
        setEventResolved(true);
      }
      checkedSeasonRef.current = seasonKey;
    }
  }, [state.date.year, state.date.season]);

  // 突发事件处理完毕
  const handleEventResolved = useCallback(() => {
    setUrgentEvent(null);
    setEventResolved(true);
  }, []);

  // 生成决策
  const decisions = useMemo(
    () => (eventResolved ? generateQuarterlyDecisions(state) : []),
    [state.date.year, state.date.season, state.resources.silver.totalSilver, eventResolved]
  );

  const handleSelect = useCallback((decision: QuarterlyDecision, option: DecisionOption) => {
    setSelections(prev => {
      if (decision.multiSelect) {
        const current = prev[decision.id] || [];
        const exists = current.some(o => o.id === option.id);
        // 特殊处理：点"维持不变"时清空其他选择；点其他选项时移除"维持不变"
        if (option.id === 'silver_none') {
          return { ...prev, [decision.id]: [option] };
        }
        const filtered = current.filter(o => o.id !== 'silver_none');
        if (exists) {
          return { ...prev, [decision.id]: filtered.filter(o => o.id !== option.id) };
        }
        return { ...prev, [decision.id]: [...filtered, option] };
      }
      return { ...prev, [decision.id]: [option] };
    });
  }, []);

  const selectedCount = Object.values(selections).reduce((sum, arr) => sum + arr.length, 0);

  // 确认→计算决策效果→模拟→批量dispatch→推进阶段
  const handleConfirm = useCallback(() => {
    setConfirmed(true);
    setIsSimulating(true);

    // ========================================================
    // Step 1: 纯计算——基于当前 state 和 selections 计算 effectiveState
    // 所有定价/银两/人脉变动先累积，不 dispatch，确保 simulateSeason 看到最新值
    // ========================================================
    let effectivePricing = { ...state.pricing };
    let effectiveSilver = { ...state.resources.silver };
    let reputationDelta = 0;
    const connectionsDelta: Partial<typeof state.resources.connections> = {};

    const selectedOptions = Object.values(selections).flat();
    for (const option of selectedOptions) {
      // --- 定价变化（纯计算） ---
      switch (option.id) {
        // 费率定价（v3 合并后）
        case 'aggressive':
          effectivePricing = {
            ...effectivePricing,
            hankouFee: Math.round((state.pricing.hankouFee + 1.0) * 10) / 10,
            zhangjiakouFee: Math.round((state.pricing.zhangjiakouFee + 1.0) * 10) / 10,
            depositRate: Math.max(0.8, Math.round((state.pricing.depositRate - 0.5) * 10) / 10),
          };
          break;
        case 'attract':
          effectivePricing = {
            ...effectivePricing,
            hankouFee: Math.max(1.5, Math.round((state.pricing.hankouFee - 1.0) * 10) / 10),
            zhangjiakouFee: Math.max(2.0, Math.round((state.pricing.zhangjiakouFee - 1.0) * 10) / 10),
            depositRate: Math.round((state.pricing.depositRate + 0.5) * 10) / 10,
          };
          break;
        case 'volume':
          effectivePricing = {
            ...effectivePricing,
            hankouFee: Math.max(1.5, Math.round((state.pricing.hankouFee - 1.0) * 10) / 10),
            zhangjiakouFee: Math.max(2.0, Math.round((state.pricing.zhangjiakouFee - 1.0) * 10) / 10),
            depositRate: Math.max(0.8, Math.round((state.pricing.depositRate - 0.5) * 10) / 10),
          };
          break;
        // 银两运营（v3 合并后）
        case 'raise_limit':
          effectivePricing = { ...effectivePricing, loanLimit: Math.round(state.pricing.loanLimit * 1.5) };
          break;
        case 'lower_limit':
          effectivePricing = { ...effectivePricing, loanLimit: Math.max(10_000, Math.round(state.pricing.loanLimit * 0.6)) };
          break;
        // 动态：机遇
        case 'give_discount':
          effectivePricing = {
            ...effectivePricing,
            hankouFee: Math.max(1.5, Math.round((state.pricing.hankouFee - 1.0) * 10) / 10),
            zhangjiakouFee: Math.max(2.0, Math.round((state.pricing.zhangjiakouFee - 1.0) * 10) / 10),
          };
          break;
        case 'accept_deposit':
          effectivePricing = { ...effectivePricing, depositRate: Math.round((state.pricing.depositRate + 0.5) * 10) / 10 };
          break;
      }

      // --- 银两效果（累积） ---
      if (option.effects.silver) {
        for (const [key, value] of Object.entries(option.effects.silver)) {
          if (value !== undefined && (key in effectiveSilver)) {
            effectiveSilver = {
              ...effectiveSilver,
              [key]: Math.max(0, (effectiveSilver[key as keyof typeof effectiveSilver] as number) + value),
            };
          }
        }
      }

      // --- 信誉效果（累积） ---
      if (option.effects.reputation) {
        reputationDelta += option.effects.reputation;
      }

      // --- 人脉效果（累积） ---
      if (option.effects.connections) {
        for (const [k, v] of Object.entries(option.effects.connections)) {
          if (v !== undefined && k in connectionsDelta) {
            connectionsDelta[k as keyof typeof connectionsDelta] =
              (connectionsDelta[k as keyof typeof connectionsDelta] ?? 0) + v;
          } else if (v !== undefined) {
            (connectionsDelta as Record<string, number>)[k] = v;
          }
        }
      }
    }

    // 重新计算 totalSilver
    effectiveSilver.totalSilver =
      effectiveSilver.headquarters + effectiveSilver.hankou +
      effectiveSilver.zhangjiakou + effectiveSilver.inTransit;

    // ========================================================
    // Step 2: 构建 effectiveState（决策全部生效后的状态）
    // ========================================================
    const effectiveReputation = Math.max(0, Math.min(100, state.resources.reputation + reputationDelta));
    const effectiveConnections = { ...state.resources.connections };
    for (const [k, v] of Object.entries(connectionsDelta)) {
      if (v !== undefined && k in effectiveConnections) {
        effectiveConnections[k as keyof typeof effectiveConnections] =
          Math.max(0, Math.min(100, effectiveConnections[k as keyof typeof effectiveConnections] + v));
      }
    }

    const effectiveState: typeof state = {
      ...state,
      pricing: effectivePricing,
      resources: {
        ...state.resources,
        silver: effectiveSilver,
        reputation: effectiveReputation,
        connections: effectiveConnections,
      },
    };

    // ========================================================
    // Step 3: 模拟季度经济 + 推进时间（1.2s 展示动画）
    // ========================================================
    setTimeout(() => {
      // 收集本季定向调拨（经 inTransit 半衰期送达）
      const fundTransfers: { target: 'headquarters' | 'hankou' | 'zhangjiakou'; amount: number }[] = [];
      for (const option of selectedOptions) {
        if (option._fundTransfer) {
          fundTransfers.push(option._fundTransfer);
        }
      }

      const result = simulateSeason(effectiveState);
      const nextState = applySimulation(effectiveState, result, fundTransfers.length > 0 ? fundTransfers : undefined);

      // 批量 dispatch——消除 stale closure 和双重计算
      dispatch({ type: 'UPDATE_PRICING', payload: effectivePricing });
      dispatch({ type: 'UPDATE_SILVER', payload: nextState.resources.silver });
      dispatch({ type: 'UPDATE_REPUTATION', delta: reputationDelta + result.reputationChange });
      if (Object.keys(connectionsDelta).length > 0) {
        dispatch({ type: 'UPDATE_CONNECTIONS', payload: connectionsDelta });
      }
      dispatch({ type: 'UPDATE_BRANCH', branchId: 'hankou', payload: { businessVolume: result.hankouVolume } });
      dispatch({ type: 'UPDATE_BRANCH', branchId: 'zhangjiakou', payload: { businessVolume: result.zhangjiakouVolume } });
      dispatch({ type: 'SET_DATE', date: nextState.date });

      const summary = selectedOptions.map(opt => opt.label).join('；');
      dispatch({ type: 'ADD_LOG', message: `季度决策：${summary || '维持现状'}` });
      dispatch({ type: 'ADD_LOG', message: nextState.logs[0] });

      // 处理伙友调度 _staffDispatch 标记
      for (const option of selectedOptions) {
        if (option._staffDispatch) {
          const { staffId, targetStation } = option._staffDispatch;
          dispatch({ type: 'UPDATE_STAFF', id: staffId, changes: { stationedAt: targetStation } });
        }
      }

      // 白银调拨日志（调拨已在 applySimulation 中经 inTransit 机制送达）
      for (const ft of fundTransfers) {
        const targetName = ft.target === 'headquarters' ? '总号' : ft.target === 'hankou' ? '汉口' : '张家口';
        dispatch({ type: 'ADD_LOG', message: `白银调拨：${(ft.amount).toLocaleString()} 两已在途，每季半数抵达${targetName}。` });
      }

      // 里程碑成就检测
      const newAchievements = checkAchievements(nextState);
      if (newAchievements.length > 0) {
        for (const ach of newAchievements) {
          dispatch({ type: 'ADD_LOG', message: ach.logMessage });
          toast(ach.title, 'success');
        }
        // 将新成就加入 unlockedAchievements
        const updatedAchievements = [...nextState.unlockedAchievements, ...newAchievements.map(a => a.id)];
        nextState.unlockedAchievements = updatedAchievements;
      }

      setIsSimulating(false);

      // ========================================================
      // Step 4: 直接保存到 localStorage（不依赖引擎 currentUser 异步设置）
      // nextState 已包含决策效果 + 模拟结果，是完整的本季终态
      // ========================================================
      if (user) {
        try {
          const saveData: SaveData = {
            state: nextState,
            savedAt: new Date().toISOString(),
            version: SAVE_VERSION,
          };
          localStorage.setItem(`jinxin_save_${user}`, JSON.stringify(saveData));
        } catch (e) {
          console.error('季度存档失败：', e);
        }
      }

      // 终局检测
      // 4a. 失败结局
      if (nextState.resources.reputation <= 0 || nextState.resources.silver.totalSilver <= 0) {
        const endingType = nextState.resources.reputation <= 0 ? 'disgraced' : 'bankrupt';
        const gameOverLog = nextState.resources.reputation <= 0
          ? '字号崩塌——票号信誉扫地，无人再敢托付银两。'
          : '库银耗尽——票号无力兑付，经营难以为继。';
        dispatch({ type: 'SET_ENDING', endingType });
        dispatch({ type: 'ADD_LOG', message: gameOverLog });
        dispatch({ type: 'SET_PHASE', phase: 'game_over' });
        return;
      }

      // 4b. 胜利结局 · 金玉满堂（银两 ≥ 120万 + 经营 ≥ 7 年（1815））
      if (nextState.resources.silver.totalSilver >= 1_200_000 && nextState.date.year >= 1815) {
        dispatch({ type: 'SET_ENDING', endingType: 'golden_age' });
        dispatch({ type: 'ADD_LOG', message: '金玉满堂——库银如山，富甲天下，字号名动四海！' });
        dispatch({ type: 'SET_PHASE', phase: 'game_over' });
        return;
      }

      // 4c. 胜利结局 · 守成之主（经营满 5 年）
      if (nextState.date.year >= 1813) {
        dispatch({ type: 'SET_ENDING', endingType: 'steady_hand' });
        dispatch({ type: 'ADD_LOG', message: '守成之主——五年如一日的坚守，以信义立身，平安即是福。' });
        dispatch({ type: 'SET_PHASE', phase: 'game_over' });
        return;
      }

      // 检测跨年 → 进入年终合账
      if (nextState.date.season === 1 && nextState.date.year > state.date.year) {
        const ledger = generateAnnualLedger(nextState);
        dispatch({ type: 'SET_ANNUAL_LEDGER', ledger });
        dispatch({ type: 'SET_PHASE', phase: 'annual' });
        toast('岁末年终，进入合账盘算', 'info');
        return;
      }

      // 检测主线事件
      const pendingStory = getFirstPendingStoryEvent(nextState);
      if (pendingStory) {
        dispatch({ type: 'SET_PHASE', phase: 'event' });
        toast('有大事发生！', 'warning');
        return;
      }

      toast('本季经营完成', 'success');
      dispatch({ type: 'SET_PHASE', phase: 'morning' });
    }, 1200);
  }, [selections, state, dispatch, toast]);

  // 模拟中
  if (isSimulating) return <SimulatingOverlay />;

  // 突发事件处理中
  if (urgentEvent && !eventResolved) {
    return (
      <div className="phase-enter">
        <img
          src="/img/banner-quarterly-hy.png"
          alt="季度决策"
          className="panel-banner"
          loading="lazy"
        />
        <div className="section-title">
          <h2>📊 季度决策</h2>
        </div>
        <div style={{ marginBottom: 16 }}>
          <p className="text-urgent" style={{ marginBottom: 4 }}>
            ⚠️ 突发状况！需先处理此事方可进入常规决策。
          </p>
        </div>
        <EventDialog event={urgentEvent} onResolve={handleEventResolved} />
      </div>
    );
  }

  // 常规决策面板
  return (
    <div className="phase-enter">
      <img
        src="/img/banner-quarterly-hy.png"
        alt="季度决策"
        className="panel-banner"
        loading="lazy"
      />
      <div className="section-title">
        <h2>📊 季度决策</h2>
        <span style={{ fontSize: '0.85rem', color: 'var(--color-ink-muted)', marginLeft: 'auto' }}>
          {state.date.year}年 · {['', '春', '夏', '秋', '冬'][state.date.season]}季
        </span>
      </div>

      <p className="text-muted" style={{ marginBottom: 24, marginTop: -12 }}>
        请大掌柜阅览各项并做出决策。未做选择的将维持现状。
      </p>

      {/* 决策卡片列表 */}
      {decisions.map((decision, i) => (
        <DecisionCard
          key={decision.id}
          decision={decision}
          selectedIds={(selections[decision.id] || []).map(o => o.id)}
          onSelect={handleSelect}
          index={i}
        />
      ))}

      {/* 底部确认栏 */}
      <div className="sticky-footer">
        <div style={{ marginBottom: 12, fontSize: '0.85rem' }} className="text-muted">
          已做 <strong>{selectedCount}</strong> / {decisions.length} 项决策
          {selectedCount < decisions.length && ' — 未选的将维持现状'}
        </div>
        <button
          className="btn btn--primary btn--lg"
          onClick={handleConfirm}
          disabled={confirmed}
        >
          📜 颁布号规，推进一步
        </button>
      </div>
    </div>
  );
}
