// fetches the videos and upload into the studio page
import { z } from "zod";
import { db } from "@/db";
import { videos } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { eq, and, or, lt, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const studioRouter = createTRPCRouter({
    // getting the video that was clicked in studio page and a protected procedure
    getOne: protectedProcedure.input(
        z.object({ id: z.string() }))
        .query(async ({ ctx, input })=> {
            const {id: userId} = ctx.user
            const {id} = input
            const [video] = await db.select().from(videos)
                .where(and(
                    eq(videos.id, id), 
                    eq(videos.userId, userId)
            ))

            if (!video) {
                throw new TRPCError({ code: "NOT_FOUND"})
            }
            return video
        }),
    // getting all videos that belongs to the user
    getMany: protectedProcedure.input(
        z.object ({
            cursor: z.object({
                id: z.string().uuid(),
                updatedAt: z.date(),
            })
            .nullish(),
            limit: z.number().min(1).max(100),
        }),
    )
    
    .query(async ({ ctx, input }) => {
        const { cursor, limit } = input
        const {id: userId} = ctx.user
        const data = await db.select().from(videos)
            .where(and(eq(videos.userId, userId), cursor ? or (lt(videos.updatedAt, cursor.updatedAt),
            and(eq(videos.updatedAt, cursor.updatedAt), lt(videos.id, cursor.id))) 
            : undefined )).orderBy(desc(videos.updatedAt), desc(videos.id)).limit(limit + 1) // Add 1 to the limit to check if there is more data

    const hasMore = data.length > limit
    // Remove last item if there is more data
    const items = hasMore ? data.slice(0, -1) : data
    //  set cursor to the last item if there is more data 
    const lastItem = items[items.length - 1]
    const nextCursor = hasMore ? {
        id: lastItem.id,
        updatedAt: lastItem.updatedAt
    } : null

    return { items, nextCursor }
    })
})