/**
 * GraphQL queries and mutations for Favorite operations.
 *
 * Since Twenty v2 favorites are navigation menu items of type RECORD,
 * served by the /metadata endpoint (not /graphql).
 */

export const NAVIGATION_MENU_ITEM_FIELDS = `
  id
  type
  name
  position
  targetRecordId
  targetObjectMetadataId
  userWorkspaceId
  folderId
  createdAt
  updatedAt
  targetRecordIdentifier {
    id
    labelIdentifier
  }
`;

export const LIST_OBJECT_METADATA_QUERY = `
  query ListObjectMetadata {
    objects(paging: { first: 200 }) {
      edges {
        node {
          id
          nameSingular
        }
      }
    }
  }
`;

export const CREATE_FAVORITE_MUTATION = `
  mutation CreateFavorite($input: CreateNavigationMenuItemInput!) {
    createNavigationMenuItem(input: $input) {
      ${NAVIGATION_MENU_ITEM_FIELDS}
    }
  }
`;

export const GET_FAVORITE_QUERY = `
  query GetFavorite($id: UUID!) {
    navigationMenuItem(id: $id) {
      ${NAVIGATION_MENU_ITEM_FIELDS}
    }
  }
`;

export const LIST_FAVORITES_QUERY = `
  query ListFavorites {
    navigationMenuItems {
      ${NAVIGATION_MENU_ITEM_FIELDS}
    }
  }
`;

export const DELETE_FAVORITE_MUTATION = `
  mutation DeleteFavorite($id: UUID!) {
    deleteNavigationMenuItem(id: $id) {
      id
    }
  }
`;
