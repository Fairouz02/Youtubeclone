// user -> main studio page: page.tsx -> studio-view.tsx -> videos-section.tsx

import { DEFAULT_LIMIT } from "@/constants";
import { StudioView } from "@/modules/studio/ui/views/studio-view";
import { HydrateClient, trpc } from "@/trpc/server";

const Page = async () => {
    void trpc.studio.getMany.prefetchInfinite({
        limit: DEFAULT_LIMIT
    })
    return ( 
        <HydrateClient>
            <StudioView />
        </HydrateClient>
     );
}
 
export default Page;