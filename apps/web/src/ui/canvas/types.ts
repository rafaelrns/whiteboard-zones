export type CanvasObjectJSON = any;

export type CanvasDocument = {
  version: 1;
  createdAt: string;
  updatedAt: string;
  canvas: any; // fabric JSON
};

export const DEFAULT_DOC: CanvasDocument = {
  version: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  canvas: null,
};
