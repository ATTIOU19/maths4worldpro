import { useState, useRef, useCallback, useEffect } from "react";

// Extend Window for webkit prefix
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface UseSpeechRecognitionOptions {
  lang?: string;
  onResult?: (transcript: string) => void;
  onEnd?: () => void;
}

// Map our langue codes to BCP-47 for Web Speech API
const langMap: Record<string, string> = {
  fr: "fr-FR",
  en: "en-US",
  fon: "fr-FR", // fallback
  yoruba: "yo-NG",
};

export function useSpeechRecognition({ lang = "fr", onResult, onEnd }: UseSpeechRecognitionOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SR);
  }, []);

  const start = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.lang = langMap[lang] || "fr-FR";
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      if (finalTranscript) {
        onResult?.(finalTranscript);
        setInterim("");
      } else {
        setInterim(interimTranscript);
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      setInterim("");
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterim("");
      onEnd?.();
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [lang, onResult, onEnd]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
    setInterim("");
  }, []);

  const toggle = useCallback(() => {
    if (isListening) {
      stop();
    } else {
      start();
    }
  }, [isListening, start, stop]);

  return { isListening, interim, isSupported, start, stop, toggle };
}
