# 《晋·信》集成与边界测试 Bug 报告

> 测试日期：2026-06-17  
> 测试范围：全项目 54 个源文件（TypeScript/React/Vite）  
> 测试维度：核心逻辑、边界值/空值、容错机制、性能/内存

---

## 一、致命 Bug（Crash / 数据丢失 / 不可恢复）

### BUG-001 🔴 致命：`applySimulation` 与 `QuarterlyPanel.handleConfirm` 双重写入导致银两异常

- **位置**：`src/engine/simulation.ts:217-286` + `src/components/quarterly/QuarterlyPanel.tsx:236-271`
- **触发场景**：每次季度模拟时
- **现象**：`applySimulation` 内部修改了 `nextState.resources.silver`（基于 `netIncome` 分配），随后在 `QuarterlyPanel.handleConfirm` 中又通过 `dispatch(UPDATE_SILVER, nextState.resources.silver)` 直接覆盖。而此前 `applyDecisions()` 已经通过 `dispatch(UPDATE_SILVER)` 对银两做了调拨，`applySimulation` 以"当前 state"计算分配——但它引用的 `state` 是闭包中的旧值，而非 `applyDecisions` 之后的实际值。
- **严重程度**：**致命** — 导致每季银两数值计算错乱，`totalSilver` 可能与实际分号之和不同步
- **修复建议**：`applySimulation` 应以 `applyDecisions` 后的实际状态为输入。当前 `setTimeout` 闭包中的 `state` 是 stale closure，应使用 `useRef` 或 `dispatch` 回调形式。

---

### BUG-002 🔴 致命：`refreshTotalSilver` 直接修改传入的 state 对象（违反不可变性）

- **位置**：`src/engine/gameState.ts:52-55`
- **代码**：
```typescript
export function refreshTotalSilver(state: GameState): GameState {
  state.resources.silver.totalSilver = computeTotalSilver(state.resources.silver);
  return state;
}
```
- **触发场景**：`APPLY_EFFECTS` reducer 中调用 `refreshTotalSilver(next)` 时
- **现象**：直接 mutate 了 state 对象，导致 React 可能跳过 re-render（引用未变），或导致 `useEffect` 依赖不触发
- **严重程度**：**致命** — 破坏 React 不可变数据流，可能引起 UI 不更新或状态不一致
- **修复建议**：应返回新对象：
```typescript
export function refreshTotalSilver(state: GameState): GameState {
  return {
    ...state,
    resources: {
      ...state.resources,
      silver: {
        ...state.resources.silver,
        totalSilver: computeTotalSilver(state.resources.silver),
      },
    },
  };
}
```

---

### BUG-003 🔴 致命：`QuarterlyPanel.handleConfirm` 中的 game over 检测基于 stale state

- **位置**：`src/components/quarterly/QuarterlyPanel.tsx:261-272`
- **代码**：
```typescript
const isReputationRuined = nextState.resources.reputation + result.reputationChange <= 0;
```
- **触发场景**：信誉在临界值附近时触发季度模拟
- **现象**：`nextState.resources.reputation` 已经包含了 `result.reputationChange`（因为 `applySimulation` 已将其加到 state 上），这里又加了一遍，导致重复计算。且此处的 game over 检测与 reducer 中的检测（`UPDATE_REPUTATION`/`UPDATE_SILVER`）形成双重检测但逻辑不同步。
- **严重程度**：**致命** — 游戏结束判定可能误判或漏判
- **修复建议**：`applySimulation` 返回的 `nextState` 已经包含了最终结果，应直接用 `nextState.resources.reputation` 判定。

---

### BUG-004 🔴 致命：`MorningPanel` 中 `briefs.length === 0 && !allAcknowledged` 逻辑死锁

- **位置**：`src/components/morning/MorningPanel.tsx:18-23, 37-39, 69-80`
- **触发场景**：`generateMorningBriefs` 返回空数组时
- **现象**：
  - `useEffect` (line 18): `if (state.phase === 'morning' && briefs.length === 0)` → 生成简报
  - `useEffect` (line 36): `if (briefs.length === 0 && state.phase === 'morning')` → `setAllAcknowledged(true)`
  - 渲染 (line 69): `briefs.length === 0 && !allAcknowledged` → 显示 empty state
  - **问题**：如果 `generateMorningBriefs` 返回非空数组，用户逐条 acknowledge 后 `briefs` 变为空 → `allAcknowledged` 变为 `true` → 显示按钮 ✅。但如果 `generateMorningBriefs` 返回空数组 → `briefs` 初始即为空 → 两个 useEffect 同时触发 → `allAcknowledged` 被设为 `true`（因为 briefs.length === 0）→ 显示"简报已悉，进入季度决策"按钮。但用户实际没有看到任何简报！
- **严重程度**：**致命** — 极端情况下跳过整个晨间简报阶段，用户无感知
- **修复建议**：增加 `briefsGenerated` 标志位区分"尚未生成"和"已生成但为空"两种状态。

---

## 二、严重 Bug（功能错误 / 逻辑漏洞）

### BUG-005 🟠 严重：`applyDecisions` 决策效果与 `applySimulation` 执行顺序存在竞态

- **位置**：`src/components/quarterly/QuarterlyPanel.tsx:176-295`
- **触发场景**：用户在季度决策中选择了影响 pricing 的选项
- **现象**：`applyDecisions` 中 dispatch 的 `UPDATE_PRICING` 是同步 dispatch，但 React 的 `useReducer` 状态更新是异步的（在下一次渲染才生效）。紧接着的 `setTimeout` 中的 `simulateSeason(state)` 使用的 `state` 仍然是旧的 pricing 值（闭包捕获），所以汇费调整、利率调整等定价决策对当季模拟无任何影响。
- **严重程度**：**严重** — 定价类决策对当前季度的模拟完全无效，玩家感知"我改了汇费但收入没变"
- **修复建议**：在 `applyDecisions` 中手动计算新 pricing 值，传入 `simulateSeason` 而非依赖 state 闭包。或使用 `useReducer` 的 dispatch 传入函数形式。

---

### BUG-006 🟠 严重：`simulateSeason` 中 `hankouRemittance` 被重复计算

- **位置**：`src/engine/simulation.ts:170-176`
- **代码**：
```typescript
const hankouVolume = calcBranchRemittanceVolume(state, 'hankou');
const hankouRemittance = calcRemittanceIncome(state, 'hankou');
// ...
const remittanceIncome = hankouRemittance + zhangjiakouRemittance;
```
- `calcRemittanceIncome` 内部又调用了一次 `calcBranchRemittanceVolume(state, 'hankou')`，导致每次计算汇兑收入时，业务量被随机波动两次（两次独立随机），汇兑业务量和汇兑收入基于不同的随机值。
- **严重程度**：**严重** — 业务量数值和收入数值基于不同随机种子，数据不一致
- **修复建议**：`calcRemittanceIncome` 应接受已计算好的 volume 作为参数，而非重新计算。

---

### BUG-007 🟠 严重：`applySimulation` 中 `depositExpense` 被错误地加到 headquarters

- **位置**：`src/engine/simulation.ts:236`
- **代码**：
```typescript
headquarters: state.resources.silver.headquarters + result.income.netIncome * 0.2 + result.income.depositExpense * 0.2,
```
- **触发场景**：每季模拟
- **现象**：`depositExpense` 是**负值**（支出），但 `netIncome` 中已经包含了 `depositExpense`。这里又额外加了一次 `depositExpense * 0.2`，导致总号库银被错误地二次扣减了 20% 的存款利息支出。
- **严重程度**：**严重** — 每季总号银两被多扣一笔，长期运行总号库银持续低于预期
- **修复建议**：移除 `+ result.income.depositExpense * 0.2` 这一项，因为 `netIncome` 已包含。

---

### BUG-008 🟠 严重：季度事件面板 `urgentEvent` 依赖不稳定——组件重渲染导致重复生成

- **位置**：`src/components/quarterly/QuarterlyPanel.tsx:145-155`
- **代码**：
```typescript
useEffect(() => {
  if (!eventResolved && urgentEvent === null) {
    if (shouldTriggerQuarterlyEvent(state)) {
      const evt = generateQuarterlyEvent(state);
      setUrgentEvent(evt);
      dispatch({ type: 'ADD_LOG', message: `突发事件：${evt.title}` });
    } else {
      setEventResolved(true);
    }
  }
}, [state.date.year, state.date.season]);
```
- **触发场景**：同一季度内，QuarterlyPanel 因其他原因重新挂载（如从分号面板切换回来）
- **现象**：依赖项只有 `year` 和 `season`。如果组件因父组件重渲染而重新挂载（例如 NavContext 变化），会再次检查 `urgentEvent === null`（此时为 true）→ 再次调用 `shouldTriggerQuarterlyEvent` → 可能生成不同的事件（因为 `chance(0.30)` 每次不同）。第一次生成了事件、第二次没生成，或者生成了不同的事件。
- **严重程度**：**严重** — 同一季度可能触发零次或多次事件，或事件内容不一致
- **修复建议**：使用 `useRef` 记录本季度是否已检测过，或增加 `state.phase` 作为依赖。

---

### BUG-009 🟠 严重：`EventPhase` 组件中事件处理完毕后可能陷入无限循环

- **位置**：`src/components/events/EventPhase.tsx:26-29`
- **代码**：
```typescript
if (!event) {
  handleResolve();
  return null;
}
```
- **触发场景**：`getFirstPendingStoryEvent` 返回 null（所有主线事件已触发或条件不满足），且 `state.annualLedger` 为 null
- **现象**：`handleResolve()` 执行 `dispatch(SET_PHASE, 'morning')` → 进入 morning 面板 → morning 面板可能又触发某些逻辑导致回到 event → 无限循环
- **严重程度**：**严重** — React 可能检测到无限 re-render 并报错
- **修复建议**：在 `handleResolve` 中增加 phase 检查，避免无事件时反复切换。

---

### BUG-010 🟠 严重：`pickRandom` 在空数组上调用会导致返回 undefined

- **位置**：`src/utils/random.ts:30-32`
- **代码**：
```typescript
export function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
```
- **触发场景**：多处调用 `pickRandom` 时传入可能为空的数组：
  - `src/engine/quarterlyEvents.ts:219`：`pickRandom(state.staff.filter(s => s.role === 'apprentice'))` — 如果没有学徒，filter 返回空数组
  - `src/engine/morning.ts:103`：`pickRandom(clerks)` — 如果没有伙友
  - `src/engine/morning.ts:78`：`pickRandom(msgs)` — msgs 总是有值，安全
- **现象**：`arr[Math.floor(Math.random() * 0)]` = `arr[0]` = `undefined`，在后续使用中可能触发 `Cannot read property 'name' of undefined` 导致白屏
- **严重程度**：**严重** — 特定条件下触发 TypeError，白屏 crash
- **修复建议**：
```typescript
export function pickRandom<T>(arr: readonly T[]): T {
  if (arr.length === 0) throw new Error('pickRandom: empty array');
  return arr[Math.floor(Math.random() * arr.length)];
}
```
并在调用处增加空数组检查。

---

### BUG-011 🟠 严重：`MorningPanel` 依赖项不完整——`useEffect` 只在 phase 变化时生成简报

- **位置**：`src/components/morning/MorningPanel.tsx:17-23`
- **代码**：
```typescript
useEffect(() => {
  if (state.phase === 'morning' && briefs.length === 0) {
    const generated = generateMorningBriefs(state);
    setBriefs(generated);
    dispatch({ type: 'SET_MORNING_BRIEFS', briefs: generated });
  }
}, [state.phase]); // 仅依赖 phase
```
- **触发场景**：同一 morning 阶段内，state 变化但 phase 不变
- **现象**：React StrictMode 在开发环境下会 double-invoke effects，但更重要的是，如果组件因 props 变化重渲染但 phase 不变，不会重新生成简报。问题不算致命但有 lint warning。
- **严重程度**：**严重** — ESLint `react-hooks/exhaustive-deps` 规则会报警，`state` 和 `briefs.length` 未在依赖中
- **修复建议**：增加完整依赖或使用 `useRef` 避免重复生成。

---

## 三、一般 Bug（非致命但影响体验）

### BUG-012 🟡 一般：`auto-save` 定时器在 `state` 变化时重建，可能导致频繁存档

- **位置**：`src/hooks/useGameState.ts:294-299`
- **代码**：
```typescript
useEffect(() => {
  const timer = setInterval(() => {
    saveGame(state);
  }, 3 * 60 * 1000);
  return () => clearInterval(timer);
}, [state]);
```
- **触发场景**：游戏运行中任意状态变化
- **现象**：`state` 作为依赖意味着每次 dispatch 后 state 引用变化，定时器都会被清除并重建。这导致：1) 定时器永远不会真正到达 3 分钟（因为状态变化频率远高于 3 分钟）；2) 每次状态变化都会有一次 `saveGame` 被"重置"计时。实际上每次 phase 变化已经触发了存档（line 286-291），定时存档几乎不会生效。
- **严重程度**：**一般** — 功能降级但不影响正确性（phase 变化存档仍然工作）
- **修复建议**：使用 `useRef` 保存最新 state，定时器不依赖 state：
```typescript
const stateRef = useRef(state);
stateRef.current = state;
useEffect(() => {
  const timer = setInterval(() => saveGame(stateRef.current), 3 * 60 * 1000);
  return () => clearInterval(timer);
}, []); // 空依赖
```

---

### BUG-013 🟡 一般：`LogPanel` 使用 index 作为 key

- **位置**：`src/components/logs/LogPanel.tsx:80-95`
- **代码**：`<div key={i}>` where `i` is array index
- **触发场景**：新日志被添加到数组头部
- **现象**：由于日志按时间倒序排列（新日志在顶部），且 `slice(0, 50)` 限制数量，当第 51 条日志加入、第 50 条被移除时，React 可能错误复用 DOM 节点，导致日志条目的左侧彩色边框与内容不匹配。
- **严重程度**：**一般** — 视觉上的短暂错位，不影响数据
- **修复建议**：为每条日志生成唯一 ID（如 `${timestamp}-${index}`）或使用日志内容作为 key（内容唯一性较高）。

---

### BUG-014 🟡 一般：`generateMorningBriefs` 中多个简报 ID 可能相同

- **位置**：`src/engine/morning.ts:193, 209`
- **代码**：
```typescript
id: `brief_${Date.now()}_silver`,  // silver 简报
id: `brief_${Date.now()}_${i}`,    // 其他简报
```
- **触发场景**：同一毫秒内调用（同步循环中 `Date.now()` 不变）
- **现象**：多个简报具有相同 ID。在 `MorningPanel` 中使用 `brief.id` 作为 `key`（line 58），React 会报警告 `Encountered two children with the same key`。
- **严重程度**：**一般** — React key 重复警告，可能导致列表渲染异常
- **修复建议**：使用递增计数器替代 `Date.now()`。

---

### BUG-015 🟡 一般：`TICK_DATE` 中的日期递进逻辑存在 off-by-one 风险

- **位置**：`src/hooks/useGameState.ts:52-65`
- **代码**：
```typescript
while (newState.date.day > 90) {
  newState.date.day -= 90;
  newState.date.season = (newState.date.season % 4 + 1) as GameState['date']['season'];
  if (newState.date.season === 1) {
    newState.date.year += 1;
  }
}
```
- **触发场景**：传入 `days: 90` 时
- **现象**：如果 `day` 从 1 开始，加 90 后为 91 → `91 > 90` → `day = 1`，season 进一。但如果连续跳过多个季度（如一次性加 180 天），逻辑正确。问题是：**如果初始 day 已经是 90 且加 0 天**，不会触发跨季。这不是 bug，但需要注意 `TICK_DATE` 的调用方是否正确。
- **严重程度**：**一般** — 正常流程中不会触发（总是加 90 天整）
- **修复建议**：保持现状，增加注释说明。

---

### BUG-016 🟡 一般：`applySimulation` 的 `TICK_DATE` 与 `QuarterlyPanel` 中重复 dispatch

- **位置**：`src/engine/simulation.ts:266-274` + `src/components/quarterly/QuarterlyPanel.tsx:255`
- **代码**：
  - `applySimulation` 内部 `next.date.day += 90`（直接修改 next）
  - `QuarterlyPanel` 中 `dispatch({ type: 'TICK_DATE', days: 90 })`
- **触发场景**：每季模拟
- **现象**：`applySimulation` 已经在返回的 `nextState` 中推进了日期，`QuarterlyPanel` 又通过 `TICK_DATE` 再推进一次，导致日期被推进了 **180 天**（两个季度）而非 90 天。
- **严重程度**：**一般** — 游戏时间流速翻倍，季节/年份推进异常
- **修复建议**：移除 `QuarterlyPanel` 中的 `TICK_DATE` dispatch，或移除 `applySimulation` 中的日期推进，二选一。

---

### BUG-017 🟡 一般：`AnnualPanel` 步骤间缺少防重复提交

- **位置**：`src/components/annual/AnnualPanel.tsx:396-431`
- **触发场景**：用户快速双击"进入分红"按钮
- **现象**：`handleDividend`、`handleStaff`、`handleFinish` 没有防抖或 disabled 状态，快速点击可能触发多次 dispatch，导致分红效果被多次应用。
- **严重程度**：**一般** — 玩家恶意操作或误触可能导致数值异常
- **修复建议**：增加 `isProcessing` 状态或按钮 `disabled` 属性。

---

### BUG-018 🟡 一般：`generateBranchReports` 估算逻辑不准确——使用当前季业务量 × 4 估算全年

- **位置**：`src/engine/annual.ts:58`
- **代码**：`const estimatedYearlyVolume = branch.businessVolume * 4;`
- **触发场景**：年终合账
- **现象**：`businessVolume` 只是最后一季的业务量（每次模拟覆盖），用此 × 4 估算全年会导致：1) 最后一季恰好是淡季 → 全年低估；2) 最后一季恰好是旺季 → 全年高估。年度报表与实际经营结果存在系统性偏差。
- **严重程度**：**一般** — 影响年度报表的准确性，但不影响实际游戏经济
- **修复建议**：在 state 中增加 `yearlyBusinessVolume` 累计字段。

---

## 四、轻微 Bug（代码质量 / 潜在风险）

### BUG-019 🟢 轻微：`hashPassword` 的哈希算法过于简单——`hash & hash` 无实际作用

- **位置**：`src/utils/accountManager.ts:22-33`
- **代码**：`hash = hash & hash; // 转为 32 位整数`
- **触发场景**：注册/登录
- **现象**：`hash & hash` 恒等于 `hash`（任何数与自身按位与等于自身）。正确写法应为 `hash & 0xFFFFFFFF` 或使用 `| 0`。
- **严重程度**：**轻微** — 密码哈希正确性不受影响（JS 位运算自动转 32 位），仅注释误导
- **修复建议**：改为 `hash = hash | 0;` 或直接删除此行（JS 位运算 `<<` 结果已经是 32 位）。

---

### BUG-020 🟢 轻微：`ConfirmProvider` 中 `globalSetState` 在 StrictMode 下可能被覆盖

- **位置**：`src/components/common/Confirm.tsx:25, 50`
- **代码**：`globalSetState = show;` 在 render 阶段赋值
- **触发场景**：React StrictMode 开发模式
- **现象**：StrictMode 会 double-invoke render，第二次 render 会覆盖 `globalSetState`。由于两次引用的是同一个 `show` 函数（`useCallback` 依赖 `[]`），功能上没问题，但模块级变量在 render 中赋值不是最佳实践。
- **严重程度**：**轻微** — 不影响生产环境
- **修复建议**：将赋值移至 `useEffect` 或使用 `useRef` + `useImperativeHandle` 模式。

---

### BUG-021 🟢 轻微：`GameProvider` 中 `useReducer` 的 init 函数参数为 null 但未使用

- **位置**：`src/hooks/useGameState.ts:279-282`
- **代码**：`useReducer(gameReducer, null, () => { ... })`
- **触发场景**：初始化
- **现象**：`useReducer` 的第二个参数 `null` 实际上未被 init 函数使用（init 函数忽略参数直接返回 loadGame 或 createInitialState）。功能正确但类型不精确。
- **严重程度**：**轻微** — 无实际影响
- **修复建议**：改为 `useReducer(gameReducer, undefined as never, () => { ... })` 或使用更明确的模式。

---

### BUG-022 🟢 轻微：CSS 中引用不存在的图片路径

- **位置**：`src/styles/global.css:848, 869-896`
- **代码**：
  - `.progress-bar__fill::after` 引用 `/img/progress-bar-hy.png`
  - `.theme-dark` 引用 `/img/dark-bg-hy.png`
  - `.overlay-bg-texture` 引用 `/img/overlay-bg-hy.png`
  - `.festive-bg` 引用 `/img/festival-bg-hy.png`
- **触发场景**：页面渲染
- **现象**：这些图片路径可能不存在于 `public/img/` 中（需要确认）。如果不存在，浏览器会显示 404 但不会影响页面功能。
- **严重程度**：**轻微** — 仅控制台 404 警告，视觉上可能有空白
- **修复建议**：确认 `public/img/` 中是否存在这些文件，不存在则移除引用或添加占位图。

---

### BUG-023 🟢 轻微：`DecisionCard` 的 `key` 在动态决策中可能重复

- **位置**：`src/engine/decisions.ts:356, 458, 523, 625, 684`
- **代码**：动态决策 ID 使用固定前缀如 `'opportunity'`、`'threat'`、`'season_event'`、`'competitor_move'`、`'rumor_response'`
- **触发场景**：同一季随机到多个动态决策且 ID 前缀相同时（理论上可能，因为动态池有 6 个生成器）
- **现象**：React key 重复警告
- **严重程度**：**轻微** — 概率极低（每季只选 1-2 个动态决策，且每个生成器类型不同）
- **修复建议**：为动态决策 ID 增加随机后缀或时间戳。

---

### BUG-024 🟢 轻微：`getReserveHealth` 被多处调用但 `silver.totalSilver` 可能为 0

- **位置**：`src/engine/resources.ts:26-31`
- **代码**：
```typescript
export function getReserveHealth(silver: SilverState): ReserveHealth {
  const ratio = calcReserveRatio(silver);
  if (ratio >= SAFE_RESERVE_RATIO) return 'safe';
  // ...
}
```
- `calcReserveRatio` 中 `if (total === 0) return 0`，所以 `ratio = 0`，触发 `danger`。正确。
- **严重程度**：**轻微** — 逻辑正确，但 `totalSilver === 0` 时 game over 检测会先触发，此函数不会再被调用。

---

### BUG-025 🟢 轻微：`LogPanel` 筛选器 "银钱" 分类的 `filter` 关键词中 "银" 会匹配几乎所有日志

- **位置**：`src/components/logs/LogPanel.tsx:17`
- **代码**：`finance: ['两', '银两', '汇兑', '分红', '利润', '银']`
- **触发场景**：点击"银钱"筛选项
- **现象**：几乎所有日志都包含"两"字（因为银两数值格式），导致筛选几乎无效果。
- **严重程度**：**轻微** — 用户体验不佳，筛选不精确
- **修复建议**：使用更精确的关键词如 `'汇兑'`、`'分红'`、`'银两'`，移除泛关键词 `'两'` 和 `'银'`。

---

## 五、总结统计

| 严重程度 | 数量 | 关键影响 |
|----------|------|----------|
| 🔴 致命 | 4 | 银两计算错乱、不可变数据破坏、game over 误判、晨间简报死锁 |
| 🟠 严重 | 7 | 定价决策无效、业务量双重随机、库银重复扣减、事件重复/丢失、undefined crash |
| 🟡 一般 | 7 | 日期翻倍推进、自动存档失效、key 重复警告、年度报表不准、重复提交 |
| 🟢 轻微 | 7 | 代码质量问题、CSS 资源404、日志筛选不精确 |
| **总计** | **25** | |

### 优先修复建议

1. **立即修复**（致命）：
   - BUG-001: stale closure 导致银两计算错乱
   - BUG-002: `refreshTotalSilver` 破坏不可变性
   - BUG-003: game over 重复判定
   - BUG-004: 晨间简报死锁

2. **尽快修复**（严重）：
   - BUG-005: 定价决策当季无效（玩家感知最强）
   - BUG-007: 存款利息重复扣减
   - BUG-010: `pickRandom` 空数组 crash
   - BUG-016: 日期翻倍推进

3. **计划修复**（一般 + 轻微）：可在后续迭代中统一处理
