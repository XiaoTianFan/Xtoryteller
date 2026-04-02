import AsymmetricSplitLayout from '@/layouts/asymmetric-split';
import ContentLeftMediaRightLayout from '@/layouts/content-left-media-right';
import ComparisonLayout from '@/layouts/comparison-layout';
import FramedRailLayout from '@/layouts/framed-rail';
import FullBleedLayout from '@/layouts/full-bleed';
import GalleryLayout from '@/layouts/gallery';
import Grid2x2Layout from '@/layouts/grid-2x2';
import Grid3x2Layout from '@/layouts/grid-3x2';
import MediaLeftContentRightLayout from '@/layouts/media-left-content-right';
import PyramidLayout from '@/layouts/pyramid-layout';
import ScatteredLayout from '@/layouts/scattered';
import SectionHeaderLayout from '@/layouts/section-header';
import SidebarMainLayout from '@/layouts/sidebar-main';
import SingleContentLayout from '@/layouts/single-content';
import StackLayout from '@/layouts/stack';
import ThreeColumnLayout from '@/layouts/three-column';
import TitleCenterLayout from '@/layouts/title-center';
import TitleLeftLayout from '@/layouts/title-left';
import TimelineLayout from '@/layouts/timeline-layout';
import TopBottomLayout from '@/layouts/top-bottom';
import TwoColumnLayout from '@/layouts/two-column';

export const runtimeLayoutMap = {
  'asymmetric-split': AsymmetricSplitLayout,
  'title-center': TitleCenterLayout,
  'title-left': TitleLeftLayout,
  'section-header': SectionHeaderLayout,
  'single-content': SingleContentLayout,
  'two-column': TwoColumnLayout,
  'framed-rail': FramedRailLayout,
  'content-left-media-right': ContentLeftMediaRightLayout,
  'full-bleed': FullBleedLayout,
  stack: StackLayout,
  'three-column': ThreeColumnLayout,
  'top-bottom': TopBottomLayout,
  'grid-2x2': Grid2x2Layout,
  'grid-3x2': Grid3x2Layout,
  'media-left-content-right': MediaLeftContentRightLayout,
  'sidebar-main': SidebarMainLayout,
  gallery: GalleryLayout,
  scattered: ScatteredLayout,
  'timeline-layout': TimelineLayout,
  'comparison-layout': ComparisonLayout,
  'pyramid-layout': PyramidLayout
} as const;

export type RuntimeLayoutType = keyof typeof runtimeLayoutMap;
