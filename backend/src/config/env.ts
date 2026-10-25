import { z } from "zod";
import dotenv from "dotenv";
dotenv.config();

export const envSchema = z.object({
    NODE_ENV: z
        .enum(["development", "production", "test"])
        .default("development"),
    PORT: z.coerce.number().default(5000),
    DATABASE_URL: z.string().url("Must be a valid connection string"),
    GROQ_API_KEY_RESUME_PARSER: z.string().min(1, "Groq API key is required"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
    throw new Error(
        `Invalid environment variables:\n${JSON.stringify(parsedEnv.error.format(), null, 2)}`,
    );
}

export type Env = z.infer<typeof envSchema>;
export const env = parsedEnv.data;
