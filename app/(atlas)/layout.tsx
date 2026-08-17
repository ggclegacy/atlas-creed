import { AtlasShell } from "@/components/layout/atlas-shell";
import { requireOwner } from "@/lib/auth/guards";
import { listConversations } from "@/lib/conversation/service";

// This entire route group contains owner-private database state. Keep it out
// of static generation and every shared response cache even if its internals
// are refactored later.
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export default async function AtlasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const owner = await requireOwner();
  const conversations = await listConversations(owner.id);
  return (
    <AtlasShell
      ownerEmail={owner.email}
      conversations={conversations.map((conversation) => ({
        ...conversation,
        lastMessageAt: conversation.lastMessageAt.toISOString(),
      }))}
    >
      {children}
    </AtlasShell>
  );
}
