// displays the categories of the vidoes in the home page
//  user -> page.tsx -> home-view.tsx -> categories-section.tsx -> filter-carousel.tsx


import { CategoriesSection } from "../sections/categories-section"

interface HomeViewProps {
    categoryId?: string
}

export const HomeView = ({ categoryId }: HomeViewProps) => {
    return(
        <div className="max-w-[2400px] mx-auto mb-10 px-4 pt-2.5 flex flex-col gap-y-6">
            <CategoriesSection categoryId={categoryId} />
        </div>
    )
}