import { Markdown } from '@/components/_shared/markdown';
import styles from './styles.module.css';

export default function BlockQuote({
  content,
  props,
  style
}: {
  content?: string;
  props?: Record<string, unknown>;
  style?: React.CSSProperties;
}) {
  return (
    <figure className={styles.quote} style={style}>
      <blockquote>
        <Markdown content={content ?? ''} />
      </blockquote>
      {props?.attribution ? <figcaption><cite>{String(props.attribution)}</cite></figcaption> : null}
    </figure>
  );
}
