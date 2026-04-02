import type { CSSProperties } from 'react';

import styles from './styles.module.css';

type RailItem = {
  label?: string;
  color?: string;
  tone?: string;
  height?: 'short' | 'medium' | 'tall';
  active?: boolean;
};

const toneColorMap: Record<string, string> = {
  primary: 'var(--color-primary)',
  secondary: 'var(--color-secondary)',
  accent: 'var(--color-accent)',
  muted: 'var(--color-muted)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  error: 'var(--color-error)'
};

function resolveRailColor(item: RailItem, index: number) {
  if (item.color) {
    return item.color;
  }

  if (item.tone && toneColorMap[item.tone]) {
    return toneColorMap[item.tone];
  }

  return `var(--color-decor-rail-${index + 1}, var(--color-decor-active, var(--color-primary)))`;
}

export default function EdgeRail({
  props,
  style
}: {
  content?: string;
  props?: Record<string, unknown>;
  style?: CSSProperties;
}) {
  const items = Array.isArray(props?.items) ? (props.items as RailItem[]) : [];
  const variant = props?.variant === 'tabs' ? 'tabs' : 'pills';
  const side = props?.side === 'left' ? 'left' : 'right';
  const orientation = props?.orientation === 'horizontal' ? 'horizontal' : 'vertical';

  return (
    <nav
      aria-label="Edge rail"
      className={[styles.rail, styles[variant], styles[side], styles[orientation]].join(' ')}
      data-variant={variant}
      data-side={side}
      data-orientation={orientation}
      style={style}
    >
      {items.map((item, index) => {
        const itemStyle = {
          ['--rail-item-color' as string]: resolveRailColor(item, index)
        } satisfies CSSProperties;
        const height = item.height ?? 'medium';

        return (
          <span
            key={`${item.label ?? 'rail'}-${index}`}
            className={[styles.item, styles[height], item.active ? styles.active : ''].join(' ')}
            data-height={height}
            data-active={item.active ? 'true' : 'false'}
            style={itemStyle}
          >
            {item.label ? <span className={styles.label}>{item.label}</span> : null}
          </span>
        );
      })}
    </nav>
  );
}
