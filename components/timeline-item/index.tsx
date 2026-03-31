import { Markdown } from '@/components/_shared/markdown';
import { ProjectIcon } from '@/components/_shared/project-icon';
import styles from './styles.module.css';

export default function TimelineItem({
  content,
  props,
  style
}: {
  content?: string;
  props?: Record<string, unknown>;
  style?: React.CSSProperties;
}) {
  const markerType = typeof props?.marker === 'string' ? props.marker : 'dot';
  const markerValue = String(props?.markerValue ?? props?.marker ?? '');

  return (
    <article className={styles.item} style={style}>
      <div className={styles.marker}>
        {markerType === 'icon' ? (
          <span className={styles.markerIcon} aria-hidden="true">
            <ProjectIcon name={markerValue || 'clock'} size="100%" color="currentColor" />
          </span>
        ) : markerType === 'number' ? (
          markerValue || '1'
        ) : (
          <span className={styles.dot} aria-hidden="true" />
        )}
      </div>
      <div className={styles.body}>
        {props?.date ? <p className={styles.date}>{String(props.date)}</p> : null}
        {props?.title ? <h3 className={styles.title}>{String(props.title)}</h3> : null}
        {content ? <div className={styles.copy}><Markdown content={content} /></div> : null}
      </div>
    </article>
  );
}
