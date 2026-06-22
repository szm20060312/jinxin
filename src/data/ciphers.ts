// ============================================================
// 密押系统数据 —— 《晋·信》
//
// 晋商票号独创的密押制度，用特定汉字代替数字，
// 防止汇票伪造。不同方案有不同的编码规则。
// ============================================================

import type { CipherScheme } from '../types';

// ---- 密押方案 ----

/** 基础方案：简单字码替换，防伪能力有限 */
const BASIC_CIPHER = {
  /** 金额数字→密押字映射 */
  digits: ['晋', '商', '信', '义', '通', '天', '下', '汇', '万', '两'] as const,
  //         0     1     2     3     4     5     6     7     8     9

  /** 月份→密押字映射 */
  months: ['谨', '防', '假', '冒', '票', '号', '信', '义', '为', '本', '诚', '实'] as const,
  //         1     2     3     4     5     6     7     8     9    10    11    12

  /** 日期→密押字映射 */
  days: [
    '赵', '钱', '孙', '李', '周', '吴', '郑', '王', '冯', '陈',
    '褚', '卫', '蒋', '沈', '韩', '杨', '朱', '秦', '尤', '许',
    '何', '吕', '施', '张', '孔', '曹', '严', '华', '金', '魏', '陶',
  ] as const,
  //   1    2    3    4    5    6    7    8    9   10
  //  11   12   13   14   15   16   17   18   19   20
  //  21   22   23   24   25   26   27   28   29   30   31

  name: '基础字码',
  description: '以百家姓与晋商要义字为码，代码简单，**防伪能力有限**。每 12 个月建议更换。',
  securityLevel: 1,
};

/** 标准方案：两套字码轮换，中等安全 */
const STANDARD_CIPHER = {
  /** 甲套：金额数字→密押字 */
  digitsA: ['青', '山', '不', '老', '绿', '水', '长', '流', '金', '玉'] as const,
  //          0     1     2     3     4     5     6     7     8     9

  /** 乙套：金额数字→密押字（交叉验证用） */
  digitsB: ['日', '月', '光', '华', '弘', '道', '兴', '邦', '恒', '久'] as const,
  //          0     1     2     3     4     5     6     7     8     9

  /** 月份→密押字 */
  months: ['一', '元', '复', '始', '万', '象', '更', '新', '天', '地', '春', '回'] as const,
  //         1     2     3     4     5     6     7     8     9    10    11    12

  /** 日期→密押字 */
  days: [
    '天', '地', '玄', '黄', '宇', '宙', '洪', '荒', '日', '月',
    '盈', '昃', '辰', '宿', '列', '张', '寒', '来', '暑', '往',
    '秋', '收', '冬', '藏', '闰', '余', '成', '岁', '律', '吕', '调',
  ] as const,
  //  1~31, 取《千字文》前 31 字

  name: '标准双码',
  description: '甲/乙两套字码轮换使用，需两地账房对照解码，**安全等级中等**。每 9 个月建议更换。',
  securityLevel: 2,
};

/** 高级方案：三码联动+暗语诗，高安全 */
const ADVANCED_CIPHER = {
  /** 数字→密押字（取五言诗编码） */
  digits: ['白', '云', '深', '处', '有', '人', '家', '停', '车', '坐'] as const,
  // 取自"白云深处有人家，停车坐爱枫林晚"

  /** 月份→密押字（节气版） */
  months: ['立', '雨', '惊', '春', '清', '谷', '立', '处', '白', '寒', '霜', '冬'] as const,
  //       立春 雨水 惊蛰 春分 清明 谷雨 立夏 处暑 白露 寒露 霜降 冬至

  /** 日期→密押字（三十六天罡前31字） */
  days: [
    '魁', '罡', '机', '闲', '勇', '雄', '猛', '威', '英', '杰',
    '贵', '富', '满', '昌', '胜', '明', '暗', '佐', '佑', '微',
    '究', '文', '正', '辟', '强', '慧', '武', '进', '退', '星', '智',
  ] as const,

  /** 暗语验证诗句（两地账房各自持有半句，合验确认） */
  verificationPoemA: '远上寒山石径斜',
  verificationPoemB: '白云生处有人家',

  name: '三码联动',
  description: '数字+月份+日期三维编码，附暗语诗句交叉验证，**高度安全**。每 6 个月必须更换。',
  securityLevel: 3,
};

// ---- 方案查询接口 ----

export interface CipherSchemeData {
  name: string;
  description: string;
  securityLevel: number;
  digits: readonly string[];  // 数字→密押字（0-9）
  months: readonly string[];  // 月份→密押字（1-12）
  days: readonly string[];    // 日期→密押字（1-31）
}

/** 获取密押方案数据 */
export function getCipherScheme(scheme: CipherScheme): CipherSchemeData {
  switch (scheme) {
    case 'basic':
      return {
        name: BASIC_CIPHER.name,
        description: BASIC_CIPHER.description,
        securityLevel: BASIC_CIPHER.securityLevel,
        digits: BASIC_CIPHER.digits,
        months: BASIC_CIPHER.months,
        days: BASIC_CIPHER.days,
      };
    case 'standard':
      return {
        name: STANDARD_CIPHER.name,
        description: STANDARD_CIPHER.description,
        securityLevel: STANDARD_CIPHER.securityLevel,
        digits: STANDARD_CIPHER.digitsA,
        months: STANDARD_CIPHER.months,
        days: STANDARD_CIPHER.days,
      };
    case 'advanced':
      return {
        name: ADVANCED_CIPHER.name,
        description: ADVANCED_CIPHER.description,
        securityLevel: ADVANCED_CIPHER.securityLevel,
        digits: ADVANCED_CIPHER.digits,
        months: ADVANCED_CIPHER.months,
        days: ADVANCED_CIPHER.days,
      };
  }
}

/** 获取密押安全等级 */
export function getCipherSecurityLevel(scheme: CipherScheme): number {
  return getCipherScheme(scheme).securityLevel;
}

/** 高级方案暗语诗句 */
export function getAdvancedVerificationPoem(): { poemA: string; poemB: string } {
  return {
    poemA: ADVANCED_CIPHER.verificationPoemA,
    poemB: ADVANCED_CIPHER.verificationPoemB,
  };
}

/** 将金额数字编码为密押字（基础方案为例） */
export function encodeAmount(amount: number, scheme: CipherScheme = 'basic'): string {
  const { digits } = getCipherScheme(scheme);
  return String(amount)
    .split('')
    .map(d => digits[parseInt(d)])
    .join('');
}

/** 所有密押方案列表 */
export const ALL_CIPHER_SCHEMES: CipherSchemeData[] = [
  getCipherScheme('basic'),
  getCipherScheme('standard'),
  getCipherScheme('advanced'),
];
