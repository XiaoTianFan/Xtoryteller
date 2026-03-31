import { resolveAssetPath } from '@/lib/engine/asset-resolver';
import styles from './styles.module.css';

export default function ImageComponent({
  props,
  style,
  slug
}: {
  props?: Record<string, unknown>;
  style?: React.CSSProperties;
  slug: string;
}) {
  const src = props?.src ? resolveAssetPath(slug, String(props.src)) : '';
  const alt = String(props?.alt ?? 'Presentation image');
  const caption = props?.caption ? String(props.caption) : null;
  const fit = String(props?.fit ?? 'contain');

  return (
    <figure className={styles.figure} style={style}>
      <img className={styles.image} src={src} alt={alt} style={{ objectFit: fit as React.CSSProperties['objectFit'] }} />
      {caption ? <figcaption className={styles.caption}>{caption}</figcaption> : null}
    </figure>
  );
}
