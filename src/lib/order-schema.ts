import { z } from "zod";

export const orderItemInputSchema = z.object({
  productId: z.string().min(1),
  answers: z.record(z.string(), z.union([z.string(), z.array(z.string())])),
  uploadId: z.string().optional(),
});

export const createOrderSchema = z.object({
  idempotencyKey: z.string().min(8).max(200),
  locale: z.enum(["ar", "en"]),
  customer: z.object({
    fullName: z.string().trim().min(2).max(200),
    phone: z.string().trim().min(4).max(40),
    email: z.union([z.string().trim().email(), z.literal("")]).optional(),
  }),
  delivery: z.object({
    country: z.string().trim().min(1).max(100),
    city: z.string().trim().min(1).max(150),
    address: z.string().trim().min(3).max(500),
    addressNotes: z.string().trim().max(500).optional(),
  }),
  paymentMethod: z.enum(["cod", "whish"]),
  items: z.array(orderItemInputSchema).min(1).max(30),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const validateCartSchema = z.object({
  items: z.array(
    z.object({
      cartItemId: z.string(),
      productId: z.string(),
      answers: z.record(z.string(), z.union([z.string(), z.array(z.string())])),
      clientLineTotalCents: z.number(),
    })
  ),
});
