//  fetch all info to be published in the top row
import Link from "next/link";

import { useAuth } from "@clerk/nextjs";
import { VideoGetOneOutput } from "../../types";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { UserInfo } from "@/modules/users/ui/components/user-info";
import { SubscriptionButton } from "@/modules/subscriptions/ui/components/subscription-button";

interface VideoOwnerProps {
    user: VideoGetOneOutput["user"],
    videoId: string
}

export const VideoOwner = ({ user, videoId}: VideoOwnerProps) => {
    const { userId: clerkUserId } = useAuth()
    
    return (
        <div className="flex items-center sm:items-start justify-between sm:justify-start gap-3">
            
            {/* Name and subscriber count */}
            <Link href={`/users/${user.id}`}>
                <div className="flex items-center gap-3 min-w-0">
                    <UserAvatar size="lg" imageUrl={user.imageUrl} name={user.name} />
                    <div className="flex flex-col gap-1 min-w-0">
                        <UserInfo size="lg" name={user.name} />
                        <span className="text-sm text-muted-foreground line-clamp-1">
                            {/* TODO: create a proper subs fill */}
                            {0} subscribers
                        </span>
                    </div>
                </div>
            </Link>

            {/* Edit Video and subscribe button */}
            { clerkUserId === user.clerkId ? (
                <Button variant="secondary" className="rounded-full" asChild>
                    <Link href={`/studio/videos/${videoId}`}>
                        Edit Video
                    </Link>
                </Button>
            ):(
                <SubscriptionButton onClick={ () => {} } disabled={false} isSubscribed={false} className="flex-none" />
            )}
        </div>
    )
}