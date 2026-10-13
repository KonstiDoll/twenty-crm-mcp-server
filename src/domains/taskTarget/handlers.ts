/**
 * TaskTarget domain handlers
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
  CREATE_TASK_TARGET_MUTATION,
  LIST_TASK_TARGETS_QUERY,
  DELETE_TASK_TARGET_MUTATION,
} from "./queries.js";
import {
  CreateTaskTargetInput,
  ListTaskTargetsParams,
  TaskTarget,
  TaskTargetGraphQLInput,
} from "./types.js";

/**
 * Transform create input to GraphQL format
 */
function transformCreateInput(
  data: CreateTaskTargetInput
): TaskTargetGraphQLInput {
  return {
    taskId: data.taskId,
    ...toTargetFields(data),
  };
}

/**
 * Build filter for list query
 */
function buildListFilter(
  params: ListTaskTargetsParams
): Record<string, unknown> | null {
  const { taskId, personId, companyId, opportunityId } = params;
  const filter: Record<string, unknown> = toTargetFilter({
    personId,
    companyId,
    opportunityId,
  });

  if (taskId) filter.taskId = { eq: taskId };

  return Object.keys(filter).length > 0 ? filter : null;
}

/**
 * Create a new task target (link task to entity)
 */
export async function createTaskTarget(
  client: GraphQLClient,
  data: CreateTaskTargetInput
): Promise<CallToolResult> {
  // Validate that at least one target is provided
  if (!data.personId && !data.companyId && !data.opportunityId) {
    throw new Error(
      "At least one target (personId, companyId, or opportunityId) must be provided"
    );
  }

  const input = transformCreateInput(data);

  const result = await client.request<{
    createTaskTarget: Record<string, unknown>;
  }>(CREATE_TASK_TARGET_MUTATION, { input });

  const taskTarget = fromTargetFields(result.createTaskTarget) as unknown as TaskTarget;

  // Determine what was linked
  const targetType = taskTarget.personId
    ? "person"
    : taskTarget.companyId
    ? "company"
    : "opportunity";
  const targetId =
    taskTarget.personId ||
    taskTarget.companyId ||
    taskTarget.opportunityId;

  return {
    content: [
      {
        type: "text",
        text: `✅ Linked task to ${targetType} (${targetId})\n\n${JSON.stringify(taskTarget, null, 2)}`,
      },
    ],
  };
}

/**
 * List task targets with optional filtering
 */
export async function listTaskTargets(
  client: GraphQLClient,
  params: ListTaskTargetsParams = {}
): Promise<CallToolResult> {
  const { limit = 20, ...filterParams } = params;
  const filter = buildListFilter(filterParams);

  const result = await client.request<{
    taskTargets: Connection<Record<string, unknown>>;
  }>(LIST_TASK_TARGETS_QUERY, { filter, limit });

  const connection = result.taskTargets;
  const taskTargets = connection.edges.map(
    (edge) => fromTargetFields(edge.node) as unknown as TaskTarget
  );
  const summary = `Found ${taskTargets.length} task target(s)${
    connection.pageInfo.hasNextPage ? " (more available)" : ""
  }`;

  return {
    content: [
      {
        type: "text",
        text: `${summary}\n\n${JSON.stringify(taskTargets, null, 2)}`,
      },
    ],
  };
}

/**
 * Delete a task target (unlink task from entity)
 */
export async function deleteTaskTarget(
  client: GraphQLClient,
  id: string
): Promise<CallToolResult> {
  await client.request<{ deleteTaskTarget: { id: string } }>(
    DELETE_TASK_TARGET_MUTATION,
    { id }
  );

  return {
    content: [
      {
        type: "text",
        text: `✅ Deleted task target: ${id}`,
      },
    ],
  };
}
