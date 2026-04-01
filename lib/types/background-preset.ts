export interface BackgroundPresetConfig {
  name: string;
  description?: string;
  tags?: string[];
  shader: string;
  preset?: string;
  params?: Record<string, unknown>;
  colorStops?: string[];
  intensity?: number;
  grain?: number;
  contrast?: number;
  speed?: number;
  opacity?: number;
}

export interface BackgroundPresetRegistryEntry {
  slug: string;
  name: string;
  description?: string;
  tags: string[];
  shader: string;
  preset?: string;
}
