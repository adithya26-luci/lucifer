import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Volume2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface VoiceInterfaceProps {
  isSpeaking: boolean;
  setIsSpeaking: (speaking: boolean) => void;
  onVoiceInput: (text: string) => void;
}

const VoiceInterface = ({ isSpeaking, setIsSpeaking, onVoiceInput }: VoiceInterfaceProps) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = "en-US";

      recognitionInstance.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        console.log("Speech recognized:", transcript);
        
        // Pass the recognized text to the parent component
        onVoiceInput(transcript);
        
        toast({
          title: "Voice recognized",
          description: transcript,
        });
      };

      recognitionInstance.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        toast({
          title: "Voice input error",
          description: "Failed to recognize speech. Please try again.",
          variant: "destructive",
        });
        setIsListening(false);
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }
  }, [toast]);

  const toggleListening = () => {
    if (!recognition) {
      toast({
        title: "Not supported",
        description: "Speech recognition is not supported in your browser.",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
      toast({
        title: "Listening...",
        description: "Speak now",
      });
    }
  };

  const stopSpeaking = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4">
      {/* Voice Input Button */}
      <Button
        onClick={toggleListening}
        size="lg"
        className={cn(
          "rounded-full h-16 w-16 shadow-glow transition-all",
          isListening
            ? "bg-gradient-to-r from-crimson to-primary animate-pulse"
            : "bg-secondary/80 backdrop-blur-sm hover:bg-secondary"
        )}
      >
        {isListening ? (
          <MicOff className="w-6 h-6" />
        ) : (
          <Mic className="w-6 h-6" />
        )}
      </Button>

      {/* Stop Speaking Button */}
      {isSpeaking && (
        <Button
          onClick={stopSpeaking}
          size="lg"
          variant="secondary"
          className="rounded-full h-14 w-14 animate-pulse"
        >
          <Volume2 className="w-5 h-5" />
        </Button>
      )}
    </div>
  );
};

export default VoiceInterface;
