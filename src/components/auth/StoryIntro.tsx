// ============================================================
// 背景故事过渡页 —— 《晋·信》
// 逐行显示 + 晓晓语音朗读同步
// 点击/回车 → 打断当前音频 → 推进下一行
// onended → 自动推进
// ============================================================

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

const LINES = [
  '嘉庆十二年秋，',
  '白莲教之乱的余烬在川楚的深山里化作最后一缕青烟。',
  '紫禁城内，嘉庆帝对着空虚的国库长叹；',
  '而在千里之外的山西平遥，南大街的青石板路上，',
  '驼铃声与算盘声交织成另一曲帝国的脉搏。',
  '这里没有皇权的威严，',
  '却有着比皇权更实在的力量——白银的流动。',
  '',   // 空行 → 段落间距
  '在这座"大清金融中心"平遥城内，',
  '日升昌、蔚泰厚等大号的红漆招牌在日光下晃得人眼晕。',
  '而你，执掌着一家中型票号。',
  '',   // 空行 → 段落间距
  '东家是平遥本地大族，',
  '因厌倦了官场倾轧，将万贯家财全权委托于你。',
  '你是大掌柜，是这艘金融巨舟的实际掌舵人。',
  '',   // 空行 → 段落间距
  '总号之内，你执掌银库、调度分号、周旋官商、培养伙友。',
  '你既拥有独断的经营之权，',
  '也承担着泰山压顶般的经营之险。',
  '',   // 空行 → 段落间距
  '你卖的是一张纸，守的是一口气。',
  '',   // 空行 → 段落间距
  '票号不卖米面绸缎，它卖的是一张薄薄的纸——汇票。',
  '这张纸之所以能让商人从京师提走汉口分号的万两白银，',
  '凭的完全是票号招牌的信誉。',
  '',   // 空行 → 段落间距
  '信为命脉，利在长远。',
  '百年积累可毁于一夕，一次失信便是灭门之灾。',
  '',   // 空行 → 段落间距
  '你的目标是让拿着你票号票据的商人，',
  '在帝国的任何一个角落都能立兑白银。',
  '从这间青砖灰瓦的账房开始，',
  '你的商道、你的信义、你的传奇——',
  '正等待被亲手书写。',
];

// ─── 构建 LINES索引 → 音频文件索引 映射表 ───
function buildAudioMap(): Map<number, number> {
  const map = new Map<number, number>();
  let audioIdx = 0;
  for (let i = 0; i < LINES.length; i++) {
    if (LINES[i] === '') {
      map.set(i, -1); // 空行不播放音频
    } else {
      map.set(i, audioIdx++);
    }
  }
  return map;
}

/** 音频文件路径 */
function audioPath(audioIdx: number): string {
  return `/audio/story/line_${String(audioIdx).padStart(2, '0')}.mp3`;
}

interface Props {
  onFinish: () => void;
}

export function StoryIntro({ onFinish }: Props) {
  const [visibleLines, setVisibleLines] = useState(1);
  const [autoPlay, setAutoPlay] = useState(true);
  const autoPlayRef = useRef(true);   // ref 供 onended 闭包读取最新值
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isAdvancing = useRef(false);
  const hasStartedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;
  autoPlayRef.current = autoPlay;

  // 映射表（mount 时构建一次）
  const audioMap = useMemo(() => buildAudioMap(), []);

  // ── 停止当前音频 ──
  const stopAudio = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      audio.src = '';
      audio.onended = null;
      audioRef.current = null;
    }
  }, []);

  // ── 跳过空行：从 fromLine（含）开始一直找到非空行 ──
  const skipBlanks = useCallback((fromLine: number): number => {
    let i = fromLine;
    while (i < LINES.length && LINES[i] === '') {
      i++;
    }
    return i;
  }, []);

  // ── ref 打破 playAudio ↔ advanceAfterAudio 循环依赖 ──
  const playAudioRef = useRef<(lineIdx: number) => void>(() => {});

  // ── 音频播完后自动推进到下一行（跳过空行） ──
  const advanceAfterAudio = useCallback((fromLine: number) => {
    if (isAdvancing.current) return;
    isAdvancing.current = true;

    // 从 fromLine+1 开始找下一个非空行
    const nextLine = skipBlanks(fromLine + 1);

    if (nextLine >= LINES.length) {
      setVisibleLines(LINES.length);
      isAdvancing.current = false;
      return;
    }

    // 跳到下一个非空行（中间空行一并展示，段落间距可见）
    setVisibleLines(nextLine + 1);

    setTimeout(() => {
      playAudioRef.current(nextLine);
      isAdvancing.current = false;
    }, 50);
  }, [skipBlanks]);

  // ── 播放指定 LINES 索引对应的音频 ──
  const playAudio = useCallback((lineIdx: number) => {
    const aIdx = audioMap.get(lineIdx);
    if (aIdx === undefined || aIdx < 0) return; // 空行或无映射

    const path = audioPath(aIdx);

    fetch(path, { method: 'HEAD' })
      .then(res => {
        if (!res.ok) {
          // 文件缺失 → 跳过本行（静默）
          advanceAfterAudio(lineIdx);
          return;
        }
        const audio = new Audio(path);
        audioRef.current = audio;

        audio.onended = () => {
          audio.onended = null;
          audioRef.current = null;
          // 只在自动模式 + 非空行时自动推进
          if (autoPlayRef.current) {
            advanceAfterAudio(lineIdx);
          }
        };

        audio.play().catch(() => {
          // autoplay 被浏览器拦截 → 清理，停在当前行等待用户点击
          audio.onended = null;
          audioRef.current = null;
          // 不调用 advanceAfterAudio，由用户手势触发推进
        });
      })
      .catch(() => {
        // 网络错误 → 跳过本行（静默）
        advanceAfterAudio(lineIdx);
      });
  }, [audioMap, advanceAfterAudio]);

  // 保持 ref 指向最新 playAudio
  playAudioRef.current = playAudio;

  // ── 用户点击/回车推进（主动打断当前音频） ──
  const advance = useCallback(() => {
    if (isAdvancing.current) return;

    // ── 首次点击：播放当前可见行音频（不推进文字） ──
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      isAdvancing.current = true;
      stopAudio();
      const firstLine = skipBlanks(0);
      if (firstLine < LINES.length) {
        setTimeout(() => {
          playAudio(firstLine);
          isAdvancing.current = false;
        }, 50);
      } else {
        isAdvancing.current = false;
      }
      return;
    }

    isAdvancing.current = true;

    // 打断当前音频
    stopAudio();

    // 如果已经是最后一行 → 完成
    if (visibleLines >= LINES.length) {
      onFinishRef.current();
      isAdvancing.current = false;
      return;
    }

    // newLineIdx = LINES 中新展示的行索引
    // visibleLines(旧)=N 表示 LINES[0..N-1] 已展示，因此 N 就是新行索引
    const newLineIdx = visibleLines;

    // 空行也计入 visibleLines（渲染为段落间距），非空行才播音频
    setVisibleLines(prev => Math.min(prev + 1, LINES.length));

    if (LINES[newLineIdx] !== '') {
      setTimeout(() => {
        playAudio(newLineIdx);
        isAdvancing.current = false;
      }, 50);
    } else {
      isAdvancing.current = false;
    }
  }, [visibleLines, stopAudio, skipBlanks, playAudio]);

  // ── 卸载清理 ──
  useEffect(() => {
    return () => {
      const audio = audioRef.current;
      if (audio) {
        audio.onended = null;
        audio.pause();
        audio.src = '';
        audioRef.current = null;
      }
    };
  }, []);

  // ── 键盘推进 ──
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        advance();
      }
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        advance();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [advance]);

  // ── 每次新文字出现 → 平滑滚动 ──
  useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.scrollTo({
          top: document.documentElement.scrollHeight,
          behavior: 'smooth',
        });
      });
    });
  }, [visibleLines]);

  const showAll = LINES.slice(0, visibleLines);
  const isDone = visibleLines >= LINES.length;

  return (
    <div
      onClick={advance}
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: 'clamp(80px, 15vh, 180px) 24px 60px',
        background: 'var(--color-paper)',
        cursor: isDone ? 'default' : 'pointer',
        userSelect: 'none',
      }}
    >
      {/* 跳过按钮 */}
      <button
        onClick={e => {
          e.stopPropagation();
          stopAudio();
          onFinish();
        }}
        style={{
          position: 'fixed',
          top: 16,
          right: 20,
          background: 'rgba(253,251,245,0.85)',
          border: '1px solid var(--color-paper-border)',
          borderRadius: 8,
          padding: '8px 18px',
          fontSize: '0.82rem',
          color: 'var(--color-ink-muted)',
          cursor: 'pointer',
          fontFamily: 'var(--font-body)',
          zIndex: 10,
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(31,25,14,0.06)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(253,251,245,0.85)'; }}
      >
        跳过 »
      </button>

      {/* 自动播放切换 */}
      <button
        onClick={e => {
          e.stopPropagation();
          // 如果还没启动过，切换时同时启动音频
          if (!hasStartedRef.current) {
            hasStartedRef.current = true;
            const firstLine = skipBlanks(0);
            if (firstLine < LINES.length) playAudio(firstLine);
          }
          setAutoPlay(v => !v);
        }}
        style={{
          position: 'fixed',
          top: 16,
          right: 100,
          background: autoPlay ? 'var(--color-red-seal)' : 'rgba(253,251,245,0.85)',
          border: autoPlay ? 'none' : '1px solid var(--color-paper-border)',
          borderRadius: 8,
          padding: '8px 18px',
          fontSize: '0.82rem',
          color: autoPlay ? 'var(--color-paper)' : 'var(--color-ink-muted)',
          cursor: 'pointer',
          fontFamily: 'var(--font-body)',
          zIndex: 10,
          transition: 'all 0.25s',
          boxShadow: autoPlay ? '0 2px 8px rgba(181,32,32,0.25)' : 'none',
        }}
        onMouseEnter={e => {
          if (!autoPlay) e.currentTarget.style.background = 'rgba(31,25,14,0.06)';
        }}
        onMouseLeave={e => {
          if (!autoPlay) e.currentTarget.style.background = 'rgba(253,251,245,0.85)';
        }}
      >
        {autoPlay ? '自动 ▶' : '手动 ▷'}
      </button>

      {/* 印章 */}
      <div
        style={{
          width: 72,
          height: 72,
          border: '3px solid var(--color-red-seal)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-red-seal)',
          fontSize: '2rem',
          fontWeight: 700,
          fontFamily: 'var(--font-heading)',
          marginBottom: 40,
          opacity: 1,
          transform: 'scale(1)',
          transition: 'all 0.8s ease',
        }}
      >
        晋
      </div>

      {/* 文本区 */}
      <div style={{ maxWidth: 560, width: '100%' }}>
        {showAll.map((line, i) => {
          const isNew = i === visibleLines - 1;
          const isEmpty = line === '';

          if (isEmpty) {
            return <div key={i} style={{ height: 24 }} />;
          }

          return (
            <p
              key={i}
              style={{
                fontSize: '1.2rem',
                lineHeight: 2.1,
                color: isNew ? 'var(--color-ink)' : 'var(--color-ink-light)',
                textAlign: 'center',
                fontFamily: 'var(--font-body)',
                letterSpacing: '0.04em',
                marginBottom: 2,
                opacity: isNew ? 1 : 0.65,
                animation: isNew ? 'fadeIn 0.5s ease-out' : undefined,
                transition: 'color 0.6s, opacity 0.6s',
              }}
            >
              {line}
            </p>
          );
        })}
      </div>

      {/* 滚动锚点 */}
      <div ref={containerRef} style={{ height: 1 }} />

      {/* 底栏：提示 / 进入游戏按钮 */}
      {!isDone ? (
        <div
          style={{
            marginTop: 40,
            fontSize: '0.78rem',
            color: 'var(--color-ink-muted)',
            opacity: 0.5,
            animation: 'pulse 2s infinite',
          }}
        >
          点击或按回车继续{!autoPlay ? '' : ' · 自动'}
        </div>
      ) : (
        <button
          onClick={e => {
            e.stopPropagation();
            stopAudio();
            onFinish();
          }}
          style={{
            marginTop: 48,
            padding: '14px 56px',
            fontSize: '1.1rem',
            fontFamily: 'var(--font-body)',
            fontWeight: 700,
            color: 'var(--color-paper)',
            background: 'var(--color-red-seal)',
            border: 'none',
            borderRadius: 10,
            cursor: 'pointer',
            letterSpacing: '0.06em',
            boxShadow: '0 4px 16px rgba(181,32,32,0.3)',
            animation: 'fadeInScale 0.6s ease-out',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'scale(1.04)';
            e.currentTarget.style.boxShadow = '0 6px 24px rgba(181,32,32,0.4)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(181,32,32,0.3)';
          }}
        >
          进入游戏
        </button>
      )}
    </div>
  );
}
