import { AtlasShell } from "@/components/layout/atlas-shell";
import { requireOwner } from "@/lib/auth/guards";
import { listConversations } from "@/lib/conversation/service";

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
