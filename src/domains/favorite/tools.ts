/**
 * MCP tool definitions for Favorite operations
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const FAVORITE_TOOLS: Tool[] = [
  {
    name: "add_favorite",
    description: "Add a person, company, or opportunity to favorites in Twenty CRM",
    inputSchema: {
      type: "object",
      properties: {
        personId: {
          type: "string",
          description: "Person ID to add to favorites",
        },
        companyId: {
          type: "string",
          description: "Company ID to add to favorites",
        },
        opportunityId: {
          type: "string",
          description: "Opportunity ID to add to favorites",
        },
        position: {
          type: "number",
          description: "Position in favorites list (optional)",
        },
      },
    },
  },
  {
    name: "get_favorite",
    description: "Get details of a specific favorite (navigation menu item) by ID",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "Favorite ID",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "list_favorites",
    description: "List all favorites with optional filtering",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Number of results to return (max: 60, default: 20)",
        },
        personId: {
          type: "string",
          description: "Filter by person ID",
        },
        companyId: {
          type: "string",
          description: "Filter by company ID",
        },
        opportunityId: {
          type: "string",
          description: "Filter by opportunity ID",
        },
        objectType: {
          type: "string",
          description:
            "Filter by object type of the favorited record (e.g. person, company, opportunity)",
        },
      },
    },
  },
  {
    name: "remove_favorite",
    description: "Remove a record from favorites",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "Favorite ID to remove",
        },
      },
      required: ["id"],
    },
  },
];
