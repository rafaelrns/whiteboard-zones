export type ID = string;

export type Role = 'owner' | 'editor' | 'reviewer' | 'viewer';

export type ZoneType = 'FREE_EDIT' | 'LOCKED_ZONE' | 'REVIEW_REQUIRED' | 'READ_ONLY';

export interface User {
  id: ID;
  name: string;
  email: string;
  role: Role;
}

export interface Board {
  id: ID;
  name: string;
  ownerId: ID;
  createdAt: string;
  updatedAt: string;
}

export interface Zone {
  id: ID;
  boardId: ID;
  type: ZoneType;
  name: string;
  rect: { x: number; y: number; w: number; h: number };
  rules: {
    maxEditors?: number;
    maxEditSeconds?: number;
    allowedRoles: Role[];
  };
}

export interface BoardVersion {
  id: ID;
  boardId: ID;
  createdById: ID;
  label: string;
  createdAt: string;
  // snapshot do canvas/CRDT (na Etapa 2+ vira JSON/Yjs updates)
  snapshot: unknown;
}

export interface ZonePermission {
  id: ID;
  zoneId: ID;
  role: Role;
  canView: boolean;
  canEdit: boolean;
  canSuggest: boolean;
  canApprove: boolean;
}

export interface EditQueueItem {
  id: ID;
  zoneId: ID;
  userId: ID;
  position: number;
  createdAt: string;
}

export interface Invite {
  id: ID;
  boardId: ID;
  email: string;
  role: Role;
  token: string;
  expiresAt: string;
  acceptedAt?: string | null;
}


export type ZoneRules = {
  maxEditors?: number;
  maxEditSeconds?: number;
  allowedRoles: Role[];
};

export type ZoneRect = { x: number; y: number; w: number; h: number };

export type ZoneDTO = {
  id: ID;
  boardId: ID;
  type: ZoneType;
  name: string;
  rect: ZoneRect;
  rules: ZoneRules;
  createdAt: string;
  updatedAt: string;
};


export type SuggestionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type SuggestionDTO = {
  id: ID;
  boardId: ID;
  zoneId?: ID | null;
  authorId: ID;
  status: SuggestionStatus;
  title: string;
  message?: string | null;
  objectsJson: any[];
  createdAt: string;
  decidedAt?: string | null;
  decidedById?: ID | null;
};
