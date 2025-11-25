import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatMessageProps {
  message: Message;
}

const ChatMessage = ({ message }: ChatMessageProps) => {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3 shadow-md transition-all hover:shadow-lg",
          isUser
            ? "bg-gradient-to-br from-primary to-crimson text-primary-foreground ml-12"
            : "bg-card/80 backdrop-blur-sm border border-border/30 mr-12"
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <span className="text-xs opacity-60 mt-1 block">
          {message.timestamp.toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
};

export default ChatMessage;
