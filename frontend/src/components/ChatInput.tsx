import React from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Send } from 'lucide-react';

interface ChatInputProps {
  input: string;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  placeholder?: string;
  isDisabled?: boolean;
}

export function ChatInput({
  input,
  onInputChange,
  onSendMessage,
  placeholder = "Type a message...",
  isDisabled = false
}: ChatInputProps) {

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (!isDisabled && input.trim()) {
        onSendMessage();
      }
    }
  };

  const handleSendClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
       if (!isDisabled && input.trim()) {
           onSendMessage();
       }
  }

  return (
    <div className="p-4 border-t bg-background">
      <div className="flex items-end gap-2">
        <Textarea
          placeholder={placeholder}
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="min-h-[44px] max-h-32 flex-1 resize-none"
          rows={1}
          disabled={isDisabled}
        />
        <Button
            className="px-4 h-[44px]"
            onClick={handleSendClick}
            disabled={isDisabled || !input.trim()}
        >
          <Send className="h-4 w-4 mr-2 sm:mr-0" />
          <span className="hidden sm:inline">Send</span>
        </Button>
      </div>
    </div>
  );
}