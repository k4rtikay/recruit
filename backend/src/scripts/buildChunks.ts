import type { ResumeExtraction } from "../schemas/ai.schema.js";

export type BuiltResumeChunk = {
    chunkIndex: number;
    section: ResumeExtraction["chunks"][number]["section"];
    entryLabel: string | null;
    page: number;
    startOffset: number;
    endOffset: number;
    originalText: string;
};

export type ChunkedResume = {
    candidateName: string | null;
    chunks: BuiltResumeChunk[];
};

export function buildChunks(
    lines: readonly string[],
    extraction: ResumeExtraction,
): ChunkedResume {

    const candidateName = extraction.header.nameLine
        ? (lines[extraction.header.nameLine - 1] ?? null)
        : null;

    const chunks = extraction.chunks.map((chunk, chunkIndex) => {
        const startIndex = chunk.startLine - 1;
        const endIndex = chunk.endLine - 1;
        const originalText = lines.slice(startIndex, endIndex + 1).join("\n");

        return {
            chunkIndex,
            section: chunk.section,
            entryLabel: chunk.entryLabel,
            page: 1,
            startOffset: chunk.startLine,
            endOffset: chunk.endLine,
            originalText,
        };
    });

    return { candidateName, chunks };
}
