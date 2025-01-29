import OpenAI from "openai";
import { success } from "@service/logging";

const normalOpenAi = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  //baseURL: "https://oai.helicone.ai/v1",
  //defaultHeaders: {
  //  "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
  //},
});

success(`Using OpenAI API key: ${process.env.OPENAI_API_KEY}`);

export const openai = normalOpenAi;
