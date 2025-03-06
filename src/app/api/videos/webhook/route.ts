// route for MUX to upload videos
import { eq } from "drizzle-orm";
import { VideoAssetCreatedWebhookEvent, VideoAssetDeletedWebhookEvent, VideoAssetErroredWebhookEvent, VideoAssetReadyWebhookEvent, VideoAssetTrackReadyWebhookEvent } from "@mux/mux-node/resources/webhooks.mjs";
import { headers } from "next/headers";
import { mux } from "@/lib/mux";
import { db } from "@/db";
import { videos } from "@/db/schema";
import { UTApi } from "uploadthing/server";

const SIGNING_SECRET = process.env.MUX_WEBHOOK_SECRET!
type WebhookEvent = 
    | VideoAssetCreatedWebhookEvent
    | VideoAssetErroredWebhookEvent
    | VideoAssetReadyWebhookEvent
    | VideoAssetTrackReadyWebhookEvent
    | VideoAssetDeletedWebhookEvent

export const POST = async(request: Request) => {
    if (!SIGNING_SECRET) {
        throw new Error("MUX_WEBHOOK_SECRET is not set")
    }

    const headersPayload = await headers()
    const muxSignature = headersPayload.get("mux-signature")

    if (!muxSignature) {
        return new Response("No Signature Found", {status: 401})
    }

    const payload = await request.json()
    const body = JSON.stringify(payload)

    mux.webhooks.verifySignature(
        body, {
            "mux-signature": muxSignature
        },
        SIGNING_SECRET
    )

    switch (payload.type as WebhookEvent["type"]) { // creating of video
        case "video.asset.created": {
            const data = payload.data as VideoAssetCreatedWebhookEvent["data"]

            if (!data.upload_id) {
                return new Response("No upload ID found", {status: 400})
            }
            
            console.log("Creating video: ", {uploadId: data.upload_id})
            await db.update(videos).set({
                muxAssetId: data.id,
                muxStatus: data.status
            })
            .where(eq(videos.muxUploadId, data.upload_id))
        break
        }
        case "video.asset.ready": {
            const data = payload.data as VideoAssetReadyWebhookEvent["data"]
            const playbackId = data.playback_ids?.[0].id
            
            if (!data.upload_id) {
                return new Response("Missing upload ID", {status: 400})
            }

            if (!playbackId) {
                return new Response("Missing playback ID", {status: 400})
            }

            const tempThumbnailUrl = `https://image.mux.com/${playbackId}/thumbnail.jpg`
            const tempPreviewUrl = `https://image.mux.com/${playbackId}/animated.gif`
            const duration = data.duration ? Math.round(data.duration * 1000) : 0

            const utapi = new UTApi()
            const [ uploadedThumbnailUrl, uploadedPreviewUrl ] = await utapi.uploadFilesFromUrl([
                tempThumbnailUrl,
                tempPreviewUrl
            ])

            if (!uploadedThumbnailUrl.data || !uploadedPreviewUrl.data) {
                return new Response("Failed to upload thumbnail or preview", {status: 500})
            }

            const { key: thumbnailKey, ufsUrl: thumbnailUrl } = uploadedThumbnailUrl.data
            const { key: previewKey, ufsUrl: previewUrl } = uploadedPreviewUrl.data

            await db.update(videos).set({
                muxStatus: data.status,
                muxPlaybackId: playbackId,
                muxAssetId: data.id,
                thumbnailUrl,
                thumbnailKey,
                previewUrl,
                previewKey,
                duration
            })
            .where(eq(videos.muxUploadId, data.upload_id))
        break
        }
        case "video.asset.errored": { // error uploading video
            const data = payload.data as VideoAssetErroredWebhookEvent["data"]

            if (!data.upload_id) {
                return new Response("Missing upload ID", {status: 400})
            }

            await db.update(videos).set({
                muxStatus: data.status
            })
            .where(eq(videos.muxUploadId, data.upload_id))
        break
        }
        case "video.asset.deleted": { // deleting of video
            const data = payload.data as VideoAssetErroredWebhookEvent["data"] 

            if (!data.upload_id) {
                return new Response("Missing upload ID", {status: 400})
            }

            console.log("Deleting video: ", {uploadId: data.upload_id})

            await db.delete(videos).where(eq( videos.muxUploadId, data.upload_id))
        break
        }
        case "video.asset.track.ready": { // subtitles. webhook will be activated/called when there is audio or subtitles
            const data = payload.data as VideoAssetTrackReadyWebhookEvent["data"] & {
                asset_id: string
            }

            console.log("Track ready")

            const assetId = data.asset_id
            const trackId = data.id
            const status = data.status

            if (!assetId) {
                return new Response("Missing asset ID", {status: 400})
            }

            await db.update(videos).set({
                muxTrackId: trackId,
                muxTrackStatus: status
            }).where(eq( videos.muxAssetId, assetId))
        break
        }
    }

    return new Response("Webhook received", {status: 200})
}