import { z } from 'zod';

// Route params are not part of the shared contract; bodies come from @it-inventory/contracts.
export const FloorMapParamsSchema = z.object({ id: z.uuid() });
export type FloorMapParams = z.infer<typeof FloorMapParamsSchema>;

export const DeskParamsSchema = z.object({ id: z.uuid(), objectId: z.uuid() });
export type DeskParams = z.infer<typeof DeskParamsSchema>;
