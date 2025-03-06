### Day 1.1:

Project Setup. Dependencies such as bun to replace npm, shadcn for components

### Day 1.2:

Created the main home page layout with sidebar and navbar. Single page web currently

### Day 1.3:

Sign in/up, Database, webhooks and public hosting domain
Sign-in/up: Clerk. Log of creating/deletion/update can be seen in the logs
utilise svix as webhook
Database: Neon.tech (PostgreSQL), DrizzleORM
Ngrok: public hosting site
Concurrent: host local and public at the same time
To run web portal: bunx drizzle-kit studio & bun run dev:all

### Day 2.1:

TRPC: ensures end to end typesafety. allows authenticated prefetching
Why prefetch: "render as you fetch" concept. parallel data loading
Server Component -> Data Cache -> HydrateClient -> Client Components -> Data Cache 1. Prefetch Data 2.Preserve State 3: Assess Cache 4: Auto-refresh

populated the video categories using carousel and fetching the categories from drizzle.
Upstash to cache the categories and limit requests(refresh) count
current file format for categories(neglecting db connection): user -> page.tsx -> home-view.tsx -> categories-section.tsx -> filter-carousel.tsx

### Day 3.1:

Create the studio layout and populate video data in video section.
Infinite scroll wheel limited by DEFAULT_LIMIT in constants.ts

### Day 4.1:

MUX (video service) integration and webhooks.
studio-uploader.tsx, studio-upload-model.tsx, webhook/route.ts
MUX webhooks syncing with db, ui
Create design and content of video edit page: form-section.tsx, videos-section.tsx

### Day 5.1:

Integrate UploadThing for user to upload thumbnail instead of using default
UTApi is fetching the thumbnail information

### Day 8:
Integrate Upstash workflow to run background AI jobs
