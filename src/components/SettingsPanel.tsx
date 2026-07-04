import React from "react";
import { LANGUAGES, TRANSLATIONS, LanguageCode } from "../lib/translations";
import { Settings, X, Globe, Type, Palette, MapPin, AlertTriangle, Check, RefreshCw } from "lucide-react";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  textSize: "sm" | "md" | "lg";
  setTextSize: (size: "sm" | "md" | "lg") => void;
  theme: "light" | "slate" | "dark";
  setTheme: (theme: "light" | "slate" | "dark") => void;
  gpsLat: number;
  gpsLng: number;
  gpsAddr: string;
  onUpdateCoordinates: (lat: number, lng: number, address: string) => void;
  onResetDatabase: () => void;
}

export const MOCK_LOCATIONS = [
  { name: "Palo Alto (Stanford Medical)", lat: 37.4275, lng: -122.1697, address: "Stanford University Medical Center, Palo Alto, CA" },
  { name: "London (St Thomas' Hospital)", lat: 51.5005, lng: -0.1184, address: "St Thomas' Hospital, Westminster, London, UK" },
  { name: "Tokyo (University of Tokyo Hosp.)", lat: 35.7131, lng: 139.7624, address: "The University of Tokyo Hospital, Bunkyo, Tokyo, Japan" },
  { name: "Madrid (Hospital Clínico)", lat: 40.4414, lng: -3.7258, address: "Hospital Clínico San Carlos, Moncloa, Madrid, Spain" },
  { name: "Paris (Hôpital Pitié-Salpêtrière)", lat: 48.8396, lng: 2.3653, address: "Hôpital Pitié-Salpêtrière, 13th Arr., Paris, France" },
  { name: "Berlin (Charité Hospital)", lat: 52.5251, lng: 13.3779, address: "Charité Universitätsmedizin, Mitte, Berlin, Germany" },
  { name: "New York (Bellevue Hospital)", lat: 40.7388, lng: -73.9765, address: "Bellevue Hospital Center, Kips Bay, New York, NY" },
  { name: "Mumbai (KEM Hospital)", lat: 19.0026, lng: 72.8421, address: "King Edward Memorial Hospital, Parel, Mumbai, India" },
  { name: "São Paulo (Hospital das Clínicas)", lat: -23.5566, lng: -46.6631, address: "Hospital das Clínicas da FMUSP, Cerqueira César, São Paulo, Brazil" },
  { name: "Moscow (Sklifosovsky Institute)", lat: 55.7744, lng: 37.6358, address: "Sklifosovsky Research Institute, Meshchansky, Moscow, Russia" }
];

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  language,
  setLanguage,
  textSize,
  setTextSize,
  theme,
  setTheme,
  gpsLat,
  gpsLng,
  gpsAddr,
  onUpdateCoordinates,
  onResetDatabase
}) => {
  if (!isOpen) return null;

  const t = TRANSLATIONS[language];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" id="settings-modal">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {t.settingsTitle}
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {t.settingsSubtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Scroll */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* Section 1: Language */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-teal-600" />
              {t.settingsLanguage}
            </h4>
            <div className="grid grid-cols-2 gap-1.5">
              {LANGUAGES.map((lang) => {
                const isSelected = language === lang.code;
                return (
                  <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                      isSelected
                        ? "bg-teal-50 dark:bg-teal-950/40 border-teal-500 text-teal-700 dark:text-teal-400 ring-1 ring-teal-500/20"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-350"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base leading-none">{lang.flag}</span>
                      <span>{lang.nativeName}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Text Size */}
          <div className="space-y-2.5 border-t border-slate-100 dark:border-slate-800 pt-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-teal-600" />
              {t.settingsTextSize}
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {(["sm", "md", "lg"] as const).map((sz) => {
                const isSelected = textSize === sz;
                const labels = {
                  sm: t.settingsTextSizeSm,
                  md: t.settingsTextSizeMd,
                  lg: t.settingsTextSizeLg
                };
                return (
                  <button
                    key={sz}
                    onClick={() => setTextSize(sz)}
                    className={`px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                      isSelected
                        ? "bg-teal-50 dark:bg-teal-950/40 border-teal-500 text-teal-700 dark:text-teal-400"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-350"
                    }`}
                  >
                    {labels[sz]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Color Schemes */}
          <div className="space-y-2.5 border-t border-slate-100 dark:border-slate-800 pt-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-teal-600" />
              {t.settingsTheme}
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {(["light", "slate", "dark"] as const).map((th) => {
                const isSelected = theme === th;
                const labels = {
                  light: t.settingsThemeLight,
                  slate: t.settingsThemeSlate,
                  dark: t.settingsThemeDark
                };
                return (
                  <button
                    key={th}
                    onClick={() => setTheme(th)}
                    className={`px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                      isSelected
                        ? "bg-teal-50 dark:bg-teal-950/40 border-teal-500 text-teal-700 dark:text-teal-400"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-350"
                    }`}
                  >
                    {labels[th]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 4: Patient Coordinates Simulator */}
          <div className="space-y-2.5 border-t border-slate-100 dark:border-slate-800 pt-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-teal-600" />
              {t.settingsMockGps}
            </h4>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              {t.settingsMockGpsDesc}
            </p>
            
            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-150 dark:border-slate-850 flex items-center justify-between">
              <div className="min-w-0">
                <span className="text-[9px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider block">Currently Simulated Location</span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 mt-0.5 block truncate">
                  {gpsAddr || "Default (Stanford, California)"}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Lat: {gpsLat.toFixed(4)}, Lng: {gpsLng.toFixed(4)}
                </span>
              </div>
            </div>

            <div className="max-h-40 overflow-y-auto space-y-1 pr-1.5 border border-slate-100 dark:border-slate-850 rounded-xl p-1.5">
              {MOCK_LOCATIONS.map((loc) => {
                const isCurrent = Math.abs(gpsLat - loc.lat) < 0.0001 && Math.abs(gpsLng - loc.lng) < 0.0001;
                return (
                  <button
                    key={loc.name}
                    type="button"
                    onClick={() => onUpdateCoordinates(loc.lat, loc.lng, loc.address)}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-[11px] transition-colors flex items-center justify-between cursor-pointer ${
                      isCurrent
                        ? "bg-teal-500/10 text-teal-700 dark:text-teal-400 font-bold"
                        : "hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <span>{loc.name}</span>
                    {isCurrent && <Check className="w-3 h-3 text-teal-600 dark:text-teal-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hard Reset database */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-5 flex justify-between items-center">
            <div className="max-w-[70%]">
              <h5 className="text-[11px] font-bold text-red-500 uppercase tracking-wider">Troubleshooting</h5>
              <p className="text-[9px] text-slate-400 mt-0.5 leading-relaxed">
                Wipe all cached sessions and restore factory defaults.
              </p>
            </div>
            <button
              onClick={() => {
                if (confirm(t.confirmReset)) {
                  onResetDatabase();
                  onClose();
                }
              }}
              className="text-xs font-semibold text-red-600 hover:text-white hover:bg-red-500 border border-red-200 dark:border-red-900/60 hover:border-red-500 rounded-lg px-3 py-2 cursor-pointer transition-all shrink-0"
            >
              {t.settingsResetBtn}
            </button>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 flex justify-end">
          <button
            onClick={onClose}
            className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md shadow-teal-600/10 hover:shadow-teal-600/20 cursor-pointer transition-all hover:scale-[1.01]"
          >
            {t.settingsCloseBtn}
          </button>
        </div>

      </div>
    </div>
  );
};
