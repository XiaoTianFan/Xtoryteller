'use client';

import { useRouter } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { MouseEvent, PointerEvent as ReactPointerEvent, TouchEvent as ReactTouchEvent, useEffect, useMemo, useRef, useState } from 'react';

import { createBuildPlan, getSequentialRevealCount, isComponentVisible } from '@/lib/runtime/build-plan';
import { getEditorClipboard, setEditorClipboard } from '@/lib/runtime/editor/clipboard';
import { AddComponentOverlay } from '@/lib/runtime/editor/add-component-overlay';
import {
  commitEditorHistorySnapshot,
  createEditorHistoryState,
  EditorHistoryState,
  redoEditorHistory,
  replaceEditorHistoryPresent,
  undoEditorHistory
} from '@/lib/runtime/editor/history';
import {
  isCopyShortcut,
  isDeleteShortcut,
  isDuplicateShortcut,
  isEditableEventTarget,
  isPasteShortcut,
  isRedoShortcut,
  isUndoShortcut
} from '@/lib/runtime/editor/keyboard';
import { EditableComponentDraft } from '@/lib/runtime/editor/types';
import {
  buildStageDraftSignature,
  cloneDeep,
  createDraftComponentInstance,
  createEditableComponentDraft,
  offsetFreeformGeometry
} from '@/lib/runtime/editor/utils';
import { resolveRuntimeTransition } from '@/lib/runtime/primitive-resolver';
import {
  isCompactStageViewport,
  serializePresentationHash
} from '@/lib/runtime/presentation-navigation';
import { usePresentationRuntime } from '@/lib/runtime/providers/presentation-provider';
import { ComponentRenderer } from '@/lib/runtime/renderers/component-renderer';
import { LayoutRenderer } from '@/lib/runtime/renderers/layout-renderer';
import { getStageSceneMotion } from '@/lib/runtime/transition-presets';
import { BackgroundLayer } from '@/lib/runtime/ui/background-layer';
import { LiveRegion } from '@/lib/runtime/ui/live-region';
import { PresentationControls, PresentationNavigationHandlers } from '@/lib/runtime/ui/presentation-controls';
import { ComponentInstance } from '@/lib/types/presentation';

type StageEditPhase = 'idle' | 'measuring' | 'active';
type StageEditInteractionMode = 'move' | 'resize-right' | 'resize-bottom' | 'resize-corner';

interface StageEditInteraction {
  componentId: string;
  mode: StageEditInteractionMode;
  startClientX: number;
  startClientY: number;
  startDrafts: EditableComponentDraft[];
  boundsWidth: number;
  boundsHeight: number;
  changed: boolean;
}

const MIN_COMPONENT_WIDTH = 140;
const MIN_COMPONENT_HEIGHT = 88;
const INSERT_OFFSET = 0.04;
const STAGE_SWIPE_THRESHOLD = 72;

function shouldStartStageSwipeFromTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return true;
  }

  return !target.closest(
    'button, a, input, textarea, select, summary, [role="button"], [role="link"], [data-no-stage-swipe], .shortcutOverlayBackdrop, .shortcutOverlayPanel'
  );
}

function clampStageGeometry(
  geometry: Pick<EditableComponentDraft, 'x' | 'y' | 'width' | 'height'>,
  boundsWidth: number,
  boundsHeight: number
) {
  const minWidth = Math.min(1, MIN_COMPONENT_WIDTH / Math.max(boundsWidth, 1));
  const minHeight = Math.min(1, MIN_COMPONENT_HEIGHT / Math.max(boundsHeight, 1));
  const width = Math.min(1, Math.max(minWidth, geometry.width));
  const height = Math.min(1, Math.max(minHeight, geometry.height));
  const x = Math.min(Math.max(0, geometry.x), Math.max(0, 1 - width));
  const y = Math.min(Math.max(0, geometry.y), Math.max(0, 1 - height));

  return {
    x: Number(x.toFixed(6)),
    y: Number(y.toFixed(6)),
    width: Number(width.toFixed(6)),
    height: Number(height.toFixed(6))
  };
}

function updateDraftFromPointer(
  draft: EditableComponentDraft,
  interaction: StageEditInteraction,
  clientX: number,
  clientY: number
) {
  const deltaX = (clientX - interaction.startClientX) / Math.max(interaction.boundsWidth, 1);
  const deltaY = (clientY - interaction.startClientY) / Math.max(interaction.boundsHeight, 1);

  if (interaction.mode === 'move') {
    return {
      ...draft,
      ...clampStageGeometry(
        {
          x: draft.x + deltaX,
          y: draft.y + deltaY,
          width: draft.width,
          height: draft.height
        },
        interaction.boundsWidth,
        interaction.boundsHeight
      )
    };
  }

  if (interaction.mode === 'resize-right') {
    return {
      ...draft,
      ...clampStageGeometry(
        {
          x: draft.x,
          y: draft.y,
          width: draft.width + deltaX,
          height: draft.height
        },
        interaction.boundsWidth,
        interaction.boundsHeight
      )
    };
  }

  if (interaction.mode === 'resize-bottom') {
    return {
      ...draft,
      ...clampStageGeometry(
        {
          x: draft.x,
          y: draft.y,
          width: draft.width,
          height: draft.height + deltaY
        },
        interaction.boundsWidth,
        interaction.boundsHeight
      )
    };
  }

  return {
    ...draft,
    ...clampStageGeometry(
      {
        x: draft.x,
        y: draft.y,
        width: draft.width + deltaX,
        height: draft.height + deltaY
      },
      interaction.boundsWidth,
      interaction.boundsHeight
    )
  };
}

function getComponentLabel(component: ComponentInstance, index: number) {
  const content =
    typeof component.content === 'string' && component.content.trim()
      ? `. ${component.content.trim().slice(0, 80)}`
      : '';
  return `Component ${index + 1} (${component.type})${content}`;
}

function getInsertedGeometry(drafts: EditableComponentDraft[]) {
  const width = 0.32;
  const height = 0.24;
  const x = Math.min(0.08 + drafts.length * INSERT_OFFSET, 1 - width - 0.04);
  const y = Math.min(0.1 + drafts.length * INSERT_OFFSET, 1 - height - 0.04);

  return { x, y, width, height };
}

function getNextSelectedDraftId(drafts: EditableComponentDraft[], removedIndex: number) {
  return drafts[removedIndex]?.draftId ?? drafts[removedIndex - 1]?.draftId ?? null;
}

function measureStageDrafts(body: HTMLElement, components: ComponentInstance[]) {
  const bodyRect = body.getBoundingClientRect();
  if (bodyRect.width <= 0 || bodyRect.height <= 0) {
    throw new Error('Could not measure the stage canvas.');
  }

  const measuredNodes = Array.from(body.querySelectorAll<HTMLElement>('[data-layout-item-index]'));
  if (measuredNodes.length !== components.length) {
    throw new Error('Could not measure all components on this step.');
  }

  return measuredNodes
    .map((node) => {
      const index = Number(node.dataset.layoutItemIndex);
      const component = components[index];
      if (!component) {
        return null;
      }

      const rect = node.getBoundingClientRect();
      const geometry = clampStageGeometry(
        {
          x: (rect.left - bodyRect.left) / bodyRect.width,
          y: (rect.top - bodyRect.top) / bodyRect.height,
          width: rect.width / bodyRect.width,
          height: rect.height / bodyRect.height
        },
        bodyRect.width,
        bodyRect.height
      );

      return createEditableComponentDraft(component, geometry, 'stage-component');
    })
    .filter((item): item is EditableComponentDraft => Boolean(item));
}

function UnsavedLayoutDialog({
  open,
  isSaving,
  error,
  onSave,
  onDiscard,
  onStay
}: {
  open: boolean;
  isSaving: boolean;
  error: string | null;
  onSave: () => void;
  onDiscard: () => void;
  onStay: () => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Unsaved layout changes"
      className="shortcutOverlayBackdrop"
      onClick={onStay}
    >
      <div className="shortcutOverlayPanel stageEditPromptPanel appScrollbarMuted" onClick={(event) => event.stopPropagation()}>
        <div className="shortcutOverlayHeader">
          <div>
            <strong className="shortcutOverlayTitle">Unsaved layout changes</strong>
            <span className="shortcutOverlaySubtitle">
              Save this stage layout before leaving the current step, discard the draft, or stay here.
            </span>
          </div>
        </div>
        {error ? <span className="mapEditError">{error}</span> : null}
        <div className="stageEditPromptActions">
          <button type="button" className="ghostButton" onClick={onSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          <button type="button" className="ghostButton" onClick={onDiscard} disabled={isSaving}>
            Discard
          </button>
          <button type="button" className="ghostButton" onClick={onStay} disabled={isSaving}>
            Stay
          </button>
        </div>
      </div>
    </div>
  );
}

export function StageRenderer() {
  const router = useRouter();
  const { presentation, theme, machine } = usePresentationRuntime();
  const isDev = process.env.NODE_ENV !== 'production';
  const prefersReducedMotion = useReducedMotion();
  const stepIndex = machine.state.context.currentStepIndex;
  const step = presentation.steps?.[stepIndex];
  const stepSceneBodyRef = useRef<HTMLDivElement | null>(null);
  const editInteractionRef = useRef<StageEditInteraction | null>(null);
  const pendingNavigationRef = useRef<(() => void) | null>(null);
  const swipeGestureRef = useRef<{ startX: number; startY: number; lastX: number; lastY: number } | null>(null);
  const [editPhase, setEditPhase] = useState<StageEditPhase>('idle');
  const [history, setHistory] = useState<EditorHistoryState<EditableComponentDraft[]> | null>(null);
  const [cleanDrafts, setCleanDrafts] = useState<EditableComponentDraft[]>([]);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [isSavingLayout, setIsSavingLayout] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showUnsavedPrompt, setShowUnsavedPrompt] = useState(false);
  const [showAddComponentOverlay, setShowAddComponentOverlay] = useState(false);
  const [presenterReady, setPresenterReady] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(1280);
  const [supportsSwipeNavigation, setSupportsSwipeNavigation] = useState(false);

  useEffect(() => {
    setPresenterReady(false);
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setPresenterReady(true));
    });
    return () => cancelAnimationFrame(id);
  }, [stepIndex]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const updateViewportWidth = () => setViewportWidth(window.innerWidth);
    updateViewportWidth();
    window.addEventListener('resize', updateViewportWidth);
    return () => window.removeEventListener('resize', updateViewportWidth);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const coarsePointer = window.matchMedia('(pointer: coarse)').matches || window.navigator.maxTouchPoints > 0;
    setSupportsSwipeNavigation(coarsePointer);
  }, []);

  const renderedDrafts = history?.present ?? [];
  const draftSignature = buildStageDraftSignature(renderedDrafts);
  const cleanDraftSignature = buildStageDraftSignature(cleanDrafts);
  const layoutDraftIsDirty = editPhase === 'active' && draftSignature !== cleanDraftSignature;
  const isEditing = editPhase !== 'idle';
  const isCompactViewport = isCompactStageViewport(viewportWidth);

  const resetEditorState = () => {
    editInteractionRef.current = null;
    setEditPhase('idle');
    setHistory(null);
    setCleanDrafts([]);
    setSelectedComponentId(null);
    setIsSavingLayout(false);
    setSaveError(null);
    setShowAddComponentOverlay(false);
  };

  useEffect(() => {
    resetEditorState();
    setShowUnsavedPrompt(false);
    pendingNavigationRef.current = null;
  }, [stepIndex]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const interaction = editInteractionRef.current;
      if (!interaction) {
        return;
      }

      setHistory((current) => {
        if (!current) {
          return current;
        }

        const nextPresent = current.present.map((draft) => {
          if (draft.draftId !== interaction.componentId) {
            return draft;
          }

          const baseDraft = interaction.startDrafts.find((item) => item.draftId === draft.draftId) ?? draft;
          const nextDraft = updateDraftFromPointer(baseDraft, interaction, event.clientX, event.clientY);
          if (
            nextDraft.x === draft.x &&
            nextDraft.y === draft.y &&
            nextDraft.width === draft.width &&
            nextDraft.height === draft.height
          ) {
            return draft;
          }

          interaction.changed = true;
          return nextDraft;
        });

        return replaceEditorHistoryPresent(current, nextPresent);
      });
    };

    const finishInteraction = () => {
      const interaction = editInteractionRef.current;
      editInteractionRef.current = null;
      if (!interaction?.changed) {
        return;
      }

      setHistory((current) => {
        if (!current) {
          return current;
        }

        return commitEditorHistorySnapshot(current, interaction.startDrafts, current.present);
      });
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', finishInteraction);
    window.addEventListener('pointercancel', finishInteraction);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', finishInteraction);
      window.removeEventListener('pointercancel', finishInteraction);
    };
  }, []);

  useEffect(() => {
    if (editPhase !== 'measuring' || !step) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      const body = stepSceneBodyRef.current;
      if (!body) {
        setSaveError('Could not prepare the stage editor.');
        setEditPhase('idle');
        return;
      }

      try {
        const measuredDrafts = measureStageDrafts(body, step.components);
        setHistory(createEditorHistoryState(measuredDrafts));
        setCleanDrafts(measuredDrafts);
        setSelectedComponentId(measuredDrafts[0]?.draftId ?? null);
        setSaveError(null);
        setEditPhase('active');
      } catch (error) {
        setSaveError(error instanceof Error ? error.message : 'Could not prepare the stage editor.');
        setEditPhase('idle');
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [editPhase, step]);

  useEffect(() => {
    if (!renderedDrafts.length) {
      setSelectedComponentId(null);
      return;
    }

    if (!selectedComponentId || !renderedDrafts.some((draft) => draft.draftId === selectedComponentId)) {
      setSelectedComponentId(renderedDrafts[0]?.draftId ?? null);
    }
  }, [renderedDrafts, selectedComponentId]);

  useEffect(() => {
    if (editPhase !== 'active' || !history) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableEventTarget(event.target)) {
        return;
      }

      if (isUndoShortcut(event)) {
        event.preventDefault();
        event.stopPropagation();
        setHistory((current) => (current ? undoEditorHistory(current) : current));
        return;
      }

      if (isRedoShortcut(event)) {
        event.preventDefault();
        event.stopPropagation();
        setHistory((current) => (current ? redoEditorHistory(current) : current));
        return;
      }

      if (isDeleteShortcut(event)) {
        const selectedIndex = history.present.findIndex((draft) => draft.draftId === selectedComponentId);
        if (selectedIndex < 0) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        setHistory((current) => {
          if (!current) {
            return current;
          }

          const currentIndex = current.present.findIndex((draft) => draft.draftId === selectedComponentId);
          if (currentIndex < 0) {
            return current;
          }

          const nextDrafts = current.present.filter((draft) => draft.draftId !== selectedComponentId);
          setSelectedComponentId(getNextSelectedDraftId(nextDrafts, currentIndex));
          return commitEditorHistorySnapshot(current, current.present, nextDrafts);
        });
        return;
      }

      if (isDuplicateShortcut(event)) {
        const selectedIndex = history.present.findIndex((draft) => draft.draftId === selectedComponentId);
        if (selectedIndex < 0) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        setHistory((current) => {
          if (!current) {
            return current;
          }

          const currentIndex = current.present.findIndex((draft) => draft.draftId === selectedComponentId);
          const selectedDraft = currentIndex >= 0 ? current.present[currentIndex] : null;
          if (!selectedDraft) {
            return current;
          }

          const nextDraft = createEditableComponentDraft(
            cloneDeep(selectedDraft.component),
            offsetFreeformGeometry(selectedDraft, INSERT_OFFSET, INSERT_OFFSET),
            'stage-component'
          );
          const nextDrafts = [
            ...current.present.slice(0, currentIndex + 1),
            nextDraft,
            ...current.present.slice(currentIndex + 1)
          ];

          setSelectedComponentId(nextDraft.draftId);
          return commitEditorHistorySnapshot(current, current.present, nextDrafts);
        });
        return;
      }

      if (isCopyShortcut(event)) {
        const selectedDraft = history.present.find((draft) => draft.draftId === selectedComponentId);
        if (!selectedDraft) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        setEditorClipboard({
          kind: 'stage-component',
          item: {
            component: cloneDeep(selectedDraft.component),
            x: selectedDraft.x,
            y: selectedDraft.y,
            width: selectedDraft.width,
            height: selectedDraft.height
          }
        });
        return;
      }

      if (isPasteShortcut(event)) {
        const clipboard = getEditorClipboard();
        if (clipboard?.kind !== 'stage-component') {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        setHistory((current) => {
          if (!current) {
            return current;
          }

          const nextDraft = createEditableComponentDraft(
            clipboard.item.component,
            offsetFreeformGeometry(clipboard.item, INSERT_OFFSET, INSERT_OFFSET),
            'stage-component'
          );
          setSelectedComponentId(nextDraft.draftId);
          return commitEditorHistorySnapshot(current, current.present, [...current.present, nextDraft]);
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [editPhase, history, selectedComponentId]);

  useEffect(() => {
    if (!layoutDraftIsDirty) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [layoutDraftIsDirty]);

  const buildPlan = step ? createBuildPlan(step) : [];
  const visibleEntries = buildPlan.filter((entry) => isComponentVisible(entry, machine.state.context.currentBuildIndex));
  const allEditableEntries =
    step?.components.map((component) => ({
      component,
      revealCount: Number.MAX_SAFE_INTEGER
    })) ?? [];
  const sceneMotion = getStageSceneMotion(
    resolveRuntimeTransition(presentation.meta.slug, step?.transition),
    theme,
    Boolean(prefersReducedMotion)
  );
  const canUndo = Boolean(history?.past.length);
  const canRedo = Boolean(history?.future.length);

  const exitEditMode = () => {
    setShowUnsavedPrompt(false);
    resetEditorState();
  };

  const continuePendingNavigation = () => {
    const action = pendingNavigationRef.current;
    pendingNavigationRef.current = null;
    setShowUnsavedPrompt(false);
    action?.();
  };

  const requestStageNavigation = (action: () => void) => {
    if (isSavingLayout) {
      return;
    }

    if (layoutDraftIsDirty) {
      pendingNavigationRef.current = action;
      setShowUnsavedPrompt(true);
      return;
    }

    if (isEditing) {
      exitEditMode();
    }

    action();
  };

  const saveLayout = async () => {
    if (editPhase !== 'active' || !layoutDraftIsDirty || isSavingLayout) {
      return false;
    }

    setIsSavingLayout(true);
    setSaveError(null);

    try {
      const response = await fetch(`/api/presentations/${encodeURIComponent(presentation.meta.slug)}/layout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          stepIndex,
          components: renderedDrafts.map((item, index) => ({
            ...cloneDeep(item.component),
            index,
            x: item.x,
            y: item.y,
            width: item.width,
            height: item.height
          }))
        })
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? 'Failed to save layout.');
      }

      if (process.env.NODE_ENV === 'development') {
        void fetch(`/api/dev/presentations/${encodeURIComponent(presentation.meta.slug)}/thumbnail`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{}'
        });
      }

      exitEditMode();
      router.refresh();
      return true;
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save layout.');
      return false;
    } finally {
      setIsSavingLayout(false);
    }
  };

  const handleSaveAndContinue = async () => {
    const saved = await saveLayout();
    if (saved) {
      continuePendingNavigation();
    }
  };

  const handleDiscardAndContinue = () => {
    exitEditMode();
    continuePendingNavigation();
  };

  const navigationHandlers: PresentationNavigationHandlers = {
    onRequestNext: () => requestStageNavigation(() => machine.next()),
    onRequestPrev: () => requestStageNavigation(() => machine.prev()),
    onRequestGoToStep: (nextStepIndex) => requestStageNavigation(() => machine.goToStep(nextStepIndex)),
    onRequestExit: () => requestStageNavigation(() => router.push('/'))
  };
  const stageSwipeEnabled = isCompactViewport && supportsSwipeNavigation;

  const canStartStageSwipe = (target: EventTarget | null) =>
    stageSwipeEnabled &&
    !isEditing &&
    !isSavingLayout &&
    !showUnsavedPrompt &&
    !showAddComponentOverlay &&
    shouldStartStageSwipeFromTarget(target);

  const beginStageSwipe = (clientX: number, clientY: number, target: EventTarget | null) => {
    if (!canStartStageSwipe(target)) {
      swipeGestureRef.current = null;
      return;
    }

    swipeGestureRef.current = {
      startX: clientX,
      startY: clientY,
      lastX: clientX,
      lastY: clientY
    };
  };

  const updateStageSwipe = (clientX: number, clientY: number) => {
    if (!swipeGestureRef.current) {
      return;
    }

    swipeGestureRef.current = {
      ...swipeGestureRef.current,
      lastX: clientX,
      lastY: clientY
    };
  };

  const finishStageSwipe = () => {
    const swipe = swipeGestureRef.current;
    swipeGestureRef.current = null;
    if (!swipe) {
      return;
    }

    const moveX = swipe.lastX - swipe.startX;
    const moveY = swipe.lastY - swipe.startY;
    if (Math.abs(moveX) < STAGE_SWIPE_THRESHOLD || Math.abs(moveX) <= Math.abs(moveY) * 1.25) {
      return;
    }

    if (moveX < 0) {
      navigationHandlers.onRequestNext?.();
      return;
    }

    navigationHandlers.onRequestPrev?.();
  };

  const cancelStageSwipe = () => {
    swipeGestureRef.current = null;
  };

  const handleStagePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch') {
      return;
    }

    beginStageSwipe(event.clientX, event.clientY, event.target);
  };

  const handleStagePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch') {
      return;
    }

    updateStageSwipe(event.clientX, event.clientY);
  };

  const handleStageTouchStart = (event: ReactTouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    if (!touch) {
      return;
    }

    beginStageSwipe(touch.clientX, touch.clientY, event.target);
  };

  const handleStageTouchMove = (event: ReactTouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    if (!touch) {
      return;
    }

    updateStageSwipe(touch.clientX, touch.clientY);
  };

  const handleStageTouchEnd = (event: ReactTouchEvent<HTMLDivElement>) => {
    const touch = event.changedTouches[0];
    if (touch) {
      updateStageSwipe(touch.clientX, touch.clientY);
    }

    finishStageSwipe();
  };

  if (!step) {
    return null;
  }

  const enterEditMode = () => {
    if (!isDev || isEditing || !step.components.length) {
      return;
    }

    setSaveError(null);
    setShowUnsavedPrompt(false);
    pendingNavigationRef.current = null;
    setEditPhase('measuring');
  };

  const startComponentInteraction = (
    event: ReactPointerEvent<HTMLElement>,
    componentId: string,
    mode: StageEditInteractionMode
  ) => {
    if (editPhase !== 'active' || isSavingLayout || event.button !== 0 || !history) {
      return;
    }

    const geometry = history.present.find((draft) => draft.draftId === componentId);
    const body = stepSceneBodyRef.current;
    if (!geometry || !body) {
      return;
    }

    const bodyRect = body.getBoundingClientRect();
    setSelectedComponentId(componentId);
    setSaveError(null);
    editInteractionRef.current = {
      componentId,
      mode,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startDrafts: history.present,
      boundsWidth: bodyRect.width,
      boundsHeight: bodyRect.height,
      changed: false
    };
    event.preventDefault();
    event.stopPropagation();
  };

  const handleComponentSelect = (
    event: Pick<MouseEvent<HTMLElement>, 'preventDefault' | 'stopPropagation'>,
    componentId: string
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setSelectedComponentId(componentId);
  };

  const handleAddComponent = (component: ComponentInstance) => {
    setHistory((current) => {
      if (!current) {
        return current;
      }

      const nextDraft = createEditableComponentDraft(component, getInsertedGeometry(current.present), 'stage-component');
      setSelectedComponentId(nextDraft.draftId);
      return commitEditorHistorySnapshot(current, current.present, [...current.present, nextDraft]);
    });
    setShowAddComponentOverlay(false);
  };

  return (
    <main
      className="viewerShell"
      data-xt-presenter-ready={presenterReady ? 'true' : 'false'}
      data-stage-compact={isCompactViewport ? 'true' : 'false'}
      data-stage-current-hash={serializePresentationHash(presentation, { kind: 'stage-step', stepIndex }) ?? ''}
    >
      <BackgroundLayer />
      <AnimatePresence mode="wait">
        <motion.section
          key={`${presentation.meta.slug}-${stepIndex}`}
          className="stepScene"
          initial={sceneMotion.initial}
          animate={sceneMotion.animate}
          exit={sceneMotion.exit}
          transition={sceneMotion.transition}
        >
          {step.title || step.description ? (
            <header className="stepSceneHeader">
              {step.title ? <p className="stepSceneTitle">{step.title}</p> : null}
              {step.description ? <p className="stepSceneDescription">{step.description}</p> : null}
            </header>
          ) : null}
          <div
            ref={stepSceneBodyRef}
            className="stepSceneBody"
            data-editing={isEditing ? 'true' : 'false'}
            data-stage-swipe-enabled={stageSwipeEnabled ? 'true' : 'false'}
            onPointerDown={handleStagePointerDown}
            onPointerMove={handleStagePointerMove}
            onPointerUp={finishStageSwipe}
            onPointerCancel={cancelStageSwipe}
            onTouchStart={handleStageTouchStart}
            onTouchMove={handleStageTouchMove}
            onTouchEnd={handleStageTouchEnd}
            onTouchCancel={cancelStageSwipe}
          >
            {editPhase === 'active' ? (
              <div className="stageEditCanvas" aria-label="Stage layout editor">
                {renderedDrafts.map((item, index) => {
                  const isSelected = item.draftId === selectedComponentId;
                  return (
                    <div
                      key={item.draftId}
                      className={`stageEditItem ${isSelected ? 'selected' : ''}`}
                      style={{
                        left: `${item.x * 100}%`,
                        top: `${item.y * 100}%`,
                        width: `${item.width * 100}%`,
                        height: `${item.height * 100}%`
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label={getComponentLabel(item.component, index)}
                      aria-pressed={isSelected}
                      onClick={(event) => handleComponentSelect(event, item.draftId)}
                      onPointerDown={(event) => startComponentInteraction(event, item.draftId, 'move')}
                    >
                      <div className="stageEditItemHeader" aria-hidden="true">
                        <span className="clusterBadge">{item.component.type}</span>
                        <span className="stageEditItemLabel">{index + 1}</span>
                      </div>
                      <div className="stageEditItemContent">
                        <ComponentRenderer
                          component={createDraftComponentInstance(item)}
                          revealCount={Number.MAX_SAFE_INTEGER}
                          slug={presentation.meta.slug}
                        />
                      </div>
                      {isSelected ? (
                        <>
                          <button
                            type="button"
                            className="clusterResizeHandle clusterResizeHandleEast"
                            aria-label={`Resize component ${index + 1} width`}
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                            }}
                            onPointerDown={(event) => startComponentInteraction(event, item.draftId, 'resize-right')}
                          />
                          <button
                            type="button"
                            className="clusterResizeHandle clusterResizeHandleSouth"
                            aria-label={`Resize component ${index + 1} height`}
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                            }}
                            onPointerDown={(event) => startComponentInteraction(event, item.draftId, 'resize-bottom')}
                          />
                          <button
                            type="button"
                            className="clusterResizeHandle clusterResizeHandleCorner"
                            aria-label={`Resize component ${index + 1} width and height`}
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                            }}
                            onPointerDown={(event) => startComponentInteraction(event, item.draftId, 'resize-corner')}
                          />
                        </>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : (
              <LayoutRenderer
                layout={step.layout}
                layoutProps={step.layoutProps}
                compact={isCompactViewport}
                disableMotion={editPhase === 'measuring'}
                items={
                  editPhase === 'measuring'
                    ? allEditableEntries
                    : visibleEntries.map((entry) => ({
                        component: entry.component,
                        revealCount:
                          entry.component.build === 'sequential'
                            ? getSequentialRevealCount(entry, machine.state.context.currentBuildIndex)
                            : Number.MAX_SAFE_INTEGER
                      }))
                }
              />
            )}
          </div>
        </motion.section>
      </AnimatePresence>
      <PresentationControls
        total={presentation.steps?.length ?? 0}
        current={stepIndex + 1}
        navigationHandlers={navigationHandlers}
        rightActions={
          <>
            {isEditing ? (
              <>
                <span className={`mapEditStatus ${layoutDraftIsDirty ? 'dirty' : ''}`}>
                  {editPhase === 'measuring'
                    ? 'Preparing editor'
                    : layoutDraftIsDirty
                      ? 'Unsaved edits'
                      : 'Editing layout'}
                </span>
                <span className="mapMeta">Undo {canUndo ? 'available' : 'empty'} | Redo {canRedo ? 'available' : 'empty'}</span>
                {saveError ? <span className="mapEditError">{saveError}</span> : null}
                <button
                  type="button"
                  className="ghostButton"
                  onClick={() => setShowAddComponentOverlay(true)}
                  disabled={editPhase !== 'active' || isSavingLayout}
                >
                  Add component
                </button>
                <button
                  type="button"
                  className="ghostButton"
                  onClick={() => {
                    void saveLayout();
                  }}
                  disabled={editPhase !== 'active' || !layoutDraftIsDirty || isSavingLayout}
                >
                  {isSavingLayout ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  className="ghostButton"
                  onClick={() => {
                    pendingNavigationRef.current = null;
                    exitEditMode();
                  }}
                  disabled={isSavingLayout}
                >
                  Cancel
                </button>
              </>
            ) : null}
            {isDev && !isEditing ? (
              <button type="button" className="ghostButton" onClick={enterEditMode}>
                Edit layout
              </button>
            ) : null}
            <button type="button" className="ghostButton" onClick={navigationHandlers.onRequestExit}>
              Back
            </button>
          </>
        }
      />
      <UnsavedLayoutDialog
        open={showUnsavedPrompt}
        isSaving={isSavingLayout}
        error={saveError}
        onSave={() => {
          void handleSaveAndContinue();
        }}
        onDiscard={handleDiscardAndContinue}
        onStay={() => {
          pendingNavigationRef.current = null;
          setShowUnsavedPrompt(false);
        }}
      />
      <AddComponentOverlay
        open={showAddComponentOverlay}
        title="Add component to stage"
        onClose={() => setShowAddComponentOverlay(false)}
        onAdd={(definition) => handleAddComponent(definition.component)}
      />
      <LiveRegion
        message={`Step ${stepIndex + 1} of ${presentation.steps?.length ?? 0}: ${step.title ?? presentation.meta.title}`}
      />
    </main>
  );
}
