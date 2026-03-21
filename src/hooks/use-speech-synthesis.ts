import { useState, useRef, useCallback, useEffect } from "react";

const langMap: Record<string, string> = {
  fr: "fr-FR",
  en: "en-US",
  fon: "fr-FR",
  yoruba: "fr-FR",
};

interface UseSpeechSynthesisOptions {
  lang?: string;
  rate?: number;
  onEnd?: () => void;
}

export function useSpeechSynthesis({ lang = "fr", rate = 1, onEnd }: UseSpeechSynthesisOptions = {}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const isSupported = typeof window !== "undefined" && "speechSynthesis" in window;

  // Clean up markdown for speech: remove **, ##, ---, etc.
  const cleanForSpeech = (text: string): string => {
    return text
      .replace(/#{1,6}\s*/g, "")
      .replace(/\*{1,3}(.*?)\*{1,3}/g, "$1")
      .replace(/_{1,2}(.*?)_{1,2}/g, "$1")
      .replace(/`{1,3}[^`]*`{1,3}/g, "")
      .replace(/---+/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/[✅💡🎯📚✓•]/g, "")
      .replace(/\n{2,}/g, ". ")
      .replace(/\n/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();
  };

  const speak = useCallback((text: string) => {
    if (!isSupported) return;

    window.speechSynthesis.cancel();

    const cleaned = cleanForSpeech(text);
    if (!cleaned) return;

    // Split into chunks (speechSynthesis has limits on long text)
    const chunks = cleaned.match(/[^.!?]+[.!?]+/g) || [cleaned];
    let currentIndex = 0;

    const speakNext = () => {
      if (currentIndex >= chunks.length) {
        setIsSpeaking(false);
        onEnd?.();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(chunks[currentIndex].trim());
      utterance.lang = langMap[lang] || "fr-FR";
      utterance.rate = rate;
      utterance.pitch = 1.05;

      // Try to find a good French voice
      const voices = window.speechSynthesis.getVoices();
      const targetLang = langMap[lang] || "fr-FR";
      const voice = voices.find(v => v.lang === targetLang && v.name.includes("Google")) 
        || voices.find(v => v.lang === targetLang)
        || voices.find(v => v.lang.startsWith(targetLang.split("-")[0]));
      if (voice) utterance.voice = voice;

      utterance.onend = () => {
        currentIndex++;
        speakNext();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    };

    setIsSpeaking(true);
    speakNext();
  }, [isSupported, lang, rate, onEnd]);

  const stop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isSupported]);

  // Preload voices
  useEffect(() => {
    if (isSupported) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, [isSupported]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (isSupported) window.speechSynthesis.cancel();
    };
  }, [isSupported]);

  return { isSpeaking, speak, stop, isSupported };
}
