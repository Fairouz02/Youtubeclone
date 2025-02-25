// in order to implement infinite scroll component, need to implement reuseable hook

import { useState, useRef, useEffect } from "react";

export const useIntersectionObserver = (options? : IntersectionObserverInit) => {
    const [ isIntersecting, setIsIntersecting ] = useState(false) // to detect if user has hit the end of the list
    const targetRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            setIsIntersecting(entry.isIntersecting)
        }, options)

        if (targetRef.current) {
            observer.observe(targetRef.current)
        }

        return () => observer.disconnect()
    }, [options])

    return {targetRef, isIntersecting}
}