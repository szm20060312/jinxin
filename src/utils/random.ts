// ============================================================
// 工具函数 —— 随机数
// ============================================================

/**
 * 在 [min, max] 区间内生成随机整数
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 在 [min, max] 区间内生成随机浮点数
 */
export function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * 按概率返回 true
 * @param probability 0~1 之间的概率值
 */
export function chance(probability: number): boolean {
  return Math.random() < probability;
}

/**
 * 从数组中随机抽取一个元素
 * @throws 数组为空时抛出异常（调用方需自行保证非空）
 */
export function pickRandom<T>(arr: readonly T[]): T {
  if (arr.length === 0) {
    throw new Error('pickRandom: cannot pick from empty array');
  }
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * 从数组中随机抽取 N 个不重复元素
 */
export function pickNRandom<T>(arr: readonly T[], n: number): T[] {
  const shuffled = [...arr];
  // Fisher-Yates 洗牌
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, Math.min(n, shuffled.length));
}

/**
 * 加权随机选择
 * @param items 元素数组
 * @param weights 对应的权重数组
 */
export function weightedRandom<T>(items: readonly T[], weights: number[]): T {
  if (items.length === 0) throw new Error('weightedRandom: items array is empty');
  if (items.length !== weights.length) throw new Error('weightedRandom: items and weights length mismatch');

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < items.length; i++) {
    random -= weights[i];
    if (random <= 0) return items[i];
  }

  return items[items.length - 1];
}

/**
 * 生成指定范围内的随机偏移（用于模拟波动）
 * @param base 基准值
 * @param variance 波动比例（0.1 = ±10%）
 */
export function randomVariance(base: number, variance: number): number {
  return base * (1 + randomFloat(-variance, variance));
}

/**
 * 掷 N 面骰子
 */
export function rollDice(sides: number): number {
  return randomInt(1, sides);
}

/**
 * clamp 值限制在范围内
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
