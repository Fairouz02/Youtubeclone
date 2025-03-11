// Video Page: read user input on reactions and updates the like/dislike into the database

import { z } from "zod";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { videoReactions } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

export const videoReactionsRouter = createTRPCRouter({
    like: protectedProcedure.input( z.object({ videoId: z.string().uuid()}))
        .mutation(async ({ ctx, input }) => {
            const { videoId } = input
            const { id: userId } = ctx.user
            const [existingVideoReactionLike] = await db
            .select()
            .from(videoReactions)
            .where(and(
                    eq(videoReactions.videoId, videoId),
                    eq(videoReactions.userId, userId),
                    eq(videoReactions.type, "like")
                ))
        
        // if video already liked, this will delete the like reaction 
        if (existingVideoReactionLike) {
            const [ deletedViewerReaction ] = await db
                .delete(videoReactions)
                .where(and(
                    eq(videoReactions.userId, userId),
                    eq(videoReactions.videoId, videoId)
                )).returning()

            return deletedViewerReaction
        }

        // if video havent recieved a like. onConflict would overwrite the dislike to like 
        const [createdVideoReaction] = await db
        .insert(videoReactions)
        .values({userId, videoId, type: "like"})
        .onConflictDoUpdate({
            target: [videoReactions.userId, videoReactions.videoId],
            set: {
                type: "like"
            }
        })
        .returning()

        return createdVideoReaction
        }),
        dislike: protectedProcedure.input( z.object({ videoId: z.string().uuid()}))
        .mutation(async ({ ctx, input }) => {
            const { videoId } = input
            const { id: userId } = ctx.user
            const [existingVideoReactionDislike] = await db
            .select()
            .from(videoReactions)
            .where(and(
                    eq(videoReactions.videoId, videoId),
                    eq(videoReactions.userId, userId),
                    eq(videoReactions.type, "dislike")
                ))
        
        if (existingVideoReactionDislike) {
            const [ deletedViewerReaction ] = await db
            .delete(videoReactions)
            .where(and(
                eq(videoReactions.userId, userId),
                eq(videoReactions.videoId, videoId)
            )).returning()

                return deletedViewerReaction
        }

        const [createdVideoReaction] = await db
        .insert(videoReactions)
        .values({userId, videoId, type: "dislike"})
        .onConflictDoUpdate({
            target: [videoReactions.userId, videoReactions.videoId],
            set: {
                type: "dislike"
            }
        })
        .returning()

        return createdVideoReaction
        })

})