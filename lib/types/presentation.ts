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

export interface BackgroundShaderConfig {
  type: string;
  variant?: string;
  colorStops?: string[];
  intensity?: number;
  grain?: number;
  contrast?: number;
  speed?: number;
  opacity?: number;
}

export interface BackgroundSection {
  match: {
    stepRange?: [number, number];
    clusterIds?: string[];
    group?: string;
  };
  shader: BackgroundShaderConfig;
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
    algorithm?: 'flow' | 'radial' | 'grid';
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
  theme: string;
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
}
