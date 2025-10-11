import Conversation from "../../conversation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

export default async function ChatPage({
  params,
  searchParams,
}: {
  params: Promise<{ threadId: string }>;
  searchParams: Promise<{ initialMessage?: string }>;
}) {
  const { threadId } = await params;
  const { initialMessage } = await searchParams;

  return (
    <div className="flex flex-col h-full">
      {/* Header with sidebar trigger */}
      <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4 sticky top-0 z-10">
        <SidebarTrigger />
        <Separator orientation="vertical" className="h-6" />
        <div>
          <h2 className="text-lg font-semibold">Patient Conversation</h2>
          <p className="text-xs text-muted-foreground">ICD-11 Diagnostic Chat</p>
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        <div>
          <Conversation threadId={threadId} initialMessage={initialMessage || ""} />
        </div>
      </div>
    </div>
  );
}
