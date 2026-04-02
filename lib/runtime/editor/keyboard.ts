export function isEditableEventTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target.isContentEditable) {
    return true;
  }

  return Boolean(target.closest('input, textarea, select, button, a, [role="button"], [contenteditable="true"]'));
}

export function hasPrimaryModifier(event: Pick<KeyboardEvent, 'ctrlKey' | 'metaKey'>) {
  return event.metaKey || event.ctrlKey;
}

export function isUndoShortcut(event: KeyboardEvent) {
  return hasPrimaryModifier(event) && !event.shiftKey && event.key.toLowerCase() === 'z';
}

export function isRedoShortcut(event: KeyboardEvent) {
  const key = event.key.toLowerCase();
  return hasPrimaryModifier(event) && ((event.shiftKey && key === 'z') || key === 'y');
}

export function isCopyShortcut(event: KeyboardEvent) {
  return hasPrimaryModifier(event) && !event.shiftKey && event.key.toLowerCase() === 'c';
}

export function isPasteShortcut(event: KeyboardEvent) {
  return hasPrimaryModifier(event) && !event.shiftKey && event.key.toLowerCase() === 'v';
}

export function isDuplicateShortcut(event: KeyboardEvent) {
  return hasPrimaryModifier(event) && !event.shiftKey && event.key.toLowerCase() === 'd';
}

export function isDeleteShortcut(event: KeyboardEvent) {
  const key = event.key.toLowerCase();
  return !hasPrimaryModifier(event) && !event.altKey && (key === 'backspace' || key === 'delete');
}
