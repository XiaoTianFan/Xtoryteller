import styles from './styles.module.css';

export default function Label({
  content,
  props,
  style
}: {
  content?: string;
  props?: Record<string, unknown>;
  style?: React.CSSProperties;
}) {
  const tone = String(props?.tone ?? 'default');

  return (
    <span className={`${styles.label} ${styles[tone as keyof typeof styles] ?? ''}`} style={style}>
      {content}
    </span>
  );
}
