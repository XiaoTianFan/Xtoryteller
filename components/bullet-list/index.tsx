import { Markdown } from '@/components/_shared/markdown';
import styles from './styles.module.css';

export default function BulletList({
  props,
  revealCount = Number.MAX_SAFE_INTEGER,
  style
}: {
  props?: Record<string, unknown>;
  revealCount?: number;
  style?: React.CSSProperties;
}) {
  const items = Array.isArray(props?.items) ? (props?.items as string[]) : [];
  const ordered = Boolean(props?.ordered);
  const ListTag = ordered ? 'ol' : 'ul';

  return (
    <ListTag className={styles.list} style={style}>
      {items.map((item, index) => (
        <li key={`${item}-${index}`} className={`${styles.item} ${index < revealCount ? styles.visible : ''}`}>
          <Markdown content={item} />
        </li>
      ))}
    </ListTag>
  );
}
