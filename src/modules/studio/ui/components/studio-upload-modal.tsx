// modal for uploading of content in studio page
"use client"

import { Button } from "@/components/ui/button"
import { trpc } from "@/trpc/client"
import { Loader2Icon, PlusIcon } from "lucide-react"
import { toast } from "sonner"

export const StudioUploadModal = () => {
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

    return (
        <Button variant="secondary" onClick={() => create.mutate()} disabled={create.isPending}>
            {create.isPending ? <Loader2Icon className="animate-spin" /> : <PlusIcon /> }
            Create
        </Button>
    )
}