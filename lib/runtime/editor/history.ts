export interface EditorHistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

const DEFAULT_HISTORY_LIMIT = 60;

export function createEditorHistoryState<T>(present: T): EditorHistoryState<T> {
  return {
    past: [],
    present,
    future: []
  };
}

export function replaceEditorHistoryPresent<T>(
  history: EditorHistoryState<T>,
  present: T
): EditorHistoryState<T> {
  return {
    ...history,
    present
  };
}

export function commitEditorHistorySnapshot<T>(
  history: EditorHistoryState<T>,
  previousPresent: T,
  nextPresent: T,
  limit = DEFAULT_HISTORY_LIMIT
): EditorHistoryState<T> {
  const nextPast = [...history.past, previousPresent];
  if (nextPast.length > limit) {
    nextPast.splice(0, nextPast.length - limit);
  }

  return {
    past: nextPast,
    present: nextPresent,
    future: []
  };
}

export function undoEditorHistory<T>(history: EditorHistoryState<T>): EditorHistoryState<T> {
  if (!history.past.length) {
    return history;
  }

  const previousPresent = history.past[history.past.length - 1];
  return {
    past: history.past.slice(0, -1),
    present: previousPresent,
    future: [history.present, ...history.future]
  };
}

export function redoEditorHistory<T>(history: EditorHistoryState<T>): EditorHistoryState<T> {
  if (!history.future.length) {
    return history;
  }

  return {
    past: [...history.past, history.present],
    present: history.future[0],
    future: history.future.slice(1)
  };
}

