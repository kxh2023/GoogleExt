// src/content/services/editor/state.ts
import { EditorStateType } from "./types";

// Global editor state that's shared across all functions
export const EditorState: EditorStateType = {
  content: "",
  cursor: { line: 0, ch: 0 },
  selection: { from: null, to: null, text: "" },
  visibleLines: { from: 0, to: 0 },
  isReady: false,
  cmInstance: null,
};

// Flag to track if observer is active
export let isObserving = false;

// Set the observing state
export const setObserving = (state: boolean): void => {
  isObserving = state;
};
