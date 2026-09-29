import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  leadContext: z.string().max(8000),
  notes: z.string().max(20000),
  conversation: z.string().max(40000),
});

export const qualifyLeadWithAI = createServerFn({ method: "POST" })
  .inputValidator((data) => schema.parse(data))
  .handler(async ({ data }) => {
    const { runQualification } = await import("./ai-qualify.server");
    if (!data.notes.trim() && !data.conversation.trim()) {
      throw new Error("Add some notes or conversation history first.");
    }
    return runQualification(data);
  });
