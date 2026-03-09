import { useState, useRef, useCallback, useEffect } from "react";

interface SpeechRecognitionType extends EventTarget {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event & { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

interface UseSpeechRecognitionOptions {
  lang?: string;
  onResult?: (transcript: string) => void;
  onEnd?: () => void;
}

const langMap: Record<string, string> = {
  fr: "fr-FR",
  en: "en-US",
  fon: "fr-FR",
  yoruba: "yo-NG",
};

function getSR(): (new () => SpeechRecognitionType) | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function useSpeechRecognition({ lang = "fr", onResult, onEnd }: UseSpeechRecognitionOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionType | null>(null);

  useEffect(() => {
    setIsSupported(!!getSR());
  }, []);

  const start = useCallback(() => {
    const SR = getSR();
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
      console.error("Speech recognition error:", (event as any).error);
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
    if (isListening) stop();
    else start();
  }, [isListening, start, stop]);

  return { isListening, interim, isSupported, start, stop, toggle };
}
