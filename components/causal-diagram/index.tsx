'use client';

import ELK from 'elkjs/lib/elk.bundled.js';
import type { ElkExtendedEdge, ElkNode, ElkPoint, LayoutOptions } from 'elkjs/lib/elk-api';
import { startTransition, useEffect, useId, useState } from 'react';

import styles from '@/components/_shared/diagram.module.css';

type NodeShape = 'circle' | 'rect';
type NodeSide = 'top' | 'right' | 'bottom' | 'left' | 'center';
type NodeTone = 'primary' | 'secondary' | 'accent' | 'warning' | 'success' | 'muted' | 'surface';
type GroupPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

interface CanvasConfig {
  width?: number;
  height?: number;
}

interface LayoutConfig {
  algorithm?: string;
  direction?: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
  edgeRouting?: 'POLYLINE' | 'ORTHOGONAL' | 'SPLINES';
  nodeSpacing?: number;
  layerSpacing?: number;
  edgeNodeSpacing?: number;
  padding?: number;
  considerModelOrder?: boolean;
  layoutOptions?: Record<string, string | number | boolean | undefined>;
}

interface DiagramNode {
  id: string;
  label: string;
  detail?: string;
  width?: number;
  height?: number;
  shape?: NodeShape;
  tone?: NodeTone;
  fill?: string;
  stroke?: string;
  textColor?: string;
  fontSize?: number;
  group?: string;
  order?: number;
  layoutOptions?: Record<string, string | number | boolean | undefined>;
}

interface LegacyVariable extends DiagramNode {
  x?: number;
  y?: number;
}

interface Point {
  x: number;
  y: number;
}

interface DiagramEdge {
  id?: string;
  source?: string;
  target?: string;
  from?: string;
  to?: string;
  polarity?: string;
  label?: string;
  tone?: NodeTone;
  color?: string;
  strokeWidth?: number;
  dashArray?: string;
  markerEnd?: boolean;
  layoutOptions?: Record<string, string | number | boolean | undefined>;
}

interface LegacyEdge extends DiagramEdge {
  fromSide?: NodeSide;
  toSide?: NodeSide;
  fromOffset?: number;
  toOffset?: number;
  controls?: Point[];
  path?: string;
  labelX?: number;
  labelY?: number;
}

interface DiagramGroup {
  id: string;
  label: string;
  members: string[];
  tone?: NodeTone;
  offsetX?: number;
  offsetY?: number;
  padding?: number;
  position?: GroupPosition;
}

interface Annotation {
  label: string;
  x: number;
  y: number;
  fill?: string;
  stroke?: string;
  textColor?: string;
}

interface ResolvedVariable extends LegacyVariable {
  x: number;
  y: number;
  width: number;
  height: number;
  shape: NodeShape;
}

interface NormalizedEdge extends DiagramEdge {
  id: string;
  source: string;
  target: string;
  label?: 'S' | 'O';
}

interface NormalizedGraph {
  canvas: { width: number; height: number };
  layout: LayoutConfig;
  nodes: DiagramNode[];
  edges: NormalizedEdge[];
  groups: DiagramGroup[];
  annotations: Annotation[];
  usesLegacyCoordinates: boolean;
  legacyVariables: LegacyVariable[];
  legacyEdges: LegacyEdge[];
}

const elk = new ELK();

const toneFillMap: Record<NodeTone, string> = {
  primary: 'color-mix(in srgb, var(--color-primary) 28%, white 72%)',
  secondary: 'color-mix(in srgb, var(--color-secondary) 26%, white 74%)',
  accent: 'color-mix(in srgb, var(--color-accent) 26%, white 74%)',
  warning: 'color-mix(in srgb, var(--color-warning) 42%, white 58%)',
  success: 'color-mix(in srgb, var(--color-success) 28%, white 72%)',
  muted: 'color-mix(in srgb, var(--color-muted) 20%, white 80%)',
  surface: 'var(--color-surface)'
};

const toneStrokeMap: Record<NodeTone, string> = {
  primary: 'color-mix(in srgb, var(--color-primary) 65%, black 35%)',
  secondary: 'color-mix(in srgb, var(--color-secondary) 65%, black 35%)',
  accent: 'color-mix(in srgb, var(--color-accent) 65%, black 35%)',
  warning: 'color-mix(in srgb, var(--color-warning) 58%, black 42%)',
  success: 'color-mix(in srgb, var(--color-success) 58%, black 42%)',
  muted: 'color-mix(in srgb, var(--color-muted) 55%, black 45%)',
  surface: 'var(--color-border)'
};

const toneTextMap: Record<NodeTone, string> = {
  primary: 'color-mix(in srgb, var(--color-primary) 16%, black 84%)',
  secondary: 'color-mix(in srgb, var(--color-secondary) 16%, black 84%)',
  accent: 'color-mix(in srgb, var(--color-accent) 18%, black 82%)',
  warning: 'color-mix(in srgb, var(--color-warning) 18%, black 82%)',
  success: 'color-mix(in srgb, var(--color-success) 18%, black 82%)',
  muted: 'color-mix(in srgb, var(--color-muted) 18%, black 82%)',
  surface: 'var(--color-foreground)'
};

const groupToneMap: Record<NodeTone, { fill: string; stroke: string }> = {
  primary: {
    fill: 'color-mix(in srgb, var(--color-primary) 22%, var(--color-background) 78%)',
    stroke: 'color-mix(in srgb, var(--color-primary) 44%, var(--color-border) 56%)'
  },
  secondary: {
    fill: 'color-mix(in srgb, var(--color-secondary) 22%, var(--color-background) 78%)',
    stroke: 'color-mix(in srgb, var(--color-secondary) 44%, var(--color-border) 56%)'
  },
  accent: {
    fill: 'color-mix(in srgb, var(--color-accent) 22%, var(--color-background) 78%)',
    stroke: 'color-mix(in srgb, var(--color-accent) 44%, var(--color-border) 56%)'
  },
  warning: {
    fill: 'color-mix(in srgb, var(--color-warning) 22%, var(--color-background) 78%)',
    stroke: 'color-mix(in srgb, var(--color-warning) 44%, var(--color-border) 56%)'
  },
  success: {
    fill: 'color-mix(in srgb, var(--color-success) 22%, var(--color-background) 78%)',
    stroke: 'color-mix(in srgb, var(--color-success) 44%, var(--color-border) 56%)'
  },
  muted: {
    fill: 'color-mix(in srgb, var(--color-muted) 20%, var(--color-background) 80%)',
    stroke: 'color-mix(in srgb, var(--color-muted) 44%, var(--color-border) 56%)'
  },
  surface: {
    fill: 'color-mix(in srgb, var(--color-surface) 72%, var(--color-background) 28%)',
    stroke: 'var(--color-border)'
  }
};

function resolveCanvas(props?: Record<string, unknown>) {
  const canvas = (props?.canvas as CanvasConfig | undefined) ?? {};
  return {
    width: Math.max(640, Number(canvas.width ?? 640)),
    height: Math.max(420, Number(canvas.height ?? 420))
  };
}

function resolveLayout(props?: Record<string, unknown>): LayoutConfig {
  const layout = (props?.layout as LayoutConfig | undefined) ?? {};
  return {
    algorithm: layout.algorithm ?? 'layered',
    direction: layout.direction ?? 'RIGHT',
    edgeRouting: layout.edgeRouting ?? 'POLYLINE',
    nodeSpacing: Number(layout.nodeSpacing ?? 54),
    layerSpacing: Number(layout.layerSpacing ?? 92),
    edgeNodeSpacing: Number(layout.edgeNodeSpacing ?? 40),
    padding: Number(layout.padding ?? 54),
    considerModelOrder: layout.considerModelOrder ?? true,
    layoutOptions: layout.layoutOptions ?? {}
  };
}

function wrapLine(line: string, maxChars: number) {
  const words = line.trim().split(/\s+/).filter(Boolean);
  if (!words.length) {
    return [''];
  }

  const wrapped: string[] = [];
  let current = words[0];

  for (const word of words.slice(1)) {
    if (`${current} ${word}`.length <= maxChars) {
      current = `${current} ${word}`;
    } else {
      wrapped.push(current);
      current = word;
    }
  }

  wrapped.push(current);
  return wrapped;
}

function wrapText(value: string, width: number, fontSize: number) {
  const maxChars = Math.max(8, Math.floor((width - 28) / Math.max(fontSize * 0.56, 1)));
  return value
    .split('\n')
    .flatMap((line) => wrapLine(line, maxChars))
    .filter(Boolean);
}

function resolveLegacyVariable(variable: LegacyVariable, index: number, total: number, canvas: { width: number; height: number }): ResolvedVariable {
  const explicitPosition = Number.isFinite(variable.x) && Number.isFinite(variable.y);
  const shape = variable.shape ?? (explicitPosition ? 'rect' : 'circle');
  const width = Number(variable.width ?? (shape === 'circle' ? 92 : 176));
  const height = Number(variable.height ?? (shape === 'circle' ? 92 : 108));

  if (explicitPosition) {
    return {
      ...variable,
      x: Number(variable.x),
      y: Number(variable.y),
      width,
      height,
      shape
    };
  }

  const angle = (Math.PI * 2 * index) / Math.max(total, 1);
  const centerX = canvas.width / 2 + Math.cos(angle) * Math.min(canvas.width * 0.28, 190);
  const centerY = canvas.height / 2 + Math.sin(angle) * Math.min(canvas.height * 0.24, 130);
  return {
    ...variable,
    x: centerX - width / 2,
    y: centerY - height / 2,
    width,
    height,
    shape
  };
}

function nodeCenter(node: { x: number; y: number; width: number; height: number }): Point {
  return { x: node.x + node.width / 2, y: node.y + node.height / 2 };
}

function anchorPoint(node: ResolvedVariable, side: NodeSide, offset = 0): Point {
  const center = nodeCenter(node);

  switch (side) {
    case 'top':
      return { x: center.x + offset, y: node.y };
    case 'right':
      return { x: node.x + node.width, y: center.y + offset };
    case 'bottom':
      return { x: center.x + offset, y: node.y + node.height };
    case 'left':
      return { x: node.x, y: center.y + offset };
    case 'center':
    default:
      return { x: center.x + offset, y: center.y + offset };
  }
}

function pathForLegacyEdge(start: Point, end: Point, controls: Point[] = [], explicitPath?: string) {
  if (explicitPath) {
    return explicitPath;
  }

  if (controls.length >= 2) {
    const [cp1, cp2] = controls;
    return `M ${start.x} ${start.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${end.x} ${end.y}`;
  }

  if (controls.length === 1) {
    const [cp] = controls;
    return `M ${start.x} ${start.y} Q ${cp.x} ${cp.y}, ${end.x} ${end.y}`;
  }

  return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
}

function midpointForLegacyEdge(start: Point, end: Point, controls: Point[] = []) {
  if (controls.length >= 2) {
    const [cp1, cp2] = controls;
    const t = 0.5;
    const x =
      Math.pow(1 - t, 3) * start.x +
      3 * Math.pow(1 - t, 2) * t * cp1.x +
      3 * (1 - t) * Math.pow(t, 2) * cp2.x +
      Math.pow(t, 3) * end.x;
    const y =
      Math.pow(1 - t, 3) * start.y +
      3 * Math.pow(1 - t, 2) * t * cp1.y +
      3 * (1 - t) * Math.pow(t, 2) * cp2.y +
      Math.pow(t, 3) * end.y;
    return { x, y };
  }

  if (controls.length === 1) {
    const [cp] = controls;
    const t = 0.5;
    const x = Math.pow(1 - t, 2) * start.x + 2 * (1 - t) * t * cp.x + Math.pow(t, 2) * end.x;
    const y = Math.pow(1 - t, 2) * start.y + 2 * (1 - t) * t * cp.y + Math.pow(t, 2) * end.y;
    return { x, y };
  }

  return {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2
  };
}

function annotationWidth(label: string) {
  return Math.max(54, Math.min(250, 18 + label.length * 7));
}

function normalizePolarity(value?: string) {
  const normalized = String(value ?? '')
    .trim()
    .toUpperCase();

  if (['S', '+', 'PLUS', 'POSITIVE', 'SAME'].includes(normalized)) {
    return 'S' as const;
  }

  if (['O', '-', 'MINUS', 'NEGATIVE', 'OPPOSITE'].includes(normalized)) {
    return 'O' as const;
  }

  return undefined;
}

function stringifyLayoutOptions(value?: Record<string, string | number | boolean | undefined>) {
  if (!value) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([, entry]) => entry !== undefined && entry !== null)
      .map(([key, entry]) => [key, String(entry)])
  ) as LayoutOptions;
}

function normalizeGraph(props?: Record<string, unknown>): NormalizedGraph {
  const canvas = resolveCanvas(props);
  const layout = resolveLayout(props);
  const nodes = Array.isArray(props?.nodes) ? (props?.nodes as DiagramNode[]) : [];
  const groups = Array.isArray(props?.groups) ? (props?.groups as DiagramGroup[]) : [];
  const annotations = Array.isArray(props?.annotations) ? (props?.annotations as Annotation[]) : [];
  const legacyVariables = Array.isArray(props?.variables) ? (props?.variables as LegacyVariable[]) : [];
  const legacyEdges = Array.isArray(props?.edges) ? (props?.edges as LegacyEdge[]) : [];

  const resolvedNodes =
    nodes.length > 0
      ? [...nodes]
      : legacyVariables.map((variable) => ({
          id: variable.id,
          label: variable.label,
          detail: variable.detail,
          width: variable.width,
          height: variable.height,
          shape: variable.shape ?? (Number.isFinite(variable.x) && Number.isFinite(variable.y) ? 'rect' : 'circle'),
          tone: variable.tone,
          fill: variable.fill,
          stroke: variable.stroke,
          textColor: variable.textColor,
          fontSize: variable.fontSize,
          order: variable.order,
          layoutOptions: variable.layoutOptions
        }));

  const resolvedEdges = legacyEdges
    .map((edge, index) => {
      const source = edge.source ?? edge.from;
      const target = edge.target ?? edge.to;
      if (!source || !target) {
        return null;
      }

      return {
        ...edge,
        id: edge.id ?? `edge-${index}`,
        source,
        target,
        label: normalizePolarity(edge.label ?? edge.polarity)
      } satisfies NormalizedEdge;
    })
    .filter(Boolean) as NormalizedEdge[];

  const usesLegacyCoordinates =
    legacyVariables.some((variable) => Number.isFinite(variable.x) && Number.isFinite(variable.y)) ||
    legacyEdges.some((edge) => Array.isArray(edge.controls) || Boolean(edge.path) || edge.fromSide || edge.toSide || edge.labelX || edge.labelY);

  return {
    canvas,
    layout,
    nodes: resolvedNodes.sort((left, right) => {
      const leftOrder = Number(left.order ?? Number.MAX_SAFE_INTEGER);
      const rightOrder = Number(right.order ?? Number.MAX_SAFE_INTEGER);
      if (leftOrder !== rightOrder) {
        return leftOrder - rightOrder;
      }
      return left.label.localeCompare(right.label);
    }),
    edges: resolvedEdges,
    groups,
    annotations,
    usesLegacyCoordinates,
    legacyVariables,
    legacyEdges
  };
}

function buildElkGraph(graph: NormalizedGraph): ElkNode {
  const padding = graph.layout.padding ?? 54;
  return {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': graph.layout.algorithm ?? 'layered',
      'elk.direction': graph.layout.direction ?? 'RIGHT',
      'elk.edgeRouting': graph.layout.edgeRouting ?? 'POLYLINE',
      'elk.spacing.nodeNode': String(graph.layout.nodeSpacing ?? 54),
      'elk.layered.spacing.nodeNodeBetweenLayers': String(graph.layout.layerSpacing ?? 92),
      'elk.spacing.edgeNode': String(graph.layout.edgeNodeSpacing ?? 40),
      'elk.padding': `[top=${padding},left=${padding},bottom=${padding},right=${padding}]`,
      'elk.layered.considerModelOrder': graph.layout.considerModelOrder === false ? 'NONE' : 'NODES_AND_EDGES',
      ...stringifyLayoutOptions(graph.layout.layoutOptions)
    },
    children: graph.nodes.map((node) => ({
      id: node.id,
      width: Number(node.width ?? (node.shape === 'circle' ? 108 : 190)),
      height: Number(node.height ?? (node.shape === 'circle' ? 108 : 110)),
      layoutOptions: stringifyLayoutOptions(node.layoutOptions)
    })),
    edges: graph.edges.map((edge) => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
      layoutOptions: stringifyLayoutOptions(edge.layoutOptions)
    }))
  };
}

function labelBoxStyles(tone?: NodeTone) {
  if (!tone) {
    return {
      fill: 'color-mix(in srgb, var(--color-background) 84%, var(--color-surface) 16%)',
      stroke: 'color-mix(in srgb, var(--color-border) 76%, transparent 24%)'
    };
  }

  return groupToneMap[tone];
}

function renderNode(node: ResolvedVariable) {
  const tone = node.tone ?? (node.shape === 'circle' ? 'surface' : 'warning');
  const fill = node.fill ?? toneFillMap[tone];
  const stroke = node.stroke ?? toneStrokeMap[tone];
  const textColor = node.textColor ?? toneTextMap[tone];
  const fontSize = Number(node.fontSize ?? (node.shape === 'rect' ? 15 : 14));
  const center = nodeCenter(node);
  const labelLines = wrapText(node.label, node.width, fontSize);
  const detailLines = node.detail ? wrapText(node.detail, node.width, Math.max(12, fontSize - 2)) : [];
  const totalHeight =
    labelLines.length * (fontSize + 3) + detailLines.length * (Math.max(12, fontSize - 2) + 2);
  const startY = center.y - totalHeight / 2 + fontSize - 2;

  return (
    <g key={node.id} data-node-id={node.id}>
      {node.shape === 'circle' ? (
        <circle
          cx={center.x}
          cy={center.y}
          r={Math.min(node.width, node.height) / 2}
          fill={fill}
          stroke={stroke}
          strokeWidth="1.5"
        />
      ) : (
        <rect
          x={node.x}
          y={node.y}
          width={node.width}
          height={node.height}
          rx="16"
          fill={fill}
          stroke={stroke}
          strokeWidth="1.5"
        />
      )}
      <text
        x={center.x}
        y={startY}
        textAnchor="middle"
        fill={textColor}
        fontFamily="var(--font-body)"
        fontWeight={node.shape === 'rect' ? '600' : '500'}
      >
        {labelLines.map((line, lineIndex) => (
          <tspan key={`${node.id}-label-${lineIndex}`} x={center.x} dy={lineIndex === 0 ? 0 : fontSize + 3} fontSize={fontSize}>
            {line}
          </tspan>
        ))}
        {detailLines.map((line, lineIndex) => (
          <tspan
            key={`${node.id}-detail-${lineIndex}`}
            x={center.x}
            dy={labelLines.length === 0 && lineIndex === 0 ? 0 : Math.max(12, fontSize - 2) + 2}
            fontSize={Math.max(12, fontSize - 2)}
            opacity="0.78"
          >
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
}

function pointKey(point: ElkPoint | Point) {
  return `${point.x}:${point.y}`;
}

function flattenEdgePoints(edge: ElkExtendedEdge) {
  if (!Array.isArray(edge.sections) || edge.sections.length === 0) {
    return [];
  }

  const sectionsById = new Map(edge.sections.map((section) => [section.id, section]));
  const allOutgoing = new Set(edge.sections.flatMap((section) => section.outgoingSections ?? []));
  const firstSection = edge.sections.find((section) => !allOutgoing.has(section.id)) ?? edge.sections[0];
  const orderedSections = [firstSection];

  while (orderedSections.length < edge.sections.length) {
    const current = orderedSections.at(-1);
    const nextSectionId = current?.outgoingSections?.[0];
    const nextSection = nextSectionId ? sectionsById.get(nextSectionId) : undefined;
    if (!nextSection || orderedSections.includes(nextSection)) {
      break;
    }
    orderedSections.push(nextSection);
  }

  const points: ElkPoint[] = [];
  orderedSections.forEach((section) => {
    const sectionPoints = [section.startPoint, ...(section.bendPoints ?? []), section.endPoint];
    sectionPoints.forEach((point) => {
      if (points.at(-1) && pointKey(points.at(-1)!) === pointKey(point)) {
        return;
      }
      points.push(point);
    });
  });

  return points;
}

function pathFromPoints(points: Array<Point | ElkPoint>) {
  if (points.length === 0) {
    return '';
  }

  return points.reduce((path, point, index) => {
    if (index === 0) {
      return `M ${point.x} ${point.y}`;
    }
    return `${path} L ${point.x} ${point.y}`;
  }, '');
}

function midpointFromPoints(points: Array<Point | ElkPoint>) {
  if (points.length === 0) {
    return { x: 0, y: 0 };
  }

  if (points.length === 1) {
    return { x: points[0].x, y: points[0].y };
  }

  let totalLength = 0;
  const segments: Array<{ start: Point | ElkPoint; end: Point | ElkPoint; length: number }> = [];
  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];
    const length = Math.hypot(end.x - start.x, end.y - start.y);
    totalLength += length;
    segments.push({ start, end, length });
  }

  const halfway = totalLength / 2;
  let consumed = 0;
  for (const segment of segments) {
    if (consumed + segment.length >= halfway) {
      const progress = segment.length === 0 ? 0 : (halfway - consumed) / segment.length;
      return {
        x: segment.start.x + (segment.end.x - segment.start.x) * progress,
        y: segment.start.y + (segment.end.y - segment.start.y) * progress
      };
    }
    consumed += segment.length;
  }

  return { x: points.at(-1)!.x, y: points.at(-1)!.y };
}

function resolveEdgeStroke(edge: Pick<NormalizedEdge, 'tone' | 'color'>) {
  if (edge.color) {
    return edge.color;
  }

  if (edge.tone) {
    return toneStrokeMap[edge.tone];
  }

  return 'var(--color-muted)';
}

function renderEdgeLabel(label: string, x: number, y: number, tone?: NodeTone) {
  const stylesForTone = labelBoxStyles(tone);
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect
        x={-14}
        y={-12}
        width={28}
        height={24}
        rx={12}
        fill={stylesForTone.fill}
        stroke={stylesForTone.stroke}
      />
      <text
        x="0"
        y="4"
        textAnchor="middle"
        fill="var(--color-foreground)"
        fontFamily="var(--font-body)"
        fontSize="12"
        fontWeight="700"
      >
        {label}
      </text>
    </g>
  );
}

function renderGroupLabel(group: DiagramGroup, bounds: { minX: number; minY: number; maxX: number; maxY: number }) {
  const labelWidth = annotationWidth(group.label);
  const padding = Number(group.padding ?? 12);
  const offsetX = Number(group.offsetX ?? 0);
  const offsetY = Number(group.offsetY ?? 0);
  const position = group.position ?? 'top-left';
  let x = bounds.minX - padding + offsetX;
  let y = bounds.minY - 34 + offsetY;

  if (position === 'top-right') {
    x = bounds.maxX - labelWidth + padding + offsetX;
  } else if (position === 'bottom-left') {
    y = bounds.maxY + 14 + offsetY;
  } else if (position === 'bottom-right') {
    x = bounds.maxX - labelWidth + padding + offsetX;
    y = bounds.maxY + 14 + offsetY;
  }

  const stylesForTone = labelBoxStyles(group.tone);
  return (
    <g key={group.id} data-group-id={group.id} transform={`translate(${x}, ${y})`}>
      <rect x="0" y="0" width={labelWidth} height="28" rx="14" fill={stylesForTone.fill} stroke={stylesForTone.stroke} />
      <text
        x={labelWidth / 2}
        y="19"
        textAnchor="middle"
        fill="var(--color-foreground)"
        fontFamily="var(--font-body)"
        fontSize="12.5"
        fontWeight="700"
      >
        {group.label}
      </text>
    </g>
  );
}

function renderAnnotation(annotation: Annotation, key: string) {
  const width = annotationWidth(annotation.label);
  return (
    <g key={key} transform={`translate(${annotation.x}, ${annotation.y})`}>
      <rect
        x="0"
        y="0"
        width={width}
        height="30"
        rx="15"
        fill={annotation.fill ?? 'color-mix(in srgb, var(--color-background) 84%, var(--color-surface) 16%)'}
        stroke={annotation.stroke ?? 'color-mix(in srgb, var(--color-border) 76%, transparent 24%)'}
      />
      <text
        x={width / 2}
        y="20"
        textAnchor="middle"
        fill={annotation.textColor ?? 'var(--color-foreground)'}
        fontFamily="var(--font-body)"
        fontSize="13"
        fontWeight="700"
      >
        {annotation.label}
      </text>
    </g>
  );
}

function renderLegacyDiagram(graph: NormalizedGraph, markerId: string) {
  const resolvedVariables = graph.legacyVariables.map((variable, index) =>
    resolveLegacyVariable(variable, index, graph.legacyVariables.length, graph.canvas)
  );
  const nodeMap = new Map(resolvedVariables.map((node) => [node.id, node]));

  return (
    <>
      {graph.legacyEdges.map((edge, index) => {
        const sourceId = edge.source ?? edge.from;
        const targetId = edge.target ?? edge.to;
        if (!sourceId || !targetId) {
          return null;
        }
        const from = nodeMap.get(sourceId);
        const to = nodeMap.get(targetId);
        if (!from || !to) {
          return null;
        }

        const start = anchorPoint(from, edge.fromSide ?? 'right', edge.fromOffset ?? 0);
        const end = anchorPoint(to, edge.toSide ?? 'left', edge.toOffset ?? 0);
        const controls = Array.isArray(edge.controls) ? edge.controls : [];
        const path = pathForLegacyEdge(start, end, controls, edge.path);
        const label = normalizePolarity(edge.label ?? edge.polarity);
        const midpoint = midpointForLegacyEdge(start, end, controls);
        const labelX = Number(edge.labelX ?? midpoint.x);
        const labelY = Number(edge.labelY ?? midpoint.y);

        return (
          <g key={`${sourceId}-${targetId}-${index}`} data-edge-id={edge.id ?? `legacy-edge-${index}`}>
            <path
              d={path}
              fill="none"
              stroke={resolveEdgeStroke({ tone: edge.tone, color: edge.color })}
              strokeWidth={Number(edge.strokeWidth ?? 2.4)}
              strokeDasharray={edge.dashArray}
              strokeLinecap="round"
              strokeLinejoin="round"
              markerEnd={edge.markerEnd === false ? undefined : `url(#${markerId})`}
            />
            {label ? renderEdgeLabel(label, labelX, labelY, edge.tone) : null}
          </g>
        );
      })}
      {graph.annotations.map((annotation, index) => renderAnnotation(annotation, `annotation-${index}`))}
      {resolvedVariables.map(renderNode)}
    </>
  );
}

function renderElkDiagram(graph: NormalizedGraph, layoutGraph: ElkNode, markerId: string) {
  const layoutChildren = Array.isArray(layoutGraph.children) ? layoutGraph.children : [];
  const nodeMeta = new Map(graph.nodes.map((node) => [node.id, node]));
  const resolvedNodes = layoutChildren.map((child) => {
    const meta = nodeMeta.get(child.id);
    return {
      id: child.id,
      label: meta?.label ?? child.id,
      detail: meta?.detail,
      x: Number(child.x ?? 0),
      y: Number(child.y ?? 0),
      width: Number(child.width ?? meta?.width ?? 180),
      height: Number(child.height ?? meta?.height ?? 108),
      shape: meta?.shape ?? 'rect',
      tone: meta?.tone,
      fill: meta?.fill,
      stroke: meta?.stroke,
      textColor: meta?.textColor,
      fontSize: meta?.fontSize
    } satisfies ResolvedVariable;
  });
  const nodeMap = new Map(resolvedNodes.map((node) => [node.id, node]));
  const edgeMeta = new Map(graph.edges.map((edge) => [edge.id, edge]));

  return (
    <>
      {(layoutGraph.edges ?? []).map((edge) => {
        const points = flattenEdgePoints(edge);
        if (points.length < 2) {
          return null;
        }

        const meta = edge.id ? edgeMeta.get(edge.id) : undefined;
        const path = pathFromPoints(points);
        const midpoint = midpointFromPoints(points);

        return (
          <g key={edge.id ?? `${edge.sources.join('-')}-${edge.targets.join('-')}`} data-edge-id={edge.id}>
            <path
              d={path}
              fill="none"
              stroke={resolveEdgeStroke({ tone: meta?.tone, color: meta?.color })}
              strokeWidth={Number(meta?.strokeWidth ?? 2.4)}
              strokeDasharray={meta?.dashArray}
              strokeLinecap="round"
              strokeLinejoin="round"
              markerEnd={meta?.markerEnd === false ? undefined : `url(#${markerId})`}
            />
            {meta?.label ? renderEdgeLabel(meta.label, midpoint.x, midpoint.y, meta.tone) : null}
          </g>
        );
      })}
      {graph.groups.map((group) => {
        const members = group.members.map((memberId) => nodeMap.get(memberId)).filter(Boolean) as ResolvedVariable[];
        if (!members.length) {
          return null;
        }

        const bounds = {
          minX: Math.min(...members.map((member) => member.x)),
          minY: Math.min(...members.map((member) => member.y)),
          maxX: Math.max(...members.map((member) => member.x + member.width)),
          maxY: Math.max(...members.map((member) => member.y + member.height))
        };

        return renderGroupLabel(group, bounds);
      })}
      {graph.annotations.map((annotation, index) => renderAnnotation(annotation, `annotation-${index}`))}
      {resolvedNodes.map(renderNode)}
    </>
  );
}

function resolveViewBox(graph: NormalizedGraph, layoutGraph: ElkNode | null) {
  const width = Math.max(graph.canvas.width, Math.ceil(Number(layoutGraph?.width ?? graph.canvas.width)));
  const height = Math.max(graph.canvas.height, Math.ceil(Number(layoutGraph?.height ?? graph.canvas.height)));
  return { width, height };
}

export default function CausalDiagram({ props }: { props?: Record<string, unknown> }) {
  const graph = normalizeGraph(props);
  const [layoutGraph, setLayoutGraph] = useState<ElkNode | null>(null);
  const markerId = `causal-arrow-${useId().replace(/[:]/g, '-')}`;
  const serializedGraph = JSON.stringify(graph);
  const usesAutoLayout = !graph.usesLegacyCoordinates;

  useEffect(() => {
    if (!usesAutoLayout || graph.nodes.length === 0 || graph.edges.length === 0) {
      setLayoutGraph(null);
      return;
    }

    let cancelled = false;
    elk
      .layout(buildElkGraph(graph))
      .then((result) => {
        if (cancelled) {
          return;
        }
        startTransition(() => {
          setLayoutGraph(result);
        });
      })
      .catch(() => {
        if (cancelled) {
          return;
        }
        startTransition(() => {
          setLayoutGraph(null);
        });
      });

    return () => {
      cancelled = true;
    };
  }, [serializedGraph, usesAutoLayout]);

  const viewBox = resolveViewBox(graph, layoutGraph);
  const layoutEngine = graph.usesLegacyCoordinates ? 'manual' : layoutGraph ? 'elk' : 'fallback';

  return (
    <figure className={styles.shell} data-layout-engine={layoutEngine}>
      <svg viewBox={`0 0 ${viewBox.width} ${viewBox.height}`} role="img" aria-label="Causal diagram">
        <defs>
          <marker id={markerId} markerWidth="11" markerHeight="11" refX="8" refY="5.5" orient="auto">
            <path d="M0,0 L0,11 L10,5.5 z" fill="var(--color-muted)" />
          </marker>
        </defs>
        {graph.usesLegacyCoordinates
          ? renderLegacyDiagram(graph, markerId)
          : layoutGraph
            ? renderElkDiagram(graph, layoutGraph, markerId)
            : renderLegacyDiagram(
                {
                  ...graph,
                  legacyVariables: graph.nodes.map((node) => ({
                    id: node.id,
                    label: node.label,
                    detail: node.detail,
                    width: node.width,
                    height: node.height,
                    shape: node.shape ?? 'rect',
                    tone: node.tone,
                    fill: node.fill,
                    stroke: node.stroke,
                    textColor: node.textColor,
                    fontSize: node.fontSize
                  })),
                  legacyEdges: graph.edges.map((edge) => ({
                    id: edge.id,
                    from: edge.source,
                    to: edge.target,
                    label: edge.label,
                    tone: edge.tone,
                    color: edge.color,
                    strokeWidth: edge.strokeWidth,
                    dashArray: edge.dashArray,
                    markerEnd: edge.markerEnd
                  }))
                },
                markerId
              )}
      </svg>
    </figure>
  );
}
