/**
 * Task domain handlers - Using base CRUD handler
 */

import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { createCRUDHandlers } from "../../shared/base-handler.js";
import { GraphQLClient } from "../../shared/graphql-client.js";
import { transformBodyV2 } from "../../shared/transformers.js";
import { CREATE_TASK_TARGET_MUTATION } from "../taskTarget/queries.js";
import { toTargetFields } from "../../shared/targets.js";
import {
  CREATE_TASK_MUTATION,
  GET_TASK_QUERY,
  LIST_TASKS_QUERY,
  UPDATE_TASK_MUTATION,
} from "./queries.js";
import {
  CreateTaskInput,
  UpdateTaskInput,
  ListTasksParams,
  Task,
  TaskGraphQLInput,
} from "./types.js";

/**
 * Transform create input to GraphQL format
 */
function transformCreateInput(data: CreateTaskInput): TaskGraphQLInput {
  const input: TaskGraphQLInput = {
    title: data.title,
  };

  if (data.body) {
    input.bodyV2 = transformBodyV2(data.body);
  }

  if (data.status) input.status = data.status;
  if (data.dueAt) input.dueAt = data.dueAt;
  if (data.assigneeId) input.assigneeId = data.assigneeId;

  return input;
}

/**
 * Transform update input to GraphQL format
 */
function transformUpdateInput(data: UpdateTaskInput): Partial<TaskGraphQLInput> {
  const { id, ...updates } = data;
  const input: Partial<TaskGraphQLInput> = {};

  if (updates.title !== undefined) input.title = updates.title;

  if (updates.body !== undefined) {
    input.bodyV2 = transformBodyV2(updates.body);
  }

  if (updates.status !== undefined) input.status = updates.status;
  if (updates.dueAt !== undefined) input.dueAt = updates.dueAt;
  if (updates.assigneeId !== undefined) input.assigneeId = updates.assigneeId;

  return input;
}

/**
 * Build filter for list query
 */
function buildListFilter(
  params: ListTasksParams
): Record<string, unknown> | null {
  const { searchTerm, status, assigneeId } = params;
  const filter: Record<string, unknown> = {};

  if (searchTerm) filter.title = { ilike: `%${searchTerm}%` };
  if (status) filter.status = { eq: status };
  if (assigneeId) filter.assigneeId = { eq: assigneeId };

  return Object.keys(filter).length > 0 ? filter : null;
}

// Create CRUD handlers using base handler
const handlers = createCRUDHandlers<
  CreateTaskInput,
  UpdateTaskInput,
  Task,
  TaskGraphQLInput,
  ListTasksParams
>({
  entityName: "task",
  entityNameCapitalized: "Task",
  queries: {
    create: CREATE_TASK_MUTATION,
    get: GET_TASK_QUERY,
    list: LIST_TASKS_QUERY,
    update: UPDATE_TASK_MUTATION,
  },
  transformCreateInput,
  transformUpdateInput,
  buildListFilter,
  formatCreateSuccess: (task) => `✅ Created task: ${task.title}`,
});

// Export handlers
export const getTask = handlers.get;
export const listTasks = handlers.list;
export const updateTask = handlers.update;

/**
 * Create a task with optional auto-linking to person/company/opportunity
 */
export async function createTask(
  client: GraphQLClient,
  data: CreateTaskInput
): Promise<CallToolResult> {
  const { personId, companyId, opportunityId, ...taskData } = data;

  // Create the task using base handler
  const result = await handlers.create(client, taskData as CreateTaskInput);

  // Extract task ID from the response JSON
  const hasTargets = personId || companyId || opportunityId;
  if (hasTargets) {
    const responseText = result.content[0].type === "text" ? result.content[0].text : "";
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const task = JSON.parse(jsonMatch[0]);
      const targets: Array<{ taskId: string; personId?: string; companyId?: string; opportunityId?: string }> = [];
      if (personId) targets.push({ taskId: task.id, personId });
      if (companyId) targets.push({ taskId: task.id, companyId });
      if (opportunityId) targets.push({ taskId: task.id, opportunityId });

      const linked: string[] = [];
      for (const target of targets) {
        await client.request(CREATE_TASK_TARGET_MUTATION, {
          input: { taskId: target.taskId, ...toTargetFields(target) },
        });
        if (target.personId) linked.push(`person (${target.personId})`);
        if (target.companyId) linked.push(`company (${target.companyId})`);
        if (target.opportunityId) linked.push(`opportunity (${target.opportunityId})`);
      }

      // Append linking info to response
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
