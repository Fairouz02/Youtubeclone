// "relation" is a orm "foreign key" that works on the application level and not database level

import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod"
import { pgTable, text, uuid, timestamp, uniqueIndex, integer, pgEnum } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
    id: uuid("id").primaryKey().defaultRandom(),
    clerkId: text("clerk_id").unique().notNull(),
    name: text("name").notNull(),
    // TODO: add banner fields
    imageUrl: text("image_url").notNull(),
    createdAt: timestamp("created at").defaultNow().notNull(),
    updatedAt: timestamp("updated at").defaultNow().notNull()
}, (t) => [uniqueIndex("clerk_id_idx").on(t.clerkId)])

export const userRelations = relations(users, ({ many }) => ({
    videos: many(videos)
}))

export const categories = pgTable("categories", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull().unique(),
    // TODO: add banner fields
    description: text("description"),
    createdAt: timestamp("created at").defaultNow().notNull(),
    updatedAt: timestamp("updated at").defaultNow().notNull()
}, (t) => [uniqueIndex("name_idx").on(t.name)])

export const categoryRelations = relations(users, ({ many }) => ({
    videos: many(videos)
}))

export const videoVisibility = pgEnum("video_visibility", [
    "private", 
    "public"
])

export const videos = pgTable("videos", {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    description: text("description"),
    muxStatus: text("mux_status"),                      // status of upload
    muxAssetId: text("mux_asset_id").unique(),          // once upload is complete, video will give an id
    muxUploadId: text("mux_upload_id").unique(),        // to connect the upload id and asset it
    muxPlaybackId: text("mux_playback_id").unique(),    // used to create thumbnails
    muxTrackId: text("mux_track_id"),                   // if video has subtitles
    muxTrackStatus: text("mux_track_status"),           // if video has subtitles
    thumbnailUrl: text("thumbnail_url"),
    thumbnailKey: text("thumbnail_key"),
    previewUrl: text("preview_url"),
    previewKey: text("preview_key"),
    duration: integer("duration").default(0).notNull(),
    visibility: videoVisibility("visiblity").default("private").notNull(),
    userId: uuid("user_id").references(() => users.id, {onDelete: "cascade"}).notNull(),
    categoryId: uuid("category_id").references(() => categories.id, {onDelete: "set null"}),
    createdAt: timestamp("created at").defaultNow().notNull(),
    updatedAt: timestamp("updated at").defaultNow().notNull()
})

export const videoInsertSchema = createInsertSchema(videos)
export const videoUpdateSchema = createUpdateSchema(videos)
export const videoSelectSchema = createSelectSchema(videos)

export const videoRelations = relations( videos, ({ one }) => ({
    user: one(users, {
        fields: [videos.userId],
        references: [users.id]
    }),
    category: one(categories, {
        fields: [videos.categoryId],
        references: [categories.id]
    })
})) 