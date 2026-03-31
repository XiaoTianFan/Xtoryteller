import { Markdown } from '@/components/_shared/markdown';
import styles from './styles.module.css';

export default function ComparisonCard({
  content,
  props,
  style
}: {
  content?: string;
  props?: Record<string, unknown>;
  style?: React.CSSProperties;
}) {
  const leftItems = Array.isArray(props?.leftItems) ? (props.leftItems as string[]) : [];
  const rightItems = Array.isArray(props?.rightItems) ? (props.rightItems as string[]) : [];
  const leftContent = typeof props?.leftContent === 'string' ? props.leftContent : leftItems.map((item) => `- ${item}`).join('\n');
  const rightContent = typeof props?.rightContent === 'string' ? props.rightContent : rightItems.map((item) => `- ${item}`).join('\n');

  return (
    <article className={styles.card} style={style}>
      {props?.title ? <h3 className={styles.title}>{String(props.title)}</h3> : null}
      {content ? <div className={styles.summary}><Markdown content={content} /></div> : null}
      <div className={styles.columns}>
        <section>
          {props?.leftTitle ? <h4>{String(props.leftTitle)}</h4> : null}
          <div className={styles.markdownColumn}><Markdown content={leftContent} /></div>
        </section>
        <section>
          {props?.rightTitle ? <h4>{String(props.rightTitle)}</h4> : null}
          <div className={styles.markdownColumn}><Markdown content={rightContent} /></div>
        </section>
      </div>
    </article>
  );
}
