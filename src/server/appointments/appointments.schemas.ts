import { z } from "zod";

export const createAppointmentAlertSchema = z.object({
  email: z.string().trim().email(),
  visaType: z.string().trim().min(1).optional(),
});

export const subscribeSchema = z.object({
  email: z.string().trim().email(),
  countrySlug: z.string().trim().min(1),
  visaType: z.string().trim().min(1).optional(),
  residenceCountry: z.string().trim().min(1).optional(),
  city: z.string().trim().min(1).optional(),
  provider: z.string().trim().min(1).optional(),
});

export const unsubscribeSchema = z
  .object({
    id: z.string().optional(),
    email: z.string().trim().email().optional(),
    countrySlug: z.string().trim().min(1).optional(),
  })
  .refine((v) => v.id || (v.email && v.countrySlug), {
    message: "Provide either id or both email and countrySlug",
  });
