import styles from './styles.module.css';

interface SpectrumMarker {
  label?: string;
  position?: number;
  detail?: string;
}

function clamp(value: number) {
  return Math.min(1, Math.max(0, value));
}

function markerList(value: unknown): SpectrumMarker[] {
  return Array.isArray(value) ? (value as SpectrumMarker[]) : [];
}

export default function SpectrumBar({
  props,
  style
}: {
  props?: Record<string, unknown>;
  style?: React.CSSProperties;
}) {
  const markers = markerList(props?.markers);
  const gradient = Array.isArray(props?.gradient) ? (props.gradient as string[]) : ['var(--color-primary)', 'var(--color-secondary)'];
  const orientation = props?.orientation === 'vertical' ? 'vertical' : 'horizontal';

  return (
    <figure className={`${styles.figure} ${orientation === 'vertical' ? styles.vertical : ''}`} style={style}>
      <div className={styles.bar} style={{ background: `linear-gradient(${orientation === 'vertical' ? '180deg' : '90deg'}, ${gradient.join(', ')})` }}>
        {markers.map((marker, index) => {
          const offset = `${clamp(Number(marker.position ?? 0.5)) * 100}%`;
          return (
            <div
              key={`${marker.label}-${index}`}
              className={styles.marker}
              style={orientation === 'vertical' ? { bottom: offset } : { left: offset }}
              title={marker.detail}
            >
              <span className={styles.dot} />
              <span className={styles.label}>{marker.label}</span>
            </div>
          );
        })}
      </div>
      <figcaption className={styles.legend}>
        <span>{String(props?.leftLabel ?? 'Low')}</span>
        <span>{String(props?.rightLabel ?? 'High')}</span>
      </figcaption>
    </figure>
  );
}
