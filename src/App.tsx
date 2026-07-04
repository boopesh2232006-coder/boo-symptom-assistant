import React, { useState, useEffect } from "react";
import { ChatSession, Message } from "./types";
import { ChatPanel } from "./components/ChatPanel";
import { PatientCaseFile } from "./components/PatientCaseFile";
import { Stethoscope, AlertTriangle, RefreshCw, LogOut, Settings as SettingsIcon } from "lucide-react";
import { TRANSLATIONS, LanguageCode } from "./lib/translations";
import { WelcomePage } from "./components/WelcomePage";
import { SettingsPanel } from "./components/SettingsPanel";

const LOCAL_STORAGE_KEY = "boo_symptom_sessions";

const createNewBlankSession = (): ChatSession => {
  const id = "session_" + Date.now();
  return {
    id,
    title: "New Consultation Session",
    date: new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    messages: [],
    extractedData: {},
    urgencyLevel: "LOW",
    emergencyFlagged: false,
    possibleConditions: [],
    educationalMedicines: [],
    recommendedHomeCare: [],
    preventiveMeasures: [],
    recommendedSpecialist: "",
  };
};

export default function App() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>("");
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"chart" | "diagnosis" | "medicines" | "care" | "hospitals" | "history">("chart");

  // Multi-language, Theme, Text Size Preferences
  const [language, setLanguage] = useState<LanguageCode>(() => {
    try {
      const stored = localStorage.getItem("boo_pref_language");
      return (stored as LanguageCode) || "en";
    } catch {
      return "en";
    }
  });

  const [textSize, setTextSize] = useState<"sm" | "md" | "lg">(() => {
    try {
      const stored = localStorage.getItem("boo_pref_textSize");
      return (stored as "sm" | "md" | "lg") || "md";
    } catch {
      return "md";
    }
  });

  const [theme, setTheme] = useState<"light" | "slate" | "dark">(() => {
    try {
      const stored = localStorage.getItem("boo_pref_theme");
      return (stored as "light" | "slate" | "dark") || "light";
    } catch {
      return "light";
    }
  });

  const [showWelcome, setShowWelcome] = useState<boolean>(true);

  const [showSettings, setShowSettings] = useState<boolean>(false);

  // Sync Preferences to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("boo_pref_language", language);
    } catch (e) {
      console.error(e);
    }
  }, [language]);

  useEffect(() => {
    try {
      localStorage.setItem("boo_pref_textSize", textSize);
    } catch (e) {
      console.error(e);
    }
  }, [textSize]);

  useEffect(() => {
    try {
      localStorage.setItem("boo_pref_theme", theme);
    } catch (e) {
      console.error(e);
    }
  }, [theme]);

  const t = TRANSLATIONS[language];

  // Load sessions from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSessions(parsed);
          setActiveSessionId(parsed[0].id);
          return;
        }
      }
    } catch (e) {
      console.error("Failed to load local clinical sessions:", e);
    }

    // Default first session if empty
    const firstSession = createNewBlankSession();
    setSessions([firstSession]);
    setActiveSessionId(firstSession.id);
  }, []);

  // Save sessions to localStorage whenever they change
  const saveSessions = (updatedSessions: ChatSession[]) => {
    setSessions(updatedSessions);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedSessions));
    } catch (e) {
      console.error("Failed to save clinical sessions:", e);
    }
  };

  const activeSession =
    sessions.find((s) => s.id === activeSessionId) || sessions[0];

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText ? customText.trim() : input.trim();
    if (!textToSend || isLoading) return;

    if (!customText) {
      setInput("");
    }

    setConnectionError(null);

    const timestamp = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Create the user message
    const userMessage: Message = {
      id: "msg_" + Date.now(),
      role: "user",
      content: textToSend,
      timestamp,
    };

    // Append user message to active session
    const updatedMessages = [...(activeSession?.messages || []), userMessage];
    let updatedTitle = activeSession?.title || "New Consultation Session";

    // Set a friendly initial title based on user complaints
    if (updatedMessages.length === 1 || updatedTitle === "New Consultation Session") {
      const titleWords = textToSend.split(" ");
      updatedTitle = titleWords.slice(0, 3).join(" ") + "... Assessment";
    }

    const tempActiveSession: ChatSession = {
      ...activeSession,
      title: updatedTitle,
      messages: updatedMessages,
    };

    const tempSessions = sessions.map((s) =>
      s.id === activeSessionId ? tempActiveSession : s
    );
    setSessions(tempSessions);
    setIsLoading(true);

    try {
      // Query the full-stack server-side endpoint proxying Gemini API securely
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: updatedMessages,
          patientState: activeSession?.extractedData || {},
          language: language,
        }),
      });

      if (!response.ok) {
        let errMsg = `Server returned clinical error status ${response.status}`;
        try {
          const errData = await response.json();
          if (errData.details) {
            if (errData.details.includes("Could not load the default credentials") || errData.details.includes("API key")) {
              errMsg = "Gemini API Key is missing. Please configure GEMINI_API_KEY in your local .env file and restart the server.";
            } else {
              errMsg = errData.details;
            }
          } else if (errData.error) {
            errMsg = errData.error;
          }
        } catch (_) {}
        throw new Error(errMsg);
      }

      const data = await response.json();

      // Create model message
      const modelMessage: Message = {
        id: "msg_" + (Date.now() + 1),
        role: "assistant",
        content: data.message,
        timestamp: new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      // Construct fully updated session using the structural extraction model returned by server
      const finalActiveSession: ChatSession = {
        ...tempActiveSession,
        messages: [...updatedMessages, modelMessage],
        extractedData: {
          ...(tempActiveSession.extractedData || {}),
          ...(data.extractedData || {}),
        },
        urgencyLevel: data.urgencyLevel || "LOW",
        emergencyFlagged: data.emergencyFlagged || false,
        possibleConditions: data.possibleConditions || [],
        educationalMedicines: data.educationalMedicines || [],
        recommendedHomeCare: data.recommendedHomeCare || [],
        preventiveMeasures: data.preventiveMeasures || [],
        recommendedSpecialist: data.recommendedSpecialist || "",
      };

      const finalSessions = sessions.map((s) =>
        s.id === activeSessionId ? finalActiveSession : s
      );
      saveSessions(finalSessions);
    } catch (err: any) {
      console.error("Clinical response generation error:", err);
      setConnectionError(
        err.message || "Secure server connection interrupted. Ensure server.ts is active or try resubmitting."
      );

      // Append fallback warning message
      const errorMessage: Message = {
        id: "msg_" + (Date.now() + 1),
        role: "assistant",
        content:
          "Unable to securely process symptom analysis right now. Please verify your connection or refresh the application workspace.\n\nBOO is an AI educational health assistant and does not replace a licensed medical professional. If your symptoms are severe, worsening, or persistent, please consult a qualified healthcare provider or seek emergency medical care immediately.",
        timestamp: new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      const errorActiveSession = {
        ...tempActiveSession,
        messages: [...updatedMessages, errorMessage],
      };
      const errorSessions = sessions.map((s) =>
        s.id === activeSessionId ? errorActiveSession : s
      );
      setSessions(errorSessions);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
    setConnectionError(null);
  };

  const handleDeleteSession = (id: string) => {
    const updated = sessions.filter((s) => s.id !== id);
    if (updated.length === 0) {
      const fresh = createNewBlankSession();
      saveSessions([fresh]);
      setActiveSessionId(fresh.id);
    } else {
      saveSessions(updated);
      if (activeSessionId === id) {
        setActiveSessionId(updated[0].id);
      }
    }
  };

  const handleStartNewSession = () => {
    const fresh = createNewBlankSession();
    saveSessions([fresh, ...sessions]);
    setActiveSessionId(fresh.id);
    setConnectionError(null);
  };

  const handleResetAll = () => {
    if (confirm(t.confirmReset)) {
      const fresh = createNewBlankSession();
      saveSessions([fresh]);
      setActiveSessionId(fresh.id);
      setConnectionError(null);
    }
  };

  const handleHardReset = () => {
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      localStorage.removeItem("boo_has_seen_welcome");
      localStorage.removeItem("boo_pref_language");
      localStorage.removeItem("boo_pref_textSize");
      localStorage.removeItem("boo_pref_theme");
    } catch (e) {
      console.error(e);
    }
    
    setLanguage("en");
    setTextSize("md");
    setTheme("light");
    setShowWelcome(true);
    
    const fresh = createNewBlankSession();
    setSessions([fresh]);
    setActiveSessionId(fresh.id);
    setConnectionError(null);
  };

  const handleUpdateCoordinates = (lat: number, lng: number, address: string) => {
    if (!activeSession) return;
    const updated = sessions.map((s) => {
      if (s.id === activeSessionId) {
        return {
          ...s,
          extractedData: {
            ...s.extractedData,
            gpsLatitude: lat,
            gpsLongitude: lng,
            gpsAccuracy: 10,
            gpsAddress: address,
            place: address,
          },
        };
      }
      return s;
    });
    saveSessions(updated);
  };

  if (showWelcome) {
    return (
      <WelcomePage
        language={language}
        setLanguage={setLanguage}
        onStart={() => {
          setShowWelcome(false);
          try {
            localStorage.setItem("boo_has_seen_welcome", "true");
          } catch (e) {
            console.error(e);
          }
        }}
      />
    );
  }

  if (!activeSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-8 h-8 rounded-full border-2 border-teal-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  // Set visual theme custom colors dynamically
  const isDark = theme === "dark";
  const isSlate = theme === "slate";
  const bgClass = isDark 
    ? "bg-slate-950 text-slate-150 dark" 
    : isSlate 
    ? "bg-slate-100/95 text-slate-800" 
    : "bg-slate-50/50 text-slate-800";

  return (
    <div className={`min-h-screen ${bgClass} flex flex-col antialiased font-sans text-size-${textSize}`}>
      {/* Top Professional Navigation Bar */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-50 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-500/10">
            <Stethoscope className="w-5.5 h-5.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white font-sans">
                {t.appName}
              </h1>
              <span className="inline-block px-2 py-0.5 text-[9px] font-bold bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 border border-teal-100 dark:border-teal-900 rounded-full uppercase tracking-wider">
                {t.clinicalLabel}
              </span>
            </div>
            <p className="text-xs text-slate-400">{t.appSlogan}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Settings option button */}
          <button
            onClick={() => setShowSettings(true)}
            className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-all flex items-center gap-1.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 px-3 py-1.5 rounded-lg"
          >
            <SettingsIcon className="w-3.5 h-3.5" />
            {t.settingsTitle}
          </button>

          <button
            onClick={handleResetAll}
            className="text-xs font-semibold text-slate-400 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 transition-colors flex items-center gap-1 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 px-2.5 py-1.5 rounded-lg"
          >
            <LogOut className="w-3.5 h-3.5" />
            {t.clearCaseLogs}
          </button>
        </div>
      </header>

      {/* Main Full-Scale Workspace Grid */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-0">
        {/* Left Side: Consultation Chat Panel */}
        <section className="lg:col-span-6 xl:col-span-7 flex flex-col h-[calc(100vh-120px)] min-h-[500px]">
          {connectionError && (
            <div className="mb-3 bg-red-50 border border-red-100 p-3 rounded-xl flex gap-2.5 items-start">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-red-700 font-medium leading-relaxed">
                {connectionError}
              </p>
            </div>
          )}
          <div className="flex-1 min-h-0">
            <ChatPanel
              session={activeSession}
              messages={activeSession.messages}
              input={input}
              setInput={setInput}
              isLoading={isLoading}
              onSendMessage={handleSendMessage}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              language={language}
            />
          </div>
        </section>

        {/* Right Side: Clinical Dashboard (Patient Chart) */}
        <section className="lg:col-span-6 xl:col-span-5 h-[calc(100vh-120px)] min-h-[500px] flex flex-col">
          <div className="flex-1 min-h-0">
            <PatientCaseFile
              session={activeSession}
              sessions={sessions}
              activeSessionId={activeSessionId}
              onSelectSession={handleSelectSession}
              onDeleteSession={handleDeleteSession}
              onStartNewSession={handleStartNewSession}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              onUpdateSessions={saveSessions}
              language={language}
            />
          </div>
        </section>
      </main>

      {/* Global Clinical Settings Modal */}
      <SettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        language={language}
        setLanguage={setLanguage}
        textSize={textSize}
        setTextSize={setTextSize}
        theme={theme}
        setTheme={setTheme}
        gpsLat={activeSession.extractedData?.gpsLatitude || 37.4275}
        gpsLng={activeSession.extractedData?.gpsLongitude || -122.1697}
        gpsAddr={activeSession.extractedData?.gpsAddress || activeSession.extractedData?.place || "Stanford, California"}
        onUpdateCoordinates={handleUpdateCoordinates}
        onResetDatabase={handleHardReset}
      />
    </div>
  );

}
