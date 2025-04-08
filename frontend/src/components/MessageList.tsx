import { Ref } from "react";
import { ScrollArea } from "./ui/scroll-area";
import { Message, MessageItem } from "./MessageItem";

interface MessageListProps {
    messages: Message[];
    scrollAreaRef: Ref<HTMLDivElement> | undefined;
}

export function MessageList({ messages, scrollAreaRef }: MessageListProps) {
    return (
        <ScrollArea className="flex-1 p-4 h-screen" ref={scrollAreaRef}>
            <div className="space-y-4">
                {messages.length === 0 && (
                    <p className="text-center text-muted-foreground">No messages yet. Start the conversation!</p>
                )}
                {messages.map((message, index) => (
                    <MessageItem key={`message-${index}`} message={message} />
                ))}
            </div>
        </ScrollArea>
    );
}