import { useState } from "react";
import ChatInterface from "@/components/chat/ChatInterface";
import VoiceInterface from "@/components/voice/VoiceInterface";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceInput, setVoiceInput] = useState<string>("");
  const { toast } = useToast();

  const handleVoiceInput = (text: string) => {
    setVoiceInput(text);
    // Reset after processing
    setTimeout(() => setVoiceInput(""), 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-dark-red/10 relative overflow-hidden">
      {/* Animated background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-crimson-glow/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] animate-pulse delay-1000" />
      </div>

      {/* Main content */}
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-crimson via-primary to-crimson-glow bg-clip-text text-transparent animate-pulse">
            Lucifer's AI
          </h1>
          <p className="text-muted-foreground">Your personal AI assistant</p>
        </div>

        {/* Chat Interface */}
        <ChatInterface 
          isSpeaking={isSpeaking} 
          setIsSpeaking={setIsSpeaking} 
          voiceInput={voiceInput}
        />

        {/* Voice Interface */}
        <VoiceInterface 
          isSpeaking={isSpeaking} 
          setIsSpeaking={setIsSpeaking}
          onVoiceInput={handleVoiceInput}
        />
      </div>
    </div>
  );
};

export default Index;
