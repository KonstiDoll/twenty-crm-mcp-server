/**
 * MCP tool definitions for Workspace Member operations
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const WORKSPACE_MEMBER_TOOLS: Tool[] = [
  {
    name: "list_workspace_members",
    description:
      "List workspace members (users) in Twenty CRM with optional search",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Number of results to return (max: 60, default: 20)",
        },
        searchTerm: {
          type: "string",
          description: "Search by first name, last name, or email",
        },
      },
    },
  },
  {
    name: "get_workspace_member",
    description: "Get details of a specific workspace member by ID",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "Workspace member ID",
        },
      },
      required: ["id"],
    },
  },
];
