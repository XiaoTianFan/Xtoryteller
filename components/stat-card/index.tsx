import { ProjectIcon } from '@/components/_shared/project-icon';
import styles from './styles.module.css';

export default function StatCard({
  props,
  style
}: {
  props?: Record<string, unknown>;
  style?: React.CSSProperties;
}) {
  const trend = typeof props?.trend === 'string' ? props.trend : undefined;

  return (
    <article className={styles.card} style={style}>
      {props?.label ? <p className={styles.label}>{String(props.label)}</p> : null}
      <p className={styles.value}>
        {props?.prefix ? String(props.prefix) : null}
        {String(props?.value ?? '--')}
        {props?.suffix ? String(props.suffix) : null}
      </p>
      {props?.detail ? <p className={styles.detail}>{String(props.detail)}</p> : null}
      {trend ? (
        <p className={styles.trend}>
          <span className={styles.trendIcon} aria-hidden="true">
            <ProjectIcon name={trend === 'up' ? 'arrow-up' : trend === 'down' ? 'arrow-down' : 'minus'} size="100%" color="currentColor" />
          </span>
          <span>{String(props?.trendValue ?? trend)}</span>
        </p>
      ) : null}
    </article>
  );
}
