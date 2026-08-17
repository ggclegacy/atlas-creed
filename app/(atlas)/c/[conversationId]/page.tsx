import { notFound } from "next/navigation";

import { ConversationView } from "@/components/atlas/conversation-view";
import { requireOwner } from "@/lib/auth/guards";
import { contentText } from "@/lib/conversation/content";
import { getConversation } from "@/lib/conversation/service";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const owner = await requireOwner();
  const { conversationId } = await params;
  const conversation = await getConversation(owner.id, conversationId);
  if (!conversation) notFound();
  return (
    <ConversationView
      initialConversationId={conversation.id}
      initialMessages={conversation.messages.map((message) => ({
        id: message.id,
        role: message.role,
        text: contentText(message.content),
        status: message.status,
        errorCode: message.errorCode,
      }))}
    />
  );
}
