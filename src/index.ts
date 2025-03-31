import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { isAIMessageChunk, isToolMessageChunk } from "@langchain/core/messages";
import { config } from "dotenv";

import { StealthBrowser, createBrowserTools, SYSTEM_PROMPT } from "./agent";

config();

const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.0-flash",
  maxOutputTokens: 2048,
  apiKey: process.env.GOOGLE_API_KEY,
});

const browser = new StealthBrowser({ channel: "chrome", headless: false });
const broswerTools = createBrowserTools(browser);

const agent = createReactAgent({
  llm: model,
  tools: broswerTools,
});

const input = {
  messages: [
    {
      role: "system",
      content: SYSTEM_PROMPT,
    },
    // {
    //   role: "user",
    //   content:
    //     "what is Crustdata and who are the founders",
    // },
    // {
    //   role: "user",
    //   content:
    //     "There is this user named Mahhheshh on the github, find how many repos he have, also list the repos down",
    // },
    {
      role: "user",
      content:
        "Go on youtube, and tell play latest video of mr beast, and tell me stats for the video, such as views, likes.",
    },
  ],
};

(async () => {
  const stream = await agent.stream(input, {
    recursionLimit: 50,
    streamMode: "messages",
  });

  for await (const [message, _metadata] of stream) {
    if (isAIMessageChunk(message)) {
      console.log(`${message.getType()}: Content: ${message.content}`);
    } else if (isToolMessageChunk(message)) {
      console.log(`${message.getType()}: Content: ${message.name}`);
    }
  }
})();
