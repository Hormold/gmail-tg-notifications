import { HeliconeProxyOpenAI as HeliconeOpenAI } from "@helicone/helicone";
import OpenAI from "openai";

const proxyOpenAi = new HeliconeOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  heliconeMeta: {
    apiKey: process.env.HELICONE_API_KEY,
  },
});

const normalOpenAi = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const openai = process.env.HELICONE_API_KEY ? proxyOpenAi : normalOpenAi;
