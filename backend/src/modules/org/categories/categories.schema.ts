import { z } from 'zod';
import { entityStatusSchema } from '../../../lib/validation.js';

// Optional category-specific field definitions (e.g. warranty for Electronics).
const customFieldSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(['text', 'number', 'date', 'boolean']),
});

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  customFields: z.array(customFieldSchema).optional(),
  status: entityStatusSchema.optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export const listCategoriesSchema = z.object({
  status: entityStatusSchema.optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type ListCategoriesQuery = z.infer<typeof listCategoriesSchema>;
