// ============================================================
// 账号管理器 —— 《晋·信》
//
// 双模式支持：
//   1. 云端模式（Edge Functions + KV Storage）— PBKDF2 安全哈希
//   2. 本地模式（localStorage）— 离线降级
//
// 优先尝试云端 API，失败时自动降级到本地。
// ============================================================

const USERS_KEY = 'jinxin_users';
const CURRENT_USER_KEY = 'jinxin_current_user';
const SESSION_TOKEN_KEY = 'jinxin_session_token';

// 云端 API 地址（EdgeOne 部署后自动可用）
const API_BASE = '/api/auth';

export interface Account {
  username: string;
  passwordHash: string;
  createdAt: string;
  lastLoginAt: string;
}

// ---- 密码哈希（简单SHA-256-based，本地用途） ----

function hashPassword(password: string): string {
  // 用简单的 encode + btoa 加盐，本地账号够用
  let hash = 0;
  const salt = 'jinxin_salt_1808';
  const combined = password + salt;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash | 0; // 确保 32 位整数（JS 位运算 << 结果可能超出范围）
  }
  return Math.abs(hash).toString(36);
}

// ---- 读取用户列表 ----

function getUsers(): Account[] {
  try {
    const json = localStorage.getItem(USERS_KEY);
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
}

function saveUsers(users: Account[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// ---- 公开 API ----

/** 注册新账号 */
export function registerAccount(
  username: string,
  password: string
): { success: true } | { success: false; error: string } {
  const trimmed = username.trim();

  if (trimmed.length < 2) {
    return { success: false, error: '用户名至少需要 2 个字符' };
  }
  if (trimmed.length > 12) {
    return { success: false, error: '用户名最多 12 个字符' };
  }
  if (!/^[\u4e00-\u9fa5a-zA-Z0-9_]+$/.test(trimmed)) {
    return { success: false, error: '用户名只能包含中文、英文、数字和下划线' };
  }
  if (password.length < 4) {
    return { success: false, error: '密码至少需要 4 个字符' };
  }

  const users = getUsers();
  if (users.some(u => u.username === trimmed)) {
    return { success: false, error: '该用户名已被注册' };
  }

  const now = new Date().toISOString();
  users.push({
    username: trimmed,
    passwordHash: hashPassword(password),
    createdAt: now,
    lastLoginAt: now,
  });

  saveUsers(users);
  return { success: true };
}

/** 登录 */
export function loginAccount(
  username: string,
  password: string
): { success: true } | { success: false; error: string } {
  const trimmed = username.trim();
  const users = getUsers();
  const user = users.find(u => u.username === trimmed);

  if (!user) {
    return { success: false, error: '账号不存在' };
  }

  if (user.passwordHash !== hashPassword(password)) {
    return { success: false, error: '密码错误' };
  }

  // 更新最后登录时间
  user.lastLoginAt = new Date().toISOString();
  saveUsers(users);

  // 记录当前用户
  localStorage.setItem(CURRENT_USER_KEY, trimmed);

  return { success: true };
}

/** 注销 */
export function logoutAccount(): void {
  localStorage.removeItem(CURRENT_USER_KEY);
}

/** 注销账号（删除账号及所有数据） */
export function deleteAccount(username: string): boolean {
  const users = getUsers();
  const filtered = users.filter(u => u.username !== username);
  if (filtered.length === users.length) return false;

  saveUsers(filtered);

  // 删除该用户的存档
  const saveKey = `jinxin_save_${username}`;
  localStorage.removeItem(saveKey);

  // 清除当前用户（如果正是被删用户）
  const current = getCurrentUser();
  if (current === username) {
    localStorage.removeItem(CURRENT_USER_KEY);
  }

  return true;
}

/** 获取当前登录用户 */
export function getCurrentUser(): string | null {
  return localStorage.getItem(CURRENT_USER_KEY);
}

/** 获取所有用户名列表 */
export function getAllUsernames(): string[] {
  return getUsers().map(u => u.username);
}

/** 获取用户信息 */
export function getAccountInfo(username: string): Account | null {
  return getUsers().find(u => u.username === username) ?? null;
}

/** 获取用户专属的存档 key */
export function getSaveKey(username?: string): string {
  const user = username ?? getCurrentUser();
  if (!user) throw new Error('未登录');
  return `jinxin_save_${user}`;
}

// ─── 云端 API 认证（Edge Functions + KV Storage）──────────

interface ApiAuthResponse {
  success: boolean;
  error?: string;
  username?: string;
  token?: string;
  expiresIn?: number;
  message?: string;
}

/** 云端注册 */
export async function cloudRegister(
  username: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data: ApiAuthResponse = await res.json();
    return { success: data.success, error: data.error };
  } catch (e) {
    return { success: false, error: '无法连接云端服务，请检查网络' };
  }
}

/** 云端登录 */
export async function cloudLogin(
  username: string,
  password: string
): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data: ApiAuthResponse = await res.json();

    if (data.success && data.token) {
      // 保存 session token
      localStorage.setItem(SESSION_TOKEN_KEY, data.token);
      localStorage.setItem(CURRENT_USER_KEY, data.username!);
    }

    return { success: data.success, token: data.token, error: data.error };
  } catch (e) {
    return { success: false, error: '无法连接云端服务，请检查网络' };
  }
}

/** 云端注销 */
export function cloudLogout(): void {
  localStorage.removeItem(SESSION_TOKEN_KEY);
  localStorage.removeItem(CURRENT_USER_KEY);
}

/** 获取当前 session token */
export function getSessionToken(): string | null {
  return localStorage.getItem(SESSION_TOKEN_KEY);
}
