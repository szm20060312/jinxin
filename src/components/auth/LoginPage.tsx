// ============================================================
// 登录/注册页面 —— 《晋·信》
// ============================================================

import { useState, useCallback, FormEvent } from 'react';
import { useAuth } from '../../hooks/useAuth';

type Mode = 'login' | 'register';

export function LoginPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const resetForm = useCallback(() => {
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setError('');
  }, []);

  const switchMode = useCallback((m: Mode) => {
    setMode(m);
    resetForm();
  }, [resetForm]);

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('请填写完整信息');
      return;
    }

    if (mode === 'register' && password !== confirmPassword) {
      setError('两次密码不一致');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        const result = await login(username, password);
        if (!result.success) setError(result.error);
      } else {
        const result = await register(username, password);
        if (!result.success) setError(result.error);
      }
    } catch {
      setError('操作失败，请重试');
    } finally {
      setLoading(false);
    }
  }, [mode, username, password, confirmPassword, login, register]);

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <img
            src="/img/seal-stamp-hy.png"
            alt="晋信印章"
            className="seal-stamp-img seal-stamp-img--lg"
            style={{ margin: '0 auto 12px' }}
            loading="eager"
          />
          <h1>晋·信</h1>
          <p className="text-muted">晋商票号模拟经营</p>
        </div>

        {/* 模式切换 */}
        <div className="login-tabs">
          <button
            className={`login-tab ${mode === 'login' ? 'login-tab--active' : ''}`}
            onClick={() => switchMode('login')}
          >
            登录
          </button>
          <button
            className={`login-tab ${mode === 'register' ? 'login-tab--active' : ''}`}
            onClick={() => switchMode('register')}
          >
            注册
          </button>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label">大掌柜名号</label>
            <input
              className="form-input"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder={mode === 'register' ? '取一个响亮的名号' : '请输入您的名号'}
              maxLength={12}
              autoFocus
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">密令</label>
            <input
              className="form-input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="请输入密令"
              maxLength={20}
              disabled={loading}
            />
          </div>

          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label">确认密令</label>
              <input
                className="form-input"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="请再次输入密令"
                maxLength={20}
                disabled={loading}
              />
            </div>
          )}

          {error && <div className="form-error">{error}</div>}

          <button
            className="btn btn--primary btn--block btn--lg"
            type="submit"
            disabled={loading}
          >
            {loading ? '请稍候……' : mode === 'register' ? '开设新号' : '进入票号'}
          </button>
        </form>
      </div>
    </div>
  );
}
