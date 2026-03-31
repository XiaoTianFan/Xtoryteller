import ContentLeftMediaRightLayout from '@/layouts/content-left-media-right';
import FullBleedLayout from '@/layouts/full-bleed';
import GalleryLayout from '@/layouts/gallery';
import Grid2x2Layout from '@/layouts/grid-2x2';
import MediaLeftContentRightLayout from '@/layouts/media-left-content-right';
import ScatteredLayout from '@/layouts/scattered';
import SidebarMainLayout from '@/layouts/sidebar-main';
import SingleContentLayout from '@/layouts/single-content';
import StackLayout from '@/layouts/stack';
import ThreeColumnLayout from '@/layouts/three-column';
import TitleCenterLayout from '@/layouts/title-center';
import TwoColumnLayout from '@/layouts/two-column';
import { usePresentationRuntime } from '@/lib/runtime/providers/presentation-provider';
import { ComponentRenderer } from '@/lib/runtime/renderers/component-renderer';
import { ComponentInstance } from '@/lib/types/presentation';

const layoutMap = {
  'title-center': TitleCenterLayout,
  'single-content': SingleContentLayout,
  'two-column': TwoColumnLayout,
  'content-left-media-right': ContentLeftMediaRightLayout,
  'full-bleed': FullBleedLayout,
  stack: StackLayout,
  'three-column': ThreeColumnLayout,
  'grid-2x2': Grid2x2Layout,
  'media-left-content-right': MediaLeftContentRightLayout,
  'sidebar-main': SidebarMainLayout,
  gallery: GalleryLayout,
  scattered: ScatteredLayout
} as const;

export function LayoutRenderer({
  layout,
  items,
  compact
}: {
  layout: string;
  layoutProps?: Record<string, unknown>;
  items: { component: ComponentInstance; revealCount: number }[];
  compact?: boolean;
}) {
  const Selected = layoutMap[layout as keyof typeof layoutMap] ?? SingleContentLayout;
  const { presentation } = usePresentationRuntime();

  return (
    <Selected
      items={items.map((item, index) => (
        <ComponentRenderer key={`${item.component.type}-${index}`} component={item.component} revealCount={item.revealCount} slug={presentation.meta.slug} />
      ))}
      compact={compact}
    />
  );
}
