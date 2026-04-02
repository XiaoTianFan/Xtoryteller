import BodyText from '@/components/body-text';
import BulletList from '@/components/bullet-list';
import BlockQuote from '@/components/blockquote';
import Callout from '@/components/callout';
import Card from '@/components/card';
import CausalDiagram from '@/components/causal-diagram';
import CodeBlock from '@/components/code-block';
import ComparisonCard from '@/components/comparison-card';
import CoordinatePlot from '@/components/coordinate-plot';
import CycleDiagram from '@/components/cycle-diagram';
import Divider from '@/components/divider';
import EdgeRail from '@/components/edge-rail';
import FeatureCard from '@/components/feature-card';
import Flowchart from '@/components/flowchart';
import Footnote from '@/components/footnote';
import FunnelDiagram from '@/components/funnel-diagram';
import Headline from '@/components/headline';
import IcebergDiagram from '@/components/iceberg-diagram';
import Icon from '@/components/icon';
import IframeEmbed from '@/components/iframe-embed';
import ImageComponent from '@/components/image';
import Label from '@/components/label';
import ChapterNav from '@/components/chapter-nav';
import MindMap from '@/components/mind-map';
import NumberedList from '@/components/numbered-list';
import OrgChart from '@/components/org-chart';
import ProfileCard from '@/components/profile-card';
import QuadrantChart from '@/components/quadrant-chart';
import RadarChart from '@/components/radar-chart';
import SankeyDiagram from '@/components/sankey-diagram';
import SpectrumBar from '@/components/spectrum-bar';
import StatCard from '@/components/stat-card';
import StakeholderMap from '@/components/stakeholder-map';
import Subtitle from '@/components/subtitle';
import SvgGraphic from '@/components/svg-graphic';
import ThreeHorizons from '@/components/three-horizons';
import Timeline from '@/components/timeline';
import TimelineItem from '@/components/timeline-item';
import VennDiagram from '@/components/venn-diagram';
import Video from '@/components/video';

export const runtimeComponentMap = {
  headline: Headline,
  subtitle: Subtitle,
  label: Label,
  'body-text': BodyText,
  'bullet-list': BulletList,
  'numbered-list': NumberedList,
  blockquote: BlockQuote,
  callout: Callout,
  footnote: Footnote,
  icon: Icon,
  image: ImageComponent,
  video: Video,
  'svg-graphic': SvgGraphic,
  'iframe-embed': IframeEmbed,
  'code-block': CodeBlock,
  card: Card,
  'stat-card': StatCard,
  'profile-card': ProfileCard,
  'feature-card': FeatureCard,
  'comparison-card': ComparisonCard,
  'timeline-item': TimelineItem,
  timeline: Timeline,
  divider: Divider,
  'edge-rail': EdgeRail,
  'chapter-nav': ChapterNav,
  'causal-diagram': CausalDiagram,
  'mind-map': MindMap,
  'iceberg-diagram': IcebergDiagram,
  'three-horizons': ThreeHorizons,
  flowchart: Flowchart,
  'quadrant-chart': QuadrantChart,
  'spectrum-bar': SpectrumBar,
  'funnel-diagram': FunnelDiagram,
  'venn-diagram': VennDiagram,
  'stakeholder-map': StakeholderMap,
  'radar-chart': RadarChart,
  'org-chart': OrgChart,
  'cycle-diagram': CycleDiagram,
  'sankey-diagram': SankeyDiagram,
  'coordinate-plot': CoordinatePlot
} as const;

export type RuntimeComponentType = keyof typeof runtimeComponentMap;
