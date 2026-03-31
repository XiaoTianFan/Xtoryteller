import { Markdown } from '@/components/_shared/markdown';
import styles from './styles.module.css';

const toneMap: Record<string, string> = {
  info: 'var(--color-secondary)',
  warning: 'var(--color-warning)',
  tip: 'var(--color-success)',
  important: 'var(--color-primary)',
  note: 'var(--color-accent)'
};

export default function Callout({
  content,
  props,
  style
}: {
  content?: string;
  props?: Record<string, unknown>;
  style?: React.CSSProperties;
}) {
  const variant = String(props?.variant ?? 'note');
  const title = props?.title ? String(props.title) : variant;

  return (
    <aside className={styles.callout} style={{ ['--tone' as string]: toneMap[variant] ?? toneMap.note, ...style }}>
      <p className={styles.title}>{title}</p>
      <div className={styles.content}>
        <Markdown content={content ?? ''} />
      </div>
    </aside>
  );
}
