/**
 * Note domain handlers - Using base CRUD handler
 */

import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { createCRUDHandlers } from "../../shared/base-handler.js";
import { GraphQLClient } from "../../shared/graphql-client.js";
import { transformBodyV2 } from "../../shared/transformers.js";
import { CREATE_NOTE_TARGET_MUTATION } from "../noteTarget/queries.js";
import { toTargetFields } from "../../shared/targets.js";
import {
  CREATE_NOTE_MUTATION,
  GET_NOTE_QUERY,
  LIST_NOTES_QUERY,
  UPDATE_NOTE_MUTATION,
  DELETE_NOTE_MUTATION,
} from "./queries.js";
import {
  CreateNoteInput,
  UpdateNoteInput,
  ListNotesParams,
  Note,
  NoteGraphQLInput,
} from "./types.js";

/**
 * Transform create input to GraphQL format
 */
function transformCreateInput(data: CreateNoteInput): NoteGraphQLInput {
  const input: NoteGraphQLInput = {
    title: data.title,
  };

  if (data.body) {
    input.bodyV2 = transformBodyV2(data.body);
  }

  return input;
}

/**
 * Transform update input to GraphQL format
 */
function transformUpdateInput(data: UpdateNoteInput): Partial<NoteGraphQLInput> {
  const { id, ...updates } = data;
  const input: Partial<NoteGraphQLInput> = {};

  if (updates.title !== undefined) input.title = updates.title;

  if (updates.body !== undefined) {
    input.bodyV2 = transformBodyV2(updates.body);
  }

  return input;
}

/**
 * Build filter for list query
 */
function buildListFilter(
  params: ListNotesParams
): Record<string, unknown> | null {
  const { searchTerm } = params;
  const filter: Record<string, unknown> = {};

  if (searchTerm) filter.title = { ilike: `%${searchTerm}%` };

  return Object.keys(filter).length > 0 ? filter : null;
}

// Create CRUD handlers using base handler
const handlers = createCRUDHandlers<
  CreateNoteInput,
  UpdateNoteInput,
  Note,
  NoteGraphQLInput,
  ListNotesParams
>({
  entityName: "note",
  entityNameCapitalized: "Note",
  queries: {
    create: CREATE_NOTE_MUTATION,
    get: GET_NOTE_QUERY,
    list: LIST_NOTES_QUERY,
    update: UPDATE_NOTE_MUTATION,
  },
  transformCreateInput,
  transformUpdateInput,
  buildListFilter,
  formatCreateSuccess: (note) => `✅ Created note: ${note.title}`,
});

// Export handlers
export const getNote = handlers.get;
export const listNotes = handlers.list;
export const updateNote = handlers.update;

/**
 * Create a note with optional auto-linking to person/company/opportunity
 */
export async function createNote(
  client: GraphQLClient,
  data: CreateNoteInput
): Promise<CallToolResult> {
  const { personId, companyId, opportunityId, ...noteData } = data;

  // Create the note using base handler
  const result = await handlers.create(client, noteData as CreateNoteInput);

  // Auto-create targets if relationship IDs provided
  const hasTargets = personId || companyId || opportunityId;
  if (hasTargets) {
    const responseText = result.content[0].type === "text" ? result.content[0].text : "";
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const note = JSON.parse(jsonMatch[0]);
      const targets: Array<{ noteId: string; personId?: string; companyId?: string; opportunityId?: string }> = [];
      if (personId) targets.push({ noteId: note.id, personId });
      if (companyId) targets.push({ noteId: note.id, companyId });
      if (opportunityId) targets.push({ noteId: note.id, opportunityId });

      const linked: string[] = [];
      for (const target of targets) {
        await client.request(CREATE_NOTE_TARGET_MUTATION, {
          input: { noteId: target.noteId, ...toTargetFields(target) },
        });
        if (target.personId) linked.push(`person (${target.personId})`);
        if (target.companyId) linked.push(`company (${target.companyId})`);
        if (target.opportunityId) linked.push(`opportunity (${target.opportunityId})`);
      }

      const linkInfo = `\n\n🔗 Auto-linked to: ${linked.join(", ")}`;
      return {
        content: [
          {
            type: "text",
            text: responseText + linkInfo,
          },
        ],
      };
    }
  }

  return result;
}

/**
 * Delete a note
 */
export async function deleteNote(
  client: GraphQLClient,
  id: string
): Promise<CallToolResult> {
  await client.request<{ deleteNote: { id: string } }>(
    DELETE_NOTE_MUTATION,
    { id }
  );

  return {
    content: [
      {
        type: "text",
        text: `✅ Deleted note: ${id}`,
      },
    ],
  };
}
