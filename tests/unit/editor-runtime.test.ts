/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it } from 'vitest';

import { getEditorClipboard, setEditorClipboard } from '@/lib/runtime/editor/clipboard';
import {
  commitEditorHistorySnapshot,
  createEditorHistoryState,
  redoEditorHistory,
  replaceEditorHistoryPresent,
  undoEditorHistory
} from '@/lib/runtime/editor/history';
import {
  hasPrimaryModifier,
  isCopyShortcut,
  isDeleteShortcut,
  isDuplicateShortcut,
  isEditableEventTarget,
  isPasteShortcut,
  isRedoShortcut,
  isUndoShortcut
} from '@/lib/runtime/editor/keyboard';
import { shouldStartMapPanFromTarget } from '@/lib/runtime/renderers/map-renderer';

describe('editor runtime helpers', () => {
  beforeEach(() => {
    setEditorClipboard(null);
  });

  it('tracks history, trims future on commit, and supports undo redo', () => {
    let history = createEditorHistoryState([{ id: 'a' }]);
    history = commitEditorHistorySnapshot(history, history.present, [{ id: 'b' }]);
    history = commitEditorHistorySnapshot(history, history.present, [{ id: 'c' }]);

    expect(history.past).toEqual([[{ id: 'a' }], [{ id: 'b' }]]);
    expect(history.present).toEqual([{ id: 'c' }]);
    expect(history.future).toEqual([]);

    history = undoEditorHistory(history);
    expect(history.present).toEqual([{ id: 'b' }]);
    expect(history.future).toEqual([[{ id: 'c' }]]);

    history = redoEditorHistory(history);
    expect(history.present).toEqual([{ id: 'c' }]);
    expect(history.future).toEqual([]);

    history = undoEditorHistory(history);
    history = commitEditorHistorySnapshot(history, history.present, [{ id: 'd' }]);
    expect(history.present).toEqual([{ id: 'd' }]);
    expect(history.future).toEqual([]);
  });

  it('replaces the current history snapshot without mutating undo stacks', () => {
    const history = createEditorHistoryState([{ id: 'a' }]);
    const updated = replaceEditorHistoryPresent(history, [{ id: 'draft' }]);

    expect(updated.present).toEqual([{ id: 'draft' }]);
    expect(updated.past).toEqual([]);
    expect(updated.future).toEqual([]);
  });

  it('stores clipboard state across helper calls until cleared', () => {
    expect(getEditorClipboard()).toBeNull();

    setEditorClipboard({
      kind: 'stage-component',
      item: {
        component: { type: 'headline', content: 'Copied headline' },
        x: 0.1,
        y: 0.2,
        width: 0.3,
        height: 0.4
      }
    });

    expect(getEditorClipboard()).toMatchObject({
      kind: 'stage-component',
      item: {
        component: {
          type: 'headline'
        }
      }
    });

    setEditorClipboard(null);
    expect(getEditorClipboard()).toBeNull();
  });

  it('detects editor shortcuts and skips editable targets', () => {
    const undoEvent = new KeyboardEvent('keydown', { metaKey: true, key: 'z' });
    const redoEvent = new KeyboardEvent('keydown', { ctrlKey: true, key: 'y' });
    const redoShiftEvent = new KeyboardEvent('keydown', { metaKey: true, shiftKey: true, key: 'Z' });
    const copyEvent = new KeyboardEvent('keydown', { ctrlKey: true, key: 'c' });
    const pasteEvent = new KeyboardEvent('keydown', { metaKey: true, key: 'v' });
    const duplicateEvent = new KeyboardEvent('keydown', { ctrlKey: true, key: 'd' });
    const deleteEvent = new KeyboardEvent('keydown', { key: 'Delete' });
    const backspaceEvent = new KeyboardEvent('keydown', { key: 'Backspace' });

    expect(hasPrimaryModifier(undoEvent)).toBe(true);
    expect(isUndoShortcut(undoEvent)).toBe(true);
    expect(isRedoShortcut(redoEvent)).toBe(true);
    expect(isRedoShortcut(redoShiftEvent)).toBe(true);
    expect(isCopyShortcut(copyEvent)).toBe(true);
    expect(isPasteShortcut(pasteEvent)).toBe(true);
    expect(isDuplicateShortcut(duplicateEvent)).toBe(true);
    expect(isDeleteShortcut(deleteEvent)).toBe(true);
    expect(isDeleteShortcut(backspaceEvent)).toBe(true);

    const input = document.createElement('input');
    const editable = document.createElement('div');
    editable.setAttribute('contenteditable', 'true');
    const plain = document.createElement('div');

    expect(isEditableEventTarget(input)).toBe(true);
    expect(isEditableEventTarget(editable)).toBe(true);
    expect(isEditableEventTarget(plain)).toBe(false);
    expect(isEditableEventTarget(null)).toBe(false);
  });

  it('only allows map pan gestures to start from empty canvas targets', () => {
    const viewport = document.createElement('div');
    const cluster = document.createElement('div');
    cluster.className = 'clusterCard';
    const clusterChild = document.createElement('div');

    viewport.append(cluster);
    cluster.append(clusterChild);

    expect(shouldStartMapPanFromTarget(viewport)).toBe(true);
    expect(shouldStartMapPanFromTarget(clusterChild)).toBe(false);
    expect(shouldStartMapPanFromTarget(null)).toBe(true);
  });
});
