import { ClusterDefinition, ComponentInstance } from '@/lib/types/presentation';

export interface FreeformGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface EditableComponentDraft extends FreeformGeometry {
  draftId: string;
  component: ComponentInstance;
}

export interface EditableMapClusterDraft
  extends Omit<ClusterDefinition, 'anchor' | 'arrangement' | 'components' | 'frame'>,
    FreeformGeometry {
  components: ComponentInstance[];
  freeformComponents: EditableComponentDraft[] | null;
}

export type EditorClipboardPayload =
  | {
      kind: 'stage-component';
      item: Omit<EditableComponentDraft, 'draftId'>;
    }
  | {
      kind: 'map-cluster';
      cluster: Omit<EditableMapClusterDraft, 'id'>;
      baseId: string;
    }
  | {
      kind: 'map-cluster-component';
      item: Omit<EditableComponentDraft, 'draftId'>;
    };

