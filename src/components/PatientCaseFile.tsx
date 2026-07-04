import React, { useState, useEffect } from "react";
import { ChatSession, ExtractedData } from "../types";
import { LocationFinder } from "./LocationFinder";
import { HospitalLocator } from "./HospitalLocator";
import { HistoryPanel } from "./HistoryPanel";
import { TRANSLATIONS, LanguageCode } from "../lib/translations";
import { COUNTRIES, Country, parsePhoneNumber } from "../lib/countries";
import {
  User,
  Heart,
  Pill,
  MapPin,
  History,
  Activity,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Shield,
  Coffee,
  Trees,
  CheckCircle2,
  BookmarkPlus,
  Phone,
  Navigation,
  Compass,
  Check,
  Pencil,
  Building2
} from "lucide-react";

interface PatientCaseFileProps {
  session: ChatSession;
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onStartNewSession: () => void;
  activeTab?: "chart" | "diagnosis" | "medicines" | "care" | "hospitals" | "history";
  setActiveTab?: (tab: "chart" | "diagnosis" | "medicines" | "care" | "hospitals" | "history") => void;
  onUpdateSessions?: (updated: ChatSession[]) => void;
  language?: LanguageCode;
}

export const PatientCaseFile: React.FC<PatientCaseFileProps> = ({
  session,
  sessions,
  activeSessionId,
  onSelectSession,
  onDeleteSession,
  onStartNewSession,
  activeTab: propActiveTab,
  setActiveTab: propSetActiveTab,
  onUpdateSessions,
  language = "en",
}) => {
  const [localActiveTab, setLocalActiveTab] = useState<"chart" | "diagnosis" | "medicines" | "care" | "hospitals" | "history">("chart");
  const activeTab = propActiveTab !== undefined ? propActiveTab : localActiveTab;
  const setActiveTab = propSetActiveTab !== undefined ? propSetActiveTab : setLocalActiveTab;
  const t = TRANSLATIONS[language];

  const [expandedCondition, setExpandedCondition] = useState<string | null>(null);
  const [expandedMedicine, setExpandedMedicine] = useState<string | null>(null);

  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [isEditingPlace, setIsEditingPlace] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [placeInput, setPlaceInput] = useState("");
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Advanced country code picker states
  const [selectedCountry, setSelectedCountry] = useState<Country>(() => COUNTRIES.find(c => c.code === "US") || COUNTRIES[0]);
  const [localPhoneInput, setLocalPhoneInput] = useState("");
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [countrySearchQuery, setCountrySearchQuery] = useState("");

  const data: ExtractedData = session.extractedData || {};

  // Sync inputs with session's extractedData when session changes
  useEffect(() => {
    const fullNumber = session.extractedData?.phoneNumber || "";
    setPhoneInput(fullNumber);
    setPlaceInput(session.extractedData?.place || "");
    
    const parsed = parsePhoneNumber(fullNumber, COUNTRIES);
    setSelectedCountry(parsed.country);
    setLocalPhoneInput(parsed.localNumber);
  }, [session.id, session.extractedData?.phoneNumber, session.extractedData?.place]);

  const updatePatientField = (fieldName: keyof ExtractedData, value: any) => {
    if (!onUpdateSessions) return;
    const updatedSessions = sessions.map(s => {
      if (s.id === session.id) {
        return {
          ...s,
          extractedData: {
            ...s.extractedData,
            [fieldName]: value
          }
        };
      }
      return s;
    });
    onUpdateSessions(updatedSessions);
  };

  const saveGpsData = (lat: number, lng: number, accuracy: number, address: string) => {
    if (!onUpdateSessions) return;
    const updatedSessions = sessions.map(s => {
      if (s.id === session.id) {
        return {
          ...s,
          extractedData: {
            ...s.extractedData,
            gpsLatitude: lat,
            gpsLongitude: lng,
            gpsAccuracy: accuracy,
            gpsAddress: address,
            place: s.extractedData.place || address
          }
        };
      }
      return s;
    });
    onUpdateSessions(updatedSessions);
    setGpsLoading(false);
  };

  const fetchCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your phone browser.");
      return;
    }
    setGpsLoading(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = position.coords.accuracy;

        const coords = { lat, lng };
        let address = `Phone GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})`;

        if (typeof window !== "undefined" && (window as any).google?.maps?.Geocoder) {
          try {
            const geocoder = new (window as any).google.maps.Geocoder();
            geocoder.geocode({ location: coords }, (results: any, status: string) => {
              if (status === "OK" && results && results[0]) {
                address = results[0].formatted_address;
              }
              saveGpsData(lat, lng, accuracy, address);
            });
            return;
          } catch (e) {
            console.error("Geocoding failed inside Patient Case File:", e);
          }
        }
        
        saveGpsData(lat, lng, accuracy, address);
      },
      (error) => {
        console.error("Geolocation error:", error);
        setGpsError(error.message || "Failed to retrieve location from phone.");
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Calculate Case Completeness Score (out of 20 parameters)
  const totalFields = 20;
  let filledFieldsCount = 0;
  if (data.age) filledFieldsCount++;
  if (data.biologicalSex) filledFieldsCount++;
  if (data.symptomDuration) filledFieldsCount++;
  if (data.painIntensity) filledFieldsCount++;
  if (data.bodyTemperature) filledFieldsCount++;
  if (data.pregnancyStatus) filledFieldsCount++;
  if (data.travelHistory) filledFieldsCount++;
  if (data.recentInfections) filledFieldsCount++;
  if (data.vaccinationStatus) filledFieldsCount++;
  if (data.mentalHealthFactors) filledFieldsCount++;
  if (data.environmentalExposure) filledFieldsCount++;
  if (data.allergies && data.allergies.length > 0) filledFieldsCount++;
  if (data.currentMedications && data.currentMedications.length > 0) filledFieldsCount++;
  if (data.chronicDiseases && data.chronicDiseases.length > 0) filledFieldsCount++;
  if (data.surgeries && data.surgeries.length > 0) filledFieldsCount++;
  if (data.familyMedicalHistory && data.familyMedicalHistory.length > 0) filledFieldsCount++;
  if (data.lifestyleHabits?.smoking || data.lifestyleHabits?.alcohol) filledFieldsCount++;
  if (data.lifestyleHabits?.diet || data.lifestyleHabits?.exercise || data.lifestyleHabits?.sleepQuality) filledFieldsCount++;
  if (data.phoneNumber) filledFieldsCount++;
  if (data.place) filledFieldsCount++;

  const completenessPercent = Math.min(100, Math.round((filledFieldsCount / totalFields) * 100));

  // Determine Triage color scheme
  const urgencyConfig = {
    LOW: { color: "text-green-600 bg-green-50 dark:bg-green-950/20 border-green-200", badge: t.urgencyLowBadge, desc: t.urgencyLowDesc },
    MEDIUM: { color: "text-amber-600 bg-amber-50 dark:bg-amber-950/20 border-amber-200", badge: t.urgencyMediumBadge, desc: t.urgencyMediumDesc },
    HIGH: { color: "text-rose-600 bg-rose-50 dark:bg-rose-950/20 border-rose-200", badge: t.urgencyHighBadge, desc: t.urgencyHighDesc },
    EMERGENCY: { color: "text-red-700 bg-red-50 dark:bg-red-950/30 border-red-300 animate-pulse", badge: t.urgencyEmergencyBadge, desc: t.urgencyEmergencyDesc }
  };

  const urgency = (session.urgencyLevel || "LOW").toUpperCase() as keyof typeof urgencyConfig;
  const currentUrgency = urgencyConfig[urgency] || urgencyConfig.LOW;

  const renderPainMeter = (painStr?: string) => {
    if (!painStr) return <span className="text-[11px] text-slate-400 italic">Not specified</span>;
    const match = painStr.match(/(\d+)/);
    const score = match ? parseInt(match[1]) : 0;
    const cleanScore = score > 10 ? 10 : score;

    return (
      <div className="space-y-1 w-full max-w-xs">
        <div className="flex justify-between text-[10px] text-slate-500">
          <span className="font-semibold text-slate-700 dark:text-slate-200">{painStr}</span>
          <span>(Scale 1-10)</span>
        </div>
        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-full border-r border-white dark:border-slate-900 ${
                i < cleanScore
                  ? cleanScore <= 3
                    ? "bg-green-500"
                    : cleanScore <= 6
                    ? "bg-amber-500"
                    : "bg-red-500"
                  : "bg-slate-100 dark:bg-slate-800"
              }`}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden" id="patient-case-file">
      {/* Triage Urgency Header */}
      <div className={`p-4 border-b border-slate-100 dark:border-slate-800 ${currentUrgency.color} border-l-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider">{currentUrgency.badge}</span>
          </div>
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border bg-white dark:bg-slate-900">
            {t.urgencyLabel}: {urgency}
          </span>
        </div>
        <p className="text-[11px] mt-1 opacity-90 leading-relaxed font-medium">{currentUrgency.desc}</p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 shrink-0">
        <button
          onClick={() => setActiveTab("chart")}
          className={`flex-1 py-3 text-center text-xs font-semibold border-b-2 transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === "chart"
              ? "text-teal-600 border-teal-600 bg-white dark:bg-slate-900"
              : "text-slate-500 border-transparent hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <User className="w-3.5 h-3.5" />
          {t.tabPatientChart}
        </button>

        <button
          onClick={() => setActiveTab("diagnosis")}
          className={`flex-1 py-3 text-center text-xs font-semibold border-b-2 transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === "diagnosis"
              ? "text-teal-600 border-teal-600 bg-white dark:bg-slate-900"
              : "text-slate-500 border-transparent hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Heart className="w-3.5 h-3.5" />
          {t.tabTriageDiagnosis}
        </button>

        <button
          onClick={() => setActiveTab("medicines")}
          className={`flex-1 py-3 text-center text-xs font-semibold border-b-2 transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === "medicines"
              ? "text-teal-600 border-teal-600 bg-white dark:bg-slate-900"
              : "text-slate-500 border-transparent hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Pill className="w-3.5 h-3.5" />
          {t.tabMedicines}
        </button>

        <button
          onClick={() => setActiveTab("care")}
          className={`flex-1 py-3 text-center text-xs font-semibold border-b-2 transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === "care"
              ? "text-teal-600 border-teal-600 bg-white dark:bg-slate-900"
              : "text-slate-500 border-transparent hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          {t.tabFacilities}
        </button>

        <button
          onClick={() => setActiveTab("hospitals")}
          className={`flex-1 py-3 text-center text-xs font-semibold border-b-2 transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === "hospitals"
              ? "text-teal-600 border-teal-600 bg-white dark:bg-slate-900"
              : "text-slate-500 border-transparent hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Building2 className="w-3.5 h-3.5 text-rose-500" />
          {t.tabHospitals}
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`flex-1 py-3 text-center text-xs font-semibold border-b-2 transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === "history"
              ? "text-teal-600 border-teal-600 bg-white dark:bg-slate-900"
              : "text-slate-500 border-transparent hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <History className="w-3.5 h-3.5" />
          {t.tabHistory}
        </button>
      </div>

      {/* Tab Panels Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 min-h-0">
        {/* TAB 1: PATIENT CHART */}
        {activeTab === "chart" && (
          <div className="space-y-4">
            {/* Completeness score banner */}
            <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-150 dark:border-slate-850">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                <span>Clinical Demographics Collected</span>
                <span className="text-teal-600">{completenessPercent}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal-600 transition-all duration-500"
                  style={{ width: `${completenessPercent}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
                Provide BOO with more background details (e.g., chronic diseases, lifestyle habits, medications) during chat to complete the assessment file.
              </p>
            </div>

            {/* Demographics grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50/50 dark:bg-slate-950/10 p-3 rounded-xl border border-slate-100 dark:border-slate-800/40">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Age</span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-100 mt-0.5 block">
                  {data.age || <span className="text-slate-400 italic font-normal">Awaiting data...</span>}
                </span>
              </div>
              <div className="bg-slate-50/50 dark:bg-slate-950/10 p-3 rounded-xl border border-slate-100 dark:border-slate-800/40">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Biological Sex</span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-100 mt-0.5 block">
                  {data.biologicalSex || <span className="text-slate-400 italic font-normal">Awaiting data...</span>}
                </span>
              </div>
              <div className="bg-slate-50/50 dark:bg-slate-950/10 p-3 rounded-xl border border-slate-100 dark:border-slate-800/40">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Duration of Symptoms</span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-100 mt-0.5 block">
                  {data.symptomDuration || <span className="text-slate-400 italic font-normal">Awaiting data...</span>}
                </span>
              </div>
              <div className="bg-slate-50/50 dark:bg-slate-950/10 p-3 rounded-xl border border-slate-100 dark:border-slate-800/40">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Estimated Temperature</span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-100 mt-0.5 block">
                  {data.bodyTemperature || <span className="text-slate-400 italic font-normal">Awaiting data...</span>}
                </span>
              </div>
              <div className="col-span-2 bg-slate-50/50 dark:bg-slate-950/10 p-3 rounded-xl border border-slate-100 dark:border-slate-800/40">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Pain Intensity</span>
                {renderPainMeter(data.painIntensity)}
              </div>
            </div>

            {/* Phone, Place & Location Sync Services */}
            <div className="bg-slate-50/50 dark:bg-slate-950/10 p-4 rounded-xl border border-teal-100/50 dark:border-teal-900/20 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <h4 className="text-[11px] font-bold text-teal-800 dark:text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" /> Mobile Contact & Coordinates
                </h4>
                <span className="text-[9px] bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 font-bold px-2 py-0.5 rounded">
                  HIPAA Secured
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Phone Number Box */}
                <div className="bg-white dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-850 shadow-2xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-450" /> Phone Number
                    </span>
                    {!isEditingPhone ? (
                      <button
                        onClick={() => setIsEditingPhone(true)}
                        className="text-[10px] text-teal-600 hover:text-teal-700 dark:text-teal-400 font-bold flex items-center gap-0.5 cursor-pointer"
                      >
                        <Pencil className="w-2.5 h-2.5" /> Edit
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          const combined = localPhoneInput.trim() ? `${selectedCountry.dialCode} ${localPhoneInput.trim()}` : "";
                          updatePatientField("phoneNumber", combined);
                          setIsEditingPhone(false);
                          setIsCountryDropdownOpen(false);
                        }}
                        className="text-[10px] text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-0.5 cursor-pointer"
                      >
                        <Check className="w-2.5 h-2.5" /> Save
                      </button>
                    )}
                  </div>
                  
                  {!isEditingPhone ? (
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-100 block py-1">
                      {data.phoneNumber || <span className="text-slate-400 italic font-normal">No number stored...</span>}
                    </span>
                  ) : (
                    <div className="relative flex flex-col gap-1.5 mt-1">
                      <div className="flex items-center gap-1">
                        {/* Country Code Selector Button */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => {
                              setIsCountryDropdownOpen(!isCountryDropdownOpen);
                              setCountrySearchQuery("");
                            }}
                            className="h-8 flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-100 transition-colors cursor-pointer select-none"
                          >
                            <span className="text-sm">{selectedCountry.flag}</span>
                            <span className="font-mono text-[11px]">{selectedCountry.dialCode}</span>
                            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                          </button>

                          {/* Country Selector Dropdown */}
                          {isCountryDropdownOpen && (
                            <>
                              <div
                                className="fixed inset-0 z-40"
                                onClick={() => setIsCountryDropdownOpen(false)}
                              />
                              <div className="absolute left-0 mt-1 w-64 max-h-56 bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-1 duration-150">
                                {/* Search input */}
                                <div className="p-1.5 bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-850">
                                  <input
                                    type="text"
                                    value={countrySearchQuery}
                                    onChange={(e) => setCountrySearchQuery(e.target.value)}
                                    placeholder="Search country or code..."
                                    className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-700 dark:text-slate-100"
                                    autoFocus
                                  />
                                </div>
                                {/* Scrollable List */}
                                <div className="overflow-y-auto flex-1 py-1 max-h-40">
                                  {COUNTRIES.filter(c =>
                                    c.name.toLowerCase().includes(countrySearchQuery.toLowerCase()) ||
                                    c.dialCode.includes(countrySearchQuery) ||
                                    c.code.toLowerCase().includes(countrySearchQuery.toLowerCase())
                                  ).map((country) => (
                                    <button
                                      key={country.code}
                                      type="button"
                                      onClick={() => {
                                        setSelectedCountry(country);
                                        setIsCountryDropdownOpen(false);
                                      }}
                                      className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer ${
                                        selectedCountry.code === country.code ? "bg-teal-50/50 dark:bg-teal-950/20 font-semibold text-teal-700 dark:text-teal-400" : "text-slate-700 dark:text-slate-300"
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 truncate">
                                        <span className="text-sm shrink-0">{country.flag}</span>
                                        <span className="truncate">{country.name}</span>
                                      </div>
                                      <span className="font-mono text-[10px] text-slate-400 shrink-0 pl-2">
                                        {country.dialCode}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Local Phone input field */}
                        <input
                          type="tel"
                          value={localPhoneInput}
                          onChange={(e) => setLocalPhoneInput(e.target.value)}
                          placeholder="e.g. 555-019-2834"
                          className="flex-1 h-8 text-xs font-semibold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-700 dark:text-slate-100 font-mono"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const combined = localPhoneInput.trim() ? `${selectedCountry.dialCode} ${localPhoneInput.trim()}` : "";
                              updatePatientField("phoneNumber", combined);
                              setIsEditingPhone(false);
                              setIsCountryDropdownOpen(false);
                            }
                          }}
                          autoFocus={!isCountryDropdownOpen}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 italic block pl-1">
                        Formatted: {selectedCountry.dialCode} {localPhoneInput || "..."}
                      </span>
                    </div>
                  )}
                </div>

                {/* Place Box */}
                <div className="bg-white dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-850 shadow-2xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-450" /> Physical Place
                    </span>
                    {!isEditingPlace ? (
                      <button
                        onClick={() => setIsEditingPlace(true)}
                        className="text-[10px] text-teal-600 hover:text-teal-700 dark:text-teal-400 font-bold flex items-center gap-0.5 cursor-pointer"
                      >
                        <Pencil className="w-2.5 h-2.5" /> Edit
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          updatePatientField("place", placeInput);
                          setIsEditingPlace(false);
                        }}
                        className="text-[10px] text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-0.5 cursor-pointer"
                      >
                        <Check className="w-2.5 h-2.5" /> Save
                      </button>
                    )}
                  </div>

                  {!isEditingPlace ? (
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-100 block py-1 truncate" title={data.place}>
                      {data.place || <span className="text-slate-400 italic font-normal">No place declared...</span>}
                    </span>
                  ) : (
                    <input
                      type="text"
                      value={placeInput}
                      onChange={(e) => setPlaceInput(e.target.value)}
                      placeholder="e.g. Dallas, Texas"
                      className="w-full text-xs font-semibold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-700 dark:text-slate-100"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          updatePatientField("place", placeInput);
                          setIsEditingPlace(false);
                        }
                      }}
                      autoFocus
                    />
                  )}
                </div>
              </div>

              {/* Patient Location - Get GPS coordinates of the patient's phone/browser */}
              <div className="bg-slate-100/50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-200/50 dark:border-slate-850 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Phone GPS Locator
                    </span>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                      Instantly fetch precise coordinates from the patient's phone/device GPS to automatically locate the nearest pharmacies and diagnostic clinics.
                    </p>
                  </div>

                  <button
                    onClick={fetchCurrentLocation}
                    disabled={gpsLoading}
                    className="shrink-0 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg shadow-xs hover:shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed"
                  >
                    {gpsLoading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Locating...
                      </>
                    ) : (
                      <>
                        <Compass className="w-3.5 h-3.5 animate-pulse" />
                        Get Location from Phone
                      </>
                    )}
                  </button>
                </div>

                {gpsError && (
                  <p className="text-[10px] text-rose-600 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 p-2 rounded-lg font-medium">
                    ⚠️ {gpsError}
                  </p>
                )}

                {data.gpsLatitude && data.gpsLongitude && (
                  <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 flex items-start gap-2.5">
                    <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-lg shrink-0 mt-0.5 border border-emerald-100/30">
                      <Navigation className="w-4 h-4" />
                    </div>
                    <div className="text-[11px] space-y-1 min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-700 dark:text-emerald-400">
                          Active Phone GPS Synced
                        </span>
                        <span className="text-[9px] text-slate-400">
                          Accuracy: ±{Math.round(data.gpsAccuracy || 0)}m
                        </span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-350 leading-tight font-medium truncate">
                        {data.gpsAddress || "Latitude & Longitude parsed"}
                      </p>
                      <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500 font-semibold mt-1">
                        <span>Lat: {data.gpsLatitude.toFixed(6)}</span>
                        <span>Lon: {data.gpsLongitude.toFixed(6)}</span>
                      </div>
                      
                      <div className="pt-2 flex flex-wrap gap-x-4 gap-y-1 items-center">
                        <button
                          onClick={() => {
                            if (setActiveTab) {
                              setActiveTab("care");
                            }
                          }}
                          className="text-[10px] font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          Show on Facilities Map &rarr;
                        </button>
                        <span className="text-slate-300 dark:text-slate-700 text-xs select-none">|</span>
                        <button
                          onClick={() => {
                            if (setActiveTab) {
                              setActiveTab("hospitals");
                            }
                          }}
                          className="text-[10px] font-bold text-rose-600 dark:text-rose-450 hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          Show Emergency Hospitals &rarr;
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Medical conditions and drugs lists */}
            <div className="space-y-3.5 pt-1">
              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1 mb-2">
                  Known Allergies
                </h4>
                {data.allergies && data.allergies.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {data.allergies.map((al, i) => (
                      <span key={i} className="text-[10px] px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-100 font-semibold dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/40">
                        {al}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">No allergies discussed.</p>
                )}
              </div>

              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1 mb-2">
                  Active Medications
                </h4>
                {data.currentMedications && data.currentMedications.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {data.currentMedications.map((med, i) => (
                      <span key={i} className="text-[10px] px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-100 font-semibold dark:bg-teal-950/20 dark:text-teal-400 dark:border-teal-900/40">
                        {med}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">No current medications listed.</p>
                )}
              </div>

              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1 mb-2">
                  Chronic Illnesses & Diseases
                </h4>
                {data.chronicDiseases && data.chronicDiseases.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {data.chronicDiseases.map((dis, i) => (
                      <span key={i} className="text-[10px] px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-250 font-semibold dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                        {dis}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">No chronic conditions declared.</p>
                )}
              </div>

              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1 mb-2">
                  Pregnancy or Breastfeeding
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {data.pregnancyStatus || <span className="text-slate-400 italic">Not discussed / Not applicable</span>}
                </p>
              </div>

              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1 mb-2">
                  Social & Lifestyle Habits
                </h4>
                {data.lifestyleHabits ? (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {data.lifestyleHabits.smoking && (
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                        <Coffee className="w-3.5 h-3.5 text-slate-400" />
                        <span>Smoking: <strong className="font-semibold text-slate-800 dark:text-slate-100">{data.lifestyleHabits.smoking}</strong></span>
                      </div>
                    )}
                    {data.lifestyleHabits.alcohol && (
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                        <Coffee className="w-3.5 h-3.5 text-slate-400" />
                        <span>Alcohol: <strong className="font-semibold text-slate-800 dark:text-slate-100">{data.lifestyleHabits.alcohol}</strong></span>
                      </div>
                    )}
                    {data.lifestyleHabits.sleepQuality && (
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                        <Coffee className="w-3.5 h-3.5 text-slate-400" />
                        <span>Sleep: <strong className="font-semibold text-slate-800 dark:text-slate-100">{data.lifestyleHabits.sleepQuality}</strong></span>
                      </div>
                    )}
                    {data.lifestyleHabits.exercise && (
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                        <Coffee className="w-3.5 h-3.5 text-slate-400" />
                        <span>Exercise: <strong className="font-semibold text-slate-800 dark:text-slate-100">{data.lifestyleHabits.exercise}</strong></span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">Habit logs empty.</p>
                )}
              </div>

              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1 mb-2">
                  Epidemiological Context
                </h4>
                <div className="grid grid-cols-1 gap-1 text-xs text-slate-600 dark:text-slate-300">
                  {data.travelHistory && (
                    <div className="flex items-start gap-1.5">
                      <Trees className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                      <span>Travel: <strong>{data.travelHistory}</strong></span>
                    </div>
                  )}
                  {data.recentInfections && (
                    <div className="flex items-start gap-1.5">
                      <Trees className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                      <span>Recent infections: <strong>{data.recentInfections}</strong></span>
                    </div>
                  )}
                  {data.environmentalExposure && (
                    <div className="flex items-start gap-1.5">
                      <Trees className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                      <span>Environmental: <strong>{data.environmentalExposure}</strong></span>
                    </div>
                  )}
                  {!data.travelHistory && !data.recentInfections && !data.environmentalExposure && (
                    <p className="text-[11px] text-slate-400 italic">No travel or exposure context given.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TRI_GE & DIAGNOSIS */}
        {activeTab === "diagnosis" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Symptom-Match Possibilities ({session.possibleConditions.length})
              </h4>
              {session.recommendedSpecialist && (
                <span className="text-[10px] bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold px-2.5 py-1 rounded-md">
                  Specialist: {session.recommendedSpecialist}
                </span>
              )}
            </div>

            {session.possibleConditions.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 dark:bg-slate-950 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                  Provide symptoms, pain scales, and timeline background to compile possible conditions dynamically.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {session.possibleConditions.map((cond, i) => {
                  const isExpanded = expandedCondition === cond.name;
                  const probColors =
                    cond.probabilityCategory === "High Probability"
                      ? "bg-rose-50 border-rose-100 text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/40"
                      : cond.probabilityCategory === "Moderate Probability"
                      ? "bg-amber-50 border-amber-100 text-amber-600 dark:bg-amber-950/20 dark:border-amber-900/40"
                      : "bg-green-50 border-green-100 text-green-600 dark:bg-green-950/20 dark:border-green-900/40";

                  return (
                    <div
                      key={i}
                      className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden hover:shadow-sm transition-all"
                    >
                      <button
                        onClick={() => setExpandedCondition(isExpanded ? null : cond.name)}
                        className="w-full p-3.5 flex items-start justify-between text-left cursor-pointer"
                      >
                        <div className="space-y-1.5 min-w-0 pr-4">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <h5 className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">
                              {cond.name}
                            </h5>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${probColors}`}>
                              {cond.probabilityCategory}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                            {cond.reasoning}
                          </p>
                        </div>
                        <div className="flex flex-col items-end shrink-0 justify-between h-full gap-2.5">
                          <span className="text-xs font-mono font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded">
                            {cond.confidencePercentage}% Match
                          </span>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="px-4 pb-4 pt-1.5 border-t border-slate-50 dark:border-slate-950 space-y-3.5 bg-slate-50/20 dark:bg-slate-950/5">
                          {/* Reasoning */}
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                              Clinical Rationale
                            </span>
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                              {cond.reasoning}
                            </p>
                          </div>

                          {/* Supporting vs conflicting */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {cond.supportingSymptoms && cond.supportingSymptoms.length > 0 && (
                              <div className="space-y-1">
                                <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider block">
                                  Supporting Symptoms
                                </span>
                                <ul className="space-y-0.5">
                                  {cond.supportingSymptoms.map((sym, idx) => (
                                    <li key={idx} className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
                                      {sym}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {cond.conflictingSymptoms && cond.conflictingSymptoms.length > 0 && (
                              <div className="space-y-1">
                                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">
                                  Symptoms Absent / Conflicting
                                </span>
                                <ul className="space-y-0.5">
                                  {cond.conflictingSymptoms.map((sym, idx) => (
                                    <li key={idx} className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1">
                                      <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                                      {sym}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>

                          {/* Complications */}
                          {cond.complicationsIfUntreated && (
                            <div className="bg-rose-50/40 dark:bg-rose-950/10 p-2.5 rounded-lg border border-rose-100/30 dark:border-rose-900/10">
                              <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider block mb-0.5">
                                Potential Complications if Untreated
                              </span>
                              <p className="text-xs text-rose-800 dark:text-rose-300 leading-relaxed">
                                {cond.complicationsIfUntreated}
                              </p>
                            </div>
                          )}

                          {/* Action */}
                          <div className="bg-teal-50/40 dark:bg-teal-950/10 p-2.5 rounded-lg border border-teal-100/30 dark:border-teal-900/10">
                            <span className="text-[10px] font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider block mb-0.5">
                              Recommended Medical Action
                            </span>
                            <p className="text-xs text-teal-800 dark:text-teal-300 leading-relaxed font-semibold">
                              {cond.recommendedAction}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Recommended Home Care & Preventive Measures */}
            {(session.recommendedHomeCare.length > 0 || session.preventiveMeasures.length > 0) && (
              <div className="grid grid-cols-1 gap-3.5 border-t border-slate-100 dark:border-slate-800 pt-4">
                {session.recommendedHomeCare.length > 0 && (
                  <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-100 dark:border-slate-850 space-y-2">
                    <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <BookmarkPlus className="w-4 h-4 text-teal-600" /> Conservative Home Care
                    </h5>
                    <ul className="space-y-1">
                      {session.recommendedHomeCare.map((rem, i) => (
                        <li key={i} className="text-[11px] text-slate-600 dark:text-slate-350 flex items-start gap-1.5 leading-relaxed">
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-500 mt-0.5 shrink-0" />
                          <span>{rem}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {session.preventiveMeasures.length > 0 && (
                  <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-100 dark:border-slate-850 space-y-2">
                    <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-teal-600" /> Lifestyle Prevention Measures
                    </h5>
                    <ul className="space-y-1">
                      {session.preventiveMeasures.map((prev, i) => (
                        <li key={i} className="text-[11px] text-slate-600 dark:text-slate-350 flex items-start gap-1.5 leading-relaxed">
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-500 mt-0.5 shrink-0" />
                          <span>{prev}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: MEDICINES DIRECTORY */}
        {activeTab === "medicines" && (
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">
              Educational Drug Information Directory ({session.educationalMedicines.length})
            </h4>

            {session.educationalMedicines.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 dark:bg-slate-950 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                  Educational guidance on medicines will display here if discussed during chat, or if related to analyzed symptoms.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {session.educationalMedicines.map((med, i) => {
                  const isExpanded = expandedMedicine === med.name;
                  return (
                    <div
                      key={i}
                      className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden hover:shadow-sm transition-all"
                    >
                      <button
                        onClick={() => setExpandedMedicine(isExpanded ? null : med.name)}
                        className="w-full p-3.5 flex items-start justify-between text-left cursor-pointer"
                      >
                        <div className="space-y-1.5 min-w-0 pr-4">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <h5 className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">
                              {med.name}
                            </h5>
                            <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                              {med.category}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                            Uses: {med.commonUses}
                          </p>
                        </div>
                        <div className="flex flex-col items-end shrink-0 justify-between h-full gap-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${med.type === "Over-the-Counter" ? "bg-teal-50 text-teal-600 dark:bg-teal-950/20" : "bg-purple-50 text-purple-600 dark:bg-purple-950/20"}`}>
                            {med.type}
                          </span>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="px-4 pb-4 pt-1.5 border-t border-slate-50 dark:border-slate-950 space-y-3 bg-slate-50/20 dark:bg-slate-950/5">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                              Mechanism of Action
                            </span>
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                              {med.mechanismOfAction}
                            </p>
                          </div>

                          {med.commonAdultDosageRange && (
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                                Typical Adult Dosage Range
                              </span>
                              <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold">
                                {med.commonAdultDosageRange}
                              </p>
                              <span className="text-[9px] text-slate-400 block mt-0.5">
                                *Reminds: Do not exceed doctor's prescription. Do not self-prescribe.
                              </span>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-2.5">
                            {med.commonSideEffects && med.commonSideEffects.length > 0 && (
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                                  Common Side Effects
                                </span>
                                <ul className="list-disc pl-3 text-[11px] text-slate-600 dark:text-slate-300">
                                  {med.commonSideEffects.map((se, idx) => <li key={idx}>{se}</li>)}
                                </ul>
                              </div>
                            )}

                            {med.seriousSideEffects && med.seriousSideEffects.length > 0 && (
                              <div>
                                <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider block mb-0.5">
                                  Serious Side Effects (Contact Doc)
                                </span>
                                <ul className="list-disc pl-3 text-[11px] text-red-700 dark:text-red-400">
                                  {med.seriousSideEffects.map((se, idx) => <li key={idx}>{se}</li>)}
                                </ul>
                              </div>
                            )}
                          </div>

                          {med.contraindications && med.contraindications.length > 0 && (
                            <div>
                              <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block mb-0.5">
                                Contraindications
                              </span>
                              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-semibold">
                                {med.contraindications.join(", ")}
                              </p>
                            </div>
                          )}

                          {med.drugInteractions && med.drugInteractions.length > 0 && (
                            <div>
                              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block mb-0.5">
                                Potential Drug Interactions
                              </span>
                              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                {med.drugInteractions.join(", ")}
                              </p>
                            </div>
                          )}

                          {med.precautions && (
                            <div className="bg-slate-100 dark:bg-slate-950 p-2 rounded text-[11px] text-slate-500 leading-relaxed">
                              <strong className="text-slate-700 dark:text-slate-200 block mb-0.5">Special Precautions:</strong>
                              {med.precautions}
                            </div>
                          )}

                          {med.storageInstructions && (
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                                Storage & Handling
                              </span>
                              <p className="text-xs text-slate-600 dark:text-slate-300">
                                {med.storageInstructions}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: EXTERNAL MEDICAL FACILITIES */}
        {activeTab === "care" && <LocationFinder session={session} />}

        {/* TAB 5: EMERGENCY HOSPITALS */}
        {activeTab === "hospitals" && <HospitalLocator session={session} />}

        {/* TAB 6: CLINICAL HISTORY & TRENDS */}
        {activeTab === "history" && (
          <HistoryPanel
            sessions={sessions}
            activeSessionId={activeSessionId}
            onSelectSession={onSelectSession}
            onDeleteSession={onDeleteSession}
            onStartNewSession={onStartNewSession}
            onUpdateSessions={onUpdateSessions}
          />
        )}
      </div>
    </div>
  );
};
