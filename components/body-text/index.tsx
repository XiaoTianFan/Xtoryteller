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
  const maxWidth = props?.maxWidth ? String(props.maxWidth) : 'none';
  const dropCap = Boolean(props?.dropCap);
  const dropCapLines = typeof props?.dropCapLines === 'number' ? Number(props.dropCapLines) : 3;

  return (
    <div
      className={[
        styles.body,
        styles[align as keyof typeof styles],
        dropCap ? styles.dropCap : ''
      ].join(' ')}
      data-drop-cap={dropCap ? 'true' : 'false'}
      style={{
        maxWidth,
        ['--body-drop-cap-lines' as string]: String(Math.max(2, dropCapLines)),
        ...style
      }}
    >
      <Markdown content={content ?? ''} />
    </div>
  );
}
