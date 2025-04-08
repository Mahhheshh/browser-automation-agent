import { cn } from "../lib/utils";
import { MessageAction } from "./MessageAction";

export interface Message {
  role: "agent" | "user";
  content: string;
  timestamp: string;
}

interface MessageItemProps {
  message: Message;
}

export function MessageItem({ message }: MessageItemProps) {
  const isAgent = message.role === "agent";

  return (
    <div
      className={cn(
        "flex gap-2 max-w-[80%]",
        !isAgent && "ml-auto flex-row-reverse"
      )}
    >
      {isAgent && (
        <div className="h-8 w-8 rounded-full bg-primary flex-shrink-0" />
      )}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {isAgent ? "Browser Agent" : "User"}
          </span>
          <span className="text-xs text-muted-foreground">
            {message.timestamp}
          </span>
        </div>
        <div className={cn(
            "p-3 rounded-lg text-sm whitespace-pre-wrap",
             isAgent ? "bg-muted/50" : "bg-blue-100 dark:bg-blue-900"
             )}>
          <p>{message.content}</p>
        </div>
        {isAgent && (
            <MessageAction messageContent={message.content} />
        )}
      </div>
    </div>
  );
}