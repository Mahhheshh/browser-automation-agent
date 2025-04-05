import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import {
  HumanMessage,
  isAIMessageChunk,
  isToolMessageChunk,
  SystemMessage,
  ToolMessageChunk,
} from "@langchain/core/messages";
import { config } from "dotenv";

import { StealthBrowser, createBrowserTools, SYSTEM_PROMPT } from "./agent";
import { z } from "zod";

config();

const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.0-flash",
  maxOutputTokens: 2048,
  apiKey: process.env.GOOGLE_API_KEY,
});

const browser = new StealthBrowser({ headless: false, args: ["--no-sandbox"] });
const broswerTools = createBrowserTools(browser);

const responseFormatter = z.object({
  answer: z.string().describe("The answer to the user's question"),
  followup_question: z
    .string()
    .describe("A follow-up question the user could ask"),
});

const agent = createReactAgent({
  llm: model,
  tools: broswerTools,
  responseFormat: responseFormatter,
});

const input = {
  messages: [
    new SystemMessage(SYSTEM_PROMPT),
    // new HumanMessage(
    //   "what is Crustdata and who are the founders, and tell me about funding they have recived via the seed rounds"
    // ),
    // new HumanMessage("There is this user named Mahhheshh on the github, find how many repos he have, also list the repos down"),
    new HumanMessage(
      "Go on youtube, and play latest video of mr beast, and tell me stats for the video, such as views, likes."
    ),
    // new HumanMessage("Go on youtube and sign in, use email my email is biscuit1000m@gmail.com and password is password, please dont click on sign in just fill in the details")
  ],
};

(async () => {
  const stream = await agent.stream(input, {
    recursionLimit: 50,
    streamMode: "messages",
  });

  for await (const [message, _metadata] of stream) {
    if (isAIMessageChunk(message)) {
      console.log(`${message.getType()} Content: ${message.content}`);
    } else if (isToolMessageChunk(message)) {
      const toolMessage = message as ToolMessageChunk;
      console.log(
        `${toolMessage.getType()} Name: ${toolMessage.name}, Content: ${
          toolMessage.content
        }`
      );
    }
  }
})();
