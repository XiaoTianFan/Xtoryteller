import styles from './styles.module.css';

export default function Headline({
  content,
  props,
  style
}: {
  content?: string;
  props?: Record<string, unknown>;
  style?: React.CSSProperties;
}) {
  const level = Number(props?.level ?? 1);
  const align = String(props?.align ?? 'left');
  const Tag = level === 2 ? 'h2' : level === 3 ? 'h3' : 'h1';
  const className = [styles[`level${level}` as keyof typeof styles], styles[align as keyof typeof styles]]
    .filter(Boolean)
    .join(' ');

  return (
    <Tag className={className} style={style}>
      {content}
    </Tag>
  );
}
