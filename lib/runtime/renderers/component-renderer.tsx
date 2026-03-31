import BodyText from '@/components/body-text';
import BulletList from '@/components/bullet-list';
import BlockQuote from '@/components/blockquote';
import Callout from '@/components/callout';
import Card from '@/components/card';
import CausalDiagram from '@/components/causal-diagram';
import CodeBlock from '@/components/code-block';
import ComparisonCard from '@/components/comparison-card';
import Divider from '@/components/divider';
import FeatureCard from '@/components/feature-card';
import Flowchart from '@/components/flowchart';
import Footnote from '@/components/footnote';
import Headline from '@/components/headline';
import IcebergDiagram from '@/components/iceberg-diagram';
import IframeEmbed from '@/components/iframe-embed';
import ImageComponent from '@/components/image';
import Label from '@/components/label';
import MindMap from '@/components/mind-map';
import NumberedList from '@/components/numbered-list';
import QuadrantChart from '@/components/quadrant-chart';
import StatCard from '@/components/stat-card';
import Subtitle from '@/components/subtitle';
import SvgGraphic from '@/components/svg-graphic';
import Timeline from '@/components/timeline';
import TimelineItem from '@/components/timeline-item';
import Video from '@/components/video';
import { ComponentInstance } from '@/lib/types/presentation';

const componentMap = {
  headline: Headline,
  subtitle: Subtitle,
  label: Label,
  'body-text': BodyText,
  'bullet-list': BulletList,
  'numbered-list': NumberedList,
  blockquote: BlockQuote,
  callout: Callout,
  footnote: Footnote,
  image: ImageComponent,
  video: Video,
  'svg-graphic': SvgGraphic,
  'iframe-embed': IframeEmbed,
  'code-block': CodeBlock,
  card: Card,
  'stat-card': StatCard,
  'feature-card': FeatureCard,
  'comparison-card': ComparisonCard,
  'timeline-item': TimelineItem,
  timeline: Timeline,
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
