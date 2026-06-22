// ============================================================
// EdgeOne Edge Function (V8) — 用户认证 API
// 路由: POST /api/auth/register | POST /api/auth/login
// ============================================================

const PEPPER = 'jinxin-default-pepper';
const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_KEY_LEN = 256;
const SALT_LENGTH = 16;

function generateSalt() {
  const bytes = new Uint8Array(SALT_LENGTH);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

async function hashPassword(password, salt) {
  const peppered = password + PEPPER;
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw', encoder.encode(peppered), 'PBKDF2', false, ['deriveBits']
  );
  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: encoder.encode(salt), iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial, PBKDF2_KEY_LEN
  );
  return Array.from(new Uint8Array(derivedBits), b => b.toString(16).padStart(2, '0')).join('');
}

function userKey(username) {
  return `user:${username.toLowerCase()}`;
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// ─── 主路由 ────────────────────────────────

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (request.method !== 'POST') {
    return json({ success: false, error: '仅支持 POST 请求' }, 405);
  }

  try {
    if (path.endsWith('/register')) {
      return await handleRegister(request);
    }
    if (path.endsWith('/login')) {
      return await handleLogin(request);
    }
    return json({ success: false, error: '未知接口' }, 404);
  } catch (e) {
    return json({ success: false, error: (e && e.message) || '服务器内部错误' }, 500);
  }
}

// ─── 注册 ──────────────────────────────────

async function handleRegister(request) {
  const body = await request.json();
  const { username, password } = body || {};

  if (!username || !password) {
    return json({ success: false, error: '用户名和密码不能为空' }, 400);
  }

  const name = String(username).trim();
  if (name.length < 2 || name.length > 12) {
    return json({ success: false, error: '用户名长度需在 2~12 个字符之间' }, 400);
  }
  if (!/^[\u4e00-\u9fa5a-zA-Z0-9_]+$/.test(name)) {
    return json({ success: false, error: '用户名只能包含中文、英文、数字和下划线' }, 400);
  }

  const pwd = String(password);
  if (pwd.length < 4) {
    return json({ success: false, error: '密码至少需要 4 位' }, 400);
  }

  const existing = await jinxin_kv.get(userKey(name), 'json');
  if (existing) {
    return json({ success: false, error: '该用户名已被注册' }, 409);
  }

  const salt = generateSalt();
  const passwordHash = await hashPassword(pwd, salt);

  await jinxin_kv.put(userKey(name), JSON.stringify({
    username: name,
    passwordHash,
    salt,
    createdAt: new Date().toISOString(),
  }));

  return json({ success: true, message: '注册成功' }, 201);
}

// ─── 登录 ──────────────────────────────────

async function handleLogin(request) {
  const body = await request.json();
  const { username, password } = body || {};

  if (!username || !password) {
    return json({ success: false, error: '用户名和密码不能为空' }, 400);
  }

  const name = String(username).trim().toLowerCase();
  const pwd = String(password);

  let user = null;
  try {
    user = await jinxin_kv.get(userKey(name), 'json');
  } catch {
    return json({ success: false, error: '登录服务暂时不可用' }, 500);
  }

  if (!user) {
    return json({ success: false, error: '用户名或密码错误' }, 401);
  }

  const computedHash = await hashPassword(pwd, user.salt);
  if (computedHash !== user.passwordHash) {
    return json({ success: false, error: '用户名或密码错误' }, 401);
  }

  const tokenBytes = new Uint8Array(32);
  crypto.getRandomValues(tokenBytes);
  const sessionToken = Array.from(tokenBytes, b => b.toString(16).padStart(2, '0')).join('');

  await jinxin_kv.put(`session:${sessionToken}`, JSON.stringify({
    username: user.username,
    expiresAt: Date.now() + 3600_000,
  }));

  return json({
    success: true,
    username: user.username,
    token: sessionToken,
    expiresIn: 3600,
  });
}
