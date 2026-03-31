import BodyText from '@/components/body-text';
import BulletList from '@/components/bullet-list';
import BlockQuote from '@/components/blockquote';
import Callout from '@/components/callout';
import Card from '@/components/card';
import CausalDiagram from '@/components/causal-diagram';
import CodeBlock from '@/components/code-block';
import Divider from '@/components/divider';
import Flowchart from '@/components/flowchart';
import Headline from '@/components/headline';
import IcebergDiagram from '@/components/iceberg-diagram';
import ImageComponent from '@/components/image';
import MindMap from '@/components/mind-map';
import QuadrantChart from '@/components/quadrant-chart';
import Subtitle from '@/components/subtitle';
import { ComponentInstance } from '@/lib/types/presentation';

const componentMap = {
  headline: Headline,
  subtitle: Subtitle,
  'body-text': BodyText,
  'bullet-list': BulletList,
  blockquote: BlockQuote,
  callout: Callout,
  image: ImageComponent,
  'code-block': CodeBlock,
  card: Card,
  divider: Divider,
  'causal-diagram': CausalDiagram,
  'mind-map': MindMap,
  'iceberg-diagram': IcebergDiagram,
  flowchart: Flowchart,
  'quadrant-chart': QuadrantChart
} as const;

export function ComponentRenderer({
  component,
  revealCount,
  slug
}: {
  component: ComponentInstance;
  revealCount: number;
  slug: string;
}) {
  const Selected = componentMap[component.type as keyof typeof componentMap];

  if (!Selected) {
    return (
      <article className="missingPrimitive">
        <p>Unknown component: {component.type}</p>
      </article>
    );
  }

  return (
    <Selected
      content={component.content}
      props={component.props}
      style={component.style as React.CSSProperties | undefined}
      revealCount={revealCount}
      slug={slug}
    />
  );
}
