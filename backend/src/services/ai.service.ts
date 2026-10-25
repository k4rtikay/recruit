import { Groq } from "groq-sdk";
import { ResumeExtractionSchema } from "../schemas/ai.schema.js";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

const SYSTEM_PROMPT = `
You are a deterministic data extraction engine for resume parsing.
You will receive a resume where every line is prefixed with a line number (e.g., "1. text").
Line numbers begin at 1.

Your tasks:
1. Identify the header block containing the candidate's name and contact details.
2. Identify the line number containing the candidate's full name, or use null if none can be identified.
3. Extract the line numbers of structural section headings such as EXPERIENCE, EDUCATION, PROJECTS, and SKILLS.
4. Group the remaining text into logical chunks (experience, education, projects, skills, summary, or other).
5. Identify the inclusive start and end line numbers for each chunk.
6. EXCLUDE structural section headings from chunk bounds. Each chunk should contain only the substantive entry content.

You must respond ONLY with a valid JSON object matching this exact schema, with no markdown formatting or conversational text:
{
  "header": {
    "nameLine": "Number | null",
    "startLine": "Number",
    "endLine": "Number"
  },
  "headingLines": ["Number"],
  "chunks": [
    {
      "section": "experience | education | projects | skills | summary | other",
      "entryLabel": "String | null",
      "startLine": "Number",
      "endLine": "Number"
    }
  ]
}

All line numbers must be integers greater than or equal to 1.
`;

export async function extractResumeStructure(numberedText: string) {
    const response = await groq.chat.completions.create({
        messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: numberedText },
        ],
        model: "openai/gpt-oss-120b",
        temperature: 0, // 0 guarantees deterministic, repeatable outputs
        response_format: { type: "json_object" },
    });

    const rawJson = response.choices[0]?.message?.content;

    if (!rawJson) {
        throw new Error("Groq returned an empty response");
    }

    const validationResult = ResumeExtractionSchema.safeParse(
        JSON.parse(rawJson),
    );

    if (!validationResult.success) {
        console.error(
            "Groq response failed resume schema validation:",
            validationResult.error,
        );
        return null;
    }

    return validationResult.data;
}
