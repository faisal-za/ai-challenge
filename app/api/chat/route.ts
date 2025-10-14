import { mastra } from "@/mastra";

const myAgent = mastra.getAgent("RiskAssessmentAgent");

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function POST(req: Request) {

  const { messages, thread } = await req.json();

  console.log("Messages received:", messages.length, "messages, thread:", thread);

  const stream = await myAgent.stream(messages, {
    format: "aisdk",
    memory: {
      resource: "demo",
      thread: thread || "demo"
    }
  });

  console.log("Stream created successfully");

  return stream.toUIMessageStreamResponse({
    sendReasoning: true,
    sendSources: true,
  });
}
