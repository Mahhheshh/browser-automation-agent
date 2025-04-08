import { Button } from "./ui/button";
import { Copy, ThumbsUp, ThumbsDown } from 'lucide-react';

interface MessageActionsProps {
  messageContent: string;
  onRate?: (rating: 'up' | 'down') => void;
  onCopy?: (content: string) => void;
}

export function MessageAction({ messageContent, onRate, onCopy }: MessageActionsProps) {

  const handleCopy = () => {
    navigator.clipboard.writeText(messageContent)
      .then(() => {
        console.log("Message copied to clipboard");
        if (onCopy) onCopy(messageContent);
      })
      .catch(err => console.error("Failed to copy message: ", err));
  };

  const handleRateUp = () => {
    console.log("Thumbs Up clicked");
    if (onRate) onRate('up');
  };

  const handleRateDown = () => {
    console.log("Thumbs Down clicked");
    if (onRate) onRate('down');
  };

  return (
    <div className="flex items-center gap-2 mt-1">
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopy} title="Copy message">
        <Copy className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleRateUp} title="Good response">
        <ThumbsUp className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleRateDown} title="Bad response">
        <ThumbsDown className="h-4 w-4" />
      </Button>
    </div>
  );
}