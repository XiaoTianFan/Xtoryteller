import componentRegistry from '@/skills/xtoryteller/references/registries/component-registry.json';

import { RuntimeComponentType } from '@/lib/runtime/component-registry';
import { ComponentInstance } from '@/lib/types/presentation';

export interface ComponentStarterDefinition {
  type: RuntimeComponentType;
  displayName: string;
  description: string;
  category: string;
  component: ComponentInstance;
}

const INLINE_SVG_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 480'%3E%3Crect width='800' height='480' fill='%23f3ead5'/%3E%3Crect x='72' y='72' width='656' height='336' rx='28' fill='%23d7c2a2'/%3E%3Cpath d='M120 330 270 220 398 294 520 176 680 328' fill='none' stroke='%237a5536' stroke-width='18' stroke-linecap='round' stroke-linejoin='round'/%3E%3Ccircle cx='248' cy='178' r='44' fill='%23f7f3e8'/%3E%3C/svg%3E";

function buildStarterComponent(type: RuntimeComponentType): ComponentInstance {
  switch (type) {
    case 'headline':
      return { type, content: 'New headline' };
    case 'subtitle':
      return { type, content: 'A supporting subtitle' };
    case 'label':
      return { type, content: 'Context label', props: { tone: 'primary' } };
    case 'body-text':
      return { type, content: 'Use this space for a crisp supporting paragraph that explains the idea.' };
    case 'bullet-list':
      return { type, props: { items: ['First point', 'Second point', 'Third point'] } };
    case 'numbered-list':
      return { type, props: { items: ['Frame the problem', 'Show the shift', 'Name the action'] } };
    case 'blockquote':
      return { type, content: 'People need orientation, not more noise.', props: { attribution: 'Project note' } };
    case 'callout':
      return { type, content: 'This is the key message to keep visible.', props: { title: 'Why it matters', variant: 'important' } };
    case 'footnote':
      return { type, content: 'Source note or caveat', props: { label: 'Note' } };
    case 'icon':
      return { type, props: { name: 'sparkles', label: 'Sparkles icon', size: 'large' } };
    case 'image':
      return { type, props: { src: INLINE_SVG_PLACEHOLDER, alt: 'Placeholder illustration', caption: 'Preview image', fit: 'cover' } };
    case 'video':
      return { type, props: { src: '', caption: 'Preview video' } };
    case 'svg-graphic':
      return {
        type,
        content:
          "<svg viewBox='0 0 320 180' xmlns='http://www.w3.org/2000/svg'><rect width='320' height='180' rx='24' fill='rgba(122,85,54,0.12)'/><circle cx='84' cy='90' r='34' fill='rgba(122,85,54,0.35)'/><rect x='140' y='56' width='118' height='22' rx='11' fill='rgba(122,85,54,0.32)'/><rect x='140' y='96' width='86' height='18' rx='9' fill='rgba(122,85,54,0.2)'/></svg>"
      };
    case 'iframe-embed':
      return { type, props: { src: 'about:blank', title: 'Preview embed', height: '280px' } };
    case 'code-block':
      return { type, content: "const story = 'clear';", props: { language: 'ts', filename: 'story.ts' } };
    case 'card':
      return { type, content: 'A simple container for narrative content.', props: { header: 'Card header', footer: 'Card footer' } };
    case 'stat-card':
      return { type, props: { value: '84%', label: 'Adoption', trend: 'up', trendValue: '+12%', detail: 'Quarter over quarter' } };
    case 'profile-card':
      return { type, content: 'Works across product, design, and research.', props: { name: 'Alex Morgan', role: 'Program lead' } };
    case 'feature-card':
      return { type, props: { eyebrow: 'Pillar', title: 'Coordinated rollout', icon: 'sparkles', items: ['Shared language', 'Faster alignment', 'Better follow-through'] } };
    case 'comparison-card':
      return { type, props: { title: 'Shift', leftTitle: 'Before', leftItems: ['Fragmented updates', 'Slow handoffs'], rightTitle: 'After', rightItems: ['Shared context', 'Faster decisions'], variant: 'before-after' } };
    case 'timeline-item':
      return { type, content: 'Milestone description', props: { date: 'Q2 2026', title: 'Launch', marker: 'dot' } };
    case 'timeline':
      return { type, props: { events: [{ date: 'Now', title: 'Align' }, { date: 'Next', title: 'Prototype' }, { date: 'Later', title: 'Scale' }], orientation: 'horizontal' } };
    case 'divider':
      return { type, props: { variant: 'gradient' } };
    case 'edge-rail':
      return { type, props: { items: [{ label: 'Now', active: true }, { label: 'Next' }, { label: 'Later' }], variant: 'pills', side: 'left' } };
    case 'chapter-nav':
      return { type, props: { items: ['Setup', 'System', 'Move'], active: 1 } };
    case 'causal-diagram':
      return { type, props: { nodes: [{ id: 'a', label: 'Signal' }, { id: 'b', label: 'Trust' }, { id: 'c', label: 'Action' }], edges: [{ source: 'a', target: 'b', polarity: 'same' }, { source: 'b', target: 'c', polarity: 'same' }] } };
    case 'mind-map':
      return { type, props: { root: { label: 'Theme' }, branches: [{ label: 'Audience' }, { label: 'System' }, { label: 'Action' }] } };
    case 'iceberg-diagram':
      return { type, props: { layers: [{ label: 'Signals' }, { label: 'Structures' }, { label: 'Mental models' }] } };
    case 'three-horizons':
      return { type, props: { horizon1: { label: 'H1', items: ['Current model'] }, horizon2: { label: 'H2', items: ['Transition work'] }, horizon3: { label: 'H3', items: ['Emerging future'] } } };
    case 'flowchart':
      return { type, props: { nodes: [{ id: 'start', label: 'Start', type: 'start' }, { id: 'review', label: 'Review', type: 'decision' }, { id: 'ship', label: 'Ship', type: 'end' }], edges: [{ from: 'start', to: 'review' }, { from: 'review', to: 'ship' }] } };
    case 'quadrant-chart':
      return { type, props: { xAxis: { label: 'Impact' }, yAxis: { label: 'Effort' }, items: [{ label: 'Pilot', x: 0.28, y: 0.72 }, { label: 'Scale', x: 0.74, y: 0.54 }] } };
    case 'spectrum-bar':
      return { type, props: { leftLabel: 'Stable', rightLabel: 'Adaptive', markers: [{ label: 'Today', value: 0.32 }, { label: 'Target', value: 0.78 }] } };
    case 'funnel-diagram':
      return { type, props: { stages: [{ label: 'Reach', value: 100 }, { label: 'Evaluate', value: 58 }, { label: 'Adopt', value: 22 }] } };
    case 'venn-diagram':
      return { type, props: { sets: [{ label: 'People' }, { label: 'Process' }, { label: 'Tools' }], intersections: [{ label: 'Coordination', sets: [0, 1, 2] }] } };
    case 'stakeholder-map':
      return { type, props: { center: 'Core team', rings: [{ label: 'Close', items: ['Ops', 'Design'] }, { label: 'Broad', items: ['Partners', 'Advisors'] }] } };
    case 'radar-chart':
      return { type, props: { axes: [{ label: 'Speed' }, { label: 'Clarity' }, { label: 'Reach' }, { label: 'Trust' }], datasets: [{ label: 'Current', values: [72, 64, 58, 80] }] } };
    case 'org-chart':
      return { type, props: { root: { label: 'Program', children: [{ label: 'Design' }, { label: 'Product' }, { label: 'Research' }] } } };
    case 'cycle-diagram':
      return { type, props: { stages: [{ label: 'Listen' }, { label: 'Synthesize' }, { label: 'Act' }] } };
    case 'sankey-diagram':
      return { type, props: { nodes: [{ id: 'in', label: 'Inputs' }, { id: 'team', label: 'Team' }, { id: 'out', label: 'Outcomes' }], links: [{ source: 'in', target: 'team', value: 6 }, { source: 'team', target: 'out', value: 6 }] } };
    case 'coordinate-plot':
      return { type, props: { xAxis: { label: 'Confidence' }, yAxis: { label: 'Impact' }, points: [{ label: 'Pilot', x: 0.3, y: 0.7 }, { label: 'Scale', x: 0.76, y: 0.58 }] } };
    default:
      return { type, content: 'New component' };
  }
}

export const componentStarterRegistry: ComponentStarterDefinition[] = componentRegistry.components.map((entry) => ({
  type: entry.name as RuntimeComponentType,
  displayName: entry.displayName,
  description: entry.description,
  category: entry.category,
  component: buildStarterComponent(entry.name as RuntimeComponentType)
}));

export function getComponentStarter(type: RuntimeComponentType) {
  return componentStarterRegistry.find((entry) => entry.type === type) ?? null;
}

