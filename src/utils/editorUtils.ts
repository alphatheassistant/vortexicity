
import * as monaco from 'monaco-editor';

// Type definitions for monaco editor
type Position = monaco.Position;
type Selection = monaco.Selection;
type IRange = monaco.IRange;

// Convert a Position object to an IRange object
export const positionToRange = (position: Position): IRange => {
  return {
    startLineNumber: position.lineNumber,
    startColumn: position.column,
    endLineNumber: position.lineNumber,
    endColumn: position.column
  };
};

// Create a selection range
export const createSelectionRange = (
  startLine: number,
  startColumn: number,
  endLine: number,
  endColumn: number
): Selection => {
  return new monaco.Selection(startLine, startColumn, endLine, endColumn);
};
