#!/usr/bin/env node

/**
 * Twenty CRM MCP Server - Refactored Modular Implementation
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { realpathSync } from "fs";
import { pathToFileURL } from "url";

// Shared utilities
import { createGraphQLClient, GraphQLClient } from "./shared/graphql-client.js";

// Domain imports
import {
  PERSON_TOOLS,
  createPerson,
  getPerson,
  listPeople,
  updatePerson,
  CreatePersonInput,
  UpdatePersonInput,
  ListPeopleParams,
} from "./domains/person/index.js";

import {
  COMPANY_TOOLS,
  createCompany,
  getCompany,
  listCompanies,
  updateCompany,
  CreateCompanyInput,
  UpdateCompanyInput,
  ListCompaniesParams,
} from "./domains/company/index.js";

import {
  OPPORTUNITY_TOOLS,
  createOpportunity,
  getOpportunity,
  listOpportunities,
  updateOpportunity,
  CreateOpportunityInput,
  UpdateOpportunityInput,
  ListOpportunitiesParams,
} from "./domains/opportunity/index.js";

import {
  TASK_TOOLS,
  createTask,
  getTask,
  listTasks,
  updateTask,
  CreateTaskInput,
  UpdateTaskInput,
  ListTasksParams,
} from "./domains/task/index.js";

import {
  NOTE_TOOLS,
  createNote,
  getNote,
  listNotes,
  updateNote,
  deleteNote,
  CreateNoteInput,
  UpdateNoteInput,
  ListNotesParams,
} from "./domains/note/index.js";

import {
  TASK_TARGET_TOOLS,
  createTaskTarget,
  listTaskTargets,
  deleteTaskTarget,
  CreateTaskTargetInput,
  ListTaskTargetsParams,
} from "./domains/taskTarget/index.js";

import {
  NOTE_TARGET_TOOLS,
  createNoteTarget,
  listNoteTargets,
  deleteNoteTarget,
  CreateNoteTargetInput,
  ListNoteTargetsParams,
} from "./domains/noteTarget/index.js";

import {
  ACTIVITY_TOOLS,
  createTimelineActivity,
  getTimelineActivity,
  listTimelineActivities,
  updateTimelineActivity,
  CreateTimelineActivityInput,
  UpdateTimelineActivityInput,
  ListTimelineActivitiesParams,
} from "./domains/activity/index.js";

import {
  FAVORITE_TOOLS,
  addFavorite,
  getFavorite,
  listFavorites,
  removeFavorite,
  AddFavoriteInput,
  ListFavoritesParams,
} from "./domains/favorite/index.js";

import {
  ATTACHMENT_TOOLS,
  createAttachment,
  getAttachment,
  listAttachments,
  deleteAttachment,
  CreateAttachmentInput,
  ListAttachmentsParams,
} from "./domains/attachment/index.js";

import {
  WORKSPACE_MEMBER_TOOLS,
  getWorkspaceMember,
  listWorkspaceMembers,
  ListWorkspaceMembersParams,
} from "./domains/workspaceMember/index.js";

/**
 * Main Twenty CRM MCP Server
 */
class TwentyCRMServer {
  private server: Server;
  private _client: GraphQLClient | null = null;

  private get client(): GraphQLClient {
    if (!this._client) {
      this._client = createGraphQLClient();
    }
    return this._client;
  }

  constructor() {
    // Initialize MCP Server
    this.server = new Server(
      {
        name: "twenty-crm",
        version: "0.6.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Setup handlers
    this.setupToolHandlers();
  }

  /**
   * Setup MCP tool handlers
   */
  setupToolHandlers(): void {
    // Register list tools handler
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          ...PERSON_TOOLS,
          ...COMPANY_TOOLS,
          ...OPPORTUNITY_TOOLS,
          ...TASK_TOOLS,
          ...NOTE_TOOLS,
          ...TASK_TARGET_TOOLS,
          ...NOTE_TARGET_TOOLS,
          ...ACTIVITY_TOOLS,
          ...FAVORITE_TOOLS,
          ...ATTACHMENT_TOOLS,
          ...WORKSPACE_MEMBER_TOOLS,
        ],
      };
    });

    // Register call tool handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        // Route to appropriate domain handler
        switch (name) {
          // Person operations
          case "create_person":
            return await createPerson(
              this.client,
              args as unknown as CreatePersonInput
            );
          case "get_person":
            return await getPerson(
              this.client,
              (args as unknown as { id: string }).id
            );
          case "list_people":
            return await listPeople(
              this.client,
              (args || {}) as unknown as ListPeopleParams
            );
          case "update_person":
            return await updatePerson(
              this.client,
              args as unknown as UpdatePersonInput
            );

          // Company operations
          case "create_company":
            return await createCompany(
              this.client,
              args as unknown as CreateCompanyInput
            );
          case "get_company":
            return await getCompany(
              this.client,
              (args as unknown as { id: string }).id
            );
          case "list_companies":
            return await listCompanies(
              this.client,
              (args || {}) as unknown as ListCompaniesParams
            );
          case "update_company":
            return await updateCompany(
              this.client,
              args as unknown as UpdateCompanyInput
            );

          // Opportunity operations
          case "create_opportunity":
            return await createOpportunity(
              this.client,
              args as unknown as CreateOpportunityInput
            );
          case "get_opportunity":
            return await getOpportunity(
              this.client,
              (args as unknown as { id: string }).id
            );
          case "list_opportunities":
            return await listOpportunities(
              this.client,
              (args || {}) as unknown as ListOpportunitiesParams
            );
          case "update_opportunity":
            return await updateOpportunity(
              this.client,
              args as unknown as UpdateOpportunityInput
            );

          // Task operations
          case "create_task":
            return await createTask(
              this.client,
              args as unknown as CreateTaskInput
            );
          case "get_task":
            return await getTask(
              this.client,
              (args as unknown as { id: string }).id
            );
          case "list_tasks":
            return await listTasks(
              this.client,
              (args || {}) as unknown as ListTasksParams
            );
          case "update_task":
            return await updateTask(
              this.client,
              args as unknown as UpdateTaskInput
            );

          // Note operations
          case "create_note":
            return await createNote(
              this.client,
              args as unknown as CreateNoteInput
            );
          case "get_note":
            return await getNote(
              this.client,
              (args as unknown as { id: string }).id
            );
          case "list_notes":
            return await listNotes(
              this.client,
              (args || {}) as unknown as ListNotesParams
            );
          case "update_note":
            return await updateNote(
              this.client,
              args as unknown as UpdateNoteInput
            );
          case "delete_note":
            return await deleteNote(
              this.client,
              (args as unknown as { id: string }).id
            );

          // Task Target operations
          case "create_task_target":
            return await createTaskTarget(
              this.client,
              args as unknown as CreateTaskTargetInput
            );
          case "list_task_targets":
            return await listTaskTargets(
              this.client,
              (args || {}) as unknown as ListTaskTargetsParams
            );
          case "delete_task_target":
            return await deleteTaskTarget(
              this.client,
              (args as unknown as { id: string }).id
            );

          // Note Target operations
          case "create_note_target":
            return await createNoteTarget(
              this.client,
              args as unknown as CreateNoteTargetInput
            );
          case "list_note_targets":
            return await listNoteTargets(
              this.client,
              (args || {}) as unknown as ListNoteTargetsParams
            );
          case "delete_note_target":
            return await deleteNoteTarget(
              this.client,
              (args as unknown as { id: string }).id
            );

          // TimelineActivity operations
          case "create_timeline_activity":
            return await createTimelineActivity(
              this.client,
              args as unknown as CreateTimelineActivityInput
            );
          case "get_timeline_activity":
            return await getTimelineActivity(
              this.client,
              (args as unknown as { id: string }).id
            );
          case "list_timeline_activities":
            return await listTimelineActivities(
              this.client,
              (args || {}) as unknown as ListTimelineActivitiesParams
            );
          case "update_timeline_activity":
            return await updateTimelineActivity(
              this.client,
              args as unknown as UpdateTimelineActivityInput
            );

          // Favorite operations
          case "add_favorite":
            return await addFavorite(
              this.client,
              args as unknown as AddFavoriteInput
            );
          case "get_favorite":
            return await getFavorite(
              this.client,
              (args as unknown as { id: string }).id
            );
          case "list_favorites":
            return await listFavorites(
              this.client,
              (args || {}) as unknown as ListFavoritesParams
            );
          case "remove_favorite":
            return await removeFavorite(
              this.client,
              (args as unknown as { id: string }).id
            );

          // Attachment operations
          case "create_attachment":
            return await createAttachment(
              this.client,
              args as unknown as CreateAttachmentInput
            );
          case "get_attachment":
            return await getAttachment(
              this.client,
              (args as unknown as { id: string }).id
            );
          case "list_attachments":
            return await listAttachments(
              this.client,
              (args || {}) as unknown as ListAttachmentsParams
            );
          case "delete_attachment":
            return await deleteAttachment(
              this.client,
              (args as unknown as { id: string }).id
            );

          // Workspace Member operations
          case "list_workspace_members":
            return await listWorkspaceMembers(
              this.client,
              (args || {}) as unknown as ListWorkspaceMembersParams
            );
          case "get_workspace_member":
            return await getWorkspaceMember(
              this.client,
              (args as unknown as { id: string }).id
            );

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text",
              text: `Error: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  /**
   * Start the MCP server
   */
  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Twenty CRM MCP Server running on stdio");
  }

  // ======================
  // TESTING METHODS
  // Expose internal methods for testing
  // ======================

  async graphqlRequest<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
    return this.client.request<T>(query, variables);
  }

  async createPerson(data: CreatePersonInput) {
    return createPerson(this.client, data);
  }

  async getPerson(id: string) {
    return getPerson(this.client, id);
  }

  async listPeople(params: ListPeopleParams = {}) {
    return listPeople(this.client, params);
  }

  async updatePerson(data: UpdatePersonInput) {
    return updatePerson(this.client, data);
  }

  async createCompany(data: CreateCompanyInput) {
    return createCompany(this.client, data);
  }

  async getCompany(id: string) {
    return getCompany(this.client, id);
  }

  async listCompanies(params: ListCompaniesParams = {}) {
    return listCompanies(this.client, params);
  }

  async updateCompany(data: UpdateCompanyInput) {
    return updateCompany(this.client, data);
  }

  async createOpportunity(data: CreateOpportunityInput) {
    return createOpportunity(this.client, data);
  }

  async getOpportunity(id: string) {
    return getOpportunity(this.client, id);
  }

  async listOpportunities(params: ListOpportunitiesParams = {}) {
    return listOpportunities(this.client, params);
  }

  async updateOpportunity(data: UpdateOpportunityInput) {
    return updateOpportunity(this.client, data);
  }

  async createTask(data: CreateTaskInput) {
    return createTask(this.client, data);
  }

  async getTask(id: string) {
    return getTask(this.client, id);
  }

  async listTasks(params: ListTasksParams = {}) {
    return listTasks(this.client, params);
  }

  async updateTask(data: UpdateTaskInput) {
    return updateTask(this.client, data);
  }

  async createNote(data: CreateNoteInput) {
    return createNote(this.client, data);
  }

  async getNote(id: string) {
    return getNote(this.client, id);
  }

  async listNotes(params: ListNotesParams = {}) {
    return listNotes(this.client, params);
  }

  async updateNote(data: UpdateNoteInput) {
    return updateNote(this.client, data);
  }

  async createTaskTarget(data: CreateTaskTargetInput) {
    return createTaskTarget(this.client, data);
  }

  async listTaskTargets(params: ListTaskTargetsParams = {}) {
    return listTaskTargets(this.client, params);
  }

  async deleteTaskTarget(id: string) {
    return deleteTaskTarget(this.client, id);
  }

  async createNoteTarget(data: CreateNoteTargetInput) {
    return createNoteTarget(this.client, data);
  }

  async listNoteTargets(params: ListNoteTargetsParams = {}) {
    return listNoteTargets(this.client, params);
  }

  async deleteNoteTarget(id: string) {
    return deleteNoteTarget(this.client, id);
  }

  async createTimelineActivity(data: CreateTimelineActivityInput) {
    return createTimelineActivity(this.client, data);
  }

  async getTimelineActivity(id: string) {
    return getTimelineActivity(this.client, id);
  }

  async listTimelineActivities(params: ListTimelineActivitiesParams = {}) {
    return listTimelineActivities(this.client, params);
  }

  async updateTimelineActivity(data: UpdateTimelineActivityInput) {
    return updateTimelineActivity(this.client, data);
  }

  async addFavorite(data: AddFavoriteInput) {
    return addFavorite(this.client, data);
  }

  async getFavorite(id: string) {
    return getFavorite(this.client, id);
  }

  async listFavorites(params: ListFavoritesParams = {}) {
    return listFavorites(this.client, params);
  }

  async removeFavorite(id: string) {
    return removeFavorite(this.client, id);
  }

  async createAttachment(data: CreateAttachmentInput) {
    return createAttachment(this.client, data);
  }

  async getAttachment(id: string) {
    return getAttachment(this.client, id);
  }

  async listAttachments(params: ListAttachmentsParams = {}) {
    return listAttachments(this.client, params);
  }

  async deleteAttachment(id: string) {
    return deleteAttachment(this.client, id);
  }

  async listWorkspaceMembers(params: ListWorkspaceMembersParams = {}) {
    return listWorkspaceMembers(this.client, params);
  }

  async getWorkspaceMember(id: string) {
    return getWorkspaceMember(this.client, id);
  }
}

// Export for testing
export { TwentyCRMServer };

// Start server if run directly
// Note: Uses realpathSync to handle symlinks (e.g., when run via npx or npm bin)
const realPath = realpathSync(process.argv[1]);
const realPathAsUrl = pathToFileURL(realPath).href;

if (import.meta.url === realPathAsUrl) {
  const server = new TwentyCRMServer();
  server.run().catch(console.error);
}
