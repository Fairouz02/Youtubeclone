import { db } from "@/db"
import { categories } from "@/db/schema"

const categoryNames = [
    "Cars and vehicles",
    "Comedy",
    "Education",
    "Gaming",
    "Entertainment",
    "Music",
    "News and politics",
    "Pets and animals",
    "Sports",
    "Travel and events"
]

async function main() {
    console.log("Seeding categories")

    try {
        const values = categoryNames.map((name) => ({
            name,
            description: `Videos related to ${name.toLowerCase()}`
        }))

        await db.insert(categories).values(values)
        console.log("Categories seeded successfully")
    } catch (error) {
        console.error("Error seeding categories: ", error)
        process.exit(1)
    }
}

main()