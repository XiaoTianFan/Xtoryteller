import { Markdown } from '@/components/_shared/markdown';
import styles from './styles.module.css';

export default function Footnote({
  content,
  props,
  style
}: {
  content?: string;
  props?: Record<string, unknown>;
  style?: React.CSSProperties;
}) {
  return (
    <aside className={styles.footnote} style={style}>
      {props?.label ? <span className={styles.label}>{String(props.label)}</span> : null}
      <Markdown content={content ?? ''} />
    </aside>
  );
}
