import styles from './styles.module.css';

export default function ChapterNav({
  props,
  style
}: {
  content?: string;
  props?: Record<string, unknown>;
  style?: React.CSSProperties;
}) {
  const items = Array.isArray(props?.items) ? (props.items as string[]) : [];
  const active = typeof props?.active === 'number' ? Number(props.active) : 0;
  const orientation = props?.orientation === 'vertical' ? 'vertical' : 'horizontal';

  return (
    <nav
      aria-label="Chapter navigation"
      className={[styles.nav, styles[orientation]].join(' ')}
      data-orientation={orientation}
      style={style}
    >
      {items.map((item, index) => (
        <span
          key={`${item}-${index}`}
          className={[styles.item, index === active ? styles.active : ''].join(' ')}
          data-active={index === active ? 'true' : 'false'}
        >
          <span className={styles.index}>{String(index + 1).padStart(2, '0')}</span>
          <span className={styles.label}>{item}</span>
        </span>
      ))}
    </nav>
  );
}
