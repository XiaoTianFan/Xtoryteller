import { Markdown } from '@/components/_shared/markdown';
import styles from './styles.module.css';

export default function BodyText({
  content,
  props,
  style
}: {
  content?: string;
  props?: Record<string, unknown>;
  style?: React.CSSProperties;
}) {
  const align = String(props?.align ?? 'left');
  const maxWidth = String(props?.maxWidth ?? '68ch');

  return (
    <div className={[styles.body, styles[align as keyof typeof styles]].join(' ')} style={{ maxWidth, ...style }}>
      <Markdown content={content ?? ''} />
    </div>
  );
}
