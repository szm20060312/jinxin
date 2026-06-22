// ============================================================
// 工具函数 —— 格式化
// ============================================================

/**
 * 格式化银两显示（中文大写风格）
 * 例：500000 → "五十万两"、"1500两"
 */
export function formatSilver(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (abs >= 10_000) {
    const wan = abs / 10_000;
    const wanInt = Math.floor(wan);
    const qian = Math.round((wan - wanInt) * 10) / 10;
    if (qian > 0) {
      return `${sign}${wanInt}万${qian * 10000}两`;
    }
    return `${sign}${wanInt}万两`;
  }
  return `${sign}${abs}两`;
}

/**
 * 格式化银两为短显示
 * 例：500000 → "50万"
 */
export function formatSilverShort(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (abs >= 10_000) {
    const wan = Math.floor(abs / 10_000);
    const qian = Math.round((abs % 10_000) / 1000);
    if (qian > 0) {
      return `${sign}${wan}.${qian}万`;
    }
    return `${sign}${wan}万`;
  }
  return `${sign}${abs}`;
}

/**
 * 格式化百分比
 * 例：0.025 → "+2.5%"
 */
export function formatPercent(value: number, showSign = false): string {
  const pct = (value * 100).toFixed(1);
  if (showSign && value > 0) return `+${pct}%`;
  return `${pct}%`;
}

/**
 * 格式化整数
 */
export function formatNumber(n: number): string {
  return n.toLocaleString('zh-CN');
}

/**
 * 格式化带+/-的数值变化
 */
export function formatDelta(value: number): string {
  if (value > 0) return `+${value}`;
  return `${value}`;
}

/**
 * 格式化银两变化
 */
export function formatSilverDelta(amount: number): string {
  const sign = amount >= 0 ? '+' : '';
  return `${sign}${formatSilver(amount)}`;
}

/**
 * 获取变化的 CSS 类名
 */
export function deltaClass(value: number): string {
  if (value > 0) return 'delta-positive';
  if (value < 0) return 'delta-negative';
  return 'delta-neutral';
}
