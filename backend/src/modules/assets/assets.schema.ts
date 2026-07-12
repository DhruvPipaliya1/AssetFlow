import { z } from 'zod';
import { entityStatusSchema } from '../../lib/validation.js';

// Optional per-asset document links (manuals, invoices, warranty PDFs).
const documentSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
});

// A photo may be a hosted URL or an inline image data URL (uploaded via the
// browser without external blob storage).
const photoSchema = z
  .string()
  .refine((v) => /^https?:\/\//.test(v) || /^data:image\//.test(v), 'Must be an image URL or upload');

// Category-specific field values, keyed by AssetCategory.customFields[].key.
const customFieldValuesSchema = z.record(z.string(), z.union([z.string(), z.number(), z.boolean()]).nullable());

// Registration body. assetTag is auto-generated (AF-####) and status starts at
// AVAILABLE — neither is client-settable (Golden Invariant #5: status only
// changes through the state machine via allocation/maintenance flows).
export const createAssetSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  categoryId: z.string().min(1, 'Category is required'),
  serialNumber: z.string().min(1).optional(),
  acquisitionDate: z.coerce.date().optional(),
  acquisitionCost: z.coerce.number().nonnegative().optional(),
  condition: z.string().min(1).optional(),
  location: z.string().min(1).optional(),
  isBookable: z.boolean().optional(),
  photoUrl: photoSchema.optional(),
  documents: z.array(documentSchema).optional(),
  customFieldValues: customFieldValuesSchema.optional(),
  ownerDepartmentId: z.string().min(1).optional(),
});

// Metadata edits only — NOT status. Status transitions happen through the
// allocation / maintenance / transfer workflows, never a raw PATCH.
export const updateAssetSchema = createAssetSchema.partial();

// Directory search + filters. All optional; strings come off the query string.
export const listAssetsSchema = z.object({
  q: z.string().optional(), // free-text over name / tag / serial
  assetTag: z.string().optional(),
  serialNumber: z.string().optional(),
  categoryId: z.string().optional(),
  status: z
    .enum([
      'AVAILABLE',
      'ALLOCATED',
      'RESERVED',
      'UNDER_MAINTENANCE',
      'LOST',
      'RETIRED',
      'DISPOSED',
    ])
    .optional(),
  ownerDepartmentId: z.string().optional(),
  location: z.string().optional(),
  isBookable: z.enum(['true', 'false']).optional(),
  page: z.string().optional(),
  take: z.string().optional(),
});

export type CreateAssetInput = z.infer<typeof createAssetSchema>;
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>;
export type ListAssetsQuery = z.infer<typeof listAssetsSchema>;
