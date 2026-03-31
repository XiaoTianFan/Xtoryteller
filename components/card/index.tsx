import { Markdown } from '@/components/_shared/markdown';
import styles from './styles.module.css';

export default function Card({
  content,
  props,
  style
}: {
  content?: string;
  props?: Record<string, unknown>;
  style?: React.CSSProperties;
}) {
  return (
    <article className={styles.card} style={style}>
      {props?.header ? <h3 className={styles.header}>{String(props.header)}</h3> : null}
      <div className={styles.content}><Markdown content={content ?? ''} /></div>
      {props?.footer ? <footer className={styles.footer}>{String(props.footer)}</footer> : null}
    </article>
  );
}
