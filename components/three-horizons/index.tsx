'use client';

import { CSSProperties, startTransition, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import styles from '@/components/_shared/diagram.module.css';
import { Markdown } from '@/components/_shared/markdown';

import { resolveFittingFontSize } from './font-fit';
import localStyles from './styles.module.css';

interface HorizonNote {
  label?: string;
  detail?: string;
}

interface HorizonBox {
  title?: string;
  notes?: HorizonNote[];
}

interface Horizon {
  label?: string;
  items?: string[];
  boxes?: HorizonBox[];
  color?: string;
}

interface TimeLabels {
  start?: string;
  mid?: string;
  end?: string;
}

interface RichBoxLayout {
  number: string;
  slot: string;
  horizonIndex: 0 | 1 | 2;
  boxIndex: 0 | 1;
}

interface RichBoxData extends RichBoxLayout {
  color: string;
  title: string;
  notes: Array<{ label: string; detail: string }>;
}

interface TooltipPosition {
  left: number;
  top: number;
  placement: 'top' | 'bottom';
  visible: boolean;
}

const richBoxLayout: RichBoxLayout[] = [
  { number: '3', slot: 'top-left', horizonIndex: 0, boxIndex: 0 },
  { number: '5', slot: 'top-center', horizonIndex: 1, boxIndex: 0 },
  { number: '1', slot: 'top-right', horizonIndex: 2, boxIndex: 0 },
  { number: '2', slot: 'bottom-left', horizonIndex: 2, boxIndex: 1 },
  { number: '6', slot: 'bottom-center', horizonIndex: 1, boxIndex: 1 },
  { number: '4', slot: 'bottom-right', horizonIndex: 0, boxIndex: 1 }
];

function horizonItems(value: unknown): string[] {
  return Array.isArray(value) ? (value as string[]).map((item) => String(item)) : [];
}

function horizonBoxes(value: unknown): HorizonBox[] {
  return Array.isArray(value) ? (value as HorizonBox[]) : [];
}

function noteEntries(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const note = entry as HorizonNote;
      const label = String(note.label ?? '').trim();
      const detail = String(note.detail ?? '').trim();

      if (!label) {
        return null;
      }

      return {
        label,
        detail
      };
    })
    .filter(Boolean) as Array<{ label: string; detail: string }>;
}

function isRichMode(horizons: Horizon[]) {
  return horizons.every((horizon) => horizonBoxes(horizon.boxes).length >= 2);
}

function noteColumnCount(notes: Array<{ label: string; detail: string }>) {
  if (notes.length >= 7) {
    return 3;
  }

  if (notes.length >= 5) {
    return 2;
  }

  return 1;
}

function toBoxData(horizons: Horizon[], colors: string[]): RichBoxData[] {
  return richBoxLayout.map((slot) => {
    const horizon = horizons[slot.horizonIndex] ?? {};
    const box = horizonBoxes(horizon.boxes)[slot.boxIndex] ?? {};

    return {
      ...slot,
      color: colors[slot.horizonIndex],
      title: String(box.title ?? ''),
      notes: noteEntries(box.notes)
    };
  });
}

function RichNote({
  color,
  note
}: {
  color: string;
  note: { label: string; detail: string };
}) {
  const id = useId().replace(/[:]/g, '-');
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const textRef = useRef<HTMLSpanElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition>({
    left: 0,
    top: 0,
    placement: 'top',
    visible: false
  });
  const visible = hovered || focused;

  useEffect(() => {
    const button = buttonRef.current;
    const text = textRef.current;
    if (!button || !text) {
      return;
    }

    let frame = 0;

    const fitText = () => {
      const nextFontSize = resolveFittingFontSize({
        min: 9.5,
        max: 16,
        fits: (size) => {
          text.style.fontSize = `${size}px`;
          return text.scrollWidth <= button.clientWidth - 18 && text.scrollHeight <= button.clientHeight - 18;
        }
      });

      text.style.fontSize = `${nextFontSize}px`;
      startTransition(() => {
        setFontSize((current) => (Math.abs(current - nextFontSize) > 0.05 ? nextFontSize : current));
      });
    };

    const scheduleFit = () => {
      cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(fitText);
    };

    const observer = new ResizeObserver(scheduleFit);
    observer.observe(button);
    scheduleFit();
    const fontReady = document.fonts?.ready;
    fontReady?.then(scheduleFit).catch(() => undefined);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [note.label]);

  useEffect(() => {
    if (!visible) {
      startTransition(() => {
        setTooltipPosition((current) => (current.visible ? { ...current, visible: false } : current));
      });
      return;
    }

    let frame = 0;

    const updatePosition = () => {
      const button = buttonRef.current;
      const tooltip = tooltipRef.current;
      if (!button || !tooltip) {
        return;
      }

      const rect = button.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      const gap = 12;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let placement: 'top' | 'bottom' = 'top';
      let top = rect.top - tooltipRect.height - gap;

      if (top < 12) {
        placement = 'bottom';
        top = rect.bottom + gap;
      }

      if (top + tooltipRect.height > viewportHeight - 12) {
        top = Math.max(12, viewportHeight - tooltipRect.height - 12);
      }

      const centeredLeft = rect.left + rect.width / 2 - tooltipRect.width / 2;
      const left = Math.min(Math.max(12, centeredLeft), viewportWidth - tooltipRect.width - 12);

      startTransition(() => {
        setTooltipPosition({
          left,
          top,
          placement,
          visible: true
        });
      });
    };

    const scheduleUpdate = () => {
      cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(updatePosition);
    };

    scheduleUpdate();
    window.addEventListener('resize', scheduleUpdate);
    window.addEventListener('scroll', scheduleUpdate, true);

    const observer = new ResizeObserver(scheduleUpdate);
    if (buttonRef.current) {
      observer.observe(buttonRef.current);
    }
    if (tooltipRef.current) {
      observer.observe(tooltipRef.current);
    }

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', scheduleUpdate);
      window.removeEventListener('scroll', scheduleUpdate, true);
      observer.disconnect();
    };
  }, [visible, note.detail, note.label]);

  const tooltip = visible && typeof document !== 'undefined'
    ? createPortal(
        <div
          ref={tooltipRef}
          id={`three-horizon-note-${id}`}
          role="tooltip"
          className={localStyles.tooltip}
          data-placement={tooltipPosition.placement}
          style={{
            left: tooltipPosition.left,
            top: tooltipPosition.top,
            visibility: tooltipPosition.visible ? 'visible' : 'hidden',
            ['--tooltip-accent' as string]: color
          }}
        >
          <span className={localStyles.tooltipEyebrow}>Note</span>
          <h5>{note.label}</h5>
          {note.detail ? (
            <div className={localStyles.tooltipBody}>
              <span className={localStyles.tooltipEyebrow}>Explanation</span>
              <Markdown content={note.detail} />
            </div>
          ) : null}
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={localStyles.note}
        aria-describedby={visible ? `three-horizon-note-${id}` : undefined}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{ ['--note-accent' as string]: color } as CSSProperties}
      >
        <span ref={textRef} className={localStyles.noteLabel} style={{ fontSize }}>
          {note.label}
        </span>
      </button>
      {tooltip}
    </>
  );
}

function RichThreeHorizons({
  horizons,
  colors,
  timeLabels
}: {
  horizons: Horizon[];
  colors: string[];
  timeLabels: TimeLabels;
}) {
  const richBoxes = toBoxData(horizons, colors);
  const markerId = useId().replace(/[:]/g, '-');
  const markerIds = colors.map((_, index) => `three-horizons-arrow-${markerId}-${index}`);

  return (
    <figure className={`${localStyles.figure} ${localStyles.richFigure}`}>
      <div className={localStyles.richCanvas}>
        <div className={styles.shell}>
          <svg viewBox="0 0 1600 1000" role="img" aria-label="Three horizons transition graph">
            <defs>
              {colors.map((color, index) => (
                <marker key={color} id={markerIds[index]} markerWidth="15" markerHeight="15" refX="12" refY="7.5" orient="auto">
                  <path d="M0,0 L0,15 L15,7.5 z" fill={color} />
                </marker>
              ))}
            </defs>

            <line x1="56" y1="42" x2="56" y2="936" className={localStyles.axisLine} />
            <line x1="56" y1="936" x2="1570" y2="936" className={localStyles.axisLine} />
            <line x1="56" y1="512" x2="1570" y2="512" className={localStyles.guideLine} />
            <line x1="548" y1="56" x2="548" y2="936" className={localStyles.guideLine} />
            <line x1="1098" y1="56" x2="1098" y2="936" className={localStyles.guideLine} />

            <path
              d="M308 188 C 408 92 512 96 640 204 C 576 238 530 290 500 358 C 438 320 380 266 308 188 Z"
              className={localStyles.transitionShape}
            />
            <path
              d="M520 268 C 654 136 910 132 1038 276 C 1002 330 980 402 974 562 C 826 506 696 494 546 574 C 540 440 530 346 520 268 Z"
              className={localStyles.transitionShape}
            />
            <path
              d="M980 188 C 1080 94 1186 98 1312 206 C 1238 264 1180 320 1112 382 C 1088 308 1044 246 980 188 Z"
              className={localStyles.transitionShape}
            />

            <path
              d="M56 128 C 252 122 400 132 514 266 C 638 412 806 650 1120 800 C 1310 890 1480 894 1562 892"
              fill="none"
              stroke={colors[0]}
              strokeWidth="8"
              strokeLinecap="round"
              markerEnd={`url(#${markerIds[0]})`}
              className={localStyles.curve}
            />
            <path
              d="M56 690 C 262 706 386 620 486 450 C 630 204 844 162 1010 370 C 1138 536 1244 662 1408 706 C 1494 726 1548 718 1562 716"
              fill="none"
              stroke={colors[1]}
              strokeWidth="8"
              strokeLinecap="round"
              markerEnd={`url(#${markerIds[1]})`}
              className={localStyles.curve}
            />
            <path
              d="M56 806 C 256 808 396 764 560 690 C 798 574 944 372 1120 242 C 1304 108 1460 122 1562 126"
              fill="none"
              stroke={colors[2]}
              strokeWidth="8"
              strokeLinecap="round"
              markerEnd={`url(#${markerIds[2]})`}
              className={localStyles.curve}
            />

            {[{ label: 'H1', y: 128, color: colors[0] }, { label: 'H2', y: 676, color: colors[1] }, { label: 'H3', y: 806, color: colors[2] }].map((item) => (
              <g key={item.label} transform={`translate(56 ${item.y})`}>
                <circle r="24" fill={item.color} opacity="0.92" />
                <text x="0" y="7" textAnchor="middle" className={localStyles.axisBubbleLabel}>
                  {item.label}
                </text>
              </g>
            ))}

            <text x="24" y="512" textAnchor="middle" transform="rotate(-90 24 512)" className={localStyles.axisLabel}>
              PREVALENCE
            </text>
            <text x="1518" y="962" className={localStyles.axisLabel}>
              TIME
            </text>
            <text x="548" y="962" textAnchor="middle" className={localStyles.timeLabel}>
              {timeLabels.mid ?? ''}
            </text>
            <text x="76" y="962" className={localStyles.timeLabel}>
              {timeLabels.start ?? ''}
            </text>
            <text x="1458" y="962" textAnchor="end" className={localStyles.timeLabel}>
              {timeLabels.end ?? ''}
            </text>
          </svg>
        </div>

        {richBoxes.map((box) => (
          <section
            key={`${box.slot}-${box.title}`}
            className={localStyles.noteBox}
            data-slot={box.slot}
            style={{ ['--box-accent' as string]: box.color } as CSSProperties}
          >
            <header className={localStyles.noteBoxHeader}>
              <span className={localStyles.noteBoxNumber}>{box.number}</span>
              <span className={localStyles.noteBoxTitle}>{box.title}</span>
            </header>
            <div
              className={localStyles.noteGrid}
              style={{ ['--note-columns' as string]: String(noteColumnCount(box.notes)) } as CSSProperties}
            >
              {box.notes.map((note) => (
                <RichNote key={note.label} color={box.color} note={note} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </figure>
  );
}

function LegacyThreeHorizons({
  horizons,
  colors,
  timeLabels
}: {
  horizons: Horizon[];
  colors: string[];
  timeLabels: TimeLabels;
}) {
  return (
    <figure className={localStyles.figure}>
      <div className={styles.shell}>
        <svg viewBox="0 0 720 360" role="img" aria-label="Three horizons diagram">
          <path d="M80 70C210 80 250 180 340 245c70 52 165 45 290 32" fill="none" stroke={colors[0]} strokeWidth="10" strokeLinecap="round" opacity="0.9" />
          <path d="M90 265c78-44 130-103 212-110 88-7 147 54 228 78" fill="none" stroke={colors[1]} strokeWidth="10" strokeLinecap="round" opacity="0.9" />
          <path d="M160 300c78-118 155-171 245-171 94 0 166 60 226 144" fill="none" stroke={colors[2]} strokeWidth="10" strokeLinecap="round" opacity="0.9" />

          <text x="90" y="52" className={styles.label}>{String(horizons[0]?.label ?? 'Horizon 1')}</text>
          <text x="308" y="132" className={styles.label}>{String(horizons[1]?.label ?? 'Horizon 2')}</text>
          <text x="530" y="112" className={styles.label}>{String(horizons[2]?.label ?? 'Horizon 3')}</text>

          <line x1="90" y1="310" x2="635" y2="310" className={styles.line} />
          <text x="90" y="336" className={styles.label}>{timeLabels.start ?? 'Now'}</text>
          {timeLabels.mid ? <text x="360" y="336" textAnchor="middle" className={styles.label}>{timeLabels.mid}</text> : null}
          <text x="635" y="336" textAnchor="end" className={styles.label}>{timeLabels.end ?? 'Future'}</text>
        </svg>
      </div>
      <div className={localStyles.columns}>
        {horizons.map((horizon, index) => (
          <section key={index} className={localStyles.column}>
            <h4 style={{ color: colors[index] }}>{String(horizon.label ?? `Horizon ${index + 1}`)}</h4>
            <ul>
              {horizonItems(horizon.items).map((item, itemIndex) => (
                <li key={`${item}-${itemIndex}`}>{item}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </figure>
  );
}

export default function ThreeHorizons({ props }: { props?: Record<string, unknown> }) {
  const horizons = [
    ((props?.horizon1 as Horizon | undefined) ?? {}),
    ((props?.horizon2 as Horizon | undefined) ?? {}),
    ((props?.horizon3 as Horizon | undefined) ?? {})
  ];
  const timeLabels = (props?.timeLabels as TimeLabels | undefined) ?? {};

  const colors = [
    horizons[0].color ?? 'var(--color-warning)',
    horizons[1].color ?? 'var(--color-primary)',
    horizons[2].color ?? 'var(--color-success)'
  ];

  return isRichMode(horizons)
    ? <RichThreeHorizons horizons={horizons} colors={colors} timeLabels={timeLabels} />
    : <LegacyThreeHorizons horizons={horizons} colors={colors} timeLabels={timeLabels} />;
}
