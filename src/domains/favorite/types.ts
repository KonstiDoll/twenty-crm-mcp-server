/**
 * Favorite domain type definitions
 *
 * Twenty v2 models favorites as navigation menu items (type RECORD) that
 * point at a record via targetRecordId + targetObjectMetadataId.
 */

import { Favorite } from "../../shared/types.js";

// ======================
// INPUT TYPES
// ======================

export interface AddFavoriteInput {
  personId?: string;
  companyId?: string;
  opportunityId?: string;
  position?: number;
}

export interface ListFavoritesParams {
  limit?: number;
  personId?: string;
  companyId?: string;
  opportunityId?: string;
  /** Restrict to one object type, e.g. "person", "company", "opportunity" */
  objectType?: string;
}

// ======================
// GRAPHQL TYPES
// ======================

export interface NavigationMenuItemInput {
  type: "RECORD";
  targetRecordId: string;
  targetObjectMetadataId: string;
  position?: number;
}

export interface NavigationMenuItem {
  id: string;
  type: string;
  name?: string | null;
  position: number;
  targetRecordId?: string | null;
  targetObjectMetadataId?: string | null;
  userWorkspaceId?: string | null;
  folderId?: string | null;
  createdAt: string;
  updatedAt?: string;
  targetRecordIdentifier?: {
    id: string;
    labelIdentifier?: string | null;
  } | null;
}

export interface ObjectMetadataNode {
  id: string;
  nameSingular: string;
}

// Re-export shared type
export type { Favorite };
