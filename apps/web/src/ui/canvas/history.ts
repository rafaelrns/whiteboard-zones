import type * as fabric from 'fabric';

export class CanvasHistory {
  private undoStack: any[] = [];
  private redoStack: any[] = [];
  private max = 100;
  private suppress = false;

  constructor(private canvas: fabric.Canvas) {}

  isSuppressed() {
    return this.suppress;
  }

  pushSnapshot() {
    if (this.suppress) return;
    const json = this.canvas.toDatalessJSON();
    this.undoStack.push(json);
    if (this.undoStack.length > this.max) this.undoStack.shift();
    this.redoStack = [];
  }

  async undo() {
    if (this.undoStack.length === 0) return;
    const current = this.canvas.toDatalessJSON();
    const prev = this.undoStack.pop();
    this.redoStack.push(current);

    this.suppress = true;
    await this.canvas.loadFromJSON(prev);
    this.canvas.renderAll();
    this.suppress = false;
  }

  async redo() {
    if (this.redoStack.length === 0) return;
    const current = this.canvas.toDatalessJSON();
    const next = this.redoStack.pop();
    this.undoStack.push(current);

    this.suppress = true;
    await this.canvas.loadFromJSON(next);
    this.canvas.renderAll();
    this.suppress = false;
  }
}
