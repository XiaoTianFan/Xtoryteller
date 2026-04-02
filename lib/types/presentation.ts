export type PresentationMode = 'stage' | 'map';
export type StyleValue = string | number;
export type StyleObject = Record<string, StyleValue>;

export type ComponentBuildMode =
  | number
  | 'sequential'
  | 'nodes-first'
  | 'all-at-once'
  | 'top-down'
  | { with: number };

export interface PresentationMeta {
  title: string;
  slug: string;
  description?: string;
  author?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
  thumbnail?: string;
}

export interface BackgroundTransitionConfig {
  duration?: number;
  easing?: string;
}

export type BackgroundRendererType = 'paper-shader' | 'css' | 'none';
export type BackgroundFilterMode = 'radial' | 'linear-horizontal' | 'linear-vertical';

export interface BackgroundFilterConfig {
  mode: BackgroundFilterMode;
  opacity?: number;
  radialSize?: {
    width?: number;
    height?: number;
  };
  linearProportion?: number;
}

export type SupportedPaperShaderName =
  | 'dithering'
  | 'grain-gradient'
  | 'mesh-gradient'
  | 'paper-texture'
  | 'static-mesh-gradient'
  | 'static-radial-gradient'
  | 'water'
  | 'warp'
  | 'waves';

export interface CssGradientConfig {
  type?: 'linear' | 'radial';
  angle?: string | number;
  position?: string;
  stops: string[];
}

interface BackgroundConfigBase {
  presetRef?: string;
  opacity?: number;
  filter?: BackgroundFilterConfig;
  transition?: BackgroundTransitionConfig;
  stages?: Array<{
    steps: [number, number];
    type?: BackgroundRendererType | 'paper';
    presetRef?: string;
    shader?: SupportedPaperShaderName | string;
    preset?: string;
    params?: Record<string, unknown>;
    value?: string;
    gradient?: CssGradientConfig;
    variant?: string;
    colorStops?: string[];
    intensity?: number;
    grain?: number;
    contrast?: number;
    speed?: number;
    opacity?: number;
    filter?: BackgroundFilterConfig;
  }>;
  regions?: Array<{
    clusters?: string[];
    group?: string;
    type?: BackgroundRendererType | 'paper';
    presetRef?: string;
    shader?: SupportedPaperShaderName | string;
    preset?: string;
    params?: Record<string, unknown>;
    value?: string;
    gradient?: CssGradientConfig;
    variant?: string;
    colorStops?: string[];
    intensity?: number;
    grain?: number;
    contrast?: number;
    speed?: number;
    opacity?: number;
    filter?: BackgroundFilterConfig;
  }>;
}

export interface BackgroundCssConfig extends BackgroundConfigBase {
  type: 'css';
  value?: string;
  gradient?: CssGradientConfig;
  variant?: string;
  colorStops?: string[];
}

export interface BackgroundPaperShaderConfig extends BackgroundConfigBase {
  type: 'paper-shader';
  shader?: SupportedPaperShaderName | string;
  preset?: string;
  params?: Record<string, unknown>;
  variant?: string;
  colorStops?: string[];
  intensity?: number;
  grain?: number;
  contrast?: number;
  speed?: number;
}

export interface BackgroundNoneConfig extends BackgroundConfigBase {
  type: 'none';
}

export interface LegacyPaperBackgroundConfig extends BackgroundConfigBase {
  type: 'paper';
  value?: string;
  gradient?: CssGradientConfig;
  variant?: string;
  colorStops?: string[];
  intensity?: number;
  grain?: number;
  contrast?: number;
  speed?: number;
}

export type BackgroundConfigObject =
  | BackgroundCssConfig
  | BackgroundPaperShaderConfig
  | BackgroundNoneConfig
  | LegacyPaperBackgroundConfig;

export type BackgroundShaderConfig = string | BackgroundConfigObject;

export interface BackgroundSection {
  match: {
    stepRange?: [number, number];
    clusterIds?: string[];
    group?: string;
  };
  shader?: BackgroundShaderConfig;
}

export interface ComponentInstance {
  type: string;
  slot?: string;
  content?: string;
  props?: Record<string, unknown>;
  style?: StyleObject;
  build?: ComponentBuildMode;
  enter?: string;
  exit?: string;
  annotations?: Record<string, string>;
  position?: { x: number; y: number };
}

export interface StepDefinition {
  id?: string;
  title?: string;
  layout: string;
  layoutProps?: Record<string, unknown>;
  transition?: string;
  background?: BackgroundShaderConfig;
  components: ComponentInstance[];
}

export type RelativeDirection =
  | 'left'
  | 'right'
  | 'above'
  | 'below'
  | 'upper-right'
  | 'upper-left'
  | 'lower-right'
  | 'lower-left';

export interface ClusterAnchor {
  x?: number;
  y?: number;
  relativeTo?: string;
  direction?: RelativeDirection;
  distance?: number;
}

export interface ClusterDefinition {
  id: string;
  title?: string;
  description?: string;
  group?: string;
  layout: string;
  layoutProps?: Record<string, unknown>;
  transition?: string;
  background?: BackgroundShaderConfig;
  anchor?: ClusterAnchor;
  arrangement?: {
    algorithm?: 'flow' | 'radial' | 'grid' | 'tree';
    columns?: number;
    radius?: number;
    spacing?: number;
  };
  components: ComponentInstance[];
}

export interface MapCanvasConfig {
  width?: number;
  height?: number;
  spacing?: number;
  minZoom?: number;
  maxZoom?: number;
  initialZoom?: number;
}

export interface MapNavigationConfig {
  sequence?: string[];
  transition?: {
    type?: string;
    duration?: number;
    easing?: string;
    zoomOut?: number | null;
  };
}

export interface PresentationConfig {
  meta: PresentationMeta;
  mode: PresentationMode;
  theme?: string;
  themeOverrides?: Record<string, unknown>;
  data?: Record<string, unknown>;
  background?: BackgroundShaderConfig;
  backgroundSections?: BackgroundSection[];
  steps?: StepDefinition[];
  clusters?: ClusterDefinition[];
  canvas?: MapCanvasConfig;
  navigation?: MapNavigationConfig;
}

export interface PresentationIndexEntry {
  slug: string;
  title: string;
  description?: string;
  tags: string[];
  author?: string;
  mode: PresentationMode;
  stepCount: number;
  updatedAt?: string;
  createdAt?: string;
  thumbnail?: string;
  previewAsset?: string;
  searchText?: string;
}
