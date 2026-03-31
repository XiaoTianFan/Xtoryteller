import { CSSProperties, ReactNode } from 'react';

import { ComponentInstance } from '@/lib/types/presentation';
import styles from '@/layouts/_shared/layout.module.css';

export interface LayoutEntry {
  component: ComponentInstance;
  node: ReactNode;
}

export interface LayoutProps {
  items: ReactNode[];
  entries?: LayoutEntry[];
  compact?: boolean;
  layoutProps?: Record<string, unknown>;
}

export function wrapPanels(items: ReactNode[]) {
  return items.map((item, index) => (
    <div key={index} className={styles.panel}>
      {item}
    </div>
  ));
}

function toCssLength(value: unknown): string | undefined {
  if (typeof value === 'number') {
    return `${value}px`;
  }

  if (typeof value === 'string' && value.trim()) {
    return value;
  }

  return undefined;
}

export function joinLayoutClasses(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

export function getLayoutStyle(layoutProps?: Record<string, unknown>): CSSProperties {
  const style: CSSProperties = {};
  const gap = toCssLength(layoutProps?.gap);
  const maxWidth = toCssLength(layoutProps?.maxWidth);
  const width = toCssLength(layoutProps?.width);
  const minHeight = toCssLength(layoutProps?.minHeight);

  if (gap) {
    style.gap = gap;
  }

  if (maxWidth) {
    style.maxWidth = maxWidth;
  }

  if (width) {
    style.width = width;
  }

  if (minHeight) {
    style.minHeight = minHeight;
  }

  return style;
}

export function getVerticalAlign(value: unknown): CSSProperties['alignItems'] | undefined {
  const align = typeof value === 'string' ? value : '';

  if (align === 'top') {
    return 'start';
  }

  if (align === 'bottom') {
    return 'end';
  }

  if (align === 'center' || align === 'stretch') {
    return align;
  }

  return undefined;
}

export function getRatioColumns(ratio: unknown, fallback = '50-50'): string {
  const selected = typeof ratio === 'string' ? ratio : fallback;

  switch (selected) {
    case '60-40':
      return 'minmax(0, 1.5fr) minmax(0, 1fr)';
    case '40-60':
      return 'minmax(0, 1fr) minmax(0, 1.5fr)';
    case '70-30':
      return 'minmax(0, 2.333fr) minmax(0, 1fr)';
    case '30-70':
      return 'minmax(0, 1fr) minmax(0, 2.333fr)';
    default:
      return 'repeat(2, minmax(0, 1fr))';
  }
}

export function getRatioRows(ratio: unknown, fallback = '50-50'): string {
  const selected = typeof ratio === 'string' ? ratio : fallback;

  switch (selected) {
    case '60-40':
      return '1.5fr 1fr';
    case '40-60':
      return '1fr 1.5fr';
    case '70-30':
      return '2.333fr 1fr';
    case '30-70':
      return '1fr 2.333fr';
    default:
      return '1fr 1fr';
  }
}
