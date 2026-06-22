// ============================================================
// 游戏存档安全体系 —— IOA（In-Game Observation & Analysis）
// ============================================================

import type { GameState } from '../types';

// ---- 存档签名密钥（简单混淆，防直接修改）----
const SAVE_SIGNATURE_KEY = 'jinxin_2024_secure_key_v1';

// ---- 存档安全接口 ----
export interface SecureSaveData {
  state: GameState;
  signature: string;      // 存档签名（防篡改）
  timestamp: number;      // 创建时间
  version: string;        // 存档版本
  checksum: string;       // 状态哈希
}

// ---- 异常行为日志 ----
export interface SecurityLog {
  type: 'tampering' | 'speed_hack' | 'suspicious_action' | 'auth_fail';
  timestamp: number;
  details: string;
  severity: 'low' | 'medium' | 'high';
}

// ---- 生成存档签名（防篡改）----
export function generateSaveSignature(state: GameState): string {
  const stateString = JSON.stringify(state);
  // 简单哈希：字符码累加 + 盐值
  let hash = 0;
  const salted = stateString + SAVE_SIGNATURE_KEY;
  for (let i = 0; i < salted.length; i++) {
    const char = salted.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转为32位
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
}

// ---- 验证存档完整性 ----
export function verifySaveIntegrity(saveData: SecureSaveData): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  // 1. 验证签名
  const expectedSignature = generateSaveSignature(saveData.state);
  if (saveData.signature !== expectedSignature) {
    issues.push('存档签名验证失败 - 存档可能已被篡改');
  }
  
  // 2. 验证时间戳合理性（防回溯）
  const now = Date.now();
  if (saveData.timestamp > now + 60000) { // 未来时间超过1分钟
    issues.push('存档时间戳异常 - 系统时间可能被修改');
  }
  
  // 3. 验证版本兼容性
  if (saveData.version !== '0.1.0') {
    issues.push(`存档版本不匹配: ${saveData.version}`);
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
}

// ---- 异常行为检测（单季数值变动监控）----
export interface StateDelta {
  silverChange: number;
  reputationChange: number;
  quarterCount: number;
}

// 异常阈值配置
const ANOMALY_THRESHOLDS = {
  silverPerQuarter: 50000,      // 单季银两变动超过5万视为异常
  reputationPerQuarter: 20,      // 单季信誉变动超过20视为异常
  maxQuartersPerDay: 50         // 单日操作超过50季视为刷取
};

export function detectAnomalousBehavior(
  prevState: GameState,
  currState: GameState,
  sessionStartTime: number
): SecurityLog | null {
  const silverDelta = Math.abs(
    currState.resources.silver.totalSilver - prevState.resources.silver.totalSilver
  );
  const reputationDelta = Math.abs(
    currState.resources.reputation - prevState.resources.reputation
  );
  
  // 检测超速刷取
  const sessionDuration = Date.now() - sessionStartTime;
  const quartersProcessed = currState.date.year * 4 + currState.date.season - 
    (prevState.date.year * 4 + prevState.date.season);
  
  // 单季银两暴增检测
  if (silverDelta > ANOMALY_THRESHOLDS.silverPerQuarter) {
    return {
      type: 'speed_hack',
      timestamp: Date.now(),
      details: `单季银两变动异常: +${silverDelta} 两`,
      severity: 'high'
    };
  }
  
  // 单季信誉暴增检测
  if (reputationDelta > ANOMALY_THRESHOLDS.reputationPerQuarter) {
    return {
      type: 'suspicious_action',
      timestamp: Date.now(),
      details: `单季信誉变动异常: ${reputationDelta > 0 ? '+' : ''}${reputationDelta}`,
      severity: 'medium'
    };
  }
  
  // 操作频率检测（Agent行为安全）
  if (sessionDuration > 0 && quartersProcessed > 0) {
    const quartersPerHour = (quartersProcessed / sessionDuration) * 3600000;
    if (quartersPerHour > ANOMALY_THRESHOLDS.maxQuartersPerDay) {
      return {
        type: 'speed_hack',
        timestamp: Date.now(),
        details: `操作频率异常: ${quartersPerHour.toFixed(1)} 季/小时`,
        severity: 'high'
      };
    }
  }
  
  return null;
}

// ---- 人机验证（简单版）----
export function generateHumanVerification(): {
  question: string;
  answer: string;
} {
  const questions: { question: string; answer: string }[] = [
    { question: '票号卖的是什么？', answer: '汇票' },
    { question: '晋商最重什么？', answer: '信义' },
    { question: '平遥是哪里？', answer: '山西' },
    { question: '大掌柜是谁？', answer: '你' },
    { question: '嘉庆几年开局？', answer: '十三' }
  ];
  return questions[Math.floor(Math.random() * questions.length)];
}

// ---- 会话安全追踪 ----
export class GameSecurityMonitor {
  private sessionStartTime: number = Date.now();
  private securityLogs: SecurityLog[] = [];
  private lastState: GameState | null = null;
  private actionCount: number = 0;
  private lastActionTime: number = Date.now();
  
  // 记录行为
  recordAction(_action: string, state: GameState): void {
    this.actionCount++;
    const now = Date.now();
    
    // 检测超快点击（Agent自动化）
    const timeSinceLastAction = now - this.lastActionTime;
    if (timeSinceLastAction < 100) { // 100ms内连续操作
      this.logSecurityEvent({
        type: 'suspicious_action',
        timestamp: now,
        details: `操作间隔过短: ${timeSinceLastAction}ms - 疑似自动化脚本`,
        severity: 'medium'
      });
    }
    
    // 检测数值异常变动
    if (this.lastState) {
      const anomaly = detectAnomalousBehavior(this.lastState, state, this.sessionStartTime);
      if (anomaly) {
        this.logSecurityEvent(anomaly);
      }
    }
    
    this.lastState = { ...state };
    this.lastActionTime = now;
  }
  
  // 记录安全事件
  logSecurityEvent(log: SecurityLog): void {
    this.securityLogs.push(log);
    console.warn(`[IOA Security] ${log.type}: ${log.details}`);
    
    // 高风险事件触发保护
    if (log.severity === 'high') {
      this.triggerProtection();
    }
  }
  
  // 触发保护机制
  private triggerProtection(): void {
    // 可扩展：锁定存档、要求重新验证等
    localStorage.setItem('jinxin_security_lock', Date.now().toString());
  }
  
  // 获取安全报告
  getSecurityReport(): {
    sessionDuration: number;
    actionCount: number;
    logs: SecurityLog[];
    riskLevel: 'low' | 'medium' | 'high';
  } {
    const highRiskCount = this.securityLogs.filter(l => l.severity === 'high').length;
    const riskLevel = highRiskCount > 0 ? 'high' : 
                     this.securityLogs.length > 3 ? 'medium' : 'low';
    
    return {
      sessionDuration: Date.now() - this.sessionStartTime,
      actionCount: this.actionCount,
      logs: this.securityLogs,
      riskLevel
    };
  }
  
  // 检查是否被锁定
  static isLocked(): boolean {
    const lockTime = localStorage.getItem('jinxin_security_lock');
    if (!lockTime) return false;
    
    // 锁定1小时后自动解除
    const lockDuration = Date.now() - parseInt(lockTime);
    if (lockDuration > 3600000) {
      localStorage.removeItem('jinxin_security_lock');
      return false;
    }
    return true;
  }
}

// ---- 导出安全存档包装函数 ----
export function createSecureSave(state: GameState): SecureSaveData {
  return {
    state,
    signature: generateSaveSignature(state),
    timestamp: Date.now(),
    version: '0.1.0',
    checksum: generateSaveSignature(state) // 简化：用签名作为校验和
  };
}

export function loadSecureSave(saveData: SecureSaveData): {
  success: boolean;
  state?: GameState;
  error?: string;
} {
  // 检查是否被安全锁定
  if (GameSecurityMonitor.isLocked()) {
    return { success: false, error: '账号因异常行为被临时锁定，请1小时后再试' };
  }
  
  // 验证存档完整性
  const verification = verifySaveIntegrity(saveData);
  if (!verification.valid) {
    return { 
      success: false, 
      error: `存档验证失败: ${verification.issues.join(', ')}` 
    };
  }
  
  return { success: true, state: saveData.state };
}
