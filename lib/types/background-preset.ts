import type { BackgroundFilterConfig } from '@/lib/types/presentation';

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
  filter?: BackgroundFilterConfig;
}

export interface BackgroundPresetRegistryEntry {
  slug: string;
  name: string;
  description?: string;
  tags: string[];
  shader: string;
  preset?: string;
}

export interface BackgroundPresetDefinitionEntry extends BackgroundPresetRegistryEntry {
  config: BackgroundPresetConfig;
}
