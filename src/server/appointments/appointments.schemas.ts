import { z } from "zod";

export const createAppointmentAlertSchema = z.object({
  email: z.string().trim().email(),
  visaType: z.string().trim().min(1).optional(),
});
