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
  const variant = String(props?.variant ?? 'default');

  return (
    <figure
      className={[styles.quote, styles[variant as keyof typeof styles] ?? ''].join(' ')}
      data-variant={variant}
      style={style}
    >
      <blockquote>
        <Markdown content={content ?? ''} />
      </blockquote>
      {props?.attribution ? <figcaption><cite>{String(props.attribution)}</cite></figcaption> : null}
    </figure>
  );
}
