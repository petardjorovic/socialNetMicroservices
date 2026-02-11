import z, { trim } from "zod";

export const searchQueryTerm = z.object({
  search: z.string().trim().optional(),
});

export type SearchQueryType = z.infer<typeof searchQueryTerm>;
