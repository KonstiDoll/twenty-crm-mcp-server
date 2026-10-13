/**
 * NoteTarget domain handlers
 */

import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { GraphQLClient } from "../../shared/graphql-client.js";
import { Connection } from "../../shared/types.js";
import {
  fromTargetFields,
  toTargetFields,
  toTargetFilter,
} from "../../shared/targets.js";
import {
  CREATE_NOTE_TARGET_MUTATION,
  LIST_NOTE_TARGETS_QUERY,
  DELETE_NOTE_TARGET_MUTATION,
} from "./queries.js";
import {
  CreateNoteTargetInput,
  ListNoteTargetsParams,
  NoteTarget,
  NoteTargetGraphQLInput,
} from "./types.js";

/**
 * Transform create input to GraphQL format
 */
function transformCreateInput(
  data: CreateNoteTargetInput
): NoteTargetGraphQLInput {
  return {
    noteId: data.noteId,
    ...toTargetFields(data),
  };
}

/**
 * Build filter for list query
 */
function buildListFilter(
  params: ListNoteTargetsParams
): Record<string, unknown> | null {
  const { noteId, personId, companyId, opportunityId } = params;
  const filter: Record<string, unknown> = toTargetFilter({
    personId,
    companyId,
    opportunityId,
  });

  if (noteId) filter.noteId = { eq: noteId };

  return Object.keys(filter).length > 0 ? filter : null;
}

/**
 * Create a new note target (link note to entity)
 */
export async function createNoteTarget(
  client: GraphQLClient,
  data: CreateNoteTargetInput
): Promise<CallToolResult> {
  // Validate that at least one target is provided
  if (!data.personId && !data.companyId && !data.opportunityId) {
    throw new Error(
      "At least one target (personId, companyId, or opportunityId) must be provided"
    );
  }

  const input = transformCreateInput(data);

  const result = await client.request<{
    createNoteTarget: Record<string, unknown>;
  }>(CREATE_NOTE_TARGET_MUTATION, { input });

  const noteTarget = fromTargetFields(result.createNoteTarget) as unknown as NoteTarget;

  // Determine what was linked
  const targetType = noteTarget.personId
    ? "person"
    : noteTarget.companyId
    ? "company"
    : "opportunity";
  const targetId =
    noteTarget.personId ||
    noteTarget.companyId ||
    noteTarget.opportunityId;

  return {
    content: [
      {
        type: "text",
        text: `✅ Linked note to ${targetType} (${targetId})\n\n${JSON.stringify(noteTarget, null, 2)}`,
      },
    ],
  };
}

/**
 * List note targets with optional filtering
 */
export async function listNoteTargets(
  client: GraphQLClient,
  params: ListNoteTargetsParams = {}
): Promise<CallToolResult> {
  const { limit = 20, ...filterParams } = params;
  const filter = buildListFilter(filterParams);

  const result = await client.request<{
    noteTargets: Connection<Record<string, unknown>>;
  }>(LIST_NOTE_TARGETS_QUERY, { filter, limit });

  const connection = result.noteTargets;
  const noteTargets = connection.edges.map(
    (edge) => fromTargetFields(edge.node) as unknown as NoteTarget
  );
  const summary = `Found ${noteTargets.length} note target(s)${
    connection.pageInfo.hasNextPage ? " (more available)" : ""
  }`;

  return {
    content: [
      {
        type: "text",
        text: `${summary}\n\n${JSON.stringify(noteTargets, null, 2)}`,
      },
    ],
  };
}

/**
 * Delete a note target (unlink note from entity)
 */
export async function deleteNoteTarget(
  client: GraphQLClient,
  id: string
): Promise<CallToolResult> {
  await client.request<{ deleteNoteTarget: { id: string } }>(
    DELETE_NOTE_TARGET_MUTATION,
    { id }
  );

  return {
    content: [
      {
        type: "text",
        text: `✅ Deleted note target: ${id}`,
      },
    ],
  };
}
