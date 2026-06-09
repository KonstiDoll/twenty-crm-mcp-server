/**
 * GraphQL queries for Workspace Member operations
 */

export const GET_WORKSPACE_MEMBER_QUERY = `
  query GetWorkspaceMember($id: UUID!) {
    workspaceMember(filter: { id: { eq: $id } }) {
      id
      name {
        firstName
        lastName
      }
      userEmail
      avatarUrl
      locale
      colorScheme
      createdAt
      updatedAt
    }
  }
`;

export const LIST_WORKSPACE_MEMBERS_QUERY = `
  query ListWorkspaceMembers($filter: WorkspaceMemberFilterInput, $limit: Int) {
    workspaceMembers(filter: $filter, first: $limit) {
      edges {
        node {
          id
          name {
            firstName
            lastName
          }
          userEmail
          avatarUrl
          locale
          colorScheme
          createdAt
          updatedAt
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
      }
    }
  }
`;
