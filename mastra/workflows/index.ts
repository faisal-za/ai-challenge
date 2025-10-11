import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";
 
const step1 = createStep({});
const step2 = createStep({});
 
export const testWorkflow = createWorkflow({
  id: "test-workflow",
  description: 'Test workflow',
  inputSchema: z.object({
    input: z.string()
  }),
  outputSchema: z.object({
    output: z.string()
  })
})
  .then(step1)
  .then(step2)
  .commit();