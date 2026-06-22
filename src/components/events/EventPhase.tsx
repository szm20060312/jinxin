// ============================================================
// 事件阶段面板 —— 《晋·信》
// ============================================================

import { useCallback, useRef } from 'react';
import { useGameState } from '../../hooks/useGameState';
import { EventDialog } from './EventDialog';
import { getFirstPendingStoryEvent } from '../../engine/events';

export function EventPhase() {
  const { state, dispatch } = useGameState();

  // BUG-009 修复：防重入——event 为空时只 dispatch 一次，避免 render 中 setState 触发无限循环
  const resolvedRef = useRef(false);

  // 获取当前应处理的事件
  const event = getFirstPendingStoryEvent(state);

  const handleResolve = useCallback(() => {
    // 事件处理完毕，根据当前时间决定去向
    if (state.annualLedger) {
      dispatch({ type: 'SET_PHASE', phase: 'annual' });
    } else {
      dispatch({ type: 'SET_PHASE', phase: 'morning' });
    }
  }, [state.annualLedger, dispatch]);

  if (!event) {
    // 没有待处理事件，直接跳过——但只执行一次
    if (!resolvedRef.current) {
      resolvedRef.current = true;
      // 延迟 dispatch，避免在 render 阶段修改状态
      setTimeout(() => handleResolve(), 0);
    }
    return null;
  }

  // event 存在时重置标志位
  resolvedRef.current = false;

  return (
    <div className="phase-enter">
      <div className="section-title">
        <h2>📜 重大事件</h2>
      </div>
      <EventDialog event={event} onResolve={handleResolve} />
    </div>
  );
}
