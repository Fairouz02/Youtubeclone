// modal for uploading of content in studio page
"use client"

import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { StudioUploader } from "./studio-uploader"
import { Loader2Icon, PlusIcon } from "lucide-react"

import { trpc } from "@/trpc/client"
import { Button } from "@/components/ui/button"
import { ResponsiveModel } from "@/components/responsive-dialog"

export const StudioUploadModal = () => {
    const router = useRouter()
    const utils = trpc.useUtils()
    const create = trpc.videos.create.useMutation({
        onSuccess: () => {
            toast.success("Video created successfully")
            utils.studio.getMany.invalidate()
        },
        onError: (e) => {
            toast.error("Failed to create video: " + e.message)
        }
    })

    const onSuccess = () => {
        if (!create.data?.video.id) return

        create.reset()
        router.push(`/studio/videos/${create.data.video.id}`)
    }
    return (
        <>
        <ResponsiveModel title="Upload a video" open={!!create.data?.url} onOpenChange={() => create.reset()}>

            {create.data?.url 
                ? <StudioUploader endpoint={create.data.url} onSuccess={onSuccess}/> 
                : <Loader2Icon />}

        </ResponsiveModel>
            <Button variant="secondary" onClick={() => create.mutate()} disabled={create.isPending}>
                {create.isPending ? <Loader2Icon className="animate-spin" /> : <PlusIcon /> }
                Create
            </Button>
        </>
    )
}