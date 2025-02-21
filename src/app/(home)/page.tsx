// the home page that isnt in navbar and sidebar
//  user -> page.tsx -> home-view.tsx -> categories-section.tsx -> filter-carousel.tsx


import { HomeView } from "@/modules/home/ui/views/home-view"
import { HydrateClient, trpc } from "@/trpc/server"

export const dynamic = "force-dynamic"

interface PageProps {
  searchParams: Promise<{
    categoryId?: string
  }>
}

const Page = async ({ searchParams }: PageProps) => {
  const { categoryId } = await searchParams
  void trpc.categories.getMany.prefetch() // prefetching to populate data cache

  return (
    <HydrateClient>
      <HomeView categoryId={categoryId} />
    </HydrateClient>
      
  )
}

export default Page;