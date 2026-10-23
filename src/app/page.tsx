"use client";

import { useState, useRef } from "react";
import {
  ShieldAlert,
  Send,
  Activity,
  Zap,
  CheckCircle2,
  Terminal,
  Layers,
  Play,
  Mic,
  MicOff,
  Image as ImageIcon,
  X,
  Volume2,
  VolumeX,
  ClipboardPaste,
  Sparkles,
  Globe2,
} from "lucide-react";

interface ActionCard {
  heading: string;
  detail: string;
  action: string;
}

interface AnalysisResult {
  title: string;
  overview: string;
  priorityLevel: string;
  cards: ActionCard[];
  executionPlan: string[];
  languageCode?: string;
}

// Background Automatic Image Compression Helper (< 200 KB instant optimization)
const compressImage = (
  base64Str: string,
  maxWidth = 1024,
  maxHeight = 1024,
): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.75));
    };
    img.onerror = () => resolve(base64Str);
  });
};

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [usedVoiceInput, setUsedVoiceInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [simulationLogs, setSimulationLogs] = useState<string[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dynamic Language Selection State (Auto + Specific Indian Regional Languages)
  const [selectedLang, setSelectedLang] = useState<
    "auto" | "mr" | "en" | "kn" | "hi"
  >("auto");

  const languageOptions = [
    { id: "auto", label: "⚡ Auto Detect", code: "auto", speechLang: "mr-IN" },
    { id: "mr", label: "मराठी", code: "mr-IN", speechLang: "mr-IN" },
    { id: "en", label: "English", code: "en-US", speechLang: "en-IN" },
    { id: "kn", label: "ಕನ್ನಡ", code: "kn-IN", speechLang: "kn-IN" },
    { id: "hi", label: "हिंदी", code: "hi-IN", speechLang: "hi-IN" },
  ] as const;

  const placeholders: Record<string, string> = {
    auto: "कोणत्याही भाषेत विचारा / Ask in any language / किसी भी भाषा में पूछें (Ctrl+V)...",
    mr: "कोणत्याही भाषेत विचारा (मराठी, हिंदी, कन्नड, इंग्रजी) किंवा Ctrl+V ने फोटो पेस्ट करा...",
    hi: "किसी भी भाषा में पूछें (हिंदी, मराठी, कन्नड़, अंग्रेजी) या Ctrl+V से फोटो पेस्ट करें...",
    kn: "ಯಾವುದೇ ಭಾಷೆಯಲ್ಲಿ ಕೇಳಿ (ಕನ್ನಡ, ಮರಾಠಿ, ಹಿಂದಿ, ಇಂಗ್ಲಿಷ್) ಅಥವಾ Ctrl+V ಬಳಸಿ ಫೋಟೋ ಪೇಸ್ಟ್ ಮಾಡಿ...",
    en: "Ask in any language (English, Marathi, Kannada, Hindi) or paste photo using Ctrl+V...",
  };

  // Ctrl + V Paste Image with Auto-Compression
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onloadend = async () => {
              const rawBase64 = reader.result as string;
              const optimized = await compressImage(rawBase64);
              setImagePreview(optimized);
            };
            reader.readAsDataURL(blob);
            e.preventDefault();
            break;
          }
        }
      }
    }
  };

  // Voice Input with Dynamic Language Sync
  const toggleListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        "Browser voice recognition support karat nahi. Google Chrome vapra.",
      );
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();

      // Dynamic Speech Recognition Language Binding
      const currentOpt = languageOptions.find((opt) => opt.id === selectedLang);
      recognition.lang = currentOpt ? currentOpt.speechLang : "mr-IN";

      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsRecording(true);
      recognition.onend = () => setIsRecording(false);
      recognition.onerror = () => setIsRecording(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setPrompt((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setUsedVoiceInput(true);
      };

      recognition.start();
    } catch {
      setIsRecording(false);
    }
  };

  // Voice Output (Auto Language Text-to-Speech)
  const speakText = (text: string, langCode?: string) => {
    if (!window.speechSynthesis) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);

    // Auto detect language based on returned schema or selected pill
    if (langCode) {
      utterance.lang = langCode;
    } else if (selectedLang !== "auto") {
      const active = languageOptions.find((l) => l.id === selectedLang);
      utterance.lang = active ? active.code : "mr-IN";
    } else if (/[\u0C80-\u0CFF]/.test(text)) {
      utterance.lang = "kn-IN";
    } else if (/[\u0900-\u097F]/.test(text)) {
      utterance.lang = "mr-IN";
    } else {
      utterance.lang = "en-US";
    }

    utterance.rate = 0.95;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // File Upload with Auto-Compression
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const rawBase64 = reader.result as string;
        const optimized = await compressImage(rawBase64);
        setImagePreview(optimized);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Analyze with Language Mirroring Injection
  const handleAnalyze = async () => {
    if (!prompt.trim() && !imagePreview) return;
    setLoading(true);
    setSimulationLogs([]);
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setIsSpeaking(false);

    // Explicit language directive jar auto nasel tar
    let finalPrompt = prompt;
    if (selectedLang === "mr") {
      finalPrompt = `${prompt} (Answer strictly in Marathi script - languageCode: mr-IN)`;
    } else if (selectedLang === "en") {
      finalPrompt = `${prompt} (Answer strictly in English language - languageCode: en-US)`;
    } else if (selectedLang === "kn") {
      finalPrompt = `${prompt} (Answer strictly in Kannada script - languageCode: kn-IN)`;
    } else if (selectedLang === "hi") {
      finalPrompt = `${prompt} (Answer strictly in Hindi Devanagari script - languageCode: hi-IN)`;
    }

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: finalPrompt,
          image: imagePreview,
        }),
      });

      const json = await res.json();
      setData(json);

      if (json?.overview && usedVoiceInput) {
        speakText(`${json.title}. ${json.overview}`, json.languageCode);
      }
    } catch (err) {
      console.error("Client fetch error:", err);
    } finally {
      setLoading(false);
      setUsedVoiceInput(false);
    }
  };

  const runSimulation = () => {
    if (!data?.executionPlan?.length) return;
    setIsSimulating(true);
    setSimulationLogs([]);

    data.executionPlan.forEach((step, index) => {
      setTimeout(
        () => {
          setSimulationLogs((prev) => [...prev, `[EXEC-NODE] ${step}`]);
          if (index === data.executionPlan.length - 1) {
            setTimeout(() => {
              setSimulationLogs((prev) => [
                ...prev,
                "✓ Autonomous Sequence Verified.",
              ]);
              setIsSimulating(false);
            }, 400);
          }
        },
        (index + 1) * 600,
      );
    });
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-cyan-600 to-blue-500 rounded-lg shadow-md shadow-cyan-500/20">
            <ShieldAlert className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-wide text-white flex items-center gap-2">
              RERRO{" "}
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
                Edge Grid v2.5
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Universal Auto-Language Action Orchestrator
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full text-cyan-400">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
          <span>Zero-Config Multilingual Auto-Sync</span>
        </div>
      </header>

      <div className="max-w-6xl w-full mx-auto px-4 py-8 flex flex-col gap-8 flex-1">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-400" />
                Universal Field Ingestion Console
              </label>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                <span>
                  Konthyahi bhashet bola kiva liha. System swataha bhasha
                  oḷkhel.
                </span>
                <span className="bg-slate-800 text-cyan-300 px-2 py-0.5 rounded border border-slate-700 text-[10px] flex items-center gap-1">
                  <ClipboardPaste className="w-3 h-3" /> Ctrl+V Image Active
                </span>
              </p>
            </div>

            {/* Dynamic Multilingual Override Pills */}
            <div className="flex items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800 self-start sm:self-auto">
              <Globe2 className="w-3.5 h-3.5 text-cyan-400 ml-1.5 mr-0.5 hidden md:block" />
              {languageOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedLang(opt.id)}
                  className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                    selectedLang === opt.id
                      ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-semibold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-850"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <textarea
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              setUsedVoiceInput(false);
            }}
            onPaste={handlePaste}
            placeholder={placeholders[selectedLang] || placeholders.auto}
            rows={3}
            className="w-full bg-slate-950/90 border border-slate-700/80 rounded-xl p-4 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none transition"
          />

          {imagePreview && (
            <div className="mt-3 relative inline-block">
              <img
                src={imagePreview}
                alt="Uploaded frame"
                className="w-28 h-20 object-cover rounded-lg border border-cyan-500 shadow-md"
              />
              <button
                onClick={removeImage}
                className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-500 text-white rounded-full p-1 shadow"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleListening}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium border transition ${
                  isRecording
                    ? "bg-red-950/80 border-red-600 text-red-400 animate-pulse"
                    : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300"
                }`}
              >
                {isRecording ? (
                  <MicOff className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4 text-cyan-400" />
                )}
                {isRecording
                  ? `Listening (${languageOptions.find((l) => l.id === selectedLang)?.label})...`
                  : `Voice Ingest (${selectedLang.toUpperCase()})`}
              </button>

              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition"
              >
                <ImageIcon className="w-4 h-4 text-blue-400" />
                Attach Photo
              </button>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={loading || (!prompt.trim() && !imagePreview)}
              className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium text-xs px-6 py-2.5 rounded-xl transition shadow-lg shadow-cyan-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Activity className="w-4 h-4 animate-spin" />
                  Analyzing Real-Time...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Synthesize Action Grid
                </>
              )}
            </button>
          </div>
        </div>

        {data && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 uppercase tracking-wider">
                      Priority: {data.priorityLevel}
                    </span>
                    <button
                      onClick={() =>
                        speakText(
                          `${data.title}. ${data.overview}`,
                          data.languageCode,
                        )
                      }
                      className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-cyan-950/70 border border-cyan-700/60 text-cyan-300 hover:bg-cyan-900 transition"
                    >
                      {isSpeaking ? (
                        <VolumeX className="w-3.5 h-3.5 text-red-400" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                      )}
                      {isSpeaking ? "Stop Voice" : "Voice Out (Speak)"}
                    </button>
                  </div>
                  <h2 className="text-xl font-bold text-white mt-2">
                    {data.title}
                  </h2>
                  <p className="text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
                    {data.overview}
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-2 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Schema Verified
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {data.cards?.map((card, i) => (
                <div
                  key={i}
                  className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition shadow-lg group"
                >
                  <div>
                    <div className="flex items-center gap-2 text-cyan-400 mb-2">
                      <Layers className="w-4 h-4" />
                      <h3 className="font-semibold text-sm text-slate-200">
                        {card.heading}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed mb-4">
                      {card.detail}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      speakText(
                        `${card.heading}. ${card.detail}`,
                        data.languageCode,
                      )
                    }
                    className="w-full text-xs font-medium py-2 px-3 rounded-lg bg-slate-800 text-cyan-300 border border-slate-700 group-hover:border-cyan-600 transition flex items-center justify-center gap-1.5"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                    {card.action}
                  </button>
                </div>
              ))}
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-semibold text-slate-300 font-mono">
                    AUTONOMOUS DISPATCH EXECUTION RUNTIME
                  </span>
                </div>
                <button
                  onClick={runSimulation}
                  disabled={isSimulating}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3.5 py-1.5 rounded-lg font-medium transition disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  {isSimulating ? "Dispatching..." : "Simulate Live Dispatch"}
                </button>
              </div>

              <div className="bg-black/60 rounded-xl p-4 font-mono text-xs text-slate-300 min-h-[120px] flex flex-col justify-start gap-1.5 border border-slate-900">
                {simulationLogs.length === 0 ? (
                  <span className="text-slate-600 italic">
                    Ready for runtime execution. Click 'Simulate Live Dispatch'
                    to run verified steps.
                  </span>
                ) : (
                  simulationLogs.map((log, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-emerald-400"
                    >
                      <span>›</span>
                      <span>{log}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
