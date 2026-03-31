import { Markdown } from '@/components/_shared/markdown';
import styles from './styles.module.css';

export default function FeatureCard({
  content,
  props,
  style
}: {
  content?: string;
  props?: Record<string, unknown>;
  style?: React.CSSProperties;
}) {
  const items = Array.isArray(props?.items) ? (props.items as string[]) : [];

  return (
    <article className={styles.card} style={style}>
      {props?.eyebrow ? <p className={styles.eyebrow}>{String(props.eyebrow)}</p> : null}
      {props?.title ? <h3 className={styles.title}>{String(props.title)}</h3> : null}
      {content ? <div className={styles.body}><Markdown content={content} /></div> : null}
      {items.length ? (
        <ul className={styles.list}>
          {items.map((item, index) => (
            <li key={`${item}-${index}`}>{item}</li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
