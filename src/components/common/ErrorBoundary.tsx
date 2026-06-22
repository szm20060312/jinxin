// ============================================================
// 错误边界 —— 《晋·信》
//
// 捕获渲染异常，展示古风 fallback UI
// ============================================================

import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[晋·信] 渲染异常：', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary__card">
            <div className="error-boundary__seal">错</div>
            <h1 className="error-boundary__title">票号账房出了岔子</h1>
            <p className="text-muted" style={{ marginBottom: 12, fontSize: '0.9rem' }}>
              系统遇到意外状况，请大掌柜稍后再试。
            </p>
            {this.state.error && (
              <div className="error-boundary__detail">
                {this.state.error.message}
              </div>
            )}
            <div style={{ marginTop: 20 }}>
              <button
                className="btn btn--primary"
                onClick={this.handleRetry}
              >
                🔄 重新来过
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
