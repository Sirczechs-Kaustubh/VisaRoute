import { z } from "zod";

export const countriesListQuerySchema = z.object({
  region: z
    .enum(["Western Europe", "Nordic", "Central/Eastern Europe", "Southern Europe"])
    .optional(),
  search: z.string().trim().min(1).optional(),
  popularOnly: z
    .string()
    .optional()
    .transform((value) => value === "true"),
  appointmentLead: z.enum(["all", "quick", "standard"]).optional(),
});
