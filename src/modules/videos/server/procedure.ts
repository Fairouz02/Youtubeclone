// creating and uploading of videos into database
// line 30: existingVideo fetches views, dislike, like
import { z } from "zod";
import { and, eq, getTableColumns, inArray } from "drizzle-orm";
import { UTApi } from "uploadthing/server";

import { db } from "@/db";
import { mux } from "@/lib/mux";
import { TRPCError } from "@trpc/server";
import { workflow } from "@/lib/workflow";
import { users, videoReactions, videos, videoUpdateSchema, videoViews } from "@/db/schema";
import { baseProcedure, createTRPCRouter, protectedProcedure } from "@/trpc/init";

export const videosRouter = createTRPCRouter({
    // getting video for video page. not a protected procedure unlike inside studio folder
    getOne: baseProcedure
        .input(z.object({ id: z.string().uuid() }))
        .query( async ({ ctx, input }) => {
            const { clerkUserId } = ctx
            let userId
            
            // check for user login
            const [ user ] = await db
                .select()
                .from(users)
                .where(inArray(users.clerkId, clerkUserId ? [clerkUserId] : [] ))
            
            if (user) userId = user.id

            // temporary table/common table expression to join existingVideo. selects the reaction that login user made on a specific video
            const viewerReactions = db.$with("viewer_reactions").as(
                db.select({
                    videoId: videoReactions.videoId,
                    type: videoReactions.type
                }).from(videoReactions).where(inArray(videoReactions.userId, userId ? [userId] : []))
            )

            const [existingVideo] = await db
                .with(viewerReactions) // command to link the temporary table
                .select({
                    ...getTableColumns(videos),
                    user: {
                        ...getTableColumns(users)
                    },
                    viewCount: db.$count(videoViews, eq(videoViews.videoId, videos.id)),
                    likeCount: db.$count(videoReactions, and(
                        eq(videoReactions.videoId, videos.id),
                        eq(videoReactions.type, "like")),
                    ),                    
                    dislikeCount: db.$count(videoReactions, and(
                        eq(videoReactions.videoId, videos.id),
                        eq(videoReactions.type, "dislike")),
                    ),
                    viewerReactions: viewerReactions.type
                })
                .from(videos)
                .innerJoin(users, eq(videos.userId, users.id))
                .leftJoin(viewerReactions, eq(viewerReactions.videoId, videos.id)) //left join because login user might have no reaction to the video
                .where(eq(videos.id, input.id))
                // .groupBy(
                //     videos.id,
                //     users.id,
                //     viewerReactions.type
                // )

        if (!existingVideo) {
            throw new TRPCError({code: "NOT_FOUND"})
        }

        return existingVideo
    }),
    generateTitle: protectedProcedure.input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
        const {id: userId} = ctx.user
        const { workflowRunId } = await workflow.trigger({
            url: `${process.env.UPSTASH_WORKFLOW_URL}/api/videos/workflows/title`,
            body: { userId, videoId: input.id },
            retries: 3
        })

        return workflowRunId
    }),
    generateDescription: protectedProcedure.input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
        const {id: userId} = ctx.user
        const { workflowRunId } = await workflow.trigger({
            url: `${process.env.UPSTASH_WORKFLOW_URL}/api/videos/workflows/description`,
            body: { userId, videoId: input.id },
            retries: 3
        })

        return workflowRunId
    }),
    generateThumbnail: protectedProcedure.input(z.object({ id: z.string().uuid(), prompt: z.string().min(10) }))
        .mutation(async ({ ctx, input }) => {
        const {id: userId} = ctx.user
        const { workflowRunId } = await workflow.trigger({
            url: `${process.env.UPSTASH_WORKFLOW_URL}/api/videos/workflows/thumbnail`,
            body: { userId, videoId: input.id, prompt: input.prompt },
            retries: 3
        })

        return workflowRunId
    }),
    restoreThumbnail: protectedProcedure.input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            const { id: userId } = ctx.user

            const [existingVideo] = await db.select().from(videos)
            .where(and(
                eq(videos.id, input.id),
                eq(videos.userId, userId)
            ))

            if (!existingVideo) {
                throw new TRPCError({ code: "NOT_FOUND"})
            }

            if (existingVideo.thumbnailKey) {
                const utapi = new UTApi()

                await utapi.deleteFiles(existingVideo.thumbnailKey)
                await db.update(videos).set({ thumbnailKey: null, previewKey: null}).where(and(
                    eq(videos.id, input.id),
                    eq(videos.userId, userId)
                ))
            }

            if (!existingVideo.muxPlaybackId) {
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR"})
            }
            
            const utapi = new UTApi()
            const tempThumbnailUrl = `https://image.mux.com/${existingVideo.muxPlaybackId}/thumbnail.jpg`
            const uploadedThumbnail= await utapi.uploadFilesFromUrl(tempThumbnailUrl)

            if(!uploadedThumbnail.data) {
                throw new TRPCError({ code: "BAD_REQUEST"})
            }
            
            const { key: thumbnailKey, ufsUrl: thumbnailUrl } = uploadedThumbnail.data

            const [updatedVideo] = await db.update(videos).set({thumbnailUrl, thumbnailKey}).where(and(
                eq(videos.id, input.id),
                eq(videos.userId, userId)
            )).returning()

            return updatedVideo
        }),
    remove: protectedProcedure.input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ctx, input}) => {
            const { id: userId } = ctx.user
            const utapi = new UTApi()

            const [removedVideo] = await db.delete(videos)
                .where(and(
                    eq(videos.id, input.id),
                    eq(videos.userId, userId)
                )).returning()
                
            if (!removedVideo) {
                throw new TRPCError({ code: "NOT_FOUND"})
            }

            if (removedVideo.thumbnailKey) {

                await utapi.deleteFiles(removedVideo.thumbnailKey)

            }
            if (removedVideo.previewKey) {

                await utapi.deleteFiles(removedVideo.previewKey)

            }

            return removedVideo
        }),
    update: protectedProcedure.input(videoUpdateSchema).mutation(async ({ctx, input}) => {
        const { id: userId} = ctx.user

        if (!input.id) {
            throw new TRPCError({ code: "BAD_REQUEST" })
        }

        const [updatedVideo] = await db.update(videos).set({
            title: input.title,
            description: input.description,
            categoryId: input.categoryId,
            visibility: input.visibility,
            updatedAt: new Date()
        }).where(and(
            eq(videos.id, input.id),
            eq(videos.userId, userId)
        )).returning()

        if (!updatedVideo) {
            throw new TRPCError({ code: "NOT_FOUND" })
        }

        return updatedVideo
    }),
    create: protectedProcedure.mutation(async ({ctx}) => {
        const { id: userId } = ctx.user
        const upload = await mux.video.uploads.create({
            new_asset_settings: {
                passthrough: userId,
                playback_policy: ["public"],
                input: [{
                    generated_subtitles: [{
                        language_code: "en",
                        name: "English"
                    }]
                }]
            }, cors_origin: "*" // TODO: in production, set to URL
        })
        
        const [video] = await db.insert(videos).values({
            userId,
            title: "Untitled",
            muxStatus: "waiting",
            muxUploadId: upload.id
        })
        .returning()

        return {
            video: video,
            url: upload.url
        }
    })
})
