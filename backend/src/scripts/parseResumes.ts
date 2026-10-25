import { getDocumentProxy } from "unpdf";
import path from "node:path";
import fs from "node:fs/promises";
import { extractResumeStructure } from "../services/ai.service.js";
import { buildChunks } from "./buildChunks.js";
import { validateExtraction } from "./validateExtraction.js";

type PdfTextItem = {
    str?: string;
    transform?: number[];
};

type PositionedText = {
    text: string;
    x: number;
    y: number;
};

const defaultResumePath = path.join(
    import.meta.dirname,
    "../../storage/resumes/sample-1.pdf",
);
const lineYTolerance = 2;

function normalizeWhitespace(text: string) {
    return text.replace(/\s+/g, " ").trim();
}

function groupItemsByLine(items: PositionedText[]) {
    const sortedItems = [...items].sort((first, second) => {
        if (Math.abs(first.y - second.y) > lineYTolerance) {
            return second.y - first.y;
        }

        return first.x - second.x;
    });

    const groupedLines: PositionedText[][] = [];

    for (const item of sortedItems) {
        const currentLine = groupedLines[groupedLines.length - 1];
        const currentLineY = currentLine?.[0]?.y;

        if (
            currentLine &&
            currentLineY !== undefined &&
            Math.abs(currentLineY - item.y) <= lineYTolerance
        ) {
            currentLine.push(item);
        } else {
            groupedLines.push([item]);
        }
    }

    return groupedLines;
}

function mergeStrayCharacters(lines: string[]) {
    const mergedLines: string[] = [];

    for (const line of lines) {
        const normalizedLine = normalizeWhitespace(line);

        if (!normalizedLine) {
            continue;
        }

        const previousLineIndex = mergedLines.length - 1;
        const isStrayCharacter = /^[a-z0-9]$/i.test(normalizedLine);

        if (isStrayCharacter && previousLineIndex >= 0) {
            mergedLines[previousLineIndex] += normalizedLine;
        } else {
            mergedLines.push(normalizedLine);
        }
    }

    return mergedLines;
}

export async function parseResume(
    filePath = defaultResumePath,
): Promise<string[]> {
    const buffer = await fs.readFile(filePath);
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const resumeLines: string[] = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        const content = await page.getTextContent();

        const positionedText = content.items
            .map((item) => item as PdfTextItem)
            .map((item) => ({
                text: normalizeWhitespace(item.str ?? ""),
                x: item.transform?.[4] ?? 0,
                y: item.transform?.[5] ?? 0,
            }))
            .filter((item) => item.text.length > 0);

        const pageLines = groupItemsByLine(positionedText).map((lineItems) =>
            normalizeWhitespace(
                lineItems
                    .sort((first, second) => first.x - second.x)
                    .map((item) => item.text)
                    .join(" "),
            ),
        );

        resumeLines.push(...pageLines);
    }

    return mergeStrayCharacters(resumeLines);
}

export async function run(filePath = defaultResumePath) {
    const lines = await parseResume(filePath);
    const numberedResume = lines
        .map((line, index) => `${index + 1}. ${line}`)
        .join("\n");

    const extraction = await extractResumeStructure(numberedResume);

    if (!extraction) {
        return null;
    }

    const validation = validateExtraction(lines, extraction);

    if (!validation.valid) {
        console.error("Resume extraction contains invalid line ranges:", {
            checks: validation.checks,
            errors: validation.errors,
        });
        return null;
    }

    return buildChunks(lines, extraction);
}

run()
    .then((chunkedResume) => {
        if (chunkedResume) {
            console.dir(chunkedResume, { depth: null });
        }
    })
    .catch((error) => console.error("Failed to process resume:", error));
