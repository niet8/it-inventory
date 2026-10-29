import { z } from 'zod';

// Query strings arrive as text, hence the coercion.
export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};
