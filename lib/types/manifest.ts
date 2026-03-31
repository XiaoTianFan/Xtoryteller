export interface PropManifestEntry {
  type: string;
  description?: string;
  required?: boolean;
  default?: unknown;
  values?: unknown[];
}

export interface ComponentManifest {
  name: string;
  displayName: string;
  description: string;
  category: string;
  content?: boolean;
  props?: Record<string, PropManifestEntry>;
  density?: Record<string, unknown>;
}

export interface LayoutManifest {
  name: string;
  displayName: string;
  description: string;
  slots: string[];
  density?: Record<string, unknown>;
  props?: Record<string, PropManifestEntry>;
}

export interface TransitionManifest {
  name: string;
  displayName: string;
  description: string;
  category: string;
  feeling?: string;
}
