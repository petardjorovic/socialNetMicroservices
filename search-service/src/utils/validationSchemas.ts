import z from "zod";

export type SearchQueryType = z.infer<typeof searchQueryTerm>;

export const searchQueryTerm = z.object({
  search: z.string().optional(),
});
