/**
 * Shared type definitions used across all domains
 */

// ======================
// COMPOSITE TYPES
// ======================

export interface NameComposite {
  firstName: string;
  lastName: string;
}

export interface EmailsComposite {
  primaryEmail: string;
  additionalEmails?: string[];
}

export interface PhonesComposite {
  primaryPhoneNumber: string;
  primaryPhoneCountryCode?: string;
  primaryPhoneCallingCode?: string;
  additionalPhones?: unknown[];
}

export interface LinkComposite {
  primaryLinkLabel?: string;
  primaryLinkUrl: string;
  secondaryLinks?: unknown[];
}

export interface AddressComposite {
  addressStreet1?: string;
  addressStreet2?: string;
  addressCity?: string;
  addressPostcode?: string;
  addressState?: string;
  addressCountry?: string;
}

export interface CurrencyComposite {
  amountMicros: number;
  currencyCode: string;
}

export interface BodyV2Composite {
  blocknote: string;
  markdown: string;
}

// ======================
// GRAPHQL RESPONSE TYPES
// ======================

export interface GraphQLResponse<T> {
  data: T;
  errors?: Array<{ message: string }>;
}

// Generic pagination types
export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface Edge<T> {
  node: T;
}

export interface Connection<T> {
  edges: Edge<T>[];
  pageInfo: PageInfo;
}

// ======================
// RELATIONSHIP TYPES (v0.5.0)
// ======================

// Task Target - Links tasks to other entities
export interface TaskTarget {
  id: string;
  taskId: string;
  personId?: string;
  companyId?: string;
  opportunityId?: string;
  createdAt: string;
  updatedAt?: string;
}

// Note Target - Links notes to other entities
export interface NoteTarget {
  id: string;
  noteId: string;
  personId?: string;
  companyId?: string;
  opportunityId?: string;
  createdAt: string;
  updatedAt?: string;
}

// TimelineActivity - Timeline events and interactions
export interface TimelineActivity {
  id: string;
  name: string;
  properties?: Record<string, unknown>;
  happensAt?: string;
  linkedRecordId?: string;
  linkedObjectMetadataId?: string;
  linkedRecordCachedName?: string;
  workspaceMemberId?: string;
  personId?: string;
  companyId?: string;
  opportunityId?: string;
  noteId?: string;
  taskId?: string;
  workflowId?: string;
  workflowVersionId?: string;
  workflowRunId?: string;
  dashboardId?: string;
  createdAt: string;
  updatedAt?: string;
}

// Favorite - Quick access to frequently used records.
// Backed by navigation menu items (type RECORD) since Twenty v2.
export interface Favorite {
  id: string;
  position: number;
  /** Object type of the favorited record, e.g. "person", "company" */
  objectType: string;
  /** ID of the favorited record */
  targetRecordId: string;
  /** Display label of the favorited record, when known */
  label?: string | null;
  personId?: string;
  companyId?: string;
  opportunityId?: string;
  userWorkspaceId?: string | null;
  createdAt: string;
  updatedAt?: string;
}
