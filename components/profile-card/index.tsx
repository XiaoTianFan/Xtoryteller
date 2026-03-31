import { Markdown } from '@/components/_shared/markdown';
import { resolveAssetPath } from '@/lib/engine/asset-resolver';
import styles from './styles.module.css';

function initialsFromName(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export default function ProfileCard({
  content,
  props,
  style,
  slug
}: {
  content?: string;
  props?: Record<string, unknown>;
  style?: React.CSSProperties;
  slug?: string;
}) {
  const name = String(props?.name ?? 'Profile');
  const role = typeof props?.role === 'string' ? props.role : undefined;
  const avatar = typeof props?.avatar === 'string' ? props.avatar : undefined;
  const resolvedAvatar = avatar && slug ? resolveAssetPath(slug, avatar) : avatar;

  return (
    <article className={styles.card} style={style}>
      <div className={styles.header}>
        {resolvedAvatar ? (
          <img className={styles.avatar} src={resolvedAvatar} alt={name} />
        ) : (
          <div className={styles.placeholder} aria-hidden="true">
            {initialsFromName(name)}
          </div>
        )}
        <div className={styles.meta}>
          <h3 className={styles.name}>{name}</h3>
          {role ? <p className={styles.role}>{role}</p> : null}
        </div>
      </div>
      {content ? <div className={styles.body}><Markdown content={content} /></div> : null}
    </article>
  );
}
