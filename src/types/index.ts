// ============================================================
// 核心游戏类型定义 —— 《晋·信》
// ============================================================

// ---- 时间 ----
export interface GameDate {
  year: number;   // 例：1808
  season: 1 | 2 | 3 | 4; // 1=春 2=夏 3=秋 4=冬（腊月）
  day: number;    // 1~90（每季约90天）
}

// ---- 三大资源 ----
export interface Resources {
  silver: SilverState;
  reputation: number;   // 0~100，映射到五级
  connections: Connections;
}

export interface SilverState {
  totalSilver: number;      // 总量（计算值）
  headquarters: number;     // 平遥总号库银
  hankou: number;           // 汉口分号库银
  zhangjiakou: number;      // 张家口分号库银
  inTransit: number;        // 在途银
  externalDeposits: number; // 外部储户存款（独立于票号自有资金）
}

export interface Connections {
  government: number;  // 官府好感 0~100
  merchantGuild: number; // 商帮好感 0~100
  owner: number;        // 东家信任 0~100
}

// ---- 信誉等级 ----
export type ReputationTier =
  | 'golden'      // ★★★★★ 金字招牌
  | 'excellent'   // ★★★★ 信誉卓著
  | 'average'     // ★★★ 中规中矩
  | 'shaky'       // ★★ 风雨飘摇
  | 'ruined';     // ★ 信用破产

// ---- 分号 ----
export type BranchId = 'hankou' | 'zhangjiakou';

export interface Branch {
  id: BranchId;
  name: string;
  tier: 1 | 2;          // 一等/二等分号
  silver: number;       // 库银
  managerAbility: number;   // 掌柜能力 0~100
  managerLoyalty: number;   // 掌柜忠诚 0~100
  businessVolume: number;   // 本季业务量（内部计算）
  status: BranchStatus;
}

export type BranchStatus = 'normal' | 'crisis' | 'recovering';

// ---- 伙友（2 层） ----
export type StaffRole = 'apprentice' | 'clerk';

export interface Staff {
  id: number;
  name: string;
  role: StaffRole;
  monthsTrained: number;   // 受训月数
  talent: number;          // 资质 1~100
  loyalty: number;         // 忠诚 1~100（隐藏值）
  ability: number;         // 能力 1~100
  talentBonus?: string;    // 天赋描述，如"铁算盘"
  stationedAt: 'headquarters' | BranchId | null;
}

// ---- 业务 ----
export interface Pricing {
  hankouFee: number;         // 汉口汇费率 (%)
  zhangjiakouFee: number;    // 张家口汇费率 (%)
  depositRate: number;       // 存款利率 (%)
  loanLimit: number;         // 本季放款上限（白银两数）
}

export type CipherScheme = 'basic' | 'standard' | 'advanced';

export interface CipherState {
  current: CipherScheme;
  monthsUsed: number;  // 已使用月数
}

// ---- 事件 ----
export type EventType = 'story' | 'crisis' | 'random';

export interface GameEvent {
  id: string;
  type: EventType;
  title: string;
  description: string;
  options: EventOption[];
  condition?: EventCondition;
}

export interface EventOption {
  id: string;
  text: string;
  effects: EventEffects;
  outcomeDescription: string;
  _addApprentice?: boolean; // 内部标记：选此选项则自动生成随机学徒
  _hireStaff?: Staff;      // 内部标记：选此选项则招聘指定伙友/学徒
  _crisisAction?: 'banquet' | 'ownerBailout' | 'loanShark' | 'guarantee';
}

export interface EventEffects {
  silver?: Partial<Record<BranchId | 'headquarters' | 'inTransit', number>>;
  reputation?: number;
  connections?: Partial<Connections>;
  staffLoyalty?: number; // 按 staff id
  cipherChange?: CipherScheme;
}

export interface EventCondition {
  minReputation?: number;
  maxReputation?: number;
  minConnections?: Partial<Connections>;
  minReserveRatio?: number;
  yearsElapsed?: [number, number]; // [min, max]
}

// ---- 晨间简报 ----
export interface MorningBrief {
  id: string;
  category: 'silver' | 'draft' | 'intel' | 'staff' | 'crisis';
  title: string;
  description: string;
  options: BriefOption[];
  reliability?: 'high' | 'medium' | 'low';
}

export interface BriefOption {
  id: string;
  text: string;
  effects: EventEffects;
}

// ---- 季度决策 ----
export interface QuarterlyDecision {
  id: string;
  category: 'fund' | 'pricing' | 'staff' | 'inspection';
  title: string;
  description: string;
  options: DecisionOption[];
  currentValue?: number | string;
  multiSelect?: boolean; // 是否支持多选（如银两运营）
}

export interface DecisionOption {
  id: string;
  label: string;
  effects: EventEffects;
  predictedImpact: string; // 预估影响描述
  disabled?: boolean; // 条件不满足时置灰（如库银不足）
  disabledReason?: string; // 禁用原因提示
  _staffDispatch?: { staffId: number; targetStation: Staff['stationedAt'] }; // 内部：伙友调度标记
  _fundTransfer?: { target: 'headquarters' | 'hankou' | 'zhangjiakou'; amount: number }; // 内部：定向调拨
}

// ---- 年终合账 ----
export interface AnnualLedger {
  year: number;
  branchReports: BranchAnnualReport[];
  totalProfit: number;
  totalLoss: number;
  discrepancies: LedgerDiscrepancy[];
}

export interface BranchAnnualReport {
  branchId: BranchId;
  revenue: number;
  expenses: number;
  profit: number;
  businessCount: number;
  issueCount: number; // 问题数量
}

export interface LedgerDiscrepancy {
  branchId: BranchId;
  amount: number;
  explanation: string;     // 掌柜解释
  actualReason?: string;   // 真实原因（查账后揭示）
}

// ---- 游戏状态根对象 ----
export interface GameState {
  date: GameDate;
  resources: Resources;
  branches: Record<BranchId, Branch>;
  staff: Staff[];
  pricing: Pricing;
  cipher: CipherState;
  eventQueue: GameEvent[];
  triggeredEventIds: string[];  // 已触发事件的 ID 去重集合（一次性事件防重复）
  lastBanquetSeason: number;    // 上次商会宴请的 season index（year*4+season），冷却用
  ownerBailoutUsed: boolean;    // 是否已使用东家注资（仅 1 次）
  unlockedAchievements: string[]; // 已解锁的里程碑成就 ID
  annualDirective: 'expand' | 'consolidate' | 'reputation' | null; // 年度规划方向
  morningBriefs: MorningBrief[];
  pendingDecisions: QuarterlyDecision[];
  annualLedger: AnnualLedger | null;
  logs: string[];           // 游戏日志（最近 N 条）
  phase: GamePhase;
  endingType: GameOverType | null;  // 结局类型（game_over 时赋值）
  difficulty: Difficulty;          // 游戏难度
}

/** 结局类型 */
export type GameOverType =
  | 'bankrupt'        // 惨淡收场：库银耗尽
  | 'disgraced'       // 晚节不保：信誉归零
  | 'golden_age'      // 金玉满堂：银两富可敌国
  | 'steady_hand'     // 守成之主：平安经营五年
  | 'graceful_exit'   // 急流勇退：巅峰期主动退隐
  | 'early_exit';     // 功成身退：手动结束游戏

/** 游戏难度 */
export type Difficulty = 'normal' | 'hard';

export type GamePhase =
  | 'morning'       // 晨间简报
  | 'quarterly'     // 季度决策
  | 'simulating'    // 自动模拟中
  | 'annual'        // 年终合账
  | 'event'         // 事件剧情中
  | 'game_over';    // 终局

// ---- 存储相关 ----
export interface SaveData {
  state: GameState;
  savedAt: string;
  version: string;
}
