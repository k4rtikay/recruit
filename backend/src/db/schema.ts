import {
    pgTable,
    uuid,
    text,
    integer,
    timestamp,
    vector,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm/_relations";

export const resumes = pgTable("resume", {
    id: uuid("id").defaultRandom().primaryKey(),
    fileName: text("file_name").notNull(),
    filePath: text("file_path").notNull(),
    fileHash: text("file_hash").unique().notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    candidateName: text("candidate_name").notNull(),
});

export const resumeChunks = pgTable("resume_chunks", {
    resumeId: uuid("resume_id")
        .notNull()
        .references(() => resumes.id, { onDelete: "cascade" }),
    id: uuid("id").primaryKey(),
    chunkText: text("chunk_text").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    chunkIndex: integer("chunk_index").notNull(),
    startOffset: integer("start_offset").notNull(),
    endOffset: integer("end_offset").notNull(),
    page: integer("page").notNull(),
    redactedText: text("redacted_text").notNull(),
    embedding: vector("embedding", { dimensions: 768 }),
    entryLabel: text("entry_label"),
});

export const resumesRelations = relations(resumes, ({ many }) => ({
    chunks: many(resumeChunks),
}));

export const chunksRelations = relations(resumeChunks, ({ one }) => ({
    resume: one(resumes, {
        fields: [resumeChunks.resumeId],
        references: [resumes.id],
    }),
}));
