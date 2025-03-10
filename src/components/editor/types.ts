// src/content/services/editor/types.ts

export interface CursorPosition {
  line: number;
  ch: number;
}

export interface SelectionRange {
  from: CursorPosition | null;
  to: CursorPosition | null;
  text: string;
}

export interface VisibleLinesRange {
  from: number;
  to: number;
}

export interface EditorStateType {
  content: string;
  cursor: CursorPosition;
  selection: SelectionRange;
  visibleLines: VisibleLinesRange;
  isReady: boolean;
  cmInstance: any; // CodeMirror instance - type could be more specific
}

export interface CursorContext {
  fullContext: string;
  beforeCursor: string;
  afterCursor: string;
  currentLine: string;
  cursorPosition: CursorPosition;
}
