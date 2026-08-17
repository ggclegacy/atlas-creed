export const ATLAS_CAPABILITIES = [
  {
    id: "conversation.persistence",
    status: "available",
    label: "Authenticated, persistent streamed conversations",
  },
  {
    id: "constitution.registry",
    status: "available",
    label: "Versioned Constitutional Kernel and Canon Registry",
  },
  {
    id: "context.lexical-retrieval",
    status: "available",
    label: "Postgres lexical retrieval with project isolation",
  },
  {
    id: "context.trace",
    status: "available",
    label: "Inspectable context and provenance traces",
  },
  {
    id: "constitution.amendment",
    status: "available",
    label: "Conflict records and protected amendment workflows",
  },
  {
    id: "memory.long-term",
    status: "planned",
    label: "Long-term governed memory and explicit forget workflows",
  },
  {
    id: "autonomy.later",
    status: "planned",
    label: "Tools, background monitoring, agents, voice, and autonomy",
  },
] as const;

export function capabilityIsAvailable(capabilityId: string): boolean {
  return (
    ATLAS_CAPABILITIES.find((capability) => capability.id === capabilityId)
      ?.status === "available"
  );
}
