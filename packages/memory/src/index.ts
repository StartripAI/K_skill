import type { PersonaPack } from "../../core/src/index.js";

export type MemoryPatch = {
  op: "add" | "replace" | "remove";
  path: string;
  value?: unknown;
  reason: string;
};

export type MemorySnapshot = {
  id: string;
  pack: PersonaPack;
  createdAt: string;
  reason: string;
};

export function applyMemoryPatch(pack: PersonaPack, patch: MemoryPatch): PersonaPack {
  const next = structuredClone(pack) as PersonaPack;
  const parts = patch.path.split("/").filter(Boolean);
  if (parts[0] !== "memory") {
    throw new Error(`Memory patch path must start with /memory: ${patch.path}`);
  }

  let target: Record<string, unknown> | unknown[] = next as unknown as Record<string, unknown>;
  for (let index = 0; index < parts.length - 1; index += 1) {
    const part = parts[index];
    if (!part) throw new Error(`Invalid patch path: ${patch.path}`);
    const current = Array.isArray(target) ? target[Number(part)] : target[part];
    if (!current || typeof current !== "object") {
      throw new Error(`Patch path does not exist: ${patch.path}`);
    }
    target = current as Record<string, unknown> | unknown[];
  }

  const leaf = parts.at(-1);
  if (!leaf) throw new Error(`Invalid patch path: ${patch.path}`);
  if (patch.op === "remove") {
    if (Array.isArray(target)) target.splice(Number(leaf), 1);
    else delete target[leaf];
  } else if (patch.op === "add" && Array.isArray(target)) {
    target.push(patch.value);
  } else {
    if (Array.isArray(target)) target[Number(leaf)] = patch.value;
    else target[leaf] = patch.value;
  }
  next.memory.corrections = [...next.memory.corrections, patch.reason];
  next.updatedAt = new Date().toISOString();
  return next;
}

export function createMemorySnapshot(pack: PersonaPack, reason: string): MemorySnapshot {
  return {
    id: `snapshot_${Date.now()}`,
    pack: structuredClone(pack) as PersonaPack,
    createdAt: new Date().toISOString(),
    reason
  };
}
