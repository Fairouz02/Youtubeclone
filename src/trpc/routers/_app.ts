import { createTRPCRouter } from '../init';

import { studioRouter } from '@/modules/studio/server/procedure';
import { videosRouter } from '@/modules/videos/server/procedure';
import { categoriesRouter } from '@/modules/categories/server/procedure';

export const appRouter = createTRPCRouter({
  studio: studioRouter,
  videos: videosRouter,
  categories: categoriesRouter
});
// export type definition of API
export type AppRouter = typeof appRouter;