// ============================================================
// 晨间简报生成引擎 —— 《晋·信》
// ============================================================

import type { MorningBrief, GameState } from '../types';
import { SEASON_NAMES } from '../data/constants';
import { calcReserveRatio, getReserveHealth, getInTransitRisk } from './resources';
import { pickRandom, pickNRandom } from '../utils/random';

// ---- 简报模板 ----

type BriefTemplate = Omit<MorningBrief, 'id' | 'description' | 'options'> & {
  genDescription: (state: GameState) => string;
  condition?: (state: GameState) => boolean;
};

const BRIEF_TEMPLATES: BriefTemplate[] = [
  // ========== 银两类 ==========
  {
    category: 'silver',
    title: '库银盘点',
    genDescription: (s) => {
      const total = s.resources.silver.totalSilver.toLocaleString();
      const hq = s.resources.silver.headquarters.toLocaleString();
      const ratio = (calcReserveRatio(s.resources.silver) * 100).toFixed(1);
      return `今晨盘点库银：总号存银 ${hq} 两，全号总计 ${total} 两。准备金率${ratio}%。`;
    },
    reliability: 'high',
  },
  {
    category: 'silver',
    title: '在途银报告',
    genDescription: (s) => {
      const transit = s.resources.silver.inTransit;
      if (transit === 0) return '目前在途银为零，商路平静。';
      const risk = getInTransitRisk(s.resources.silver);
      return `当前在途白银 ${transit.toLocaleString()} 两。${risk || '一切正常。'}`;
    },
    reliability: 'high',
  },
  {
    category: 'silver',
    title: '准备金率预警',
    genDescription: (s) => {
      const health = getReserveHealth(s.resources.silver);
      switch (health) {
        case 'safe':
          return '准备金充裕，号事运转无碍。';
        case 'warning':
          return '准备金率略低于安全线，需留意周转。';
        case 'danger':
          return '准备金告急！随时有挤兑风险，请速调拨白银！';
      }
    },
    condition: (s) => getReserveHealth(s.resources.silver) !== 'safe',
  },

  // ========== 商情类 ==========
  {
    category: 'draft',
    title: '汇兑行情',
    genDescription: (s) => {
      const hkVol = s.branches.hankou.businessVolume.toLocaleString();
      const zjkVol = s.branches.zhangjiakou.businessVolume.toLocaleString();
      return `上季汇兑：汉口 ${hkVol} 两，张家口 ${zjkVol} 两。商路繁忙。`;
    },
  },
  {
    category: 'draft',
    title: '同行消息',
    genDescription: (_s) => {
      const msgs = [
        '介休侯家票号扩大汉口业务，汇费率略低半厘。',
        '听说祁县渠家想在本县再开一家分号。',
        '太谷曹家近来信誉大损，客户纷纷转投本号。',
        '平遥街上都在谈论，朝廷可能要整顿票号行规。',
      ];
      return pickRandom(msgs);
    },
    reliability: 'medium',
  },

  // ========== 人事类 ==========
  {
    category: 'staff',
    title: '学徒进度',
    genDescription: (s) => {
      const apprentices = s.staff.filter(st => st.role === 'apprentice');
      if (apprentices.length === 0) return '目前无学徒在号。';
      const nearGraduate = apprentices.find(a => a.monthsTrained >= 30);
      if (nearGraduate) {
        return `${nearGraduate.name}已受训 ${nearGraduate.monthsTrained} 月，距出师不远矣。`;
      }
      return `现有学徒 ${apprentices.length} 人，均在勤学中。`;
    },
  },
  {
    category: 'staff',
    title: '伙友动态',
    genDescription: (s) => {
      const clerks = s.staff.filter(st => st.role === 'clerk');
      const msgs = [
        clerks.length > 0
          ? `${pickRandom(clerks).name}昨日加班核账至深夜。`
          : '某伙友昨日加班核账至深夜。',
        '总号账房提议改良记账法，可减少查账时间。',
        '汉口分号来信：人手紧张，望总号增派一名账房。',
      ];
      return pickRandom(msgs);
    },
    reliability: 'low',
  },

  // ========== 情报类 ==========
  {
    category: 'intel',
    title: '官府动向',
    genDescription: (s) => {
      const gov = s.resources.connections.government;
      if (gov >= 70) return '太原府传来消息：巡抚大人有意将今秋税银汇兑交本号办理。';
      if (gov >= 40) return '衙门里的师爷递话：县太爷对大掌柜印象不错。';
      return '省府似在查票号账目，虽与本号无涉，但风声不小。';
    },
    reliability: 'medium',
  },
  {
    category: 'intel',
    title: '商帮传言',
    genDescription: (s) => {
      const merchant = s.resources.connections.merchantGuild;
      if (merchant >= 70) return '徽商茶帮来函，欲将今年茶银全部交由本号汇兑。';
      if (merchant >= 40) return '商会中有人提议，推举本号为平遥票号行首。';
      return '同行聚会时，有人对本号密押安全性提出质疑。';
    },
    reliability: 'low',
  },

  // ========== 危机类 ==========
  {
    category: 'crisis',
    title: '分号异动',
    genDescription: (s) => {
      const problems: string[] = [];
      if (s.branches.hankou.status !== 'normal') problems.push(`汉口分号状态异常（${s.branches.hankou.status}）`);
      if (s.branches.zhangjiakou.status !== 'normal') problems.push(`张家口分号状态异常（${s.branches.zhangjiakou.status}）`);
      if (problems.length > 0) return problems.join('；');
      return '各分号运转正常，未发现异常。';
    },
    condition: (s) =>
      s.branches.hankou.status !== 'normal' || s.branches.zhangjiakou.status !== 'normal',
  },
  {
    category: 'crisis',
    title: '密押到期提醒',
    genDescription: (s) => {
      const used = s.cipher.monthsUsed;
      const safe = s.cipher.current === 'basic' ? 12 : s.cipher.current === 'standard' ? 9 : 6;
      const remaining = safe - used;
      return `当前密押方案「${s.cipher.current}」已使用 ${used} 个月，安全期限仅剩 ${remaining} 个月。` +
        (remaining <= 3 ? ' 建议尽快更换！' : '');
    },
    condition: (s) => {
      const safe = s.cipher.current === 'basic' ? 12 : s.cipher.current === 'standard' ? 9 : 6;
      return s.cipher.monthsUsed >= safe * 0.5;
    },
  },
];

// ---- 简报生成 ----

/**
 * 生成本季晨间简报列表
 *
 * 每轮生成 3~5 条简报：
 * 1. 必定包含 1 条银两简报
 * 2. 剩余从符合条件的模板中随机抽取
 */
export function generateMorningBriefs(state: GameState): MorningBrief[] {
  const dateStr = `${state.date.year}年${SEASON_NAMES[state.date.season - 1]}季第${state.date.day}日`;

  // 筛选符合条件的模板（不含必选项）
  const silverTemplates = BRIEF_TEMPLATES.filter(
    t => t.category === 'silver' && (!t.condition || t.condition(state))
  );
  const otherTemplates = BRIEF_TEMPLATES.filter(
    t => t.category !== 'silver' && (!t.condition || t.condition(state))
  );

  const briefs: MorningBrief[] = [];
  // BUG-014: 使用递增计数器确保 ID 唯一，避免同一毫秒内 Date.now() 重复
  let idCounter = 0;

  // 1. 必定加入一条银两简报
  if (silverTemplates.length > 0) {
    const silver = pickRandom(silverTemplates);
    briefs.push({
      id: `brief_${++idCounter}_${Date.now()}_silver`,
      category: silver.category,
      title: silver.title,
      description: `【${dateStr}】${silver.genDescription(state)}`,
      options: [{ id: 'acknowledge', text: '知晓', effects: {} }],
      reliability: silver.reliability,
    });
  }

  // 2. 随机抽取 2~4 条其他简报
  const count = 2 + Math.floor(Math.random() * 3); // 2~4
  const selected = pickNRandom(otherTemplates, Math.min(count, otherTemplates.length));

  for (let i = 0; i < selected.length; i++) {
    const t = selected[i];
    briefs.push({
      id: `brief_${++idCounter}_${Date.now()}_${i}`,
      category: t.category,
      title: t.title,
      description: `【${dateStr}】${t.genDescription(state)}`,
      options: [{ id: 'acknowledge', text: '已阅', effects: {} }],
      reliability: t.reliability,
    });
  }

  // 终局预警检测——在简报开头插入醒目预警
  const totalSilver = state.resources.silver.totalSilver;
  const rep = state.resources.reputation;
  const year = state.date.year;
  let endingWarning: string | null = null;

  if (totalSilver < 10_000 && totalSilver > 0) {
    endingWarning = '🚨 库银见底！仅剩 ' + (totalSilver / 10_000).toFixed(1) + ' 万两——再不逆转，票号将无力回天。';
  } else if (rep < 15 && rep > 0) {
    endingWarning = '🚨 信誉濒临破产！商界对贵号信心动摇，再不振作恐晚节不保。';
  } else if (totalSilver >= 1_000_000 && year >= 1814) {
    endingWarning = '🌟 库银已逼近金玉满堂之数……再加一把劲，富甲天下指日可待！';
  } else if (year === 1812) {
    endingWarning = '⏳ 五年之期将至。这一年，不求有功，但求无过——守成即是胜利。';
  } else if (rep >= 80 && totalSilver >= 800_000 && year >= 1817) {
    endingWarning = '🍃 功成名就，此时急流勇退，青史留名正是时候。';
  }

  if (endingWarning) {
    briefs.unshift({
      id: `brief_ending_warning`,
      category: 'crisis',
      title: '⚠️ 终局预警',
      description: endingWarning,
      options: [{ id: 'acknowledge', text: '知晓', effects: {} }],
      reliability: 'high',
    });
  }

  return briefs;
}
