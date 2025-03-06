// Creating upstash workflow endpoint for AI to run. used for generation of thumbnail
// since the thumbnail URL and Key in the db for UploadThing and Drizzle will be affected, deprecation of feature will be on the UI instead
import { db } from "@/db"
import { videos } from "@/db/schema"
import { serve } from "@upstash/workflow/nextjs"
import { TableBody } from "@/components/ui/table"

import { and, eq } from "drizzle-orm"
import { UTApi } from "uploadthing/server"

interface InputType {
    videoId: string,
    userId: string,
    prompt: string
}

export const { POST } = serve(
    async (context) => {
        const utapi = new UTApi()
        const input = context.requestPayload as InputType
        const { videoId, userId, prompt } = input
        
    const video = await context.run("get-video", async () => {
        const [existingVideo] = await db.select().from(videos).where(and(
            eq(videos.id, videoId),
            eq(videos.userId, userId))
        )

        if (!existingVideo){
            throw new Error("Not found")
        }

        return existingVideo
    })

    const { body } = await context.call<{ data: Array<{ url: string }> }>("generate-thumbnail", {
        url: "https://api.openai.com/v1/images/generations",
        method: "POST",
        body: {
            prompt,
            n: 1,
            model: "dall-e-3",
            size: "1792x1024"
        },
        headers: {
            authorization: `Bearer ${process.env.OPEN_AI_KEY}`
        }
    })

    const tempThumbnailUrl = body.data[0].url

    if (!tempThumbnailUrl){
        throw new Error("Bad request")
    }

    await context.run("cleanup-thumbnail", async () => {
        if (video.thumbnailKey){
            await utapi.deleteFiles(video.thumbnailKey)
            await db.update(videos).set({ thumbnailKey: null, thumbnailUrl: null }).where(and(
                eq(videos.id, videoId),
                eq(videos.userId, userId)
            ))
        }
    })

    const uploadedThumbnail = await context.run("uploaded-thumbnail", async () => {
        const { data } = await utapi.uploadFilesFromUrl(tempThumbnailUrl)

        if (!data) {
            throw new Error("Bad request")
        }
        return data
    })
    
    await context.run("updated-video", async () => {
        await db.update(videos).set({
            title: "AI not integrated",
            thumbnailKey: uploadedThumbnail.key,
            thumbnailUrl: uploadedThumbnail.ufsUrl
        }).where(and(
            eq(videos.id, video.id),
            eq(videos.userId, video.userId)
        ))
    })

  }
)