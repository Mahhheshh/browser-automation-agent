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
import WebSocket, { WebSocketServer } from "ws";
import http from "http";

import { StealthBrowser, createBrowserTools, SYSTEM_PROMPT } from "./agent";

config();

const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.0-flash",
  maxOutputTokens: 2048,
  apiKey: process.env.GOOGLE_API_KEY,
});

const PORT = process.env.PORT || 8080;
const server = http.createServer();
const wss = new WebSocketServer({ server });

const agentClients = new Map<
  WebSocket,
  { agent: ReturnType<typeof createReactAgent>; browser: StealthBrowser }
>();

wss.on("connection", async (ws: WebSocket) => {
  console.log("Client connected");

  const browser = new StealthBrowser({
    headless: false,
    args: ["--no-sandbox"],
  });
  const broswerTools = createBrowserTools(browser);

  const agent = createReactAgent({
    llm: model,
    tools: broswerTools,
  });

  const sendScreenshot = async () => {
    if (ws.readyState !== WebSocket.OPEN) {
      return;
    }
    try {
      const data = await browser.captureScreenShot();
      if (data === "") return;
      console.log("sending data");
      ws.send(data);
    } catch (error) {
      console.error("Failed to capture or send screenshot:", error);
    }
  };

  agentClients.set(ws, { agent, browser });
  setInterval(sendScreenshot, 1000);

  ws.on("message", async (message) => {
    const parsedMessage = JSON.parse(message.toString());
    console.log(JSON.stringify(parsedMessage, null, 2));
    const input = {
      messages: [
        new SystemMessage(SYSTEM_PROMPT),
        new HumanMessage(parsedMessage.message),
      ],
    };

    try {
      const stream = await agent.stream(input, {
        recursionLimit: 50,
        streamMode: "messages",
      });

      for await (const [chunk, _metadata] of stream) {
        if (ws.readyState === WebSocket.OPEN) {
          if (isAIMessageChunk(chunk)) {
            console.log(`ai content: ${chunk.content}`);
            ws.send(JSON.stringify({ type: "ai", content: chunk.content }));
          } else if (isToolMessageChunk(chunk)) {
            const toolMessage = chunk as ToolMessageChunk;
            ws.send(
              JSON.stringify({
                type: "tool",
                name: toolMessage.name,
                content: toolMessage.content,
              })
            );
          }
        }
      }
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "end" }));
      }
    } catch (error) {
      console.error("Error processing message:", error);
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: "error",
            message: "Error processing your request.",
          })
        );
      }
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    const clientData = agentClients.get(ws);
    if (clientData?.browser) {
      clientData.browser.close_browser();
    }
    agentClients.delete(ws);
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
    agentClients.delete(ws);
  });
});

server.listen(PORT, () => {
  console.log(`WebSocket server listening on port ${PORT}`);
});
