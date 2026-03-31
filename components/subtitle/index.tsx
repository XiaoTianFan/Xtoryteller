import styles from './styles.module.css';

export default function Subtitle({
  content,
  props,
  style
}: {
  content?: string;
  props?: Record<string, unknown>;
  style?: React.CSSProperties;
}) {
  const align = String(props?.align ?? 'left');
  return (
    <p className={[styles.subtitle, styles[align as keyof typeof styles]].join(' ')} style={style}>
      {content}
    </p>
  );
}
