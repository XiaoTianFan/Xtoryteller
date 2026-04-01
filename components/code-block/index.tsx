import styles from './styles.module.css';

export default function CodeBlock({
  content,
  props,
  style
}: {
  content?: string;
  props?: Record<string, unknown>;
  style?: React.CSSProperties;
}) {
  return (
    <div className={styles.shell} style={style}>
      <div className={styles.header}>
        <span>{String(props?.filename ?? props?.language ?? 'code')}</span>
      </div>
      <pre className={`${styles.code} appScrollbar`}><code>{content}</code></pre>
    </div>
  );
}
