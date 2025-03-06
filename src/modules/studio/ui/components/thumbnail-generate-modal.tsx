//  modal for user to upload AI generated thumbnail

import { z } from "zod";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ResponsiveModel } from "@/components/responsive-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage  } from "@/components/ui/form";

interface ThumbnailGenerateModalProps {
    videoId: string,
    open: boolean,
    onOpenChange: (open:boolean) => void
}

const formSchema = z.object({
    prompt: z.string().min(10)
})

export const ThumbnailGenerateModal = ({
    videoId,
    open,
    onOpenChange
}: ThumbnailGenerateModalProps) => {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            prompt: ""
        }
    })

    const generateThumbnail = trpc.videos.generateThumbnail.useMutation({
        onSuccess: () => {
            toast.success( "Background job started", { description: "This may take some time"})
            form.reset()
            onOpenChange(false)
        },
        onError: (e) => {
            toast.error("Something went wrong: " + e)
        }
    })

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        generateThumbnail.mutate({
            prompt: values.prompt,
            id: videoId
        })
    }

    return(
        <ResponsiveModel title="Upload a thumbnail" open={open} onOpenChange={onOpenChange}>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
                    <FormField control={form.control} name="prompt" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Prompt</FormLabel>
                            <FormControl>
                                <Textarea {...field} className="resize-none" cols={30} rows={5} placeholder="A description of wanted thumbnail" />
                            </FormControl>
                            <FormMessage/>
                        </FormItem>
                    )}/>
                    <div className="flex justify-end">
                        <Button type="submit" disabled>
                            Generate (AI feature deprecated. Button Disabled)
                        </Button>
                    </div>
                </form>
            </Form>
        </ResponsiveModel>
    )
}