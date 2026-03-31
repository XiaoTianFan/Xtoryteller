import { Markdown } from '@/components/_shared/markdown';
import styles from './styles.module.css';

function listItems(value: unknown) {
  return Array.isArray(value) ? (value as string[]) : [];
}

export default function ComparisonCard({
  content,
  props,
  style
}: {
  content?: string;
  props?: Record<string, unknown>;
  style?: React.CSSProperties;
}) {
  const leftItems = listItems(props?.leftItems);
  const rightItems = listItems(props?.rightItems);

  return (
    <article className={styles.card} style={style}>
      {props?.title ? <h3 className={styles.title}>{String(props.title)}</h3> : null}
      {content ? <div className={styles.summary}><Markdown content={content} /></div> : null}
      <div className={styles.columns}>
        <section>
          {props?.leftTitle ? <h4>{String(props.leftTitle)}</h4> : null}
          <ul>{leftItems.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul>
        </section>
        <section>
          {props?.rightTitle ? <h4>{String(props.rightTitle)}</h4> : null}
          <ul>{rightItems.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul>
        </section>
      </div>
    </article>
  );
}
