// ============================================================
// 《晋·信》作品介绍 PPT 生成脚本
// ============================================================

const pptxgen = require("pptxgenjs");

// ─── 色彩体系 ──────────────────────────────
const C = {
  ink:      "1A1410",  // 墨黑（深色背景）
  inkLight: "2C2420",  // 墨灰（次深背景）
  inkText:  "2C2420",  // 墨色正文
  vermilion:"962B2B",  // 朱砂红（主强调色）
  gold:     "C4A45A",  // 金色（次强调）
  parchment:"F5F0E8",  // 宣纸色（浅色背景）
  paper:    "FFFFFF",  // 白色卡片
  muted:    "8B8178",  // 淡墨（次要文字）
  border:   "D9D0C1",  // 边框色
  profit:   "2D6A4F",  // 绿色（正面指标）
  danger:   "962B2B",  // 红色（负面指标）
};

// ─── 字体 ──────────────────────────────────
const FONT = {
  title:  "Georgia",
  body:   "Calibri",
  number: "Arial Black",
};

// ─── 影子工厂（每次新对象，避免 PptxGenJS 复用污染）────────────────
const makeCardShadow = () => ({
  type: "outer", color: "000000", blur: 4, offset: 1, angle: 135, opacity: 0.08,
});
const makeShapeShadow = () => ({
  type: "outer", color: "000000", blur: 6, offset: 2, angle: 135, opacity: 0.12,
});

// ─── 辅助函数 ──────────────────────────────

/** 添加左对齐标题（带金色左边条） */
function addSectionTitle(slide, title) {
  slide.addShape(slide._slideLayout ? "rect" : "rect", {
    x: 0.7, y: 0.35, w: 0.06, h: 0.45,
    fill: { color: C.gold },
  });
  slide.addText(title, {
    x: 0.95, y: 0.3, w: 8, h: 0.55,
    fontSize: 26, fontFace: FONT.title, color: C.inkText, bold: true,
    margin: 0,
  });
}

/** 创建卡片（白色矩形 + 阴影 + 图标圆 + 标题 + 描述） */
function addCard(slide, x, y, w, h, iconChar, title, desc, cardColor) {
  const cc = cardColor || C.vermilion;
  // 卡片底板
  slide.addShape("rect", {
    x, y, w, h,
    fill: { color: C.paper },
    shadow: makeCardShadow(),
  });
  // 顶部色条
  slide.addShape("rect", {
    x, y, w, h: 0.06,
    fill: { color: cc },
  });
  // 图标圆
  slide.addShape("oval", {
    x: x + 0.18, y: y + 0.22, w: 0.44, h: 0.44,
    fill: { color: cc, transparency: 12 },
  });
  slide.addText(iconChar, {
    x: x + 0.18, y: y + 0.22, w: 0.44, h: 0.44,
    fontSize: 16, fontFace: FONT.body, color: cc,
    align: "center", valign: "middle", margin: 0,
  });
  // 标题
  slide.addText(title, {
    x: x + 0.74, y: y + 0.22, w: w - 0.92, h: 0.36,
    fontSize: 13, fontFace: FONT.body, color: C.inkText, bold: true,
    margin: 0, valign: "middle",
  });
  // 描述
  slide.addText(desc, {
    x: x + 0.18, y: y + 0.72, w: w - 0.36, h: h - 0.88,
    fontSize: 10, fontFace: FONT.body, color: C.muted,
    margin: 0, valign: "top", lineSpacingMultiple: 1.3,
  });
}

/** 创建统计数字卡片 */
function addStatCard(slide, x, y, w, number, label, accentColor) {
  slide.addShape("rect", {
    x, y, w, h: 1.25,
    fill: { color: C.paper },
    shadow: makeCardShadow(),
  });
  slide.addText(number, {
    x, y: y + 0.12, w, h: 0.55,
    fontSize: 32, fontFace: FONT.number, color: accentColor || C.vermilion,
    align: "center", valign: "middle", margin: 0,
  });
  slide.addText(label, {
    x, y: y + 0.72, w, h: 0.35,
    fontSize: 10, fontFace: FONT.body, color: C.muted,
    align: "center", valign: "top", margin: 0,
  });
}

// ─── 创建演示文稿 ───────────────────────────
const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.author = "《晋·信》开发团队";
pres.title = "《晋·信》作品介绍";

// ════════════════════════════════════════════
// Slide 1: 封面
// ════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.ink };

  // 顶部装饰线
  s.addShape("rect", {
    x: 3.2, y: 1.1, w: 3.6, h: 0.015,
    fill: { color: C.gold },
  });

  // 副标题
  s.addText("晋商票号模拟经营 · 文字策略 Web 游戏", {
    x: 1, y: 1.3, w: 8, h: 0.45,
    fontSize: 14, fontFace: FONT.body, color: C.gold,
    align: "center", charSpacing: 3, margin: 0,
  });

  // 主标题
  s.addText("《晋·信》", {
    x: 1, y: 1.85, w: 8, h: 1.1,
    fontSize: 52, fontFace: FONT.title, color: C.parchment,
    align: "center", bold: true, margin: 0,
  });

  // 标语
  s.addText("信以为本 · 汇通天下", {
    x: 1, y: 3.1, w: 8, h: 0.5,
    fontSize: 18, fontFace: FONT.body, color: C.muted,
    align: "center", italic: true, margin: 0,
  });

  // 底部分隔
  s.addShape("rect", {
    x: 3.2, y: 3.8, w: 3.6, h: 0.015,
    fill: { color: C.gold },
  });

  // 年份
  s.addText("嘉庆十二年 · 始于 1808", {
    x: 1, y: 4.05, w: 8, h: 0.4,
    fontSize: 11, fontFace: FONT.body, color: C.muted,
    align: "center", charSpacing: 2, margin: 0,
  });

  // 底部金色方形装饰
  s.addShape("rect", {
    x: 4.6, y: 4.75, w: 0.8, h: 0.04,
    fill: { color: C.vermilion },
  });
}

// ════════════════════════════════════════════
// Slide 2: 背景故事
// ════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.parchment };

  addSectionTitle(s, "背景故事");

  // 左侧时间线装饰
  s.addShape("rect", {
    x: 0.7, y: 1.05, w: 0.04, h: 4.0,
    fill: { color: C.border },
  });

  // 第一个时间点
  s.addShape("oval", {
    x: 0.61, y: 1.15, w: 0.22, h: 0.22,
    fill: { color: C.vermilion },
  });
  s.addText("嘉庆十二年秋", {
    x: 1.05, y: 1.08, w: 2.5, h: 0.35,
    fontSize: 15, fontFace: FONT.body, color: C.vermilion, bold: true, margin: 0,
  });
  s.addText("大清帝国由盛转衰，山西平遥的青石板路上，驼铃声与算盘声交织成帝国的金融脉搏。", {
    x: 1.05, y: 1.42, w: 8.2, h: 0.5,
    fontSize: 11, fontFace: FONT.body, color: C.inkText, margin: 0,
  });

  // 第二个时间点
  s.addShape("oval", {
    x: 0.61, y: 2.2, w: 0.22, h: 0.22,
    fill: { color: C.gold },
  });
  s.addText("你的身份：票号大掌柜", {
    x: 1.05, y: 2.13, w: 3.5, h: 0.35,
    fontSize: 15, fontFace: FONT.body, color: C.inkText, bold: true, margin: 0,
  });
  s.addText("执掌一家中型票号，是这艘金融巨舟的实际掌舵人。东家将万贯家财全权委托于你——你卖的是一张薄薄的汇票，守的是一口气。", {
    x: 1.05, y: 2.48, w: 8.2, h: 0.5,
    fontSize: 11, fontFace: FONT.body, color: C.inkText, margin: 0,
  });

  // 三大铁律卡片
  const rules = [
    { icon: "信", title: "信为命脉", desc: "宁可赔光存银，不可让任何一张真票无法兑付。失信一次，便是灭门之灾", color: C.vermilion },
    { icon: "利", title: "利在长远", desc: "不为一锤子买卖。人情积累的厚度远胜一时的高利，生意是做给子孙后代的", color: C.gold },
    { icon: "衡", title: "庙堂与江湖", desc: "票号离不开官府，但绝不可沦为附庸。与巡抚过密，他倒台时你万劫不复", color: C.profit },
  ];
  rules.forEach((r, i) => {
    const cx = 1.05 + i * 2.95;
    addCard(s, cx, 3.2, 2.7, 1.7, r.icon, r.title, r.desc, r.color);
  });
}

// ════════════════════════════════════════════
// Slide 3: 核心玩法
// ════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.parchment };

  addSectionTitle(s, "核心玩法");

  // 左侧：三大核心资源
  s.addText("三大核心资源", {
    x: 0.7, y: 1.05, w: 3.5, h: 0.4,
    fontSize: 16, fontFace: FONT.body, color: C.inkText, bold: true, margin: 0,
  });

  addCard(s, 0.7, 1.55, 3.5, 1.1, "💰", "白银 — 流通之血", "总号+汉口/张家口两分号库银体系，准备金率、异地调拨、存贷利息差构成收支主干", C.vermilion);
  addCard(s, 0.7, 2.8, 3.5, 1.1, "⭐", "信誉 — 票号之魂", "五级评价，百年积累可毁于一夕拒兑。易毁难建，是游戏中最需守护的核心", C.gold);
  addCard(s, 0.7, 4.05, 3.5, 1.1, "🕸️", "人脉 — 无形之网", "官府好感、商帮交情、东家信任三维并行。攀附官员获益，他倒台你遭殃", C.profit);

  // 右侧：游戏循环
  s.addText("游戏循环 · 六阶段驱动", {
    x: 5.2, y: 1.05, w: 4.5, h: 0.4,
    fontSize: 16, fontFace: FONT.body, color: C.inkText, bold: true, margin: 0,
  });

  const phases = [
    { name: "晨间简报", desc: "一览库银/准备金/信誉/密押" },
    { name: "季度决策", desc: "银两运营/费率定价/伙友调度" },
    { name: "经济模拟", desc: "后台计算汇兑收入/利息/事件" },
    { name: "事件剧情", desc: "23+多分支剧本事件" },
    { name: "年终合账", desc: "对账审核·分红留利·人事评定" },
    { name: "终局结算", desc: "6种结局差异化展示" },
  ];

  phases.forEach((p, i) => {
    const py = 1.55 + i * 0.63;
    // 序号圆
    s.addShape("oval", {
      x: 5.2, y: py + 0.08, w: 0.32, h: 0.32,
      fill: { color: i === 5 ? C.vermilion : C.inkLight },
    });
    s.addText(String(i + 1), {
      x: 5.2, y: py + 0.08, w: 0.32, h: 0.32,
      fontSize: 12, fontFace: FONT.number, color: C.parchment,
      align: "center", valign: "middle", margin: 0,
    });
    // 阶段名
    s.addText(p.name, {
      x: 5.7, y: py, w: 1.8, h: 0.25,
      fontSize: 12, fontFace: FONT.body, color: C.inkText, bold: true, margin: 0,
    });
    s.addText(p.desc, {
      x: 5.7, y: py + 0.25, w: 3.5, h: 0.25,
      fontSize: 9.5, fontFace: FONT.body, color: C.muted, margin: 0,
    });
    // 连线
    if (i < phases.length - 1) {
      s.addShape("rect", {
        x: 5.34, y: py + 0.55, w: 0.02, h: 0.18,
        fill: { color: C.border },
      });
    }
  });
}

// ════════════════════════════════════════════
// Slide 4: 特色系统
// ════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.parchment };

  addSectionTitle(s, "特色系统");

  const systems = [
    { icon: "🏛️", title: "分号网络", desc: "汉口一等分号（九省通衢）+ 张家口二等分号（口外据点），掌柜能力/忠诚/经营状态独立模拟", color: C.vermilion },
    { icon: "👥", title: "伙友养成", desc: "学徒季度成长（36月出师），能力>80+忠诚>70给分号额外加成。低忠诚有概率携款潜逃", color: C.gold },
    { icon: "🔐", title: "密押防伪", desc: "基础字码→标准双码→三码联动三级升级，密押泄漏导致信誉断崖式下跌", color: C.inkLight },
    { icon: "📜", title: "事件剧情", desc: "5核心故事线+4危机自救+14季度突发事件，条件触发，多分支后果，每事件2~3选1", color: C.profit },
    { icon: "🏆", title: "里程碑成就", desc: "初露锋芒/万两之槛/金字招牌等6个阶段性成就，触发时弹窗提示", color: C.vermilion },
    { icon: "📋", title: "年度规划", desc: "年终选择来年方向（开疆拓土/固本培元/信誉至上），下一年享有对应经营加成", color: C.gold },
  ];

  systems.forEach((sys, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const cx = 0.7 + col * 3.05;
    const cy = 1.05 + row * 1.85;
    addCard(s, cx, cy, 2.8, 1.7, sys.icon, sys.title, sys.desc, sys.color);
  });
}

// ════════════════════════════════════════════
// Slide 5: 结局系统
// ════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.parchment };

  addSectionTitle(s, "结局系统");

  const endings = [
    { icon: "🏆", title: "金玉满堂", desc: "总库银≥120万两\n经营≥7年", type: "胜利", color: C.gold },
    { icon: "🛡️", title: "守成之主", desc: "坚持经营\n5年不倒", type: "胜利", color: C.profit },
    { icon: "🎋", title: "急流勇退", desc: "信誉≥85，巅峰期\n主动退隐", type: "特殊", color: C.profit },
    { icon: "🚪", title: "功成身退", desc: "随时手动结束\n即时结算", type: "特殊", color: C.muted },
    { icon: "💸", title: "惨淡收场", desc: "总库银\n耗尽归零", type: "失败", color: C.danger },
    { icon: "📛", title: "晚节不保", desc: "信誉崩盘\n身败名裂", type: "失败", color: C.vermilion },
  ];

  endings.forEach((e, i) => {
    const cx = 0.5 + i * 1.55;
    // 卡片
    s.addShape("rect", {
      x: cx, y: 1.1, w: 1.4, h: 2.6,
      fill: { color: C.paper },
      shadow: makeCardShadow(),
    });
    // 顶部色条
    s.addShape("rect", {
      x: cx, y: 1.1, w: 1.4, h: 0.05,
      fill: { color: e.color },
    });
    // 类型标签
    const tagColor = e.type === "胜利" ? C.profit : e.type === "失败" ? C.vermilion : C.muted;
    s.addShape("rect", {
      x: cx + 0.35, y: 1.35, w: 0.7, h: 0.28,
      fill: { color: tagColor, transparency: 90 },
    });
    s.addText(e.type, {
      x: cx + 0.35, y: 1.35, w: 0.7, h: 0.28,
      fontSize: 9, fontFace: FONT.body, color: tagColor, bold: true,
      align: "center", valign: "middle", margin: 0,
    });
    // 图标
    s.addText(e.icon, {
      x: cx, y: 1.75, w: 1.4, h: 0.45,
      fontSize: 28, fontFace: FONT.body,
      align: "center", valign: "middle", margin: 0,
    });
    // 标题
    s.addText(e.title, {
      x: cx, y: 2.25, w: 1.4, h: 0.3,
      fontSize: 13, fontFace: FONT.body, color: C.inkText, bold: true,
      align: "center", margin: 0,
    });
    // 描述
    s.addText(e.desc, {
      x: cx, y: 2.6, w: 1.4, h: 0.8,
      fontSize: 9, fontFace: FONT.body, color: C.muted,
      align: "center", margin: 0,
    });
  });
}

// ════════════════════════════════════════════
// Slide 6: 技术亮点
// ════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.parchment };

  addSectionTitle(s, "技术亮点");

  const highlights = [
    { icon: "🎵", title: "AI 程序化古筝 BGM", desc: "Web Audio API 实时合成五声音阶（宫商角徵羽），三角波模拟古筝拨弦泛音，4种主题自动切换，零外部文件、免版权", color: C.vermilion },
    { icon: "🔒", title: "IOA 三层安全体系", desc: "存档16位哈希签名防篡改 + 云端PBKDF2-SHA256认证（10万次迭代+随机盐）+ 操作行为异常检测", color: C.gold },
    { icon: "⚙️", title: "纯函数引擎架构", desc: "engine/目录 2,968 行全部为无副作用纯函数，与 UI 完全解耦。useReducer+Context 管理 28 种 Action 类型全局状态", color: C.profit },
    { icon: "📱", title: "极致轻量部署", desc: "仅 2 个运行时依赖（React 18 + ReactDOM），构建产物 gzip 仅 106KB。EdgeOne Pages 全球 CDN 一键部署", color: C.inkLight },
  ];

  highlights.forEach((h, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const cx = 0.7 + col * 4.55;
    const cy = 1.05 + row * 2.1;
    addCard(s, cx, cy, 4.3, 1.85, h.icon, h.title, h.desc, h.color);
  });
}

// ════════════════════════════════════════════
// Slide 7: 项目数据
// ════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.parchment };

  addSectionTitle(s, "项目数据");

  // 4 个大号统计卡片
  const bigStats = [
    { n: "58", label: "TS/TSX 源文件", color: C.vermilion },
    { n: "9,400", label: "总代码行数", color: C.gold },
    { n: "2", label: "运行时依赖", color: C.profit },
    { n: "106 KB", label: "构建体积 (gzip)", color: C.inkLight },
  ];
  bigStats.forEach((st, i) => {
    const cx = 0.5 + i * 2.3;
    s.addShape("rect", {
      x: cx, y: 1.05, w: 2.1, h: 1.05,
      fill: { color: C.paper },
      shadow: makeCardShadow(),
    });
    s.addText(st.n, {
      x: cx, y: 1.1, w: 2.1, h: 0.55,
      fontSize: 36, fontFace: FONT.number, color: st.color, bold: true,
      align: "center", valign: "middle", margin: 0,
    });
    s.addText(st.label, {
      x: cx, y: 1.7, w: 2.1, h: 0.3,
      fontSize: 11, fontFace: FONT.body, color: C.muted,
      align: "center", valign: "middle", margin: 0,
    });
  });

  // ─── 左半区：代码分布 ───
  s.addText("代码模块分布", {
    x: 0.7, y: 2.4, w: 4, h: 0.35,
    fontSize: 14, fontFace: FONT.body, color: C.inkText, bold: true, margin: 0,
  });

  const modules = [
    { name: "engine/ 核心引擎", pct: 31, color: C.vermilion },
    { name: "components/ UI组件", pct: 34, color: C.gold },
    { name: "data/ 游戏数据", pct: 13, color: C.profit },
    { name: "utils/ 工具函数", pct: 11, color: C.inkLight },
    { name: "hooks/ + types/", pct: 11, color: C.muted },
  ];

  modules.forEach((m, i) => {
    const py = 2.85 + i * 0.45;
    // 模块名
    s.addText(m.name, {
      x: 0.7, y: py, w: 2.1, h: 0.28,
      fontSize: 10, fontFace: FONT.body, color: C.inkText, margin: 0, valign: "middle",
    });
    // 百分比数字
    s.addText(m.pct + "%", {
      x: 2.8, y: py, w: 0.45, h: 0.28,
      fontSize: 10, fontFace: FONT.number, color: m.color, bold: true, margin: 0, valign: "middle",
    });
    // 进度条背景
    s.addShape("rect", {
      x: 3.3, y: py + 0.08, w: 1.3, h: 0.12,
      fill: { color: C.border },
    });
    // 进度条前景
    s.addShape("rect", {
      x: 3.3, y: py + 0.08, w: m.pct / 34 * 1.3, h: 0.12,
      fill: { color: m.color },
    });
  });

  // ─── 右半区：技术栈 ───
  s.addText("技术栈", {
    x: 5.3, y: 2.4, w: 4, h: 0.35,
    fontSize: 14, fontFace: FONT.body, color: C.inkText, bold: true, margin: 0,
  });

  const techItems = [
    { label: "React 18", desc: "UI 框架" },
    { label: "TypeScript 5.5", desc: "类型系统" },
    { label: "Vite 5.4", desc: "构建工具" },
    { label: "Web Audio API", desc: "程序化古筝 BGM" },
    { label: "EdgeOne Pages", desc: "CDN 全栈部署" },
    { label: "localStorage", desc: "多用户存档隔离" },
  ];
  techItems.forEach((t, i) => {
    const py = 2.85 + i * 0.45;
    s.addShape("rect", {
      x: 5.3, y: py + 0.02, w: 0.04, h: 0.24,
      fill: { color: C.vermilion },
    });
    s.addText(t.label, {
      x: 5.5, y: py, w: 1.6, h: 0.28,
      fontSize: 11, fontFace: FONT.body, color: C.inkText, bold: true, margin: 0, valign: "middle",
    });
    s.addText(t.desc, {
      x: 7.1, y: py, w: 2.5, h: 0.28,
      fontSize: 10, fontFace: FONT.body, color: C.muted, margin: 0, valign: "middle",
    });
  });
}

// ════════════════════════════════════════════
// Slide 8: 结尾
// ════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.ink };

  s.addText("汇通天下，青史留名", {
    x: 1, y: 1.3, w: 8, h: 0.7,
    fontSize: 30, fontFace: FONT.title, color: C.parchment,
    align: "center", bold: true, margin: 0,
  });

  s.addShape("rect", {
    x: 3.2, y: 2.15, w: 3.6, h: 0.015,
    fill: { color: C.gold },
  });

  s.addText("《晋·信》— 一盏油灯，一方算盘，一间青砖灰瓦的票号", {
    x: 1, y: 2.5, w: 8, h: 0.45,
    fontSize: 14, fontFace: FONT.body, color: C.muted,
    align: "center", italic: true, margin: 0,
  });

  // 链接卡片
  s.addShape("rect", {
    x: 2.2, y: 3.3, w: 5.6, h: 1.0,
    fill: { color: C.inkLight },
  });
  s.addText("立即体验", {
    x: 2.2, y: 3.35, w: 5.6, h: 0.35,
    fontSize: 13, fontFace: FONT.body, color: C.gold, bold: true,
    align: "center", margin: 0,
  });
  s.addText("jinxin-twlhpwzz.edgeone.cool", {
    x: 2.2, y: 3.7, w: 5.6, h: 0.35,
    fontSize: 12, fontFace: FONT.body, color: C.parchment,
    align: "center", margin: 0,
  });

  // GitHub
  s.addText("github.com/szm20060312/jinxin", {
    x: 1, y: 4.6, w: 8, h: 0.35,
    fontSize: 10, fontFace: FONT.body, color: C.muted,
    align: "center", margin: 0,
  });
}

// ─── 保存 ────────────────────────────────
(async () => {
  await pres.writeFile({ fileName: "PPT/《晋·信》作品介绍.pptx" });
  console.log("✅ PPT 已生成: PPT/《晋·信》作品介绍.pptx");
})();
