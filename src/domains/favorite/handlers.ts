/**
 * Favorite domain handlers
 *
 * Twenty v2 replaced the `favorite` object with navigation menu items of
 * type RECORD on the /metadata API. These handlers keep the old tool
 * surface (personId / companyId / opportunityId) and translate it.
 */

import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { GraphQLClient } from "../../shared/graphql-client.js";
import {
  CREATE_FAVORITE_MUTATION,
  GET_FAVORITE_QUERY,
  LIST_FAVORITES_QUERY,
  DELETE_FAVORITE_MUTATION,
  LIST_OBJECT_METADATA_QUERY,
} from "./queries.js";
import {
  AddFavoriteInput,
  ListFavoritesParams,
  Favorite,
  NavigationMenuItem,
  NavigationMenuItemInput,
  ObjectMetadataNode,
} from "./types.js";

type ObjectMap = { byName: Map<string, string>; byId: Map<string, string> };

/** Object metadata ids are stable per workspace, cache them per client. */
const objectMapCache = new WeakMap<GraphQLClient, ObjectMap>();

async function getObjectMap(client: GraphQLClient): Promise<ObjectMap> {
  const cached = objectMapCache.get(client);
  if (cached) return cached;

  const result = await client.request<{
    objects: { edges: { node: ObjectMetadataNode }[] };
  }>(LIST_OBJECT_METADATA_QUERY, {}, "metadata");

  const map: ObjectMap = { byName: new Map(), byId: new Map() };
  for (const { node } of result.objects.edges) {
    map.byName.set(node.nameSingular, node.id);
    map.byId.set(node.id, node.nameSingular);
  }
  objectMapCache.set(client, map);
  return map;
}

function resolveTarget(data: {
  personId?: string;
  companyId?: string;
  opportunityId?: string;
}): { objectType: string; recordId: string } | null {
  if (data.personId) return { objectType: "person", recordId: data.personId };
  if (data.companyId) return { objectType: "company", recordId: data.companyId };
  if (data.opportunityId)
    return { objectType: "opportunity", recordId: data.opportunityId };
  return null;
}

/** Map a navigation menu item onto the Favorite shape used by the tools. */
function toFavorite(item: NavigationMenuItem, objects: ObjectMap): Favorite {
  const objectType =
    (item.targetObjectMetadataId &&
      objects.byId.get(item.targetObjectMetadataId)) ||
    "unknown";
  const targetRecordId = item.targetRecordId ?? "";

  const favorite: Favorite = {
    id: item.id,
    position: item.position,
    objectType,
    targetRecordId,
    label: item.targetRecordIdentifier?.labelIdentifier ?? item.name ?? null,
    userWorkspaceId: item.userWorkspaceId ?? null,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
  if (objectType === "person") favorite.personId = targetRecordId;
  if (objectType === "company") favorite.companyId = targetRecordId;
  if (objectType === "opportunity") favorite.opportunityId = targetRecordId;
  return favorite;
}

/**
 * Add a new favorite
 */
export async function addFavorite(
  client: GraphQLClient,
  data: AddFavoriteInput
): Promise<CallToolResult> {
  const target = resolveTarget(data);
  if (!target) {
    throw new Error(
      "At least one target (personId, companyId, or opportunityId) must be provided"
    );
  }

  const objects = await getObjectMap(client);
  const targetObjectMetadataId = objects.byName.get(target.objectType);
  if (!targetObjectMetadataId) {
    throw new Error(
      `Object "${target.objectType}" not found in workspace metadata`
    );
  }

  const input: NavigationMenuItemInput = {
    type: "RECORD",
    targetRecordId: target.recordId,
    targetObjectMetadataId,
  };
  if (data.position !== undefined) input.position = data.position;

  const result = await client.request<{
    createNavigationMenuItem: NavigationMenuItem;
  }>(CREATE_FAVORITE_MUTATION, { input }, "metadata");

  const favorite = toFavorite(result.createNavigationMenuItem, objects);

  return {
    content: [
      {
        type: "text",
        text: `✅ Added ${target.objectType} to favorites (${target.recordId})\n\n${JSON.stringify(favorite, null, 2)}`,
      },
    ],
  };
}

/**
 * Get a favorite by ID
 */
export async function getFavorite(
  client: GraphQLClient,
  id: string
): Promise<CallToolResult> {
  const objects = await getObjectMap(client);
  const result = await client.request<{ navigationMenuItem: NavigationMenuItem }>(
    GET_FAVORITE_QUERY,
    { id },
    "metadata"
  );

  const favorite = toFavorite(result.navigationMenuItem, objects);

  return {
    content: [
      {
        type: "text",
        text: `Favorite details:\n\n${JSON.stringify(favorite, null, 2)}`,
      },
    ],
  };
}

/**
 * List favorites with optional filtering.
 * The metadata API has no server-side filter for navigation menu items,
 * so filtering and limiting happen client-side.
 */
export async function listFavorites(
  client: GraphQLClient,
  params: ListFavoritesParams = {}
): Promise<CallToolResult> {
  const { limit = 20, objectType, ...targetParams } = params;
  const objects = await getObjectMap(client);
  const target = resolveTarget(targetParams);

  const result = await client.request<{ navigationMenuItems: NavigationMenuItem[] }>(
    LIST_FAVORITES_QUERY,
    {},
    "metadata"
  );

  let favorites = result.navigationMenuItems
    .filter((item) => item.type === "RECORD" && item.targetRecordId)
    .map((item) => toFavorite(item, objects));

  if (target) {
    favorites = favorites.filter(
      (f) => f.objectType === target.objectType && f.targetRecordId === target.recordId
    );
  }
  if (objectType) {
    favorites = favorites.filter((f) => f.objectType === objectType);
  }

  favorites.sort((a, b) => a.position - b.position);
  const hasMore = favorites.length > limit;
  favorites = favorites.slice(0, limit);

  const summary = `Found ${favorites.length} favorite(s)${hasMore ? " (more available)" : ""}`;

  return {
    content: [
      {
        type: "text",
        text: `${summary}\n\n${JSON.stringify(favorites, null, 2)}`,
      },
    ],
  };
}

/**
 * Remove a favorite
 */
export async function removeFavorite(
  client: GraphQLClient,
  id: string
): Promise<CallToolResult> {
  await client.request<{ deleteNavigationMenuItem: { id: string } }>(
    DELETE_FAVORITE_MUTATION,
    { id },
    "metadata"
  );

  return {
    content: [
      {
        type: "text",
        text: `✅ Removed favorite: ${id}`,
      },
    ],
  };
}
