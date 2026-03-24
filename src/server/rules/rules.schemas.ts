import { z } from "zod";

export const documentRequirementsQuerySchema = z.object({
  visaType: z.string().trim().min(1).optional(),
  nationalityCategory: z.enum(["visa-required", "visa-exempt", "all"]).optional(),
  countryOfResidence: z.string().trim().min(2).max(3).optional(),
  purposeOfTravel: z.string().trim().min(1).optional(),
});
