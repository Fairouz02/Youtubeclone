// Creating upstash workflow endpoint
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
- Highlight the most compelling or unique aspect of th evideo content
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

    const generateTitle = await context.api.openai.call(
        "generate-title",{
            token: process.env.OPENAI_API_KEY!,
            operation: "chat.completions.create",
            body: {
                model: "gpt-4o",
                messages: [{
                    role: "system",
                    content: "Assistant says 'hello'"
                },{
                    role: "user",
                    content: "User shouts back 'hi' "
                }
            ]}
        }
    )

    await context.run("updated-video", async () => {
        await db.update(videos).set({
            title: "Updated from background job"
        }).where(and(
            eq(videos.id, video.id),
            eq(videos.userId, video.userId)
        ))
    })

  }
)