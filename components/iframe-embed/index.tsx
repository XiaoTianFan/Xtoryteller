import styles from './styles.module.css';

export default function IframeEmbed({
  props,
  style
}: {
  props?: Record<string, unknown>;
  style?: React.CSSProperties;
}) {
  const src = typeof props?.src === 'string' ? props.src : '';
  const title = String(props?.title ?? 'Embedded content');
  const height = typeof props?.height === 'number' ? `${props.height}px` : String(props?.height ?? '420px');

  return (
    <div className={styles.shell} style={style}>
      <iframe className={styles.frame} src={src} title={title} style={{ height }} loading="lazy" allowFullScreen />
    </div>
  );
}
