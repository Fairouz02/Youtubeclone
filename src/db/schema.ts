import { pgTable, text, uuid, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
    id: uuid("id").primaryKey().defaultRandom(),
    clerkId: text("clerk_id").unique().notNull(),
    name: text("name").notNull(),
    // TODO: add banner fields
    imageUrl: text("image_url").notNull(),
    createdAt: timestamp("created at").defaultNow().notNull(),
    updatedAt: timestamp("updated at").defaultNow().notNull()
}, (t) => [uniqueIndex("clerk_id_idx").on(t.clerkId)])

export const categories = pgTable("categories", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull().unique(),
    // TODO: add banner fields
    description: text("description"),
    createdAt: timestamp("created at").defaultNow().notNull(),
    updatedAt: timestamp("updated at").defaultNow().notNull()
}, (t) => [uniqueIndex("name_idx").on(t.name)])