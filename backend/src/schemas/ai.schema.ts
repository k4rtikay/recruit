import { z } from "zod";

const lineNo = z.number().int().min(1);

export const ResumeExtractionSchema = z.object({
    header: z
        .object({
            nameLine: lineNo
                .nullable()
                .describe(
                    "Line number containing the candidate's full name, or null if none",
                ),
            startLine: lineNo.describe(
                "First line of the header block (name and contact details)",
            ),
            endLine: lineNo.describe(
                "Last line of the header block, inclusive",
            ),
        })
        .describe("The identity block at the top of the resume"),

    headingLines: z
        .array(lineNo)
        .describe(
            "Line numbers of section headings such as EXPERIENCE or EDUCATION",
        ),

    chunks: z.array(
        z.object({
            section: z.enum([
                "experience",
                "education",
                "projects",
                "skills",
                "summary",
                "other",
            ]),
            entryLabel: z
                .string()
                .nullable()
                .describe(
                    "Company, school, or project name exactly as written in the entry, or null if the section has no named entries",
                ),
            startLine: lineNo.describe(
                "First line of the entry, as numbered in the input, inclusive",
            ),
            endLine: lineNo.describe(
                "Last line of the entry, as numbered in the input, inclusive",
            ),
        }),
    ),
});

export type ResumeExtraction = z.infer<typeof ResumeExtractionSchema>;
