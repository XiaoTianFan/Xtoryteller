import { CSSProperties, MouseEvent, startTransition, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import styles from '@/components/_shared/diagram.module.css';

import localStyles from './styles.module.css';

interface Layer {
  depth: string;
  label: string;
  items: string[];
}

interface AreaBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface PositionedNote {
  text: string;
  left: number;
  top: number;
  width: number;
  height: number;
  fontSize: number;
  lineClamp: number;
}

interface TooltipState {
  text: string;
  left: number;
  top: number;
  placement: 'top' | 'bottom';
  visible: boolean;
}

interface IcebergFit {
  renderWidth: number;
  renderHeight: number;
  left: number;
  top: number;
  scale: number;
}

const VIEWBOX_WIDTH = 1092;
const VIEWBOX_HEIGHT = 1206;
const HIDDEN_VIEWBOX_X = 250;
const HIDDEN_VIEWBOX_WIDTH = 842;

const ICEBERG_PATH = `
  M742 76
  L826 146
  L888 150
  L932 214
  L948 306
  L1038 412
  L1064 618
  L1026 704
  L968 848
  L886 942
  L860 1042
  L732 1162
  L706 1058
  L684 1116
  L644 1182
  L520 1030
  L434 900
  L360 722
  L374 636
  L322 598
  L336 550
  L334 430
  L420 358
  L468 214
  L524 214
  L564 132
  L658 126
  Z
`;

const CONTOUR_PATHS = [
  'M690 110 L754 178 L828 182 L896 224 L920 308',
  'M646 158 L724 210 L812 222 L880 264 L932 334',
  'M612 208 L700 252 L806 274 L900 326 L980 398',
  'M562 270 L644 324 L748 366 L854 424 L968 528',
  'M474 360 L596 446 L724 540 L852 646 L976 776',
  'M424 504 L560 592 L696 700 L806 820 L860 936',
  'M404 636 L522 742 L620 876 L686 1018 L722 1162',
  'M566 924 L634 978 L684 1048 L718 1132 L742 1192'
];

const TEMPLATE_COPY = [
  { title: 'LITANY', subtitle: '(events and trends)' },
  { title: 'STRUCTURES & SYSTEMS', subtitle: '(underlying causes)' },
  { title: 'WORLDVIEW & VALUES', subtitle: '(paradigms)' },
  { title: 'DEEP MYTHS', subtitle: '(metaphors)' }
];

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function normalizeDepth(depth: string) {
  const value = depth.trim().toLowerCase();

  if (['litany', 'surface', 'events', 'events-and-trends'].includes(value)) {
    return 'litany';
  }

  if (['structures', 'structure', 'patterns', 'systems', 'structures-and-systems'].includes(value)) {
    return 'structures';
  }

  if (['worldview', 'worldviews', 'values', 'worldview-and-values', 'mental-models', 'mental models'].includes(value)) {
    return 'worldview';
  }

  if (['myths', 'myth', 'metaphors', 'deep-myths', 'deep myths'].includes(value)) {
    return 'myths';
  }

  return value;
}

function resolveCopy(layer: Layer, index: number) {
  const normalizedDepth = normalizeDepth(layer.depth);
  const copyFromDepth =
    normalizedDepth === 'litany'
      ? TEMPLATE_COPY[0]
      : normalizedDepth === 'structures'
        ? TEMPLATE_COPY[1]
        : normalizedDepth === 'worldview'
          ? TEMPLATE_COPY[2]
          : normalizedDepth === 'myths'
            ? TEMPLATE_COPY[3]
            : TEMPLATE_COPY[index] ?? TEMPLATE_COPY.at(-1)!;

  return {
    title: String(layer.label ?? copyFromDepth.title),
    subtitle: copyFromDepth.subtitle
  };
}

function estimateLineCount(text: string, width: number, fontSize: number) {
  const safeWidth = Math.max(width, 80);
  const averageCharacterWidth = fontSize * 0.56;
  const charsPerLine = Math.max(8, Math.floor(safeWidth / Math.max(averageCharacterWidth, 1)));
  return text
    .split(/\s+/)
    .reduce(
      (state, word) => {
        const candidateLength = state.currentLength === 0 ? word.length : state.currentLength + word.length + 1;
        if (candidateLength <= charsPerLine) {
          return { lines: state.lines, currentLength: candidateLength };
        }

        return { lines: state.lines + 1, currentLength: word.length };
      },
      { lines: 1, currentLength: 0 }
    ).lines;
}

function fitFontSize(text: string, width: number, height: number) {
  const innerWidth = Math.max(width - 16, 52);
  const innerHeight = Math.max(height - 14, 38);

  for (let fontSize = 18; fontSize >= 8; fontSize -= 1) {
    const lineCount = estimateLineCount(text, innerWidth, fontSize);
    const totalHeight = lineCount * fontSize * 1.22;
    if (totalHeight <= innerHeight) {
      return fontSize;
    }
  }

  return 8;
}

function resolveColumns(area: AreaBox, itemCount: number, preferredColumns = 2) {
  if (itemCount <= 1) {
    return 1;
  }

  if (itemCount === 2) {
    return area.width >= 300 ? 2 : 1;
  }

  if (area.width < 260) {
    return 1;
  }

  return Math.min(preferredColumns, 2);
}

function noteAreaForLayer(index: number, waterY: number, labelsHidden: boolean): AreaBox {
  const structuresBottom = waterY + (VIEWBOX_HEIGHT - waterY) * 0.38;
  const worldviewBottom = waterY + (VIEWBOX_HEIGHT - waterY) * 0.73;
  const horizontalShift = labelsHidden ? 18 : 0;

  switch (index) {
    case 0:
      return {
        left: 520 + horizontalShift,
        top: 104,
        width: 398,
        height: Math.max(waterY - 132, 110)
      };
    case 1:
      return {
        left: 386 + horizontalShift,
        top: waterY + 28,
        width: 622,
        height: Math.max(structuresBottom - waterY - 54, 180)
      };
    case 2:
      return {
        left: 448 + horizontalShift,
        top: structuresBottom + 24,
        width: 516,
        height: Math.max(worldviewBottom - structuresBottom - 50, 180)
      };
    case 3:
    default:
      return {
        left: 560 + horizontalShift,
        top: worldviewBottom + 28,
        width: 276,
        height: Math.max(1116 - worldviewBottom, 160)
      };
  }
}

function buildNotes(items: string[], area: AreaBox, preferredColumns = 2): PositionedNote[] {
  if (!items.length) {
    return [];
  }

  const columns = resolveColumns(area, items.length, preferredColumns);
  const rows = Math.ceil(items.length / columns);
  const gapX = columns > 1 ? 16 : 0;
  const gapY = items.length > columns ? 14 : 0;
  const width = (area.width - gapX * (columns - 1)) / columns;
  const height = (area.height - gapY * (rows - 1)) / rows;

  return items.map((item, index) => {
    const row = Math.floor(index / columns);
    const column = index % columns;
    const fontSize = fitFontSize(item, width, height);
    return {
      text: item,
      left: area.left + column * (width + gapX),
      top: area.top + row * (height + gapY),
      width,
      height,
      fontSize,
      lineClamp: Math.max(2, Math.floor((height - 10) / Math.max(fontSize * 1.22, 1)))
    };
  });
}

function dividerPositions(waterY: number) {
  const structuresBottom = waterY + (VIEWBOX_HEIGHT - waterY) * 0.38;
  const worldviewBottom = waterY + (VIEWBOX_HEIGHT - waterY) * 0.73;

  return [waterY, structuresBottom, worldviewBottom];
}

export function computeIcebergContainFit({
  containerWidth,
  containerHeight,
  visibleWidth,
  visibleHeight = VIEWBOX_HEIGHT
}: {
  containerWidth: number;
  containerHeight: number;
  visibleWidth: number;
  visibleHeight?: number;
}): IcebergFit {
  const safeContainerWidth = Math.max(containerWidth, 0);
  const safeContainerHeight = Math.max(containerHeight, 0);

  if (safeContainerWidth === 0 || safeContainerHeight === 0 || visibleWidth <= 0 || visibleHeight <= 0) {
    return {
      renderWidth: 0,
      renderHeight: 0,
      left: 0,
      top: 0,
      scale: 0
    };
  }

  const scale = Math.min(safeContainerWidth / visibleWidth, safeContainerHeight / visibleHeight);

  return {
    renderWidth: visibleWidth * scale,
    renderHeight: visibleHeight * scale,
    left: 0,
    top: 0,
    scale
  };
}

export default function IcebergDiagram({ props }: { props?: Record<string, unknown> }) {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const clipPathId = useId().replace(/[:]/g, '-');
  const gradientId = `${clipPathId}-gradient`;
  const tooltipId = `iceberg-note-${clipPathId}`;
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const activeAnchorRef = useRef<HTMLElement | null>(null);
  const [boardSize, setBoardSize] = useState({ width: 0, height: 0 });
  const [tooltip, setTooltip] = useState<TooltipState>({
    text: '',
    left: 0,
    top: 0,
    placement: 'top',
    visible: false
  });
  const resolvedLayers = Array.isArray(props?.layers) ? (props.layers as Layer[]).slice(0, 4) : [];
  const showLabels = props?.showLabels !== false;
  const labelsHidden = !showLabels;
  const visibleX = labelsHidden ? HIDDEN_VIEWBOX_X : 0;
  const visibleWidth = labelsHidden ? HIDDEN_VIEWBOX_WIDTH : VIEWBOX_WIDTH;
  const waterline = clamp(Number(props?.waterlinePosition ?? 0.23), 0.18, 0.32);
  const waterY = waterline * VIEWBOX_HEIGHT;
  const [waterDivider, structuresDivider, worldviewDivider] = dividerPositions(waterY);
  const guideX1 = labelsHidden ? 300 : 22;
  const guideX2 = labelsHidden ? 1008 : VIEWBOX_WIDTH - 22;
  const fit = computeIcebergContainFit({
    containerWidth: boardSize.width,
    containerHeight: boardSize.height,
    visibleWidth
  });

  const layerNotes = resolvedLayers.map((layer, index) => ({
    copy: resolveCopy(layer, index),
    notes: buildNotes(layer.items ?? [], noteAreaForLayer(index, waterY, labelsHidden), 2),
    bandTop:
      index === 0
        ? 0
        : index === 1
          ? waterDivider
          : index === 2
            ? structuresDivider
            : worldviewDivider,
    bandBottom:
      index === 0
        ? waterDivider
        : index === 1
          ? structuresDivider
          : index === 2
            ? worldviewDivider
            : VIEWBOX_HEIGHT
  }));

  const stopClusterNavigation = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
  };

  useEffect(() => {
    const board = boardRef.current;
    if (!board) {
      return;
    }

    const updateSize = (width: number, height: number) => {
      setBoardSize((current) =>
        Math.abs(current.width - width) > 0.5 || Math.abs(current.height - height) > 0.5
          ? { width, height }
          : current
      );
    };

    const measureBoard = () => {
      const rect = board.getBoundingClientRect();
      updateSize(Math.max(rect.width, board.clientWidth, 0), Math.max(rect.height, board.clientHeight, 0));
    };

    measureBoard();

    const observer = new ResizeObserver((entries) => {
      const entry = entries.find((item) => item.target === board);
      if (!entry) {
        measureBoard();
        return;
      }

      updateSize(
        Math.max(entry.contentRect.width, board.clientWidth, 0),
        Math.max(entry.contentRect.height, board.clientHeight, 0)
      );
    });
    observer.observe(board);

    return () => {
      observer.disconnect();
    };
  }, [visibleWidth]);

  useEffect(() => {
    if (!tooltip.visible || !tooltip.text) {
      return;
    }

    let frame = 0;

    const updatePosition = () => {
      const anchor = activeAnchorRef.current;
      const tooltipElement = tooltipRef.current;
      if (!anchor || !tooltipElement) {
        return;
      }

      const anchorRect = anchor.getBoundingClientRect();
      const tooltipRect = tooltipElement.getBoundingClientRect();
      const gap = 12;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      let placement: 'top' | 'bottom' = 'top';
      let top = anchorRect.top - tooltipRect.height - gap;

      if (top < 12) {
        placement = 'bottom';
        top = anchorRect.bottom + gap;
      }

      if (top + tooltipRect.height > viewportHeight - 12) {
        top = Math.max(12, viewportHeight - tooltipRect.height - 12);
      }

      const centeredLeft = anchorRect.left + anchorRect.width / 2 - tooltipRect.width / 2;
      const left = Math.min(Math.max(12, centeredLeft), viewportWidth - tooltipRect.width - 12);

      startTransition(() => {
        setTooltip((current) => ({
          ...current,
          left,
          top,
          placement
        }));
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
    if (activeAnchorRef.current) {
      observer.observe(activeAnchorRef.current);
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
  }, [tooltip.visible, tooltip.text]);

  const showTooltip = (event: { currentTarget: HTMLButtonElement }, text: string) => {
    activeAnchorRef.current = event.currentTarget;
    startTransition(() => {
      setTooltip({
        text,
        left: 0,
        top: 0,
        placement: 'top',
        visible: true
      });
    });
  };

  const hideTooltip = () => {
    activeAnchorRef.current = null;
    startTransition(() => {
      setTooltip((current) => ({ ...current, visible: false }));
    });
  };

  const noteTooltip = tooltip.visible && tooltip.text && typeof document !== 'undefined'
    ? createPortal(
        <div
          ref={tooltipRef}
          id={tooltipId}
          role="tooltip"
          className={localStyles.tooltip}
          data-placement={tooltip.placement}
          style={{
            left: tooltip.left,
            top: tooltip.top
          }}
        >
          <span className={localStyles.tooltipEyebrow}>Layer note</span>
          <p>{tooltip.text}</p>
        </div>,
        document.body
      )
    : null;

  return (
    <figure className={`${styles.shell} ${localStyles.figure}`}>
      <div
        ref={boardRef}
        className={`${localStyles.board} ${labelsHidden ? localStyles.boardLabelsHidden : ''}`}
        data-iceberg-board="true"
      >
        <div
          className={localStyles.canvasViewport}
          data-iceberg-viewport="true"
          data-fit-left={fit.left.toFixed(2)}
          data-fit-top={fit.top.toFixed(2)}
          data-fit-width={fit.renderWidth.toFixed(2)}
          data-fit-height={fit.renderHeight.toFixed(2)}
          data-fit-scale={fit.scale.toFixed(4)}
          data-visible-width={visibleWidth}
          style={
            {
              left: `${fit.left}px`,
              top: `${fit.top}px`,
              width: `${visibleWidth}px`,
              height: `${VIEWBOX_HEIGHT}px`,
              transform: `scale(${fit.scale})`
            } as CSSProperties
          }
        >
          <svg
            viewBox={`${visibleX} 0 ${visibleWidth} ${VIEWBOX_HEIGHT}`}
            preserveAspectRatio="xMinYMin meet"
            role="img"
            aria-label="Iceberg diagram"
            className={localStyles.svg}
          >
            <defs>
              <clipPath id={clipPathId}>
                <path d={ICEBERG_PATH} />
              </clipPath>
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="color-mix(in srgb, var(--color-surface) 88%, white 12%)" />
                <stop offset={`${(waterY / VIEWBOX_HEIGHT) * 100}%`} stopColor="color-mix(in srgb, var(--color-surface) 84%, var(--color-panel, var(--color-background)) 16%)" />
                <stop offset={`${(waterY / VIEWBOX_HEIGHT) * 100}%`} stopColor="color-mix(in srgb, var(--color-panel, var(--color-surface)) 86%, var(--color-secondary) 14%)" />
                <stop offset="100%" stopColor="color-mix(in srgb, var(--color-panel, var(--color-surface)) 80%, var(--color-secondary) 20%)" />
              </linearGradient>
            </defs>

            <rect x="0" y="0" width={VIEWBOX_WIDTH} height={VIEWBOX_HEIGHT} fill="transparent" />

            {[waterDivider, structuresDivider, worldviewDivider].map((dividerY, index) => (
              <line key={index} x1={guideX1} x2={guideX2} y1={dividerY} y2={dividerY} className={index === 0 ? localStyles.waterline : localStyles.divider} />
            ))}

            <path d={ICEBERG_PATH} fill={`url(#${gradientId})`} className={localStyles.iceberg} />
            <rect x="0" y={waterY} width={VIEWBOX_WIDTH} height={VIEWBOX_HEIGHT - waterY} clipPath={`url(#${clipPathId})`} className={localStyles.underwaterTint} />

            <g clipPath={`url(#${clipPathId})`} className={localStyles.contours}>
              {CONTOUR_PATHS.map((path, index) => (
                <path key={index} d={path} />
              ))}
            </g>
          </svg>

          {showLabels ? (
            <div className={localStyles.overlay} aria-hidden="true">
              {layerNotes.map((layer, index) => {
                const centerY = (layer.bandTop + layer.bandBottom) / 2;
                return (
                  <section
                    key={`label-${index}`}
                    className={localStyles.labelBlock}
                    style={{ top: `${(centerY / VIEWBOX_HEIGHT) * 100}%` }}
                  >
                    <p className={localStyles.labelTitle}>{layer.copy.title}</p>
                    <p className={localStyles.labelSubtitle}>{layer.copy.subtitle}</p>
                  </section>
                );
              })}
            </div>
          ) : null}

          <div className={localStyles.noteLayer}>
            {layerNotes.flatMap((layer, layerIndex) =>
              layer.notes.map((note, noteIndex) => (
                <button
                  key={`${layerIndex}-${noteIndex}-${note.text}`}
                  type="button"
                  className={localStyles.note}
                  data-iceberg-note="true"
                  data-layer-index={layerIndex}
                  aria-label={note.text}
                  aria-describedby={tooltip.visible && tooltip.text === note.text ? tooltipId : undefined}
                  onClick={stopClusterNavigation}
                  onMouseDown={stopClusterNavigation}
                  onMouseEnter={(event) => showTooltip(event, note.text)}
                  onMouseLeave={hideTooltip}
                  onFocus={(event) => showTooltip(event, note.text)}
                  onBlur={hideTooltip}
                  style={{
                    left: `${((note.left - visibleX) / visibleWidth) * 100}%`,
                    top: `${(note.top / VIEWBOX_HEIGHT) * 100}%`,
                    width: `${(note.width / visibleWidth) * 100}%`,
                    height: `${(note.height / VIEWBOX_HEIGHT) * 100}%`,
                    fontSize: `${note.fontSize}px`,
                    ['--iceberg-line-clamp' as string]: String(note.lineClamp)
                  }}
                >
                  <span>{note.text}</span>
                </button>
              ))
            )}
          </div>
          {noteTooltip}
        </div>
      </div>
    </figure>
  );
}
