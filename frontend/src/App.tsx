import React, { useEffect, useState, useCallback, useRef } from "react"
import { Button } from "./components/ui/button"
import { Textarea } from "./components/ui/textarea"
import { ScrollArea } from "./components/ui/scroll-area"
import { Copy, ThumbsUp, ThumbsDown } from 'lucide-react'
import { cn } from "./lib/utils"

import './App.css'
import { useWS } from "./components/wsProvider"

interface Message {
  role: "agent" | "user"
  content: string
  timestamp: string
}

type AgentMessage = {
  type: "text" | "tool"
  content: string
}

interface WSPayload {
  type: "ai" | "tool" | "end" | "error";
  content?: string;
  name?: string;
  message?: string;
}

function App() {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const ws = useWS();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const handleSend = useCallback(
    (event: React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLTextAreaElement>) => {
      event.stopPropagation();

      ws.sendMessage(JSON.stringify({ message: input }));

      setMessages((prevMessages) => [
        ...prevMessages,
        {
          role: "user",
          content: input,
          timestamp: new Date().toTimeString().slice(1, 4),
        },
      ]);

      setInput("");
    },
    [input, ws]
  );

  const handleWebSocketMessage = useCallback(
    (event: MessageEvent) => {
      const payload: WSPayload = JSON.parse(event.data);

      if (payload.type === "ai") {
        setMessages((prevMessages) => {
          const lastMessage = prevMessages.length > 0 ? prevMessages[prevMessages.length - 1] : null;
          if (lastMessage?.role === "agent") {
            const updatedMessages = [...prevMessages];
            updatedMessages[prevMessages.length - 1] = {
              ...lastMessage,
              content: lastMessage.content + (payload.content ?? ""),
            };
            return updatedMessages;
          } else {
            return [
              ...prevMessages,
              {
                role: "agent",
                content: payload.content ?? "",
                timestamp: new Date().toLocaleTimeString().slice(1, 4),
              },
            ];
          }
        });
      }
      else if (payload.type === "end") {
        console.log("End of stream");
      } else if (payload.type === "error") {
        console.error("WebSocket error:", payload.message);
      }
    },
    []
  );

  useEffect(() => {
    if (!ws.ws) {
      return;
    }

    ws.ws.onmessage = handleWebSocketMessage;

    return () => {
      if (ws.ws) {
        ws.ws.onmessage = null;
      }
    };
  }, [ws.ws, handleWebSocketMessage]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col">
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={`message-${index}`}
              className={cn(
                "flex gap-2 max-w-[80%]",
                message.role === "user" && "ml-auto flex-row-reverse"
              )}
            >
              {message.role === "agent" && (
                <div className="h-8 w-8 rounded-full bg-primary flex-shrink-0" />
              )}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {message.role === "agent" ? "GenerativeAgent" : "User"}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {message.timestamp}
                  </span>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
                {message.role === "agent" && (
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ThumbsUp className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ThumbsDown className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Textarea
            placeholder="Type a message as a customer"
            value={input}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
            className="min-h-[44px] max-h-32"
          />
          <Button className="px-8" onClick={handleSend}>Send</Button>
        </div>
      </div>
    </div>
  )
}

export default App
