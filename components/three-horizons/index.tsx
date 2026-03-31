import styles from '@/components/_shared/diagram.module.css';
import localStyles from './styles.module.css';

interface Horizon {
  label?: string;
  items?: string[];
  color?: string;
}

function horizonItems(value: unknown): string[] {
  return Array.isArray(value) ? (value as string[]).map((item) => String(item)) : [];
}

export default function ThreeHorizons({ props }: { props?: Record<string, unknown> }) {
  const horizon1 = (props?.horizon1 as Horizon | undefined) ?? {};
  const horizon2 = (props?.horizon2 as Horizon | undefined) ?? {};
  const horizon3 = (props?.horizon3 as Horizon | undefined) ?? {};
  const timeLabels = (props?.timeLabels as { start?: string; mid?: string; end?: string } | undefined) ?? {};

  const colors = [
    horizon1.color ?? 'var(--color-secondary)',
    horizon2.color ?? 'var(--color-primary)',
    horizon3.color ?? 'var(--color-foreground)'
  ];

  return (
    <figure className={localStyles.figure}>
      <div className={styles.shell}>
        <svg viewBox="0 0 720 360" role="img" aria-label="Three horizons diagram">
          <path d="M80 70C210 80 250 180 340 245c70 52 165 45 290 32" fill="none" stroke={colors[0]} strokeWidth="10" strokeLinecap="round" opacity="0.9" />
          <path d="M90 265c78-44 130-103 212-110 88-7 147 54 228 78" fill="none" stroke={colors[1]} strokeWidth="10" strokeLinecap="round" opacity="0.9" />
          <path d="M160 300c78-118 155-171 245-171 94 0 166 60 226 144" fill="none" stroke={colors[2]} strokeWidth="10" strokeLinecap="round" opacity="0.9" />

          <text x="90" y="52" className={styles.label}>{String(horizon1.label ?? 'Horizon 1')}</text>
          <text x="308" y="132" className={styles.label}>{String(horizon2.label ?? 'Horizon 2')}</text>
          <text x="530" y="112" className={styles.label}>{String(horizon3.label ?? 'Horizon 3')}</text>

          <line x1="90" y1="310" x2="635" y2="310" className={styles.line} />
          <text x="90" y="336" className={styles.label}>{timeLabels.start ?? 'Now'}</text>
          {timeLabels.mid ? <text x="360" y="336" textAnchor="middle" className={styles.label}>{timeLabels.mid}</text> : null}
          <text x="635" y="336" textAnchor="end" className={styles.label}>{timeLabels.end ?? 'Future'}</text>
        </svg>
      </div>
      <div className={localStyles.columns}>
        {[horizon1, horizon2, horizon3].map((horizon, index) => (
          <section key={index} className={localStyles.column}>
            <h4 style={{ color: colors[index] }}>{String(horizon.label ?? `Horizon ${index + 1}`)}</h4>
            <ul>
              {horizonItems(horizon.items).map((item, itemIndex) => (
                <li key={`${item}-${itemIndex}`}>{item}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </figure>
  );
}
