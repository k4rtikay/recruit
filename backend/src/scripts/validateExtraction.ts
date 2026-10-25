import type { ResumeExtraction } from "../schemas/ai.schema.js";

export type ExtractionValidationResult = {
    valid: boolean;
    checks: {
        lineNumbersExist: boolean;
        chunksDoNotOverlap: boolean;
        chunkRangesAreChronological: boolean;
    };
    errors: string[];
};

export function validateExtraction(
    lines: readonly string[],
    extraction: ResumeExtraction,
): ExtractionValidationResult {
    const errors: string[] = [];
    const referencedLines = [
        extraction.header.nameLine,
        extraction.header.startLine,
        extraction.header.endLine,
        ...extraction.headingLines,
        ...extraction.chunks.flatMap((chunk) => [
            chunk.startLine,
            chunk.endLine,
        ]),
    ].filter((lineNumber): lineNumber is number => lineNumber !== null);

    const missingLineNumbers = [
        ...new Set(
            referencedLines.filter(
                (lineNumber) => lineNumber < 1 || lineNumber > lines.length,
            ),
        ),
    ].sort((first, second) => first - second);
    const lineNumbersExist = missingLineNumbers.length === 0;

    if (!lineNumbersExist) {
        errors.push(
            `Extraction references line numbers that do not exist: ${missingLineNumbers.join(", ")}`,
        );
    }

    const reversedChunkIndexes = extraction.chunks
        .map((chunk, index) => ({ chunk, index }))
        .filter(({ chunk }) => chunk.startLine > chunk.endLine)
        .map(({ index }) => index);
    const chunkRangesAreChronological = reversedChunkIndexes.length === 0;

    if (!chunkRangesAreChronological) {
        errors.push(
            `Chunks have start lines after their end lines: ${reversedChunkIndexes.join(", ")}`,
        );
    }

    const overlappingPairs: string[] = [];

    for (let firstIndex = 0; firstIndex < extraction.chunks.length; firstIndex += 1) {
        const firstChunk = extraction.chunks[firstIndex];

        if (!firstChunk || firstChunk.startLine > firstChunk.endLine) {
            continue;
        }

        for (
            let secondIndex = firstIndex + 1;
            secondIndex < extraction.chunks.length;
            secondIndex += 1
        ) {
            const secondChunk = extraction.chunks[secondIndex];

            if (!secondChunk || secondChunk.startLine > secondChunk.endLine) {
                continue;
            }

            const rangesOverlap =
                firstChunk.startLine <= secondChunk.endLine &&
                secondChunk.startLine <= firstChunk.endLine;

            if (rangesOverlap) {
                overlappingPairs.push(`${firstIndex} and ${secondIndex}`);
            }
        }
    }

    const chunksDoNotOverlap = overlappingPairs.length === 0;

    if (!chunksDoNotOverlap) {
        errors.push(`Overlapping chunk indexes: ${overlappingPairs.join(", ")}`);
    }

    return {
        valid:
            lineNumbersExist &&
            chunksDoNotOverlap &&
            chunkRangesAreChronological,
        checks: {
            lineNumbersExist,
            chunksDoNotOverlap,
            chunkRangesAreChronological,
        },
        errors,
    };
}
