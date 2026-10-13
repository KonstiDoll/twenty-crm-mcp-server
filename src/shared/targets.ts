/**
 * Field mapping for noteTarget / taskTarget relations.
 *
 * Twenty v2 renamed the relation fields on noteTarget and taskTarget from
 * personId/companyId/opportunityId to targetPersonId/targetCompanyId/
 * targetOpportunityId. The MCP tools keep the short names for callers and
 * map them here in both directions. GraphQL aliases are not an option:
 * Twenty ignores them and always returns the original field names.
 */

export interface TargetIds {
  personId?: string;
  companyId?: string;
  opportunityId?: string;
}

const TARGET_FIELD_MAP = {
  personId: "targetPersonId",
  companyId: "targetCompanyId",
  opportunityId: "targetOpportunityId",
} as const;

/**
 * Map caller-facing target IDs to Twenty's targetXxxId fields
 */
export function toTargetFields(ids: TargetIds): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const [key, field] of Object.entries(TARGET_FIELD_MAP)) {
    const value = ids[key as keyof TargetIds];
    if (value) fields[field] = value;
  }
  return fields;
}

/**
 * Map caller-facing target IDs to an `eq` filter on Twenty's targetXxxId fields
 */
export function toTargetFilter(
  ids: TargetIds
): Record<string, { eq: string }> {
  const filter: Record<string, { eq: string }> = {};
  for (const [field, value] of Object.entries(toTargetFields(ids))) {
    filter[field] = { eq: value };
  }
  return filter;
}

/**
 * Map a noteTarget/taskTarget record from Twenty back to the short names
 */
export function fromTargetFields(
  record: Record<string, unknown>
): Record<string, unknown> {
  const { targetPersonId, targetCompanyId, targetOpportunityId, ...rest } =
    record;
  return {
    ...rest,
    personId: targetPersonId ?? null,
    companyId: targetCompanyId ?? null,
    opportunityId: targetOpportunityId ?? null,
  };
}
