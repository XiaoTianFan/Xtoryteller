import styles from '@/components/_shared/diagram.module.css';

interface StakeholderRing {
  label?: string;
  stakeholders?: Array<{ label?: string; angle?: number; detail?: string }>;
}

function toRings(value: unknown): StakeholderRing[] {
  return Array.isArray(value) ? (value as StakeholderRing[]) : [];
}

export default function StakeholderMap({ props }: { props?: Record<string, unknown> }) {
  const rings = toRings(props?.rings);

  return (
    <figure className={styles.shell}>
      <svg viewBox="0 0 680 420" role="img" aria-label="Stakeholder map">
        <g transform="translate(340 210)">
          <circle r="44" fill="var(--color-primary)" opacity="0.2" stroke="var(--color-primary)" />
          <text textAnchor="middle" y="6" className={styles.label}>{String(props?.center ?? 'Center')}</text>

          {rings.map((ring, ringIndex) => {
            const radius = 92 + ringIndex * 62;
            const stakeholders = Array.isArray(ring.stakeholders) ? ring.stakeholders : [];

            return (
              <g key={`${ring.label}-${ringIndex}`}>
                <circle r={radius} fill="none" stroke="var(--color-border)" strokeDasharray="6 8" />
                <text x="0" y={-radius - 10} textAnchor="middle" className={styles.label}>
                  {ring.label}
                </text>
                {stakeholders.map((stakeholder, index) => {
                  const angle = ((stakeholder.angle ?? (360 / Math.max(stakeholders.length, 1)) * index) - 90) * (Math.PI / 180);
                  const x = Math.cos(angle) * radius;
                  const y = Math.sin(angle) * radius;

                  return (
                    <g key={`${stakeholder.label}-${index}`} transform={`translate(${x}, ${y})`}>
                      <circle r="18" fill="var(--color-surface)" stroke="var(--color-border)" />
                      <text y="5" textAnchor="middle" className={styles.label}>{stakeholder.label}</text>
                    </g>
                  );
                })}
              </g>
            );
          })}
        </g>
      </svg>
    </figure>
  );
}
