import React from "react";
import { Stethoscope, ArrowRight, Sparkles, HeartPulse, Activity } from "lucide-react";

interface SplashPageProps {
  onEnter: () => void;
  theme: "light" | "slate" | "dark";
}

export const SplashPage: React.FC<SplashPageProps> = ({ onEnter, theme }) => {
  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 flex items-center justify-center p-4 sm:p-6 md:p-12 font-sans relative overflow-hidden selection:bg-teal-500/20" id="splash-page">
      {/* Decorative Glowing Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 dark:bg-teal-500/5 rounded-full blur-3xl pointer-events-none animate-pulse duration-[6000ms]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl pointer-events-none animate-pulse duration-[8000ms]" />
      
      {/* Tiny floating micro-particles for dynamic UI */}
      <div className="absolute top-10 left-1/2 w-2 h-2 bg-teal-500/20 rounded-full animate-bounce duration-[3000ms]" />
      <div className="absolute bottom-20 left-10 w-3 h-3 bg-emerald-500/20 rounded-full animate-ping duration-[4000ms]" />

      {/* Main Glassmorphic Welcome Card */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md w-full max-w-lg rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-2xl relative overflow-hidden p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Glow Ring Wrapper around App Logo */}
        <div className="relative">
          {/* Pulsing Outer Glow Ring */}
          <div className="absolute inset-0 rounded-full bg-teal-500/25 dark:bg-teal-500/10 blur-xl animate-ping duration-1000" />
          
          {/* Intermediate Border Ring */}
          <div className="absolute -inset-3 rounded-full border border-teal-500/20 dark:border-teal-500/10 animate-spin duration-[10000ms]" />

          {/* Actual Logo Emblem */}
          <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-xl shadow-teal-500/30">
            <Stethoscope className="w-10 h-10 animate-pulse" />
          </div>

          {/* Floating Sparkle Icon */}
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-white shadow shadow-amber-500/20 animate-bounce">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Text Presentation */}
        <div className="space-y-3">
          <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 tracking-widest uppercase bg-teal-500/10 px-3 py-1 rounded-full">
            Intelligent Health Guidance
          </span>
          <h1 className="font-black text-4xl sm:text-5xl tracking-tight leading-none text-slate-900 dark:text-white">
            Welcome to <span className="bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent">BOO</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
            Your Best Optimized Online Healthcare Assistant. Secure clinical case files and personalized symptom screening.
          </p>
        </div>

        {/* Dynamic Micro-metrics visual */}
        <div className="flex items-center gap-6 py-2 px-6 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-800/60">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <HeartPulse className="w-4 h-4 text-rose-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Secure</span>
          </div>
          <div className="h-4 w-px bg-slate-200 dark:bg-slate-850" />
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <Activity className="w-4 h-4 text-emerald-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider">AI Studio powered</span>
          </div>
        </div>

        {/* Call to Action Button */}
        <div className="w-full pt-4">
          <button
            onClick={onEnter}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm py-4 px-8 rounded-2xl shadow-lg shadow-teal-600/25 hover:shadow-teal-700/35 transition-all flex items-center justify-center gap-2 hover:translate-x-0.5 cursor-pointer group"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Footer note */}
        <div className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          Version 1.2.0 • HIPAA Compliant Sandbox
        </div>
      </div>
    </div>
  );
};
