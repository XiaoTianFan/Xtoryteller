import * as LucideIcons from 'lucide-react';

const DEFAULT_ICON_NAME = 'sparkles';
const ICON_ALIASES: Record<string, string> = {
  spark: 'sparkles',
  sparkle: 'sparkles',
  sparkles: 'sparkles',
  person: 'user',
  people: 'users',
  profile: 'user',
  user: 'user',
  users: 'users',
  compass: 'compass',
  northstar: 'compass',
  aim: 'target',
  target: 'target',
  layers: 'layers-3',
  stack: 'layers-3',
  clock: 'clock',
  time: 'clock',
  play: 'play',
  video: 'play',
  check: 'check',
  success: 'check',
  warning: 'triangle-alert',
  alert: 'triangle-alert',
  up: 'arrow-up',
  trendup: 'arrow-up',
  down: 'arrow-down',
  trenddown: 'arrow-down',
  neutral: 'minus',
  flat: 'minus',
  arrow: 'arrow-right',
  right: 'arrow-right',
  cycle: 'refresh-cw',
  repeat: 'refresh-cw',
  chart: 'chart-column',
  graph: 'chart-column',
  radar: 'chart-column',
  node: 'workflow',
  org: 'workflow'
};

const RESERVED_EXPORTS = new Set(['createLucideIcon', 'Icon']);
const AVAILABLE_ICON_EXPORTS = new Set(
  Object.keys(LucideIcons).filter((key) => /^[A-Z]/.test(key) && !RESERVED_EXPORTS.has(key))
);

function normalizeIconKey(value: string): string {
  return value.trim().toLowerCase().replace(/[\s_]+/g, '-');
}

function toLucideExportName(name: string): string {
  return name
    .split('-')
    .filter(Boolean)
    .map((part) => {
      if (/^\d+$/.test(part)) {
        return part;
      }
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join('');
}

function normalizeCustomSvg(markup: string): string {
  const trimmed = markup.trim();

  if (!trimmed) {
    return '';
  }

  if (/^<svg[\s>]/i.test(trimmed)) {
    return trimmed;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">${trimmed}</svg>`;
}

export function getIconSize(value: unknown): string | number {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    switch (value) {
      case 'small':
        return '1rem';
      case 'medium':
        return '1.4rem';
      case 'large':
        return '2rem';
      case 'xlarge':
        return '2.75rem';
      default:
        return value;
    }
  }

  return '1.4rem';
}

export function resolveLucideIconName(name: unknown): string {
  if (typeof name !== 'string' || !name.trim()) {
    return DEFAULT_ICON_NAME;
  }

  const normalized = normalizeIconKey(name);
  const aliased = ICON_ALIASES[normalized] ?? normalized;
  const exportName = toLucideExportName(aliased);
  return AVAILABLE_ICON_EXPORTS.has(exportName) ? aliased : DEFAULT_ICON_NAME;
}

function getLucideComponent(name: unknown) {
  const resolvedName = resolveLucideIconName(name);
  const exportName = toLucideExportName(resolvedName);
  return (LucideIcons as unknown as Record<string, React.ComponentType<Record<string, unknown>>>)[exportName] ?? LucideIcons.Sparkles;
}

export function ProjectIcon({
  name,
  size,
  color,
  label,
  className,
  style,
  strokeWidth,
  customSvg
}: {
  name?: unknown;
  size?: unknown;
  color?: unknown;
  label?: string;
  className?: string;
  style?: React.CSSProperties;
  strokeWidth?: unknown;
  customSvg?: unknown;
}) {
  const resolvedSize = getIconSize(size);
  const resolvedColor = typeof color === 'string' && color.trim() ? color : 'currentColor';
  const ariaProps = label ? { role: 'img' as const, 'aria-label': label } : { 'aria-hidden': true as const };

  if (typeof customSvg === 'string' && customSvg.trim()) {
    return (
      <span
        className={className}
        style={{ display: 'inline-flex', width: resolvedSize, height: resolvedSize, color: resolvedColor, ...style }}
        dangerouslySetInnerHTML={{ __html: normalizeCustomSvg(customSvg) }}
        {...ariaProps}
      />
    );
  }

  const SelectedIcon = getLucideComponent(name);

  return <SelectedIcon className={className} size={resolvedSize} color={resolvedColor} strokeWidth={typeof strokeWidth === 'number' ? strokeWidth : 1.75} style={style} {...ariaProps} />;
}

