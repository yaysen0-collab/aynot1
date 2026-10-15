import { useState, useRef, useEffect, useCallback } from 'react';

// SpeechRecognition global types support for TypeScript
interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

// Turkish punctuation and voice command parser
export function processTurkishSpeechCommands(rawText: string): string {
  if (!rawText) return '';

  let text = rawText;

  // Replacements for Turkish punctuation words (case-insensitive)
  // "yeni satır" / "satır başı"
  text = text.replace(/(?:^|\s+)(?:yeni satır|satır başı)(?:\s+|$)/gi, '\n');

  // "soru işareti"
  text = text.replace(/(?:^|\s+)soru işareti(?:\s+|$)/gi, '? ');

  // "ünlem işareti" / "ünlem"
  text = text.replace(/(?:^|\s+)(?:ünlem işareti|ünlem)(?:\s+|$)/gi, '! ');

  // "iki nokta"
  text = text.replace(/(?:^|\s+)iki nokta(?:\s+|$)/gi, ': ');

  // "nokta"
  text = text.replace(/(?:^|\s+)nokta(?:\s+|$)/gi, '. ');

  // "virgül"
  text = text.replace(/(?:^|\s+)virgül(?:\s+|$)/gi, ', ');

  // Clean up formatting: remove space before punctuation marks
  text = text.replace(/\s+([.,!?:])/g, '$1');

  // Capitalize letter following a period, exclamation, question mark or newline
  text = text.replace(/([.!?\n]\s*)([a-zçğışöü])/gu, (_match, p1, p2) => {
    return p1 + p2.toLocaleUpperCase('tr-TR');
  });

  return text;
}

interface UseSpeechRecognitionOptions {
  onTranscript: (formattedText: string) => void;
  lang?: string;
}

export function useSpeechRecognition({
  onTranscript,
  lang = 'tr-TR',
}: UseSpeechRecognitionOptions) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorGuide, setErrorGuide] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const isManuallyStoppedRef = useRef(false);
  const onTranscriptRef = useRef(onTranscript);

  onTranscriptRef.current = onTranscript;

  const isSupported = typeof window !== 'undefined' && !!(
    (window as unknown as IWindow).SpeechRecognition ||
    (window as unknown as IWindow).webkitSpeechRecognition
  );

  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognitionAPI =
      (window as unknown as IWindow).SpeechRecognition ||
      (window as unknown as IWindow).webkitSpeechRecognition;

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      let finalSegment = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalSegment += event.results[i][0].transcript + ' ';
        }
      }

      if (finalSegment.trim()) {
        const formatted = processTurkishSpeechCommands(finalSegment);
        onTranscriptRef.current(formatted);
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('SpeechRecognition error:', event.error);
      if (event.error === 'not-allowed') {
        setError('Mikrofon erişim izni verilmedi.');
        setErrorGuide(
          'Tarayıcınızın adres çubuğundaki kilit / ayarlar simgesine dokunarak Mikrofon iznini "İzin Ver" olarak değiştirin.'
        );
        setIsListening(false);
      } else if (event.error === 'network') {
        setError('Konuşma tanıma için internet bağlantısı gerekebilir.');
        setErrorGuide(
          'İnternet bağlantınızı kontrol edebilir veya klavye ile yazarak not almaya kesintisiz devam edebilirsiniz.'
        );
        setIsListening(false);
      } else if (event.error === 'no-speech') {
        // Just silent pause, keep listening or allow restart
      } else {
        setError(`Ses tanıma uyarısı: ${event.error}`);
        setErrorGuide(null);
      }
    };

    recognition.onend = () => {
      // If user hasn't pressed stop, restart recognition automatically for continuous talking
      if (!isManuallyStoppedRef.current && recognitionRef.current) {
        try {
          recognitionRef.current.start();
          return;
        } catch {
          // If restart fails, set isListening false
        }
      }
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      isManuallyStoppedRef.current = true;
      try {
        recognition.abort();
      } catch {
        // ignore
      }
    };
  }, [isSupported, lang]);

  const startListening = useCallback(() => {
    setError(null);
    setErrorGuide(null);

    if (!isSupported) {
      setError('Tarayıcınız sesle yazmayı (Web Speech API) desteklemiyor.');
      setErrorGuide(
        'Chrome, Edge veya Safari tarayıcısını kullanarak sesle not alabilirsiniz.'
      );
      return;
    }

    if (!recognitionRef.current) return;

    isManuallyStoppedRef.current = false;
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (err: any) {
      // If already started
      if (err?.name === 'InvalidStateError') {
        setIsListening(true);
      } else {
        setError('Mikrofon başlatılamadı.');
      }
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    isManuallyStoppedRef.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsListening(false);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    setErrorGuide(null);
  }, []);

  return {
    isListening,
    isSupported,
    error,
    errorGuide,
    startListening,
    stopListening,
    clearError,
  };
}
