// ============================================================
// 简报卡片组件 —— 《晋·信》
// ============================================================

import type { MorningBrief } from '../../types';

// 分类图标
const CATEGORY_ICONS: Record<MorningBrief['category'], string> = {
  silver: '💰',
  draft: '📜',
  intel: '🕵️',
  staff: '👤',
  crisis: '⚠️',
};

// 可靠性文本
const RELIABILITY_LABELS: Record<string, string> = {
  high: '可靠',
  medium: '一般',
  low: '待核实',
};

interface MorningBriefCardProps {
  brief: MorningBrief;
  onAcknowledge: (briefId: string) => void;
}

export function MorningBriefCard({ brief, onAcknowledge }: MorningBriefCardProps) {
  const icon = CATEGORY_ICONS[brief.category] || '📋';
  const variantClass = `brief-card--${brief.category}`;

  return (
    <div className={`card ${variantClass}`}>
      <div className="card__title">
        <span className="brief-icon">{icon}</span>
        {brief.title}
        {brief.reliability && (
          <span className={`reliability-badge reliability--${brief.reliability}`}>
            {RELIABILITY_LABELS[brief.reliability] || brief.reliability}
          </span>
        )}
      </div>
      <div className="card__body">{brief.description}</div>
      <div className="card__actions">
        <button className="btn btn--sm" onClick={() => onAcknowledge(brief.id)}>
          知晓
        </button>
      </div>
    </div>
  );
}
