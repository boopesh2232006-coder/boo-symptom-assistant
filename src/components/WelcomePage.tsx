import React from "react";
import { LANGUAGES, TRANSLATIONS, LanguageCode } from "../lib/translations";
import { Stethoscope, Globe, Shield, Sparkles, Compass, CheckCircle2, ArrowRight } from "lucide-react";

interface WelcomePageProps {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  onStart: () => void;
}

export const WelcomePage: React.FC<WelcomePageProps> = ({
  language,
  setLanguage,
  onStart
}) => {
  const t = TRANSLATIONS[language];

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 flex items-center justify-center p-4 sm:p-6 md:p-12 font-sans overflow-y-auto selection:bg-teal-500/20" id="welcome-page">
      {/* Decorative Blur Background Circles */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-teal-500/10 dark:bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xl relative overflow-hidden flex flex-col md:flex-row min-h-[600px] animate-in fade-in zoom-in-95 duration-300">
        
        {/* Left Side: Brand Greeting & Languages */}
        <div className="flex-1 p-6 sm:p-10 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
          
          {/* Logo & Welcome text */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-teal-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
                <Stethoscope className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white leading-tight">
                  {t.welcomeTitle}
                </h1>
                <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 tracking-wider uppercase">
                  {t.clinicalLabel}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-2">
                {t.appSlogan}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {t.welcomeDesc}
              </p>
            </div>
          </div>

          {/* Language selection section */}
          <div className="space-y-3 mt-6">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <Globe className="w-4 h-4 text-teal-600" />
              <span>{t.selectLanguage}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-1.5 max-h-56 overflow-y-auto pr-1">
              {LANGUAGES.map((lang) => {
                const isSelected = language === lang.code;
                return (
                  <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border text-left text-xs font-semibold cursor-pointer transition-all ${
                      isSelected
                        ? "bg-teal-600 text-white border-teal-600 shadow-sm shadow-teal-600/15 scale-[1.01]"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-350 dark:hover:border-slate-750"
                    }`}
                  >
                    <span className="text-base leading-none">{lang.flag}</span>
                    <span className="truncate">{lang.nativeName}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Clinical assist badge */}
          <div className="text-[10px] text-slate-400 pt-4 flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span>AI Workspace Engine Online</span>
          </div>
        </div>

        {/* Right Side: Features Spotlight & Action */}
        <div className="flex-1 p-6 sm:p-10 flex flex-col justify-between space-y-8">
          
          {/* Features Grid */}
          <div className="space-y-5">
            <div className="space-y-4">
              <div className="flex gap-3.5 items-start">
                <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {t.welcomeFeature1Title}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    {t.welcomeFeature1Desc}
                  </p>
                </div>
              </div>

              <div className="flex gap-3.5 items-start">
                <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0 mt-0.5">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {t.welcomeFeature2Title}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    {t.welcomeFeature2Desc}
                  </p>
                </div>
              </div>

              <div className="flex gap-3.5 items-start">
                <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {t.welcomeFeature3Title}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    {t.welcomeFeature3Desc}
                  </p>
                </div>
              </div>
            </div>

            {/* Medical Disclaimer card */}
            <div className="bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/15 p-4 rounded-2xl space-y-1.5">
              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                <Shield className="w-4 h-4 shrink-0" />
                <h4 className="text-[10px] font-bold uppercase tracking-wider">
                  {t.disclaimerTitle}
                </h4>
              </div>
              <p className="text-[10px] text-amber-800/80 dark:text-amber-300/80 leading-relaxed font-medium">
                {t.disclaimerText}
              </p>
            </div>
          </div>

          {/* Launch Action */}
          <div className="pt-2">
            <button
              onClick={onStart}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs py-3.5 px-6 rounded-2xl shadow-lg shadow-teal-600/20 hover:shadow-teal-700/30 transition-all cursor-pointer flex items-center justify-center gap-2 hover:translate-x-0.5"
            >
              <span>{t.startBtn}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
