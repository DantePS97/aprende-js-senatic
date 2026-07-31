import { z } from 'zod';

const objectIdString = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Debe ser un ObjectId válido');

export const GrantRewardSchema = z.object({
  userId: objectIdString,
  achievementId: objectIdString,
});
