'use client';

import { useRouter } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { MouseEvent, PointerEvent as ReactPointerEvent, useEffect, useMemo, useRef, useState } from 'react';

import { createBuildPlan, getSequentialRevealCount, isComponentVisible } from '@/lib/runtime/build-plan';
import { resolveRuntimeTransition } from '@/lib/runtime/primitive-resolver';
import { usePresentationRuntime } from '@/lib/runtime/providers/presentation-provider';
import { ComponentRenderer } from '@/lib/runtime/renderers/component-renderer';
import { LayoutRenderer } from '@/lib/runtime/renderers/layout-renderer';
import { getStageSceneMotion } from '@/lib/runtime/transition-presets';
import { BackgroundLayer } from '@/lib/runtime/ui/background-layer';
import { LiveRegion } from '@/lib/runtime/ui/live-region';
import { PresentationControls, PresentationNavigationHandlers } from '@/lib/runtime/ui/presentation-controls';
import { ComponentInstance } from '@/lib/types/presentation';

interface EditableStageComponentGeometry {
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

type StageEditPhase = 'idle' | 'measuring' | 'active';
type StageEditInteractionMode = 'move' | 'resize-right' | 'resize-bottom' | 'resize-corner';

interface StageEditInteraction {
  componentIndex: number;
  mode: StageEditInteractionMode;
  startClientX: number;
  startClientY: number;
  startGeometry: EditableStageComponentGeometry;
  boundsWidth: number;
  boundsHeight: number;
}

const MIN_COMPONENT_WIDTH = 140;
const MIN_COMPONENT_HEIGHT = 88;

function getDraftSignature(draft: Record<number, EditableStageComponentGeometry>) {
  return Object.keys(draft)
    .map(Number)
    .sort((left, right) => left - right)
    .map((index) => {
      const item = draft[index];
      return `${index}:${item.x},${item.y},${item.width},${item.height}`;
    })
    .join('|');
}

function clampStageGeometry(
  geometry: EditableStageComponentGeometry,
  boundsWidth: number,
  boundsHeight: number
): EditableStageComponentGeometry {
  const minWidth = Math.min(1, MIN_COMPONENT_WIDTH / Math.max(boundsWidth, 1));
  const minHeight = Math.min(1, MIN_COMPONENT_HEIGHT / Math.max(boundsHeight, 1));
  const width = Math.min(1, Math.max(minWidth, geometry.width));
  const height = Math.min(1, Math.max(minHeight, geometry.height));
  const x = Math.min(Math.max(0, geometry.x), Math.max(0, 1 - width));
  const y = Math.min(Math.max(0, geometry.y), Math.max(0, 1 - height));

  return {
    ...geometry,
    x: Number(x.toFixed(6)),
    y: Number(y.toFixed(6)),
    width: Number(width.toFixed(6)),
    height: Number(height.toFixed(6))
  };
}

function updateGeometryFromPointer(
  interaction: StageEditInteraction,
  clientX: number,
  clientY: number
): EditableStageComponentGeometry {
  const deltaX = (clientX - interaction.startClientX) / Math.max(interaction.boundsWidth, 1);
  const deltaY = (clientY - interaction.startClientY) / Math.max(interaction.boundsHeight, 1);
  const start = interaction.startGeometry;

  if (interaction.mode === 'move') {
    return clampStageGeometry(
      {
        ...start,
        x: start.x + deltaX,
        y: start.y + deltaY
      },
      interaction.boundsWidth,
      interaction.boundsHeight
    );
  }

  if (interaction.mode === 'resize-right') {
    return clampStageGeometry(
      {
        ...start,
        width: start.width + deltaX
      },
      interaction.boundsWidth,
      interaction.boundsHeight
    );
  }

  if (interaction.mode === 'resize-bottom') {
    return clampStageGeometry(
      {
        ...start,
        height: start.height + deltaY
      },
      interaction.boundsWidth,
      interaction.boundsHeight
    );
  }

  return clampStageGeometry(
    {
      ...start,
      width: start.width + deltaX,
      height: start.height + deltaY
    },
    interaction.boundsWidth,
    interaction.boundsHeight
  );
}

function getComponentLabel(component: ComponentInstance, index: number) {
  const content =
    typeof component.content === 'string' && component.content.trim()
      ? `. ${component.content.trim().slice(0, 80)}`
      : '';
  return `Component ${index + 1} (${component.type})${content}`;
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
  const [editPhase, setEditPhase] = useState<StageEditPhase>('idle');
  const [draftComponents, setDraftComponents] = useState<Record<number, EditableStageComponentGeometry>>({});
  const [initialDraftSignature, setInitialDraftSignature] = useState('');
  const [selectedComponentIndex, setSelectedComponentIndex] = useState<number | null>(null);
  const [isSavingLayout, setIsSavingLayout] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showUnsavedPrompt, setShowUnsavedPrompt] = useState(false);

  const resetEditorState = () => {
    editInteractionRef.current = null;
    setEditPhase('idle');
    setDraftComponents({});
    setInitialDraftSignature('');
    setSelectedComponentIndex(null);
    setIsSavingLayout(false);
    setSaveError(null);
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

      setDraftComponents((current) => {
        const existing = current[interaction.componentIndex];
        if (!existing) {
          return current;
        }

        const next = updateGeometryFromPointer(interaction, event.clientX, event.clientY);
        if (
          next.x === existing.x &&
          next.y === existing.y &&
          next.width === existing.width &&
          next.height === existing.height
        ) {
          return current;
        }

        return {
          ...current,
          [interaction.componentIndex]: next
        };
      });
    };

    const finishInteraction = () => {
      editInteractionRef.current = null;
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

      const bodyRect = body.getBoundingClientRect();
      if (bodyRect.width <= 0 || bodyRect.height <= 0) {
        setSaveError('Could not measure the stage canvas.');
        setEditPhase('idle');
        return;
      }

      const measuredNodes = Array.from(body.querySelectorAll<HTMLElement>('[data-layout-item-index]'));
      if (measuredNodes.length !== step.components.length) {
        setSaveError('Could not measure all components on this step.');
        setEditPhase('idle');
        return;
      }

      const nextDraft = measuredNodes.reduce<Record<number, EditableStageComponentGeometry>>((draft, node) => {
        const index = Number(node.dataset.layoutItemIndex);
        const rect = node.getBoundingClientRect();
        draft[index] = clampStageGeometry(
          {
            index,
            x: (rect.left - bodyRect.left) / bodyRect.width,
            y: (rect.top - bodyRect.top) / bodyRect.height,
            width: rect.width / bodyRect.width,
            height: rect.height / bodyRect.height
          },
          bodyRect.width,
          bodyRect.height
        );
        return draft;
      }, {});

      const signature = getDraftSignature(nextDraft);
      setDraftComponents(nextDraft);
      setInitialDraftSignature(signature);
      setSelectedComponentIndex(0);
      setSaveError(null);
      setEditPhase('active');
    });

    return () => window.cancelAnimationFrame(frame);
  }, [editPhase, step]);

  const buildPlan = step ? createBuildPlan(step) : [];
  const visibleEntries = buildPlan.filter((entry) => isComponentVisible(entry, machine.state.context.currentBuildIndex));
  const allEditableEntries = step?.components.map((component) => ({
    component,
    revealCount: Number.MAX_SAFE_INTEGER
  })) ?? [];
  const sceneMotion = getStageSceneMotion(
    resolveRuntimeTransition(presentation.meta.slug, step?.transition),
    theme,
    Boolean(prefersReducedMotion)
  );
  const draftSignature = getDraftSignature(draftComponents);
  const layoutDraftIsDirty = editPhase === 'active' && draftSignature !== initialDraftSignature;
  const isEditing = editPhase !== 'idle';
  const renderedDrafts = useMemo(
    () =>
      Object.values(draftComponents)
        .sort((left, right) => left.index - right.index)
        .map((item) => item),
    [draftComponents]
  );

  if (!step) {
    return null;
  }

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
          components: renderedDrafts.map((item) => ({
            index: item.index,
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
    componentIndex: number,
    mode: StageEditInteractionMode
  ) => {
    if (editPhase !== 'active' || isSavingLayout || event.button !== 0) {
      return;
    }

    const geometry = draftComponents[componentIndex];
    const body = stepSceneBodyRef.current;
    if (!geometry || !body) {
      return;
    }

    const bodyRect = body.getBoundingClientRect();
    setSelectedComponentIndex(componentIndex);
    setSaveError(null);
    editInteractionRef.current = {
      componentIndex,
      mode,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startGeometry: geometry,
      boundsWidth: bodyRect.width,
      boundsHeight: bodyRect.height
    };
    event.preventDefault();
    event.stopPropagation();
  };

  const handleComponentSelect = (
    event: Pick<MouseEvent<HTMLElement>, 'preventDefault' | 'stopPropagation'>,
    componentIndex: number
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setSelectedComponentIndex(componentIndex);
  };

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

  return (
    <main className="viewerShell">
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
          <div ref={stepSceneBodyRef} className="stepSceneBody" data-editing={isEditing ? 'true' : 'false'}>
            {editPhase === 'active' ? (
              <div className="stageEditCanvas" aria-label="Stage layout editor">
                {renderedDrafts.map((item) => {
                  const component = step.components[item.index];
                  if (!component) {
                    return null;
                  }

                  const isSelected = item.index === selectedComponentIndex;
                  return (
                    <div
                      key={`${component.type}-${item.index}`}
                      className={`stageEditItem ${isSelected ? 'selected' : ''}`}
                      style={{
                        left: `${item.x * 100}%`,
                        top: `${item.y * 100}%`,
                        width: `${item.width * 100}%`,
                        height: `${item.height * 100}%`
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label={getComponentLabel(component, item.index)}
                      aria-pressed={isSelected}
                      onClick={(event) => handleComponentSelect(event, item.index)}
                      onPointerDown={(event) => startComponentInteraction(event, item.index, 'move')}
                    >
                      <div className="stageEditItemHeader" aria-hidden="true">
                        <span className="clusterBadge">{component.type}</span>
                        <span className="stageEditItemLabel">{item.index + 1}</span>
                      </div>
                      <div className="stageEditItemContent">
                        <ComponentRenderer
                          component={component}
                          revealCount={Number.MAX_SAFE_INTEGER}
                          slug={presentation.meta.slug}
                        />
                      </div>
                      {isSelected ? (
                        <>
                          <button
                            type="button"
                            className="clusterResizeHandle clusterResizeHandleEast"
                            aria-label={`Resize component ${item.index + 1} width`}
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                            }}
                            onPointerDown={(event) => startComponentInteraction(event, item.index, 'resize-right')}
                          />
                          <button
                            type="button"
                            className="clusterResizeHandle clusterResizeHandleSouth"
                            aria-label={`Resize component ${item.index + 1} height`}
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                            }}
                            onPointerDown={(event) => startComponentInteraction(event, item.index, 'resize-bottom')}
                          />
                          <button
                            type="button"
                            className="clusterResizeHandle clusterResizeHandleCorner"
                            aria-label={`Resize component ${item.index + 1} width and height`}
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                            }}
                            onPointerDown={(event) => startComponentInteraction(event, item.index, 'resize-corner')}
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
                {saveError ? <span className="mapEditError">{saveError}</span> : null}
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
      <LiveRegion
        message={`Step ${stepIndex + 1} of ${presentation.steps?.length ?? 0}: ${step.title ?? presentation.meta.title}`}
      />
    </main>
  );
}
