/**
 * Workspace Member domain type definitions
 */

import { NameComposite } from "../../shared/types.js";

// ======================
// INPUT TYPES
// ======================

export interface ListWorkspaceMembersParams {
  limit?: number;
  searchTerm?: string;
}

// ======================
// DOMAIN MODEL
// ======================

export interface WorkspaceMember {
  id: string;
  name: NameComposite;
  userEmail: string;
  avatarUrl?: string;
  locale?: string;
  colorScheme?: string;
  createdAt: string;
  updatedAt?: string;
}
