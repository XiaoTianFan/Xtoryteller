import styles from './styles.module.css';

interface TimelineEvent {
  date?: string;
  title?: string;
  description?: string;
  marker?: string;
}

export default function Timeline({
  props,
  revealCount = Number.MAX_SAFE_INTEGER,
  style
}: {
  props?: Record<string, unknown>;
  revealCount?: number;
  style?: React.CSSProperties;
}) {
  const events = Array.isArray(props?.events) ? (props.events as TimelineEvent[]) : [];
  const orientation = props?.orientation === 'vertical' ? 'vertical' : 'horizontal';

  return (
    <div className={`${styles.timeline} ${orientation === 'vertical' ? styles.vertical : styles.horizontal}`} style={style}>
      {events.map((event, index) => (
        <article key={`${event.title}-${index}`} className={`${styles.event} ${index < revealCount ? styles.visible : ''}`}>
          <div className={styles.dot}>{event.marker ?? index + 1}</div>
          {event.date ? <p className={styles.date}>{event.date}</p> : null}
          {event.title ? <h3 className={styles.title}>{event.title}</h3> : null}
          {event.description ? <p className={styles.description}>{event.description}</p> : null}
        </article>
      ))}
    </div>
  );
}
