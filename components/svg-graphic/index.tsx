import { resolveAssetPath } from '@/lib/engine/asset-resolver';
import styles from './styles.module.css';

export default function SvgGraphic({
  content,
  props,
  style,
  slug
}: {
  content?: string;
  props?: Record<string, unknown>;
  style?: React.CSSProperties;
  slug: string;
}) {
  const src = typeof props?.src === 'string' ? resolveAssetPath(slug, props.src) : null;

  return src ? (
    <figure className={styles.figure} style={style}>
      <img className={styles.image} src={src} alt={String(props?.alt ?? 'SVG graphic')} />
    </figure>
  ) : (
    <div className={styles.inlineGraphic} style={style} dangerouslySetInnerHTML={{ __html: content ?? '' }} />
  );
}
