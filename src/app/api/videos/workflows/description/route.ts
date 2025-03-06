// Creating upstash workflow endpoint for AI to run. used for generation of Title name
// uncomment the AI portion when openAI integrated. not integrated due to payment
import { TableBody } from "@/components/ui/table"
import { db } from "@/db"
import { videos } from "@/db/schema"
import { serve } from "@upstash/workflow/nextjs"

import { and, eq } from "drizzle-orm"

interface InputType {
    videoId: string,
    userId: string
}

const DESCRIPTION_SYSTEM_PROMPT = `Your task is to summarise the transcript of a video. Please follow these guidelines:
- Be brief. Condense the content into a summary that captures the key points and main ideas without losing important details.
- Avoid jargon or overly complex language unless necassary for the content.
- Focus on the most critical information, ignoring filler, repetitive statements, or irrelevant tangents.
- Only return the summary, no other text, annotations, or comment.
- Aim for a summary that is 3-5 sentences long and no more than 200 characters.`

export const { POST } = serve(
  async (context) => {
    const input = context.requestPayload as InputType
    const { videoId, userId } = input
    
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

    // const transcript = await context.run("get-transcript", async () => {
    //     const trackURL = `https://stream.mux.com/${video.muxPlaybackId}/text/${video.muxTrackId}.txt` // transcript fetching is covered in the MUX documentation for AI
    //     const response = await fetch(trackURL)
    //     const text = response.text()

    //     if (!text){
    //         throw new Error("Bad request")
    //     }

    //     return text
    // })

    // const { body } = await context.api.openai.call(
    //     "generate-title",{
    //         token: process.env.OPENAI_API_KEY!,
    //         operation: "chat.completions.create",
    //         body: {
    //             model: "gpt-4o",
    //             messages: [{
    //                 role: "system",
    //                 content: DESCRIPTION_SYSTEM_PROMPT

    //             },{
    //                 role: "user",
    //                 content: transcript
    //             }
    //         ]}
    //     }
    // )

    // const description = body.choices[0]?.message.content

    //     if (!description){
    //         throw new Error("Bad request")
    //     }

    await context.run("updated-video", async () => {
        

        await db.update(videos).set({
            description: "AI not integrated"
            // description: description || video.description
        }).where(and(
            eq(videos.id, video.id),
            eq(videos.userId, video.userId)
        ))
    })

  }
)