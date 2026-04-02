import { EditorClipboardPayload } from '@/lib/runtime/editor/types';

let editorClipboard: EditorClipboardPayload | null = null;

export function getEditorClipboard() {
  return editorClipboard;
}

export function setEditorClipboard(payload: EditorClipboardPayload | null) {
  editorClipboard = payload;
}

