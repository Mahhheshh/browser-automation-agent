import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { isAIMessageChunk } from "@langchain/core/messages";
// import { HumanMessage } from "@langchain/core/messages";
import { config } from "dotenv";

import { AgentBrowser, createBrowserTools, SYSTEM_PROMPT } from "./agent";

config();

const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.0-flash",
  maxOutputTokens: 2048,
  apiKey: process.env.GOOGLE_API_KEY,
});

const browser = new AgentBrowser({ channel: "chrome", headless: false });
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
    {
      role: "user",
      content:
        "Hey, there is this user named Mahhheshh on the github, find how many repos he have, also list the repos down",
    },
    // {
    //   role: "user",
    //   content: "Crustdata is a yc backed startup, I am not sure have then been funded after graduating from the yc, could you find me their seed rounds"
    // }
    // {
    //   role: "user",
    //   content:
    //     "Go on youtube, and tell play latest video of mr beast, and tell me stats for the video, such as views, likes.",
    // },
  ],
};

(async () => {
  const stream = await agent.stream(input, {
    recursionLimit: 50,
    streamMode: "messages",
  });

  for await (const [message, _metadata] of stream) {
    if (isAIMessageChunk(message) && message.tool_call_chunks?.length) {
      console.log(
        `${message.getType()} MESSAGE TOOL CALL CHUNK: ${
          message.tool_call_chunks[0].args
        }`
      );
    } else {
      console.log(`${message.getType()} MESSAGE CONTENT: ${message.content}`);
    }
  }
})();
