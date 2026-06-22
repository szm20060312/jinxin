// ============================================================
// Confirm 确认弹窗 —— 《晋·信》
//
// 替代原生 confirm()，提供一致的古风视觉
// ============================================================

import { useState, useCallback, useEffect } from 'react';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

interface ConfirmState extends ConfirmOptions {
  id: number;
  resolve: (value: boolean) => void;
}

let confirmId = 0;

// 全局单例（export 给非 React 上下文使用）
let globalSetState: ((opts: ConfirmOptions) => Promise<boolean>) | null = null;

/**
 * 命令式调用确认弹窗（可在任何地方使用）
 * @returns true = 确认, false = 取消
 */
export async function showConfirm(opts: ConfirmOptions): Promise<boolean> {
  if (!globalSetState) {
    console.warn('ConfirmProvider 未挂载');
    return false;
  }
  return globalSetState(opts);
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ConfirmState | null>(null);

  const show = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise(resolve => {
      const id = ++confirmId;
      setState({ id, ...opts, resolve });
    });
  }, []);

  // BUG-020 修复：在 effect 中注册全局，避免 render 阶段副作用
  useEffect(() => {
    globalSetState = show;
    return () => { globalSetState = null; };
  }, [show]);

  const handleConfirm = useCallback(() => {
    if (state) {
      state.resolve(true);
      setState(null);
    }
  }, [state]);

  const handleCancel = useCallback(() => {
    if (state) {
      state.resolve(false);
      setState(null);
    }
  }, [state]);

  return (
    <>
      {children}
      {state && (
        <div className="confirm-overlay" onClick={handleCancel}>
          <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
            <div className="confirm-dialog__icon">
              {state.danger ? '⚠️' : '📋'}
            </div>
            <h3 className="confirm-dialog__title">{state.title}</h3>
            <p className="confirm-dialog__message">{state.message}</p>
            <div className="confirm-dialog__actions">
              <button className="btn" onClick={handleCancel}>
                {state.cancelText || '取消'}
              </button>
              <button
                className={`btn ${state.danger ? 'btn--danger' : 'btn--primary'}`}
                onClick={handleConfirm}
              >
                {state.confirmText || '确认'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
