'use client';

import { CSSProperties, startTransition, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { Markdown } from '@/components/_shared/markdown';

import localStyles from './styles.module.css';

type SectionKey = 'strategy' | 'actors' | 'support';
type PhaseSize = 'sm' | 'md' | 'lg';

interface RoadmapItem {
  label?: string;
  detail?: string;
}

interface RoadmapSection {
  title?: string;
  subtitle?: string;
  items?: RoadmapItem[];
}

interface RoadmapPhase {
  label?: string;
  dateRange?: string;
  size?: PhaseSize;
  strategy?: RoadmapSection;
  actors?: RoadmapSection;
  support?: RoadmapSection;
}

interface TooltipPosition {
  left: number;
  top: number;
  placement: 'top' | 'bottom';
  visible: boolean;
}

interface PhaseMetrics {
  outerRadius: number;
  innerRadius: number;
  strategyChipHeight: number;
  bandChipHeight: number;
  bandLabelWidth: number;
  titleChars: number;
  subtitleChars: number;
}

interface NormalizedItem {
  key: string;
  label: string;
  detail: string;
}

interface NormalizedSection {
  title: string;
  subtitle: string;
  items: NormalizedItem[];
}

interface NormalizedPhase {
  label: string;
  dateRange: string;
  size: PhaseSize;
  strategy: NormalizedSection;
  actors: NormalizedSection;
  support: NormalizedSection;
}

interface PhaseGeometry {
  centerX: number;
  centerY: number;
  outerRadius: number;
  innerRadius: number;
  color: string;
  metrics: PhaseMetrics;
}

interface AngleRange {
  start: number;
  end: number;
}

interface LabelPlacementConfig {
  anchorAngle: number;
  ringFactor: number;
  radialOffset: number;
}

interface SectionArcConfig {
  ranges: AngleRange[];
  label: LabelPlacementConfig;
  preferredRows: number;
  ringFactor: number;
  rowSpacing: number;
  minDegreesPerItem: number;
}

interface TitleLayout {
  titleLines: string[];
  subtitleLines: string[];
  titleFontSize: number;
  subtitleFontSize: number;
  titleLineHeight: number;
  subtitleLineHeight: number;
  titleStartY: number;
  subtitleStartY: number;
  totalHeight: number;
  titleBottom: number;
}

interface BandLabelPlacement {
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  anchorAngle: number;
}

interface PhaseBadgeLayout {
  x: number;
  y: number;
  width: number;
  height: number;
  dateFontSize: number;
  dateY: number;
  labelFontSize: number;
  labelLineHeight: number;
  labelY: number;
  labelLines: string[];
}

interface ItemLayout {
  key: string;
  label: string;
  detail: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  section: SectionKey;
  phaseIndex: number;
  fontSize: number;
  lineClamp: number;
}

interface HorizontalBounds {
  minX: number;
  maxX: number;
  width: number;
  offsetX: number;
}

const VIEWBOX_HEIGHT = 920;
const HORIZONTAL_VIEWBOX_PADDING = 24;
const PHASE_COLORS = ['var(--color-warning)', 'var(--color-primary)', 'var(--color-success)'] as const;
const DEFAULT_PHASE_LABELS = ['Pilot: Incubating', 'Scale: Connecting', 'Practice: Embedded in the Regime'];

export const ROADMAP_TOP_PADDING = 40;

const PRACTICE_CENTER_X = 1416;
const PRACTICE_TO_SCALE_DY = 150;
const SCALE_TO_PILOT_DY = 140;
const ACTOR_LABEL_ANGLE = 270;
const SUPPORT_LABEL_ANGLE = 90;
const BAND_LABEL_EXCLUSION = 16;

const SIZE_METRICS: Record<PhaseSize, PhaseMetrics> = {
  sm: {
    outerRadius: 205,
    innerRadius: 120,
    strategyChipHeight: 30,
    bandChipHeight: 28,
    bandLabelWidth: 164,
    titleChars: 18,
    subtitleChars: 22
  },
  md: {
    outerRadius: 270,
    innerRadius: 150,
    strategyChipHeight: 32,
    bandChipHeight: 30,
    bandLabelWidth: 178,
    titleChars: 22,
    subtitleChars: 28
  },
  lg: {
    outerRadius: 320,
    innerRadius: 182,
    strategyChipHeight: 34,
    bandChipHeight: 30,
    bandLabelWidth: 192,
    titleChars: 24,
    subtitleChars: 30
  }
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function degreesToRadians(value: number) {
  return (value * Math.PI) / 180;
}

function polarPoint(centerX: number, centerY: number, radius: number, angle: number) {
  const radians = degreesToRadians(angle);
  return {
    x: centerX + Math.cos(radians) * radius,
    y: centerY + Math.sin(radians) * radius
  };
}

function outwardNormal(angle: number) {
  const radians = degreesToRadians(angle);
  return {
    x: Math.cos(radians),
    y: Math.sin(radians)
  };
}

function tangentVector(angle: number) {
  const radians = degreesToRadians(angle);
  return {
    x: -Math.sin(radians),
    y: Math.cos(radians)
  };
}

function tangentDx(leftRadius: number, rightRadius: number, dy: number) {
  return Math.sqrt(Math.max(0, (leftRadius + rightRadius) ** 2 - dy ** 2));
}

function estimateTextWidth(text: string, fontSize: number) {
  return text.length * fontSize * 0.58;
}

function estimateWrappedLineCount(text: string, width: number, fontSize: number) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (!words.length) {
    return 0;
  }

  const charsPerLine = Math.max(4, Math.floor(width / Math.max(fontSize * 0.56, 1)));
  let lines = 1;
  let currentLength = 0;

  for (const word of words) {
    const candidate = currentLength === 0 ? word.length : currentLength + 1 + word.length;
    if (candidate <= charsPerLine) {
      currentLength = candidate;
      continue;
    }

    lines += 1;
    currentLength = word.length;
  }

  return lines;
}

export function fitSvgLabelFontSize(text: string, maxWidth: number, max = 12, min = 9) {
  const safeText = text.trim();
  if (!safeText) {
    return max;
  }

  for (let fontSize = max; fontSize >= min; fontSize -= 0.25) {
    if (estimateTextWidth(safeText, fontSize) <= maxWidth) {
      return Number(fontSize.toFixed(2));
    }
  }

  return min;
}

export function fitChipFontSize(text: string, width: number, height: number, lineClamp = 2, max = 12, min = 8) {
  const safeText = text.trim();
  if (!safeText) {
    return max;
  }

  for (let fontSize = max; fontSize >= min; fontSize -= 0.25) {
    const lineCount = estimateWrappedLineCount(safeText, width, fontSize);
    const totalHeight = lineCount * fontSize * 1.14;
    if (lineCount <= lineClamp && totalHeight <= height) {
      return Number(fontSize.toFixed(2));
    }
  }

  return min;
}

function longestLineLength(lines: string[]) {
  return lines.reduce((max, line) => Math.max(max, line.length), 0);
}

function wrapWords(value: string, maxChars: number, maxLines = 3) {
  const text = value.trim();
  if (!text) {
    return [];
  }

  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxChars || !current) {
      current = next;
      continue;
    }

    lines.push(current);
    current = word;
  }

  if (current) {
    lines.push(current);
  }

  if (lines.length <= maxLines) {
    return lines;
  }

  const kept = lines.slice(0, maxLines);
  kept[maxLines - 1] = `${kept[maxLines - 1].replace(/\.\.\.$/, '')}...`;
  return kept;
}

function normalizeItems(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry, index) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const item = entry as RoadmapItem;
      const label = String(item.label ?? '').trim();
      const detail = String(item.detail ?? '').trim();

      if (!label) {
        return null;
      }

      return {
        key: `${label}-${index}`,
        label,
        detail
      };
    })
    .filter(Boolean) as NormalizedItem[];
}

function normalizeSection(value: unknown): NormalizedSection {
  if (!value || typeof value !== 'object') {
    return {
      title: '',
      subtitle: '',
      items: []
    };
  }

  const section = value as RoadmapSection;
  return {
    title: String(section.title ?? '').trim(),
    subtitle: String(section.subtitle ?? '').trim(),
    items: normalizeItems(section.items)
  };
}

function normalizePhase(value: unknown, index: number): NormalizedPhase {
  const fallbackSize = (['sm', 'md', 'lg'][index] ?? 'md') as PhaseSize;

  if (!value || typeof value !== 'object') {
    return {
      label: DEFAULT_PHASE_LABELS[index] ?? `Phase ${index + 1}`,
      dateRange: '',
      size: fallbackSize,
      strategy: normalizeSection(undefined),
      actors: normalizeSection(undefined),
      support: normalizeSection(undefined)
    };
  }

  const phase = value as RoadmapPhase;
  const size = phase.size === 'sm' || phase.size === 'md' || phase.size === 'lg' ? phase.size : fallbackSize;

  return {
    label: String(phase.label ?? DEFAULT_PHASE_LABELS[index] ?? `Phase ${index + 1}`).trim(),
    dateRange: String(phase.dateRange ?? '').trim(),
    size,
    strategy: normalizeSection(phase.strategy),
    actors: normalizeSection(phase.actors),
    support: normalizeSection(phase.support)
  };
}

function renderTextLines(lines: string[], x: number, y: number, lineHeight: number, className: string, fontSize?: number) {
  if (!lines.length) {
    return null;
  }

  return (
    <text x={x} y={y} textAnchor="middle" className={className} style={fontSize ? ({ fontSize } as CSSProperties) : undefined}>
      {lines.map((line, index) => (
        <tspan key={`${line}-${index}`} x={x} dy={index === 0 ? 0 : lineHeight}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

function percent(value: number, total: number) {
  return `${(value / total) * 100}%`;
}

function normalizeHorizontalBounds(minX: number, maxX: number): HorizontalBounds {
  const width = Math.max(1, maxX - minX + HORIZONTAL_VIEWBOX_PADDING * 2);

  return {
    minX,
    maxX,
    width,
    offsetX: HORIZONTAL_VIEWBOX_PADDING - minX
  };
}

function offsetBandLabelPlacement(placement: BandLabelPlacement, offsetX: number): BandLabelPlacement {
  return {
    ...placement,
    x: placement.x + offsetX
  };
}

function offsetPhaseBadgeLayout(layout: PhaseBadgeLayout, offsetX: number): PhaseBadgeLayout {
  return {
    ...layout,
    x: layout.x + offsetX
  };
}

function offsetItemLayout(item: ItemLayout, offsetX: number): ItemLayout {
  return {
    ...item,
    x: item.x + offsetX
  };
}

function computeHorizontalBounds(
  geometries: PhaseGeometry[],
  actorPlacements: BandLabelPlacement[],
  supportPlacements: BandLabelPlacement[],
  phaseBadges: PhaseBadgeLayout[],
  items: ItemLayout[]
) {
  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;

  const includeRange = (start: number, end: number) => {
    minX = Math.min(minX, start);
    maxX = Math.max(maxX, end);
  };

  geometries.forEach((geometry) => {
    includeRange(geometry.centerX - geometry.outerRadius, geometry.centerX + geometry.outerRadius);
  });

  actorPlacements.forEach((placement) => {
    includeRange(placement.x - placement.width / 2, placement.x + placement.width / 2);
  });

  supportPlacements.forEach((placement) => {
    includeRange(placement.x - placement.width / 2, placement.x + placement.width / 2);
  });

  phaseBadges.forEach((badge) => {
    includeRange(badge.x - badge.width / 2, badge.x + badge.width / 2);
  });

  items.forEach((item) => {
    includeRange(item.x - item.width / 2, item.x + item.width / 2);
  });

  return normalizeHorizontalBounds(minX, maxX);
}

function distributeAngles(start: number, end: number, count: number) {
  if (count <= 0) {
    return [];
  }

  if (count === 1) {
    return [(start + end) / 2];
  }

  return Array.from({ length: count }, (_, index) => start + ((end - start) * index) / (count - 1));
}

function splitIntoRows<T>(items: T[], rowCount: number) {
  if (rowCount <= 1 || items.length <= 1) {
    return [items];
  }

  const rows: T[][] = [];
  let start = 0;
  let remaining = items.length;
  let remainingRows = rowCount;

  while (remainingRows > 0) {
    const take = Math.ceil(remaining / remainingRows);
    rows.push(items.slice(start, start + take));
    start += take;
    remaining -= take;
    remainingRows -= 1;
  }

  return rows.filter((row) => row.length > 0);
}

function computeTitleLayout(phase: NormalizedPhase, geometry: PhaseGeometry): TitleLayout {
  const maxTitleWidth = geometry.innerRadius * 1.42;
  const maxSubtitleWidth = geometry.innerRadius * 1.28;
  const titleLines = wrapWords(phase.strategy.title, geometry.metrics.titleChars, 2);
  const subtitleLines = wrapWords(phase.strategy.subtitle, geometry.metrics.subtitleChars, 2);
  const titleFontSize = fitSvgLabelFontSize('W'.repeat(longestLineLength(titleLines)), maxTitleWidth, geometry.outerRadius >= 300 ? 31 : 29, 19);
  const subtitleFontSize = fitSvgLabelFontSize('W'.repeat(longestLineLength(subtitleLines)), maxSubtitleWidth, 18, 11.5);
  const titleLineHeight = titleFontSize * 1.05;
  const subtitleLineHeight = subtitleFontSize * 1.08;
  const titleHeight = titleLines.length * titleLineHeight;
  const subtitleHeight = subtitleLines.length ? subtitleLines.length * subtitleLineHeight : 0;
  const gap = subtitleLines.length ? 12 : 0;
  const totalHeight = titleHeight + gap + subtitleHeight;
  const titleTop = geometry.centerY - totalHeight / 2;
  const subtitleTop = titleTop + titleHeight + gap;

  return {
    titleLines,
    subtitleLines,
    titleFontSize,
    subtitleFontSize,
    titleLineHeight,
    subtitleLineHeight,
    titleStartY: titleTop + titleFontSize * 0.88,
    subtitleStartY: subtitleTop + subtitleFontSize * 0.88,
    totalHeight,
    titleBottom: geometry.centerY + totalHeight / 2
  };
}

export function computePhaseGeometry(phases: NormalizedPhase[]) {
  const metricsByPhase = phases.map((phase) => SIZE_METRICS[phase.size]);
  const practiceMetrics = metricsByPhase[2];
  const scaleMetrics = metricsByPhase[1];
  const pilotMetrics = metricsByPhase[0];

  const practice = {
    centerX: PRACTICE_CENTER_X,
    centerY: ROADMAP_TOP_PADDING + practiceMetrics.outerRadius,
    outerRadius: practiceMetrics.outerRadius,
    innerRadius: practiceMetrics.innerRadius,
    color: PHASE_COLORS[2],
    metrics: practiceMetrics
  };

  const scale = {
    centerX: 0,
    centerY: practice.centerY + PRACTICE_TO_SCALE_DY,
    outerRadius: scaleMetrics.outerRadius,
    innerRadius: scaleMetrics.innerRadius,
    color: PHASE_COLORS[1],
    metrics: scaleMetrics
  };
  const scaleDx = tangentDx(scale.outerRadius, practice.outerRadius, PRACTICE_TO_SCALE_DY);
  scale.centerX = practice.centerX - scaleDx;

  const pilot = {
    centerX: 0,
    centerY: scale.centerY + SCALE_TO_PILOT_DY,
    outerRadius: pilotMetrics.outerRadius,
    innerRadius: pilotMetrics.innerRadius,
    color: PHASE_COLORS[0],
    metrics: pilotMetrics
  };
  const pilotDx = tangentDx(pilot.outerRadius, scale.outerRadius, SCALE_TO_PILOT_DY);
  pilot.centerX = scale.centerX - pilotDx;

  return [pilot, scale, practice] as PhaseGeometry[];
}

export function computeBandLabelPlacement(
  geometry: PhaseGeometry,
  phaseIndex: number,
  section: Exclude<SectionKey, 'strategy'>,
  title: string
): BandLabelPlacement {
  const config = resolveSectionArcConfig(phaseIndex, section).label;
  const ringThickness = geometry.outerRadius - geometry.innerRadius;
  const radius = geometry.innerRadius + ringThickness * config.ringFactor + config.radialOffset;
  const anchor = polarPoint(geometry.centerX, geometry.centerY, radius, config.anchorAngle);
  const baseWidth = geometry.metrics.bandLabelWidth;
  const padding = 28;
  const fontSize = fitSvgLabelFontSize(title, baseWidth - padding, 12, 9);
  const requiredWidth = estimateTextWidth(title, fontSize) + padding;
  const width = clamp(Math.max(baseWidth, requiredWidth), baseWidth, baseWidth + 42);

  return {
    x: anchor.x,
    y: anchor.y,
    width,
    height: 34,
    fontSize: fitSvgLabelFontSize(title, width - padding, 12, 9),
    anchorAngle: config.anchorAngle
  };
}

function computePhaseBadgeLayout(phase: NormalizedPhase, geometry: PhaseGeometry): PhaseBadgeLayout {
  const width = clamp(geometry.outerRadius * 1.18, 228, 340);
  const height = geometry.outerRadius >= 300 ? 66 : 60;
  const top = geometry.centerY + geometry.outerRadius + 8;
  const y = top + height / 2;
  const labelLines = wrapWords(phase.label, geometry.outerRadius >= 300 ? 29 : geometry.outerRadius <= 210 ? 21 : 25, 2);
  const dateFontSize = geometry.outerRadius >= 300 ? 14.5 : 13.5;
  const labelFontSize = fitSvgLabelFontSize(
    'W'.repeat(longestLineLength(labelLines)),
    width - 30,
    geometry.outerRadius >= 300 ? 15.5 : 14.5,
    11.5
  );
  const labelLineHeight = labelFontSize * 1.06;

  return {
    x: geometry.centerX,
    y,
    width,
    height,
    dateFontSize,
    dateY: top + 18,
    labelFontSize,
    labelLineHeight,
    labelY: top + 36,
    labelLines
  };
}

function resolveSectionArcConfig(phaseIndex: number, section: Exclude<SectionKey, 'strategy'>): SectionArcConfig {
  const label = section === 'actors'
    ? {
        anchorAngle: ACTOR_LABEL_ANGLE,
        ringFactor: 0.55,
        radialOffset: 0
      }
    : {
        anchorAngle: SUPPORT_LABEL_ANGLE,
        ringFactor: 0.53,
        radialOffset: 0
      };

  if (section === 'actors') {
    if (phaseIndex === 0) {
      return {
        ranges: [
          { start: 184, end: 242 },
          { start: 298, end: 356 }
        ],
        label,
        preferredRows: 2,
        ringFactor: 0.74,
        rowSpacing: 18,
        minDegreesPerItem: 23
      };
    }

    if (phaseIndex === 1) {
      return {
        ranges: [
          { start: 188, end: 244 },
          { start: 296, end: 352 }
        ],
        label,
        preferredRows: 2,
        ringFactor: 0.72,
        rowSpacing: 20,
        minDegreesPerItem: 22
      };
    }

    return {
      ranges: [
        { start: 188, end: 248 },
        { start: 292, end: 352 }
      ],
      label,
      preferredRows: 2,
      ringFactor: 0.72,
      rowSpacing: 22,
      minDegreesPerItem: 21
    };
  }

  if (phaseIndex === 0) {
    return {
      ranges: [
        { start: 12, end: 64 },
        { start: 118, end: 170 }
      ],
      label,
      preferredRows: 2,
      ringFactor: 0.68,
      rowSpacing: 16,
      minDegreesPerItem: 22
    };
  }

  if (phaseIndex === 1) {
    return {
      ranges: [
        { start: 10, end: 66 },
        { start: 114, end: 170 }
      ],
      label,
      preferredRows: 2,
      ringFactor: 0.67,
      rowSpacing: 18,
      minDegreesPerItem: 21
    };
  }

  return {
    ranges: [
      { start: 10, end: 68 },
      { start: 112, end: 170 }
    ],
    label,
    preferredRows: 2,
    ringFactor: 0.66,
    rowSpacing: 20,
    minDegreesPerItem: 20
  };
}

function splitItemsAcrossRanges(items: NormalizedItem[], ranges: AngleRange[]) {
  if (!ranges.length) {
    return [];
  }

  if (ranges.length === 1) {
    return [{ range: ranges[0], items }];
  }

  const totalSpan = ranges.reduce((sum, range) => sum + Math.max(0, range.end - range.start), 0);
  let consumed = 0;

  return ranges.map((range, index) => {
    const remainingItems = items.length - consumed;
    const remainingRanges = ranges.length - index;
    const ideal = totalSpan > 0 ? Math.round((items.length * (range.end - range.start)) / totalSpan) : 0;
    const count = index === ranges.length - 1
      ? remainingItems
      : clamp(Math.max(1, ideal), 1, Math.max(1, remainingItems - (remainingRanges - 1)));
    const slice = items.slice(consumed, consumed + count);
    consumed += count;
    return { range, items: slice };
  });
}

function layoutArcRow(
  rowItems: NormalizedItem[],
  range: AngleRange,
  rowRadius: number,
  geometry: PhaseGeometry,
  phaseIndex: number,
  section: Exclude<SectionKey, 'strategy'>,
  minDegreesPerItem: number
) {
  if (!rowItems.length) {
    return [];
  }

  const totalSpan = range.end - range.start;
  const requiredSpan = Math.min(totalSpan, Math.max(minDegreesPerItem * Math.max(rowItems.length - 1, 1), totalSpan * 0.72));
  const start = range.start + (totalSpan - requiredSpan) / 2;
  const end = range.end - (totalSpan - requiredSpan) / 2;
  const angles = distributeAngles(start, end, rowItems.length);
  const step = rowItems.length <= 1 ? totalSpan : (end - start) / Math.max(rowItems.length - 1, 1);

  return rowItems.map((item, itemIndex) => {
    const angle = angles[itemIndex];
    const point = polarPoint(geometry.centerX, geometry.centerY, rowRadius, angle);
    const arcWidth = rowRadius * degreesToRadians(Math.max(step * 0.82, minDegreesPerItem - 1));
    const width = clamp(arcWidth, 84, geometry.outerRadius >= 300 ? 136 : geometry.outerRadius <= 210 ? 112 : 124);
    const height = geometry.metrics.bandChipHeight + 4;
    const fontSize = fitChipFontSize(item.label, width - 18, height - 8, 2, 11.25, 7.5);

    return {
      key: item.key,
      label: item.label,
      detail: item.detail,
      x: point.x,
      y: point.y,
      width,
      height,
      color: geometry.color,
      section,
      phaseIndex,
      fontSize,
      lineClamp: 2
    } satisfies ItemLayout;
  });
}

function boxesOverlap(a: ItemLayout, b: ItemLayout) {
  const ax1 = a.x - a.width / 2;
  const ax2 = a.x + a.width / 2;
  const ay1 = a.y - a.height / 2;
  const ay2 = a.y + a.height / 2;
  const bx1 = b.x - b.width / 2;
  const bx2 = b.x + b.width / 2;
  const by1 = b.y - b.height / 2;
  const by2 = b.y + b.height / 2;

  return ax1 < bx2 && ax2 > bx1 && ay1 < by2 && ay2 > by1;
}

function anyOverlaps(layouts: ItemLayout[]) {
  for (let index = 0; index < layouts.length; index += 1) {
    for (let compareIndex = index + 1; compareIndex < layouts.length; compareIndex += 1) {
      if (boxesOverlap(layouts[index], layouts[compareIndex])) {
        return true;
      }
    }
  }

  return false;
}

export function layoutArcChips(
  section: Exclude<SectionKey, 'strategy'>,
  items: NormalizedItem[],
  geometry: PhaseGeometry,
  phaseIndex: number
) {
  if (!items.length) {
    return [];
  }

  const config = resolveSectionArcConfig(phaseIndex, section);
  const ringThickness = geometry.outerRadius - geometry.innerRadius;
  const baseRadius = geometry.innerRadius + ringThickness * config.ringFactor;
  const rangeGroups = splitItemsAcrossRanges(items, config.ranges);

  return rangeGroups.flatMap(({ range, items: rangeItems }) => {
    if (!rangeItems.length) {
      return [];
    }

    const labelAnchor = config.label.anchorAngle;
    let adjustedRange = { ...range };
    if (range.start <= labelAnchor && range.end >= labelAnchor) {
      adjustedRange = {
        start: range.start,
        end: labelAnchor - BAND_LABEL_EXCLUSION
      };
    }

    const span = Math.max(1, adjustedRange.end - adjustedRange.start);
    const computedRows = Math.ceil((rangeItems.length * config.minDegreesPerItem) / span);
    let rowCount = clamp(Math.max(config.preferredRows, computedRows), 1, 3);
    let layouts: ItemLayout[] = [];

    while (rowCount <= 3) {
      const rows = splitIntoRows(rangeItems, rowCount);
      const rowOffsets = rowCount === 1
        ? [0]
        : Array.from({ length: rowCount }, (_, index) => (index - (rowCount - 1) / 2) * config.rowSpacing);

      layouts = rows.flatMap((rowItems, rowIndex) => {
        const rowRadius = clamp(
          baseRadius + rowOffsets[Math.min(rowIndex, rowOffsets.length - 1)],
          geometry.innerRadius + 18,
          geometry.outerRadius - 14
        );

        return layoutArcRow(
          rowItems,
          adjustedRange,
          rowRadius,
          geometry,
          phaseIndex,
          section,
          config.minDegreesPerItem
        );
      });

      if (!anyOverlaps(layouts)) {
        return layouts;
      }

      rowCount += 1;
    }

    return layouts;
  });
}

export function layoutInnerStrategyChips(
  items: NormalizedItem[],
  geometry: PhaseGeometry,
  phaseIndex: number,
  titleBottom: number
) {
  if (!items.length) {
    return [];
  }

  const rowCount = items.length >= 4 ? 2 : 1;
  const rows = splitIntoRows(items, rowCount);
  const topBoundary = Math.max(geometry.centerY + 18, titleBottom + (phaseIndex < 2 ? 34 : 24));
  const bottomBoundary = geometry.centerY + geometry.innerRadius - 18;
  const availableHeight = Math.max(20, bottomBoundary - topBoundary);
  const rowYs = rowCount === 1
    ? [topBoundary + availableHeight * 0.6]
    : phaseIndex < 2
      ? [topBoundary + availableHeight * 0.36, topBoundary + availableHeight * 0.8]
      : [topBoundary + availableHeight * 0.3, topBoundary + availableHeight * 0.74];

  return rows.flatMap((rowItems, rowIndex) => {
    const y = rowYs[Math.min(rowIndex, rowYs.length - 1)];
    const dy = Math.abs(y - geometry.centerY);
    const chordHalf = Math.max(42, Math.sqrt(Math.max(0, geometry.innerRadius ** 2 - dy ** 2)) - 14);
    const totalWidth = chordHalf * 2;
    const gap = phaseIndex === 0 ? 10 : 12;
    const width = clamp(
      (totalWidth - gap * Math.max(rowItems.length - 1, 0)) / rowItems.length,
      82,
      geometry.outerRadius >= 300 ? 138 : phaseIndex === 0 ? 108 : 122
    );
    const rowWidth = rowItems.length * width + gap * Math.max(rowItems.length - 1, 0);
    const startX = geometry.centerX - rowWidth / 2 + width / 2;
    const height = geometry.metrics.strategyChipHeight + 6;

    return rowItems.map((item, itemIndex) => {
      const x = startX + itemIndex * (width + gap);
      const fontSize = fitChipFontSize(item.label, width - 18, height - 8, 2, 11.5, 7.75);

      return {
        key: item.key,
        label: item.label,
        detail: item.detail,
        x,
        y,
        width,
        height,
        color: geometry.color,
        section: 'strategy',
        phaseIndex,
        fontSize,
        lineClamp: 2
      } satisfies ItemLayout;
    });
  });
}

function RoadmapChip({
  item,
  titleBoundary,
  phaseCenterY,
  viewBoxWidth
}: {
  item: ItemLayout;
  titleBoundary: number;
  phaseCenterY: number;
  viewBoxWidth: number;
}) {
  const tooltipId = useId().replace(/[:]/g, '-');
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition>({
    left: 0,
    top: 0,
    placement: 'top',
    visible: false
  });
  const visible = hovered || focused;

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
  }, [item.detail, item.label, visible]);

  const tooltip = visible && typeof document !== 'undefined'
    ? createPortal(
        <div
          ref={tooltipRef}
          id={`roadmap-chip-${tooltipId}`}
          role="tooltip"
          className={localStyles.tooltip}
          data-placement={tooltipPosition.placement}
          style={{
            left: tooltipPosition.left,
            top: tooltipPosition.top,
            visibility: tooltipPosition.visible ? 'visible' : 'hidden',
            ['--tooltip-accent' as string]: item.color
          }}
        >
          <span className={localStyles.tooltipEyebrow}>{item.section}</span>
          <h5>{item.label}</h5>
          {item.detail ? (
            <div className={localStyles.tooltipBody}>
              <Markdown content={item.detail} />
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
        className={localStyles.chip}
        data-roadmap-item={item.section}
        data-phase-index={item.phaseIndex + 1}
        data-center-x={item.x}
        data-center-y={item.y}
        data-width={item.width}
        data-height={item.height}
        data-phase-center-y={phaseCenterY}
        data-title-boundary={titleBoundary}
        aria-describedby={visible ? `roadmap-chip-${tooltipId}` : undefined}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          left: percent(item.x, viewBoxWidth),
          top: percent(item.y, VIEWBOX_HEIGHT),
          width: percent(item.width, viewBoxWidth),
          height: percent(item.height, VIEWBOX_HEIGHT),
          ['--roadmap-accent' as string]: item.color,
          ['--roadmap-chip-font-size' as string]: `${item.fontSize}px`
        } as CSSProperties}
      >
        <span className={localStyles.chipLabel}>{item.label}</span>
      </button>
      {tooltip}
    </>
  );
}

export default function RoadmapRings({ props }: { props?: Record<string, unknown> }) {
  const phasesRaw = Array.isArray(props?.phases) ? props?.phases : [];
  const phases = [0, 1, 2].map((index) => normalizePhase(phasesRaw[index], index));
  const rawGeometries = computePhaseGeometry(phases);
  const styleVariant = String(props?.styleVariant ?? 'dark-map');

  const titleLayouts = phases.map((phase, index) => computeTitleLayout(phase, rawGeometries[index]));
  const actorPlacements = phases.map((phase, index) =>
    computeBandLabelPlacement(rawGeometries[index], index, 'actors', (phase.actors.title || 'Actors / Stakeholders').toUpperCase())
  );
  const supportPlacements = phases.map((phase, index) =>
    computeBandLabelPlacement(rawGeometries[index], index, 'support', (phase.support.title || 'System Support').toUpperCase())
  );
  const phaseBadges = phases.map((phase, index) => computePhaseBadgeLayout(phase, rawGeometries[index]));

  const rawItems = phases.flatMap((phase, index) => {
    const geometry = rawGeometries[index];
    return [
      ...layoutInnerStrategyChips(phase.strategy.items, geometry, index, titleLayouts[index].titleBottom),
      ...layoutArcChips('actors', phase.actors.items, geometry, index),
      ...layoutArcChips('support', phase.support.items, geometry, index)
    ];
  });

  const horizontalBounds = computeHorizontalBounds(rawGeometries, actorPlacements, supportPlacements, phaseBadges, rawItems);
  const viewBoxWidth = horizontalBounds.width;
  const geometries = rawGeometries.map((geometry) => ({
    ...geometry,
    centerX: geometry.centerX + horizontalBounds.offsetX
  }));
  const normalizedActorPlacements = actorPlacements.map((placement) => offsetBandLabelPlacement(placement, horizontalBounds.offsetX));
  const normalizedSupportPlacements = supportPlacements.map((placement) => offsetBandLabelPlacement(placement, horizontalBounds.offsetX));
  const normalizedPhaseBadges = phaseBadges.map((badge) => offsetPhaseBadgeLayout(badge, horizontalBounds.offsetX));
  const items = rawItems.map((item) => offsetItemLayout(item, horizontalBounds.offsetX));

  return (
    <figure className={localStyles.figure} data-variant={styleVariant}>
      <div className={localStyles.canvas}>
        <div className={localStyles.svgShell} data-roadmap-shell="true">
          <svg viewBox={`0 0 ${viewBoxWidth} ${VIEWBOX_HEIGHT}`} role="img" aria-label="Roadmap transition graph">
            {phases.map((phase, index) => {
              const geometry = geometries[index];
              const titleLayout = titleLayouts[index];
              const actorTitle = (phase.actors.title || 'Actors / Stakeholders').toUpperCase();
              const supportTitle = (phase.support.title || 'System Support').toUpperCase();
              const actorPlacement = normalizedActorPlacements[index];
              const supportPlacement = normalizedSupportPlacements[index];
              const phaseBadge = normalizedPhaseBadges[index];

              return (
                <g
                  key={`${phase.label}-${index}`}
                  data-roadmap-phase={index + 1}
                  data-center-x={geometry.centerX}
                  data-center-y={geometry.centerY}
                  data-outer-radius={geometry.outerRadius}
                  data-title-bottom={titleLayout.titleBottom}
                  className={localStyles.phase}
                  style={{ ['--phase-color' as string]: geometry.color } as CSSProperties}
                >
                  <circle className={localStyles.outerFill} cx={geometry.centerX} cy={geometry.centerY} r={geometry.outerRadius} />
                  <circle className={localStyles.outerRing} cx={geometry.centerX} cy={geometry.centerY} r={geometry.outerRadius} />
                  <circle className={localStyles.innerFill} cx={geometry.centerX} cy={geometry.centerY} r={geometry.innerRadius} />
                  <circle className={localStyles.innerRing} cx={geometry.centerX} cy={geometry.centerY} r={geometry.innerRadius} />

                  <g
                    data-roadmap-band="actors"
                    data-phase-index={index + 1}
                    data-rotation="0"
                    data-x={actorPlacement.x}
                    data-y={actorPlacement.y}
                    data-width={actorPlacement.width}
                    transform={`translate(${actorPlacement.x} ${actorPlacement.y})`}
                  >
                    <text
                      className={localStyles.bandText}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      style={{ fontSize: actorPlacement.fontSize } as CSSProperties}
                    >
                      {actorTitle}
                    </text>
                  </g>

                  <g
                    data-roadmap-band="support"
                    data-phase-index={index + 1}
                    data-rotation="0"
                    data-x={supportPlacement.x}
                    data-y={supportPlacement.y}
                    data-width={supportPlacement.width}
                    transform={`translate(${supportPlacement.x} ${supportPlacement.y})`}
                  >
                    <text
                      className={localStyles.bandText}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      style={{ fontSize: supportPlacement.fontSize } as CSSProperties}
                    >
                      {supportTitle}
                    </text>
                  </g>

                  {renderTextLines(
                    titleLayout.titleLines,
                    geometry.centerX,
                    titleLayout.titleStartY,
                    titleLayout.titleLineHeight,
                    localStyles.strategyTitle,
                    titleLayout.titleFontSize
                  )}
                  {renderTextLines(
                    titleLayout.subtitleLines,
                    geometry.centerX,
                    titleLayout.subtitleStartY,
                    titleLayout.subtitleLineHeight,
                    localStyles.strategySubtitle,
                    titleLayout.subtitleFontSize
                  )}

                  <g
                    data-roadmap-phase-badge={index + 1}
                    data-phase-index={index + 1}
                    data-x={phaseBadge.x}
                    data-y={phaseBadge.y}
                    data-width={phaseBadge.width}
                    transform={`translate(${phaseBadge.x} ${phaseBadge.y})`}
                  >
                    <text
                      x="0"
                      y={phaseBadge.dateY - phaseBadge.y}
                      textAnchor="middle"
                      className={localStyles.phaseBadgeDate}
                      style={{ fontSize: phaseBadge.dateFontSize } as CSSProperties}
                    >
                      {phase.dateRange}
                    </text>
                    {renderTextLines(
                      phaseBadge.labelLines,
                      0,
                      phaseBadge.labelY - phaseBadge.y,
                      phaseBadge.labelLineHeight,
                      localStyles.phaseBadgeLabel,
                      phaseBadge.labelFontSize
                    )}
                  </g>
                </g>
              );
            })}
          </svg>
        </div>

        <div className={localStyles.overlay}>
          {items.map((item) => {
            const geometry = geometries[item.phaseIndex];
            const titleLayout = titleLayouts[item.phaseIndex];
            return (
              <RoadmapChip
                key={`${item.section}-${item.key}-${item.phaseIndex}`}
                item={item}
                titleBoundary={titleLayout.titleBottom}
                phaseCenterY={geometry.centerY}
                viewBoxWidth={viewBoxWidth}
              />
            );
          })}
        </div>
      </div>
    </figure>
  );
}
