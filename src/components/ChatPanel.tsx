import React, { useRef, useEffect } from "react";
import { Message, ChatSession } from "../types";
import { Send, AlertTriangle, Activity, Stethoscope, Sparkles, Map as MapIcon, Compass, ArrowRight } from "lucide-react";
import { TRANSLATIONS, LanguageCode } from "../lib/translations";

interface ChatPanelProps {
  session: ChatSession;
  messages: Message[];
  input: string;
  setInput: (val: string) => void;
  isLoading: boolean;
  onSendMessage: (text?: string) => void;
  activeTab?: string;
  setActiveTab?: (tab: "chart" | "diagnosis" | "medicines" | "care" | "hospitals" | "history") => void;
  language?: LanguageCode;
}

// A beautiful, fast, custom Markdown-lite renderer that outputs standard JSX with pristine styling
export const CustomMarkdown: React.FC<{ text: string }> = ({ text }) => {
  const parseText = (content: string) => {
    const lines = content.split("\n");
    return lines.map((line, idx) => {
      // Headers
      if (line.startsWith("### ")) {
        return (
          <h4 key={idx} className="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-3 mb-1.5 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-teal-600" />
            {line.substring(4)}
          </h4>
        );
      }
      if (line.startsWith("## ")) {
        return (
          <h3 key={idx} className="text-base font-bold text-teal-800 dark:text-teal-200 mt-4 mb-2 border-b border-teal-100 pb-1">
            {line.substring(3)}
          </h3>
        );
      }
      if (line.startsWith("# ")) {
        return (
          <h2 key={idx} className="text-lg font-bold text-teal-900 dark:text-teal-100 mt-5 mb-3">
            {line.substring(2)}
          </h2>
        );
      }

      // Bullet items
      if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
        const itemText = line.trim().substring(2);
        return (
          <li key={idx} className="ml-4 list-disc text-xs text-slate-600 dark:text-slate-300 mb-1 leading-relaxed">
            {parseInlineStyles(itemText)}
          </li>
        );
      }

      // Blockquotes / Warnings
      if (line.trim().startsWith("> ")) {
        return (
          <blockquote key={idx} className="border-l-4 border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 px-3 py-2 my-2 rounded-r-md text-xs italic text-amber-800 dark:text-amber-200">
            {parseInlineStyles(line.trim().substring(2))}
          </blockquote>
        );
      }

      // Empty lines
      if (line.trim() === "") {
        return <div key={idx} className="h-2" />;
      }

      // Normal paragraph
      return (
        <p key={idx} className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-1.5">
          {parseInlineStyles(line)}
        </p>
      );
    });
  };

  const parseInlineStyles = (line: string) => {
    // Basic bold parsing: **text**
    const parts = line.split(/\*\*([\s\S]*?)\*\*/g);
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return (
          <strong key={i} className="font-semibold text-slate-900 dark:text-white">
            {part}
          </strong>
        );
      }
      return part;
    });
  };

  return <div className="space-y-1">{parseText(text)}</div>;
};

export const ChatPanel: React.FC<ChatPanelProps> = ({
  session,
  messages,
  input,
  setInput,
  isLoading,
  onSendMessage,
  activeTab,
  setActiveTab,
  language = "en",
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const t = TRANSLATIONS[language];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const starterScenarios = language === 'es' ? [
    { label: "Opresión en el Pecho", text: "Tengo una leve opresión en el pecho y sudoración desde hace aproximadamente 1 hora." },
    { label: "Tos Persistente", text: "Soy una mujer de 28 años con tos seca desde hace 2 semanas, sin fiebre, pero con leve dificultad para respirar al hacer ejercicio." },
    { label: "Migraña Severa", text: "Tengo un dolor de cabeza intenso y palpitante en un lado de la cabeza (dolor 8/10) que comenzó hace 4 horas, con náuseas y sensibilidad a la luz." },
    { label: "Calambres Estomacales", text: "Tengo calambres abdominales repentinos, fiebre leve de 37.7 C y náuseas leves después de comer mariscos ayer." }
  ] : language === 'fr' ? [
    { label: "Oppression Thoracique", text: "J'ai une légère oppression thoracique et des sueurs depuis environ 1 heure." },
    { label: "Toux Persistante", text: "Je suis une femme de 28 ans avec une toux sèche depuis 2 semaines, sans fièvre, mais avec un léger essoufflement à l'effort." },
    { label: "Migraine Sévère", text: "J'ai un mal de tête intense et lancinant d'un côté de la tête (dolor 8/10) qui a commencé il y a 4 heures, avec des nausées et une sensibilité à la lumière." },
    { label: "Crampes d'Estomac", text: "J'ai des crampes abdominales soudaines, une légère fièvre de 37,7 C et de légères nausées après avoir mangé des fruits de mer hier." }
  ] : language === 'de' ? [
    { label: "Engegefühl in der Brust", text: "Ich habe seit etwa 1 Stunde ein leichtes Engegefühl in der Brust und Schweißausbrüche." },
    { label: "Anhaltender Husten", text: "Ich bin eine 28-jährige Frau mit trockenem Husten seit 2 Wochen, kein Fieber, aber leichte Atemnot bei körperlicher Anstrengung." },
    { label: "Schwere Migräne", text: "Ich habe seit 4 Stunden einseitige, pochende Kopfschmerzen (Schmerzstärke 8/10) mit Übelkeit und Lichtempfindlichkeit." },
    { label: "Magenkrämpfe", text: "Ich habe plötzliche Bauchkrämpfe, leichtes Fieber (37,7 C) und leichte Übelkeit, nachdem ich gestern Meeresfrüchte gegessen habe." }
  ] : language === 'zh' ? [
    { label: "胸口紧绷压迫感", text: "我感觉轻微胸闷、出汗，已经持续大约1小时。" },
    { label: "持续慢性咳嗽", text: "女性，28岁，干咳持续2周，无发热，但运动时感觉轻微气短。" },
    { label: "剧烈偏头痛", text: "一侧头部剧烈跳痛（疼痛等级 8/10），4小时前开始，伴有恶心和畏光。" },
    { label: "急性胃痉挛", text: "昨天吃海鲜后出现突然的腹部绞痛、低烧（37.7度）和轻度恶心。" }
  ] : language === 'ja' ? [
    { label: "胸の圧迫感・息苦しさ", text: "1時間ほど前から軽い胸の圧迫感と冷や汗があります。" },
    { label: "長引く乾いた咳", text: "28歳女性。2週間前から乾いた咳が続いています。熱はありませんが、運動時に軽い息切れがあります。" },
    { label: "重度の片頭痛", text: "4時間前から片側の頭がズキズキと激しく痛み（痛みは8/10）、吐き気と光への過敏症があります。" },
    { label: "急な胃の痛み・腹痛", text: "昨日シーフードを食べた後、急な腹痛、37.7℃の微熱、軽い吐き気があります。" }
  ] : language === 'pt' ? [
    { label: "Aperto no Peito", text: "Sinto um leve aperto no peito e sudorese há cerca de 1 hora." },
    { label: "Tosse Persistente", text: "Sou uma mulher de 28 anos com tosse seca há 2 semanas, sem febre, mas com leve falta de ar ao fazer exercícios." },
    { label: "Enxaqueca Forte", text: "Estou com uma dor de cabeça intensa e pulsante de um lado (dor 8/10) que começou há 4 horas, com náuseas e sensibilidade à luz." },
    { label: "Cãibras Estomacais", text: "Sinto cólicas abdominais repentinas, febre baixa de 37.7 C e náuseas leves após comer frutos do mar ontem." }
  ] : language === 'hi' ? [
    { label: "छाती में जकड़न", text: "मुझे लगभग 1 घंटे से छाती में हल्की जकड़न और पसीना आ रहा है।" },
    { label: "लगातार खांसी", text: "मैं 28 वर्षीय महिला हूं, मुझे 2 सप्ताह से सूखी खांसी है, बुखार नहीं है, लेकिन व्यायाम करते समय सांस फूलती है।" },
    { label: "तेज सिरदर्द (माइग्रेन)", text: "मुझे सिर के एक तरफ तेज दर्द हो रहा है (दर्द 8/10) जो 4 घंटे पहले शुरू हुआ था, साथ ही उल्टी और रोशनी से संवेदनशीलता है।" },
    { label: "पेट में ऐंठन", text: "कल सीफ़ूड खाने के बाद मुझे अचानक पेट में ऐंठन, 37.7 C का हल्का बुखार और हल्की मतली हो रही है।" }
  ] : language === 'ar' ? [
    { label: "ضيق في الصدر", text: "أشعر بضيق خفيف في الصدر وبعض التعرق منذ حوالي ساعة واحدة." },
    { label: "سعال مستمر", text: "أنا امرأة عمري 28 عامًا، أعاني من سعال جاف مستمر منذ أسبوعين، لا يوجد حمى ولكن أشعر بضيق خفيف في التنفس عند التمرين." },
    { label: "صداع نصفي حاد", text: "أعاني من صداع نابض شديد في جانب واحد من رأسي (الألم 8/10) بدأ قبل 4 ساعات، مع غثيان وحساسية للضوء." },
    { label: "تقلصات المعدة", text: "أعاني من مغص مفاجئ في البطن، وحمى خفيفة 37.7 درجة، وغثيان خفيف بعد تناول المأكولات البحرية بالأمس." }
  ] : language === 'ru' ? [
    { label: "Сдавленность в груди", text: "Около часа назад у меня появилась легкая сдавленность в груди и потливость." },
    { label: "Затяжной кашель", text: "Я женщина 28 лет, сухой кашель продолжается 2 недели, температуры нет, но при нагрузках появляется легкая одышка." },
    { label: "Сильная мигрень", text: "У меня сильная пульсирующая головная боль с одной стороны (8 баллов из 10), которая началась 4 часа назад, с тошнотой и светочувствительностью." },
    { label: "Спазмы в желудке", text: "У меня внезапные спазмы в животе, небольшая температура (37,7 C) и легкая тошнота после того, как я вчера съел морепродукты." }
  ] : [
    { label: "Chest Tightness", text: "I have had mild chest tightness and some sweating for about 1 hour." },
    { label: "Persistent Cough", text: "I am a 28yo female with a dry, hacking cough for 2 weeks, no fever, but slight shortness of breath when exercising." },
    { label: "Severe Migraine", text: "I am having an intense, pounding headache on one side of my head (8/10 pain) that started 4 hours ago, with nausea and light sensitivity." },
    { label: "Stomach Camps", text: "I have sudden abdominal cramps, low fever of 99.8F, and mild nausea after eating seafood yesterday." }
  ];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden" id="chat-panel">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/20">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-teal-500/10 dark:bg-teal-500/20 flex items-center justify-center text-teal-600">
            <Stethoscope className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-white flex items-center gap-1.5">
              {t.chatConsultationTitle}
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-teal-50 dark:bg-teal-950/40 text-teal-600 border border-teal-100 dark:border-teal-900">
                <Sparkles className="w-2.5 h-2.5" /> {t.chatAiAssistant}
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">{t.chatTriageModel}</p>
          </div>
        </div>

        {setActiveTab && activeTab !== "care" && (
          <button
            onClick={() => setActiveTab("care")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm cursor-pointer transition-all shrink-0 hover:scale-[1.02]"
          >
            <Compass className="w-3.5 h-3.5" />
            {t.chatOpenMapBtn}
          </button>
        )}
      </div>

      {/* Emergency Alert Banner */}
      {session.emergencyFlagged && (
        <div className="bg-red-50 dark:bg-red-950/20 border-b border-red-100 dark:border-red-900/40 px-5 py-3 flex gap-3 items-start animate-pulse">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-red-800 dark:text-red-300">{t.emergencyDetected}</h4>
            <p className="text-[11px] text-red-700 dark:text-red-400 mt-0.5 leading-relaxed">
              {t.emergencyDesc}
            </p>
          </div>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-0 bg-slate-50/20 dark:bg-slate-950/5">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-5 animate-fade-in">
            {/* WELCOME BANNER HEADLINE */}
            <div className="w-full max-w-lg bg-teal-50/50 dark:bg-teal-950/20 border border-teal-100/50 dark:border-teal-900/30 rounded-2xl p-4 text-left space-y-2 relative overflow-hidden shadow-xs">
              <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/10 rounded-full blur-xl pointer-events-none" />
              <div className="flex items-center gap-2">
                <span className="text-lg">👋</span>
                <h2 className="text-sm font-bold text-teal-900 dark:text-teal-300">
                  {t.chatWelcomeHeader}
                </h2>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {t.chatWelcomeText}
              </p>
              <div className="flex gap-4 pt-1 border-t border-teal-100/30 text-[10px] text-teal-700 dark:text-teal-400 font-bold">
                <span>{t.chatVerifiedTriage}</span>
                <span>{t.chatRealtimeGps}</span>
                <span>{t.chatActiveFirewall}</span>
              </div>
            </div>

            <div className="w-16 h-16 rounded-3xl bg-slate-50 dark:bg-slate-950/40 flex items-center justify-center text-teal-600 border border-slate-100/50 dark:border-slate-850/50 shadow-xs">
              <Stethoscope className="w-8 h-8" />
            </div>
            <div className="max-w-md space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">{t.chatStarterTitle}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {t.chatStarterDesc}
              </p>
            </div>

            {/* Starter Scenarios */}
            <div className="w-full max-w-lg space-y-2.5 pt-2">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider text-left pl-1">
                {t.chatSelectScenario}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {starterScenarios.map((sc, i) => (
                  <button
                    key={i}
                    onClick={() => onSendMessage(sc.text)}
                    className="text-left px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-teal-400 hover:bg-teal-50/10 dark:hover:bg-teal-950/10 transition-all text-xs group cursor-pointer shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-250"
                  >
                    <span className="font-semibold text-teal-600 dark:text-teal-400 block group-hover:text-teal-700">
                      {sc.label}
                    </span>
                    <span className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                      {sc.text}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((m) => {
              const isAssistant = m.role === "assistant";
              return (
                <div
                  key={m.id}
                  className={`flex ${isAssistant ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm border ${
                      isAssistant
                        ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-slate-100 dark:border-slate-800"
                        : "bg-teal-600 text-white border-teal-700"
                    }`}
                  >
                    {isAssistant ? (
                      <CustomMarkdown text={m.content} />
                    ) : (
                      <p className="text-xs leading-relaxed whitespace-pre-wrap">{m.content}</p>
                    )}
                    <div className="mt-1.5 flex justify-end">
                      <span
                        className={`text-[9px] ${
                          isAssistant ? "text-slate-400" : "text-teal-100/80"
                        }`}
                      >
                        {m.timestamp}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl px-4 py-3 shadow-sm flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">{t.chatAnalyzing}</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Google Maps Platform Assistant Prompt Box */}
      {messages.length > 0 && activeTab !== "care" && (
        <div className="mx-4 mb-3 bg-teal-50/40 dark:bg-teal-950/10 border border-teal-100/60 dark:border-teal-900/30 p-3 rounded-xl flex items-center justify-between gap-3 shadow-xs shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-600/10 dark:bg-teal-600/20 flex items-center justify-center text-teal-600 shrink-0">
              <MapIcon className="w-4 h-4" />
            </div>
            <div>
              <h5 className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                {t.chatMapTitle}
              </h5>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                {t.chatMapDesc}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab && setActiveTab("care")}
            className="flex items-center gap-1 bg-teal-600 hover:bg-teal-700 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg shrink-0 cursor-pointer transition-all shadow-sm hover:scale-[1.02]"
          >
            {t.chatLocateFacilities} <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Input Tray */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (input.trim() && !isLoading) {
              onSendMessage();
            }
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder={
              session.emergencyFlagged
                ? t.chatEmergencyActive
                : t.chatPlaceholder
            }
            className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="w-10 h-10 rounded-xl bg-teal-600 hover:bg-teal-700 text-white flex items-center justify-center shadow-sm hover:shadow transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-[9px] text-slate-400 text-center mt-2">
          {t.chatDisclaimer}
        </p>
      </div>
    </div>
  );
};

