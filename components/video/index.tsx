import { resolveAssetPath } from '@/lib/engine/asset-resolver';
import styles from './styles.module.css';

export default function Video({
  props,
  style,
  slug
}: {
  props?: Record<string, unknown>;
  style?: React.CSSProperties;
  slug: string;
}) {
  const src = props?.src ? resolveAssetPath(slug, String(props.src)) : '';
  const caption = props?.caption ? String(props.caption) : null;

  return (
    <figure className={styles.figure} style={style}>
      <video className={styles.video} src={src} controls playsInline preload="metadata" />
      {caption ? <figcaption className={styles.caption}>{caption}</figcaption> : null}
    </figure>
  );
}
