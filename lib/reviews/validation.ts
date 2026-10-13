import { z } from "zod";

export const reviewSubmissionSchema = z
  .object({
    rating: z.number().int().min(1).max(5),
    title: z.string().trim().min(2).max(120),
    comment: z.string().trim().min(5).max(3000),
  })
  .strict();
