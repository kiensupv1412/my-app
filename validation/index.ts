// validation/article.schema.ts
import { z } from 'zod';
export const ArticleSchema = z.object({
    title: z.string().min(1).max(160),
    slug: z.string().min(1).max(160).regex(/^[a-z0-9-]+$/),
    body: z.string().optional().nullable(),
    category_id: z.number().int().positive(),
    status: z.enum(['draft', 'review', 'scheduled', 'published', 'archived']).default('draft'),
    publish_at: z.coerce.date().optional().nullable(),
});
export type ArticleInput = z.infer<typeof ArticleSchema>;