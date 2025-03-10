// Video Page: dropdown with more information on the video: description, date, views 
import { cn } from "@/lib/utils"

import { useState } from "react"
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react"

interface VideoDescriptionProps {
    compactViews: string,
    expandedViews: string,
    compactDate: string,
    expandedDate: string,
    description?: string | null
}

export const VideoDescription = ({
    compactViews,
    expandedViews,
    compactDate,
    expandedDate,
    description
}: VideoDescriptionProps) => {
    const [isExpanded, setIsExpanded] = useState(false)
    return (
        <div 
        onClick={ () => setIsExpanded((current) => !current )} 
        className="bg-secondary/50 rounded-xl p-3 cursor-pointer hover:bg-secondary/70 transition"
        >
            <div className="flex gap-2 text-sm mb-2">
                <span className="font-medium">
                    {isExpanded ? expandedViews : compactViews} views
                </span>
                <span className="font-medium">
                    {isExpanded ? expandedDate : compactDate}
                </span>
            </div>
            <div className="relative">
                <p className={cn("text-sm whitespace-pre-wrap", !isExpanded && "line-clamp-2")}>
                    {description || "No Description"}
                </p>
                <div className="flex items-center gap-1 mt-4 text-sm font-medium">
                    {isExpanded ? (
                        <>
                            Show less <ChevronUpIcon className="size-4" />
                        </>
                    ):(
                        <>
                            Show More <ChevronDownIcon className="size-4" />
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}