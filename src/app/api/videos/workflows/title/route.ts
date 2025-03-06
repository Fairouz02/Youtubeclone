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

const TITLE_SYSTEM_PROMPT = `Your Task is to generate an SEO-focused title for a YouTube video based on its transcript. Please follow these guidelines:
- Be concise but descriptive, using relevant keywords to improve discoverability.
- Highlight the most compelling or unique aspect of the video content.
- Avoid jargon or overly complex language unless its directly supports searchability.
- Use action-oriented phrasing or clear value propositions where applicable.
- Ensure the title is 3-8 words long and no more then 100 characters.
- Only return the title as plain text. Do not add quotes or any additional formatting.`

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
    //                 content: TITLE_SYSTEM_PROMPT

    //             },{
    //                 role: "user",
    //                 content: transcript
    //             }
    //         ]}
    //     }
    // )

    // const title = body.choices[0]?.message.content

    //     if (!title){
    //         throw new Error("Bad request")
    //     }

    await context.run("updated-video", async () => {
        

        await db.update(videos).set({
            title: "AI not integrated"
            // title: title || video.title
        }).where(and(
            eq(videos.id, video.id),
            eq(videos.userId, video.userId)
        ))
    })

  }
)