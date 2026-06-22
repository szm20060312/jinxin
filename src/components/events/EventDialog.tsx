// ============================================================
// 突发事件对话框 —— 《晋·信》
// ============================================================

import { useCallback, useRef } from 'react';
import { useGameState } from '../../hooks/useGameState';
import { useToast } from '../common/Toast';
import { generateApprentice } from '../../data/staff';
import type { GameEvent } from '../../types';

// 事件类型图标
const EVENT_TYPE_ICONS: Record<string, string> = {
  story: '📜',
  crisis: '⚠️',
  random: '⚡',
};

interface EventDialogProps {
  event: GameEvent;
  onResolve: () => void;
}

export function EventDialog({ event, onResolve }: EventDialogProps) {
  const { state, dispatch } = useGameState();
  const { toast } = useToast();
  const icon = EVENT_TYPE_ICONS[event.type] || '📋';
  const nextIdRef = useRef(Math.max(0, ...state.staff.map(s => s.id)) + 1);

  const handleChoice = useCallback(
    (option: (typeof event.options)[number]) => {
      // 应用事件效果
      dispatch({ type: 'APPLY_EFFECTS', effects: option.effects });

      // 内部招聘标记：生成随机学徒加入伙友
      if (option._addApprentice) {
        const newId = nextIdRef.current++;
        const newApprentice = generateApprentice(newId, 'headquarters');
        dispatch({ type: 'ADD_STAFF', staff: newApprentice });
        dispatch({
          type: 'ADD_LOG',
          message: `新学徒「${newApprentice.name}」加入本号（资质 ${newApprentice.talent}，${newApprentice.talentBonus || '暂无天赋'}）。`,
        });
      }

      // 内部招聘标记：指定伙友从角色池加入
      if (option._hireStaff) {
        dispatch({ type: 'ADD_STAFF', staff: option._hireStaff });
        dispatch({
          type: 'ADD_LOG',
          message: `「${option._hireStaff.name}」加入本号，派驻总号。`,
        });
      }

      // 危机自救行动标记（宴会冷却 / 东家注资一次性标记）
      if (option._crisisAction) {
        if (option._crisisAction === 'banquet' || option._crisisAction === 'guarantee') {
          dispatch({ type: 'SET_CRISIS_ACTION', action: 'banquet' });
        } else if (option._crisisAction === 'ownerBailout') {
          dispatch({ type: 'SET_CRISIS_ACTION', action: 'ownerBailout' });
        }
      }

      // 记录日志
      dispatch({
        type: 'ADD_LOG',
        message: `【${event.title}】${option.outcomeDescription}`,
      });

      // Toast 反馈
      toast(`事件已处理：${option.text}`, 'info');

      // 保存后再通知父组件
      dispatch({ type: 'SAVE_GAME' });
      onResolve();
    },
    [event, dispatch, toast, onResolve, nextIdRef]
  );

  // 事件描述换行处理
  const description = event.description || '';

  return (
    <div className="phase-enter">
      {/* 危机事件：警戒边框装饰 */}
      {event.type === 'crisis' && (
        <img
          src="/img/border-thunder-hy.png"
          alt=""
          className="event-border-strip"
          loading="lazy"
        />
      )}

      {/* 事件标题横幅 */}
      <div
        style={{
          background: event.type === 'crisis'
            ? 'linear-gradient(135deg, rgba(178, 34, 34, 0.08), rgba(192, 57, 43, 0.12))'
            : 'linear-gradient(135deg, rgba(139, 37, 0, 0.04), rgba(184, 134, 11, 0.06))',
          border: `2px solid ${event.type === 'crisis' ? 'rgba(178, 34, 34, 0.3)' : 'var(--color-paper-border)'}`,
          borderLeft: `5px solid ${event.type === 'crisis' ? 'var(--color-loss)' : 'var(--color-red-seal)'}`,
          borderRadius: 8,
          padding: '24px 28px',
          marginBottom: 28,
        }}
      >
        <div style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 12 }}>
          <span style={{ marginRight: 8 }}>{icon}</span>
          {event.title}
          {event.type === 'crisis' && (
            <span className="urgent-badge" style={{ marginLeft: 12 }}>紧急</span>
          )}
        </div>
        <div
          className="card__body"
          style={{ marginBottom: 0, whiteSpace: 'pre-line', lineHeight: 1.9 }}
        >
          {description}
        </div>
      </div>

      {/* 选项 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {event.options.map((opt) => (
          <button
            key={opt.id}
            className="btn btn--lg"
            onClick={() => handleChoice(opt)}
            style={{
              textAlign: 'left',
              justifyContent: 'flex-start',
              padding: '14px 20px',
              borderColor: 'var(--color-paper-border)',
              backgroundColor: 'rgba(250, 248, 242, 0.7)',
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{opt.text}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)' }}>
                {opt.outcomeDescription}
              </div>
            </div>
            <span style={{ marginLeft: 12, color: 'var(--color-ink-muted)', fontSize: '1.1rem' }}>
              →
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
