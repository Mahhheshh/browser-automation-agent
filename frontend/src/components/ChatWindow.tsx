import { useEffect, useState, useCallback, useRef } from "react";
import { useWS, WSPayload } from "./wsProvider";
import { Message } from "./MessageItem";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";

export function ChatWindow() {
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [isAgentResponding, setIsAgentResponding] = useState(false);
    const { isConnected, sendMessage, subscribe, unsubscribe } = useWS();
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    const addOrUpdateMessage = useCallback((newMessage: Message) => {
        setMessages(prevMessages => {
            const lastMessage = prevMessages.length > 0 ? prevMessages[prevMessages.length - 1] : null;
            if (newMessage.role === 'agent' && lastMessage?.role === 'agent') {
                const updatedMessages = [...prevMessages];
                updatedMessages[prevMessages.length - 1] = {
                    ...lastMessage,
                    content: lastMessage.content + newMessage.content,
                    timestamp: newMessage.timestamp
                };
                return updatedMessages;
            } else {
                return [...prevMessages, newMessage];
            }
        });
    }, []);

    const handleSendMessage = useCallback(() => {
        if (!input.trim() || !isConnected) {
            console.warn("Cannot send message: Input is empty or WebSocket is not connected.");
            return;
        }

        const userMessage: Message = {
            role: "user",
            content: input.trim(),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
        };

        setMessages((prevMessages) => [...prevMessages, userMessage]);
        sendMessage(JSON.stringify({ message: input.trim() }));
        setInput("");
        setIsAgentResponding(true);
    }, [input, isConnected, sendMessage]);

    const handleWebSocketMessage = useCallback(
        (payload: WSPayload) => {
            try {
                const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

                switch (payload.type) {
                    case "ai":
                        if (payload.content) {
                            const agentMessageChunk: Message = {
                                role: "agent",
                                content: payload.content,
                                timestamp: timestamp,
                            };
                            addOrUpdateMessage(agentMessageChunk);
                            setIsAgentResponding(true);
                        }
                        break;

                    case "tool":
                        console.log(`Tool Used: ${payload.name || 'Unknown Tool'}`, payload.content);
                        addOrUpdateMessage({
                            role: "agent",
                            content: `Using tool: ${payload.name || 'Tool'}...`,
                            timestamp: timestamp,
                        });
                        break;

                    case "end":
                        console.log("End of stream received");
                        setIsAgentResponding(false);
                        break;

                    case "error":
                        console.error("WebSocket error payload:", payload.message);
                        addOrUpdateMessage({
                            role: "agent",
                            content: `An error occurred: ${payload.message || 'Unknown error'}`,
                            timestamp: timestamp,
                        });
                        setIsAgentResponding(false);
                        break;

                    case "screenshot":
                        break;

                    default:
                        console.warn("ChatWindow received unhandled WebSocket message type:", payload);
                }
            } catch (error) {
                console.error("ChatWindow failed to handle WebSocket payload:", error);
                setIsAgentResponding(false);
            }
        },
        [addOrUpdateMessage]
    );

    useEffect(() => {
        subscribe(handleWebSocketMessage);

        return () => {
            unsubscribe(handleWebSocketMessage);
        };
    }, [subscribe, unsubscribe, handleWebSocketMessage]);

    useEffect(() => {
        if (scrollAreaRef.current) {
            requestAnimationFrame(() => {
                if (scrollAreaRef.current) {
                    scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
                }
            });
        }
    }, [messages]);

    return (
        <div className="flex flex-1 flex-col h-full max-h-full overflow-hidden bg-card">
            <MessageList messages={messages} scrollAreaRef={scrollAreaRef} />
            <ChatInput
                input={input}
                onInputChange={setInput}
                onSendMessage={handleSendMessage}
                placeholder="Ask the agent anything..."
                isDisabled={isAgentResponding || !isConnected}
            />
        </div>
    );
}