import { serverEnv } from "@/data/env/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

export const google = createGoogleGenerativeAI({
    apiKey: serverEnv.GEMINI_API_KEY,
})