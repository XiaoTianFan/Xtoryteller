import styles from './styles.module.css';

export default function StatCard({
  props,
  style
}: {
  props?: Record<string, unknown>;
  style?: React.CSSProperties;
}) {
  return (
    <article className={styles.card} style={style}>
      {props?.label ? <p className={styles.label}>{String(props.label)}</p> : null}
      <p className={styles.value}>{String(props?.value ?? '--')}</p>
      {props?.detail ? <p className={styles.detail}>{String(props.detail)}</p> : null}
      {props?.trend ? <p className={styles.trend}>{String(props.trend)}</p> : null}
    </article>
  );
}
