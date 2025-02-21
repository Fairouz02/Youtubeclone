// Main home layout
// <HomeLayout> is the navbar and sidebar
// {children} is the home page (page.tsx)

import { HomeLayout } from "@/modules/home/ui/layouts/home-layout"

interface LayoutProps {
    children: React.ReactNode
}

const Layout = ({ children }: LayoutProps) => {
    return (
        <HomeLayout>
            {children}
        </HomeLayout>
    )
}

export default Layout