// "relation" is a orm "foreign key" that works on the application level and not database level
// using relation is just a work around to simplify columns in database
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod"
import { pgTable, text, uuid, timestamp, uniqueIndex, integer, pgEnum, primaryKey } from "drizzle-orm/pg-core";

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
    videos: many(videos),
    videoViews: many(videoViews),
    videoReactions: many(videoReactions)
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

export const videoRelations = relations( videos, ({ one, many }) => ({
    user: one(users, {
        fields: [videos.userId],
        references: [users.id]
    }),
    category: one(categories, {
        fields: [videos.categoryId],
        references: [categories.id]
    }),
    views: many(videoViews),
    reactions: many(videoReactions)
})) 

export const videoViews = pgTable("video_views", {
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    videoId: uuid("video_id").references(() => videos.id, { onDelete: "cascade" }).notNull(),
    createdAt: timestamp("created at").defaultNow().notNull(),
    updatedAt: timestamp("updated at").defaultNow().notNull()
}, (t) => [
    primaryKey({
        name: "video_views_pk",
        columns: [t.userId, t.videoId]
    })
])

export const videoViewRelations = relations(videoViews, ({ one }) => ({
    users: one(users, {
        fields: [videoViews.userId],
        references: [users.id]
    }),
    videos: one(videos, {
        fields: [videoViews.videoId],
        references: [videos.id]
    })
}))

export const videoViewInsertSchema = createInsertSchema(videoViews)
export const videoViewUpdateSchema = createUpdateSchema(videoViews)
export const videoViewSelectSchema = createSelectSchema(videoViews)

export const reactionType = pgEnum("reaction_type", ["like", "dislike"])

export const videoReactions = pgTable("video_reactions", {
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    videoId: uuid("video_id").references(() => videos.id, { onDelete: "cascade" }).notNull(),
    type: reactionType("type").notNull(),
    createdAt: timestamp("created at").defaultNow().notNull(),
    updatedAt: timestamp("updated at").defaultNow().notNull()
}, (t) => [
    primaryKey({
        name: "video_reactions_pk",
        columns: [t.userId, t.videoId]
    })
])

export const videoReactionRelations = relations(videoReactions, ({ one }) => ({
    users: one(users, {
        fields: [videoReactions.userId],
        references: [users.id]
    }),
    videos: one(videos, {
        fields: [videoReactions.videoId],
        references: [videos.id]
    })
}))

export const videoReactionInsertSchema = createInsertSchema(videoReactions)
export const videoReactionUpdateSchema = createUpdateSchema(videoReactions)
export const videoReactionSelectSchema = createSelectSchema(videoReactions)