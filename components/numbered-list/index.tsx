import { Markdown } from '@/components/_shared/markdown';
import styles from './styles.module.css';

export default function NumberedList({
  props,
  revealCount = Number.MAX_SAFE_INTEGER,
  style
}: {
  props?: Record<string, unknown>;
  revealCount?: number;
  style?: React.CSSProperties;
}) {
  const items = Array.isArray(props?.items) ? (props.items as string[]) : [];

  return (
    <ol className={styles.list} style={style}>
      {items.map((item, index) => (
        <li key={`${item}-${index}`} className={`${styles.item} ${index < revealCount ? styles.visible : ''}`}>
          <Markdown content={item} />
        </li>
      ))}
    </ol>
  );
}
