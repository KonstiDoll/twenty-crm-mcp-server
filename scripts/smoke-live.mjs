#!/usr/bin/env node
/**
 * Live smoke test: starts the built MCP server (dist/index.js) over stdio and
 * calls every read-only list_* / get_* tool against the real Twenty instance.
 * Needs TWENTY_BASE_URL and TWENTY_API_KEY in the environment.
 *
 *   npm run build && node scripts/smoke-live.mjs
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const serverPath = path.join(here, "..", "dist", "index.js");

if (!process.env.TWENTY_BASE_URL || !process.env.TWENTY_API_KEY) {
  console.error("TWENTY_BASE_URL and TWENTY_API_KEY must be set");
  process.exit(2);
}

const transport = new StdioClientTransport({
  command: "node",
  args: [serverPath],
  env: { ...process.env },
});
const client = new Client({ name: "smoke-live", version: "1.0.0" }, { capabilities: {} });
await client.connect(transport);

const LIST_TOOLS = [
  "list_people", "list_companies", "list_opportunities", "list_tasks",
  "list_notes", "list_workspace_members", "list_favorites", "list_attachments",
  "list_task_targets", "list_note_targets", "list_timeline_activities",
];
const GET_FOR = {
  list_people: "get_person", list_companies: "get_company",
  list_opportunities: "get_opportunity", list_tasks: "get_task",
  list_notes: "get_note", list_workspace_members: "get_workspace_member",
};

const ids = (text) => [...text.matchAll(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/g)].map(m => m[0]);
const results = [];

async function call(name, args) {
  const t0 = Date.now();
  try {
    const res = await client.callTool({ name, arguments: args });
    const text = (res.content ?? []).map(c => c.text ?? "").join("\n");
    const failed = res.isError || /\berror\b/i.test(text.slice(0, 200)) && !/"error":\s*null/.test(text);
    results.push({ name, ok: !failed, ms: Date.now() - t0, note: failed ? text.slice(0, 300) : `${ids(text).length} ids` });
    return failed ? null : text;
  } catch (e) {
    results.push({ name, ok: false, ms: Date.now() - t0, note: String(e.message ?? e).slice(0, 300) });
    return null;
  }
}

const { tools } = await client.listTools();
results.push({ name: "tools/list", ok: tools.length > 0, ms: 0, note: `${tools.length} tools` });

for (const list of LIST_TOOLS) {
  const text = await call(list, { limit: 3 });
  const getter = GET_FOR[list];
  if (getter && text) {
    const [id] = ids(text);
    if (id) await call(getter, { id });
    else results.push({ name: getter, ok: true, ms: 0, note: "skipped (no records)" });
  }
}

await client.close();

const w = Math.max(...results.map(r => r.name.length));
for (const r of results) console.log(`${r.ok ? "OK  " : "FAIL"} ${r.name.padEnd(w)} ${String(r.ms).padStart(5)}ms  ${r.note}`);
const failed = results.filter(r => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed against ${process.env.TWENTY_BASE_URL}`);
process.exit(failed.length ? 1 : 0);
