import { Markdown } from '@/components/_shared/markdown';
import styles from './styles.module.css';

export default function TimelineItem({
  content,
  props,
  style
}: {
  content?: string;
  props?: Record<string, unknown>;
  style?: React.CSSProperties;
}) {
  return (
    <article className={styles.item} style={style}>
      <div className={styles.marker}>{String(props?.marker ?? '')}</div>
      <div className={styles.body}>
        {props?.date ? <p className={styles.date}>{String(props.date)}</p> : null}
        {props?.title ? <h3 className={styles.title}>{String(props.title)}</h3> : null}
        {content ? <div className={styles.copy}><Markdown content={content} /></div> : null}
      </div>
    </article>
  );
}
