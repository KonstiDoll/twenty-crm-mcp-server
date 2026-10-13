/**
 * GraphQL queries and mutations for NoteTarget operations
 */

export const CREATE_NOTE_TARGET_MUTATION = `
  mutation CreateNoteTarget($input: NoteTargetCreateInput!) {
    createNoteTarget(data: $input) {
      id
      noteId
      targetPersonId
      targetCompanyId
      targetOpportunityId
      createdAt
      updatedAt
    }
  }
`;

export const LIST_NOTE_TARGETS_QUERY = `
  query ListNoteTargets($filter: NoteTargetFilterInput, $limit: Int) {
    noteTargets(filter: $filter, first: $limit) {
      edges {
        node {
          id
          noteId
          targetPersonId
          targetCompanyId
          targetOpportunityId
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

export const DELETE_NOTE_TARGET_MUTATION = `
  mutation DeleteNoteTarget($id: UUID!) {
    deleteNoteTarget(id: $id) {
      id
    }
  }
`;
