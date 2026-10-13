/**
 * TaskTarget domain type definitions
 */

import { TaskTarget } from "../../shared/types.js";

// ======================
// INPUT TYPES
// ======================

export interface CreateTaskTargetInput {
  taskId: string;
  personId?: string;
  companyId?: string;
  opportunityId?: string;
}

export interface ListTaskTargetsParams {
  taskId?: string;
  personId?: string;
  companyId?: string;
  opportunityId?: string;
  limit?: number;
}

// ======================
// GRAPHQL INPUT TYPES
// ======================

export interface TaskTargetGraphQLInput {
  taskId: string;
  targetPersonId?: string;
  targetCompanyId?: string;
  targetOpportunityId?: string;
}

// ======================
// GRAPHQL RESPONSE TYPES
// ======================

export interface TaskTargetsEdge {
  node: TaskTarget;
}

export interface TaskTargetsConnection {
  edges: TaskTargetsEdge[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// Re-export shared type
export type { TaskTarget };
