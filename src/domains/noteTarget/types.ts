/**
 * NoteTarget domain type definitions
 */

import { NoteTarget } from "../../shared/types.js";

// ======================
// INPUT TYPES
// ======================

export interface CreateNoteTargetInput {
  noteId: string;
  personId?: string;
  companyId?: string;
  opportunityId?: string;
}

export interface ListNoteTargetsParams {
  noteId?: string;
  personId?: string;
  companyId?: string;
  opportunityId?: string;
  limit?: number;
}

// ======================
// GRAPHQL INPUT TYPES
// ======================

export interface NoteTargetGraphQLInput {
  noteId: string;
  targetPersonId?: string;
  targetCompanyId?: string;
  targetOpportunityId?: string;
}

// ======================
// GRAPHQL RESPONSE TYPES
// ======================

export interface NoteTargetsEdge {
  node: NoteTarget;
}

export interface NoteTargetsConnection {
  edges: NoteTargetsEdge[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// Re-export shared type
export type { NoteTarget };
