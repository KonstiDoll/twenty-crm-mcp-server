/**
 * Workspace Member domain handlers
 */

import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { GraphQLClient } from "../../shared/graphql-client.js";
import { Connection } from "../../shared/types.js";
import {
  GET_WORKSPACE_MEMBER_QUERY,
  LIST_WORKSPACE_MEMBERS_QUERY,
} from "./queries.js";
import { ListWorkspaceMembersParams, WorkspaceMember } from "./types.js";

/**
 * Build filter for list query
 */
function buildListFilter(
  params: ListWorkspaceMembersParams
): Record<string, unknown> | null {
  const { searchTerm } = params;
  const filter: Record<string, unknown> = {};

  if (searchTerm) {
    filter.or = [
      { name: { firstName: { ilike: `%${searchTerm}%` } } },
      { name: { lastName: { ilike: `%${searchTerm}%` } } },
      { userEmail: { ilike: `%${searchTerm}%` } },
    ];
  }

  return Object.keys(filter).length > 0 ? filter : null;
}

/**
 * Get a workspace member by ID
 */
export async function getWorkspaceMember(
  client: GraphQLClient,
  id: string
): Promise<CallToolResult> {
  const result = await client.request<{ workspaceMember: WorkspaceMember }>(
    GET_WORKSPACE_MEMBER_QUERY,
    { id }
  );

  const member = result.workspaceMember;

  return {
    content: [
      {
        type: "text",
        text: `Workspace member details:\n\n${JSON.stringify(member, null, 2)}`,
      },
    ],
  };
}

/**
 * List workspace members with optional filtering
 */
export async function listWorkspaceMembers(
  client: GraphQLClient,
  params: ListWorkspaceMembersParams = {}
): Promise<CallToolResult> {
  const { limit = 20, ...filterParams } = params;
  const filter = buildListFilter(filterParams);

  const result = await client.request<{
    workspaceMembers: Connection<WorkspaceMember>;
  }>(LIST_WORKSPACE_MEMBERS_QUERY, { filter, limit });

  const connection = result.workspaceMembers;
  const members = connection.edges.map((edge) => edge.node);
  const summary = `Found ${members.length} workspace member(s)${
    connection.pageInfo.hasNextPage ? " (more available)" : ""
  }`;

  return {
    content: [
      {
        type: "text",
        text: `${summary}\n\n${JSON.stringify(members, null, 2)}`,
      },
    ],
  };
}
