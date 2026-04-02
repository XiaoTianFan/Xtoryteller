import { ComponentInstance } from '@/lib/types/presentation';
import { EditableComponentDraft, EditableMapClusterDraft, FreeformGeometry } from '@/lib/runtime/editor/types';

let draftIdCounter = 0;

export function createDraftId(prefix: string) {
  draftIdCounter += 1;
  return `${prefix}-${draftIdCounter}`;
}

export function cloneDeep<T>(value: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
}

export function createEditableComponentDraft(
  component: ComponentInstance,
  geometry: FreeformGeometry,
  prefix: string
): EditableComponentDraft {
  return {
    draftId: createDraftId(prefix),
    component: cloneDeep(component),
    x: geometry.x,
    y: geometry.y,
    width: geometry.width,
    height: geometry.height
  };
}

export function createDraftComponentInstance(draft: EditableComponentDraft): ComponentInstance {
  return {
    ...cloneDeep(draft.component),
    position: {
      x: draft.x,
      y: draft.y,
      width: draft.width,
      height: draft.height
    }
  };
}

export function offsetFreeformGeometry<T extends FreeformGeometry>(
  item: T,
  deltaX: number,
  deltaY: number
): T {
  return {
    ...item,
    x: Number(Math.max(0, Math.min(1 - item.width, item.x + deltaX)).toFixed(6)),
    y: Number(Math.max(0, Math.min(1 - item.height, item.y + deltaY)).toFixed(6))
  };
}

export function buildUniqueClusterId(baseId: string, existingIds: Set<string>) {
  const normalizedBase = baseId.trim() || 'cluster';
  let candidate = `${normalizedBase}-copy`;
  let suffix = 2;

  while (existingIds.has(candidate)) {
    candidate = `${normalizedBase}-copy-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

export function buildStageDraftSignature(drafts: EditableComponentDraft[]) {
  return JSON.stringify(
    drafts.map((draft) => ({
      draftId: draft.draftId,
      type: draft.component.type,
      slot: draft.component.slot,
      content: draft.component.content,
      props: draft.component.props,
      style: draft.component.style,
      build: draft.component.build,
      enter: draft.component.enter,
      exit: draft.component.exit,
      annotations: draft.component.annotations,
      x: draft.x,
      y: draft.y,
      width: draft.width,
      height: draft.height
    }))
  );
}

export function buildMapDraftSignature(drafts: EditableMapClusterDraft[]) {
  return JSON.stringify(
    drafts.map((cluster) => ({
      id: cluster.id,
      title: cluster.title,
      description: cluster.description,
      group: cluster.group,
      layout: cluster.layout,
      layoutProps: cluster.layoutProps,
      transition: cluster.transition,
      background: cluster.background,
      x: cluster.x,
      y: cluster.y,
      width: cluster.width,
      height: cluster.height,
      components: cluster.components,
      freeformComponents: cluster.freeformComponents?.map((draft) => ({
        draftId: draft.draftId,
        type: draft.component.type,
        slot: draft.component.slot,
        content: draft.component.content,
        props: draft.component.props,
        style: draft.component.style,
        build: draft.component.build,
        enter: draft.component.enter,
        exit: draft.component.exit,
        annotations: draft.component.annotations,
        x: draft.x,
        y: draft.y,
        width: draft.width,
        height: draft.height
      }))
    }))
  );
}

