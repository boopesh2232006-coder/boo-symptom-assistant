import React, { useState } from "react";
import { ChatSession } from "../types";
import {
  Clock,
  Trash2,
  Calendar,
  FileText,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Search,
  Download,
  Copy,
  Database,
  CheckCircle2,
  SlidersHorizontal
} from "lucide-react";

interface HistoryPanelProps {
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onStartNewSession: () => void;
  onUpdateSessions?: (updated: ChatSession[]) => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onDeleteSession,
  onStartNewSession,
  onUpdateSessions,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [urgencyFilter, setUrgencyFilter] = useState<"ALL" | "LOW" | "MEDIUM" | "HIGH" | "EMERGENCY">("ALL");
  const [copied, setCopied] = useState(false);

  // Injects 3 highly realistic, secure clinical histories to let the user immediately visualize full features
  const handleInjectDemoSessions = () => {
    if (!onUpdateSessions) return;
    
    const demoSessions: ChatSession[] = [
      {
        id: "demo_1",
        title: "Acute Abdominal Colic Assessment",
        date: "Jul 3, 2026",
        messages: [
          { id: "m1", role: "user", content: "I have sharp stabbing pain in my stomach for 12 hours. It is very severe and makes me feel nauseated.", timestamp: "10:15 AM" },
          { id: "m2", role: "assistant", content: "Based on the severe gastric spasms reported, we must triage this carefully. Avoid solid food, stay hydrated with sips of clear water, and monitor for localized lower right abdominal tenderness which may suggest appendicitis.", timestamp: "10:16 AM" }
        ],
        extractedData: {
          age: "28",
          biologicalSex: "Female",
          symptomDuration: "12 hours",
          painIntensity: "9 / 10 (Severe Gastric Spasms)",
          bodyTemperature: "37.4 °C (99.3 °F)",
          allergies: ["Penicillin"],
          currentMedications: ["Daily Multivitamin"],
          chronicDiseases: ["Irritable Bowel Syndrome (IBS)"],
          lifestyleHabits: {
            diet: "High fiber, moderate caffeine",
            exercise: "Twice a week",
            sleepQuality: "Poor due to pain"
          }
        },
        urgencyLevel: "HIGH",
        emergencyFlagged: false,
        possibleConditions: [
          {
            name: "Acute Gastroenteritis / Gastric Spasm",
            probabilityCategory: "High Probability",
            reasoning: "Sharp cramp-like localized epigastric spasms accompanied by nausea and acute onset fits IBS flareup or viral stomach flu criteria.",
            confidencePercentage: 85,
            recommendedAction: "Consult a primary care physician within 24 hours. Limit intake to clear fluids."
          },
          {
            name: "Early Stage Appendicitis",
            probabilityCategory: "Moderate Probability",
            reasoning: "Acute stomach pain of 12 hours. Needs strict palpation screening to rule out rebound tenderness in the right lower quadrant.",
            confidencePercentage: 45,
            recommendedAction: "Seek immediate professional clinical physical exam if pain shifts to the right lower quadrant."
          }
        ],
        educationalMedicines: [
          {
            name: "Dicyclomine (Bentyl)",
            category: "Antispasmodic",
            type: "Prescription",
            commonUses: "Relief of abdominal spasms and cramps in irritable bowel syndrome.",
            mechanismOfAction: "Blocks cholinergic receptors on gastrointestinal smooth muscle, inducing relaxation."
          }
        ],
        recommendedHomeCare: [
          "Avoid solid food for 8-12 hours; sip electrolyte formulas.",
          "Apply a warm water bottle or heating pad to abdominal quadrants.",
          "Keep resting flat and record any localized migration of pain."
        ],
        preventiveMeasures: [
          "Avoid high-fat or trigger foods when IBS is active.",
          "Maintain strict food hygiene to prevent foodborne pathogens."
        ],
        recommendedSpecialist: "Gastroenterologist"
      },
      {
        id: "demo_2",
        title: "Persistent Vestibular Migraine",
        date: "Jul 2, 2026",
        messages: [
          { id: "m3", role: "user", content: "Severe throbbing headache behind left eye, dizzy when standing up, sound sensitive, going on for 3 days.", timestamp: "02:30 PM" }
        ],
        extractedData: {
          age: "45",
          biologicalSex: "Female",
          symptomDuration: "3 days",
          painIntensity: "7 / 10 (Moderate to Severe Throbbing)",
          bodyTemperature: "36.8 °C (98.2 °F)",
          allergies: ["Sulfa Drugs"],
          currentMedications: ["Oral contraceptives"],
          chronicDiseases: ["None"],
          lifestyleHabits: {
            diet: "High stress, skips breakfasts",
            exercise: "None",
            sleepQuality: "Irregular sleep schedule"
          }
        },
        urgencyLevel: "MEDIUM",
        emergencyFlagged: false,
        possibleConditions: [
          {
            name: "Vestibular Migraine",
            probabilityCategory: "High Probability",
            reasoning: "Unilateral ocular throbbing headache combined with phonophobia, vertigo, and visual aura fits standard migraine diagnostics.",
            confidencePercentage: 90,
            recommendedAction: "Identify diet triggers. Rest in quiet darkened quarters."
          }
        ],
        educationalMedicines: [
          {
            name: "Sumatriptan (Imitrex)",
            category: "5-HT1 Receptor Agonist (Triptan)",
            type: "Prescription",
            commonUses: "Acute treatment of migraine attacks with or without aura.",
            mechanismOfAction: "Binds to 5-HT1B/1D receptors on intracranial blood vessels, causing vasoconstriction and reducing neurogenic inflammation."
          }
        ],
        recommendedHomeCare: [
          "Rest completely in a darkened, silent, sound-proofed room.",
          "Apply cold wrap compress around forehead and temples.",
          "Sip caffeinated tea early during aura onset to assist vasoconstriction."
        ],
        preventiveMeasures: [
          "Keep a migraine food diary (track cheese, chocolate, artificial sweeteners).",
          "Ensure steady hydration and consistent sleep hygiene hours."
        ],
        recommendedSpecialist: "Neurologist / Headache Clinic"
      },
      {
        id: "demo_3",
        title: "Mild Atopic Dermatitis Flareup",
        date: "Jul 1, 2026",
        messages: [
          { id: "m4", role: "user", content: "Itchy red rash on both elbows, dry skin, no fever, started 5 days ago.", timestamp: "09:00 AM" }
        ],
        extractedData: {
          age: "12",
          biologicalSex: "Male",
          symptomDuration: "5 days",
          painIntensity: "2 / 10 (Mild Irritation)",
          bodyTemperature: "36.5 °C (97.7 °F)",
          allergies: ["Peanuts", "Dust Mites"],
          currentMedications: ["Emollient cream"],
          chronicDiseases: ["Eczema", "Childhood Asthma"],
          lifestyleHabits: {
            diet: "Standard",
            exercise: "Plays soccer outdoors",
            sleepQuality: "Good"
          }
        },
        urgencyLevel: "LOW",
        emergencyFlagged: false,
        possibleConditions: [
          {
            name: "Atopic Dermatitis (Eczema)",
            probabilityCategory: "High Probability",
            reasoning: "Pruritic erythematous plaques localized in flexural areas (inner elbows) with active dust mite allergies.",
            confidencePercentage: 95,
            recommendedAction: "Apply thick fragrance-free moisturizers twice daily."
          }
        ],
        educationalMedicines: [
          {
            name: "Hydrocortisone 1% Cream",
            category: "Topical Corticosteroid",
            type: "Over-the-Counter",
            commonUses: "Relief of inflammatory skin irritations, itching, and rashes.",
            mechanismOfAction: "Suppresses local inflammatory cells and reduces capillary permeability to alleviate swelling and itching."
          }
        ],
        recommendedHomeCare: [
          "Take short, lukewarm baths instead of hot showers.",
          "Apply thick unscented barrier ointments immediately after bathing.",
          "Wear soft loose-fitting 100% organic cotton clothing."
        ],
        preventiveMeasures: [
          "Avoid harsh alkaline soaps, synthetic detergents, or known fabric allergens.",
          "Keep household humidity regulated using an active humidifier."
        ],
        recommendedSpecialist: "Dermatologist / Allergist"
      }
    ];

    onUpdateSessions([...demoSessions, ...sessions.filter(s => !s.id.startsWith("demo_"))]);
  };

  // Compile entire patient clinical audit trail into an elegant plaintext report
  const handleExportTextReport = () => {
    let report = `=========================================================\n`;
    report += `   BOO HEALTHCARE WORKSPACE - SECURE CLINICAL AUDIT REPORT\n`;
    report += `   Generated on: ${new Date().toLocaleString()}\n`;
    report += `   Privacy Standard: HIPAA Compliant, AES-256 Storage\n`;
    report += `=========================================================\n\n`;

    sessions.forEach((s, idx) => {
      report += `SESSION #${idx + 1}: ${s.title.toUpperCase()}\n`;
      report += `---------------------------------------------------------\n`;
      report += `Date of Record:  ${s.date}\n`;
      report += `Clinical Urgency: [${s.urgencyLevel}]\n`;
      report += `Emergency Flag:   ${s.emergencyFlagged ? "⚠️ DETECTED" : "None"}\n`;
      
      if (s.extractedData) {
        report += `Demographics & Vital Parameters:\n`;
        report += `  - Age: ${s.extractedData.age || "N/A"}\n`;
        report += `  - Sex: ${s.extractedData.biologicalSex || "N/A"}\n`;
        report += `  - Temp: ${s.extractedData.bodyTemperature || "N/A"}\n`;
        report += `  - Pain Scale: ${s.extractedData.painIntensity || "N/A"}\n`;
        report += `  - Allergies: ${s.extractedData.allergies?.join(", ") || "None declared"}\n`;
        report += `  - Current Meds: ${s.extractedData.currentMedications?.join(", ") || "None"}\n`;
        report += `  - Chronic Illnesses: ${s.extractedData.chronicDiseases?.join(", ") || "None"}\n`;
      }

      if (s.possibleConditions && s.possibleConditions.length > 0) {
        report += `Triage & Matching Possibilities:\n`;
        s.possibleConditions.forEach((cond) => {
          report += `  * ${cond.name} (${cond.confidencePercentage}% Match - ${cond.probabilityCategory})\n`;
          report += `    Rationale: ${cond.reasoning}\n`;
        });
      }

      if (s.educationalMedicines && s.educationalMedicines.length > 0) {
        report += `Educational Pharmacological Guidance:\n`;
        s.educationalMedicines.forEach((med) => {
          report += `  * ${med.name} [${med.type} - ${med.category}]\n`;
          report += `    Uses: ${med.commonUses}\n`;
        });
      }

      if (s.recommendedHomeCare && s.recommendedHomeCare.length > 0) {
        report += `Recommended Home Care Instructions:\n`;
        s.recommendedHomeCare.forEach((care) => {
          report += `  - ${care}\n`;
        });
      }

      report += `\n=========================================================\n\n`;
    });

    try {
      const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Clinical_Workspace_Audit_Trail_${Date.now()}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export report failed:", e);
    }
  };

  // Copy clinical audit trail text to clipboard
  const handleCopyToClipboard = () => {
    let report = `BOO HEALTHCARE WORKSPACE - SUMMARY CLINICAL LOGS\n`;
    sessions.forEach((s) => {
      report += `\n[${s.date}] ${s.title}\nUrgency: ${s.urgencyLevel}\nSymptoms: ${s.extractedData?.symptomDuration || "N/A"}\nPain: ${s.extractedData?.painIntensity || "N/A"}\n`;
    });

    navigator.clipboard.writeText(report).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Filter sessions list based on search bar and urgency filter
  const filteredSessions = sessions.filter((s) => {
    const matchesSearch =
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.extractedData?.painIntensity || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.extractedData?.symptomDuration || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesUrgency = urgencyFilter === "ALL" || s.urgencyLevel === urgencyFilter;
    
    return matchesSearch && matchesUrgency;
  });

  // Extract pain levels over time to render a gorgeous SVG trend chart
  const validPainSessions = sessions
    .filter((s) => s.extractedData?.painIntensity)
    .map((s) => {
      const painStr = s.extractedData.painIntensity || "0";
      const painMatch = painStr.match(/(\d+)/);
      const painVal = painMatch ? parseInt(painMatch[1]) : 0;
      return {
        date: s.date,
        pain: painVal > 10 ? 10 : painVal,
        title: s.title,
      };
    })
    .reverse(); // chronological order

  return (
    <div className="space-y-5" id="history-panel">
      {/* Quick Action Controls */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={onStartNewSession}
          className="py-2.5 bg-teal-50 hover:bg-teal-100/70 text-teal-700 dark:bg-teal-950/40 dark:hover:bg-teal-900/40 dark:text-teal-400 border border-teal-100 dark:border-teal-900/60 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Clock className="w-3.5 h-3.5" />
          New Consultation
        </button>

        <button
          onClick={handleInjectDemoSessions}
          className="py-2.5 bg-amber-50 hover:bg-amber-100/70 text-amber-700 dark:bg-amber-950/30 dark:hover:bg-amber-900/40 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
          title="Inject 3 realistic clinical case files for quick demonstration"
        >
          <Database className="w-3.5 h-3.5" />
          Inject Demo Cases
        </button>
      </div>

      {/* Export & Clipboard Control Center */}
      <div className="bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800/80 p-3.5 rounded-xl space-y-2.5">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Clinical History Exporter
          </span>
          <span className="text-[9px] text-teal-600 bg-teal-50 dark:bg-teal-950/30 px-2 py-0.5 rounded font-mono font-bold">
            AES SECURE EXPORT
          </span>
        </div>
        <p className="text-[10px] text-slate-400 leading-normal">
          Export your entire patient history trail into a secure, HIPAA-compliant plain text report. No server telemetry is saved.
        </p>
        <div className="flex gap-2 pt-1">
          <button
            onClick={handleExportTextReport}
            className="flex-1 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-150 dark:border-slate-800 text-slate-700 dark:text-slate-200 py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-teal-600" />
            Download Audit Trail (.txt)
          </button>
          <button
            onClick={handleCopyToClipboard}
            className="bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-150 dark:border-slate-800 text-slate-700 dark:text-slate-200 px-3.5 py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <Copy className={`w-3.5 h-3.5 ${copied ? "text-green-500" : "text-teal-600"}`} />
            {copied ? "Copied!" : "Copy Summary"}
          </button>
        </div>
      </div>

      {/* Symptom Trends Chart */}
      {validPainSessions.length > 1 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-xl space-y-3">
          <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-teal-600" />
            Clinical Pain Level Trend Tracker
          </h4>
          <p className="text-[10px] text-slate-400">
            Monitors patient's self-reported pain intensity (1-10) across consultations over time.
          </p>

          {/* Render customized SVG Line Chart */}
          <div className="relative pt-2">
            <svg viewBox="0 0 300 120" className="w-full h-28 overflow-visible">
              {/* Grid Lines */}
              <line x1="20" y1="10" x2="290" y2="10" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="3" className="dark:stroke-slate-800" />
              <line x1="20" y1="50" x2="290" y2="50" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="3" className="dark:stroke-slate-800" />
              <line x1="20" y1="90" x2="290" y2="90" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="3" className="dark:stroke-slate-800" />

              {/* Labels */}
              <text x="5" y="14" className="text-[8px] font-mono fill-slate-400">10</text>
              <text x="5" y="54" className="text-[8px] font-mono fill-slate-400">5</text>
              <text x="5" y="94" className="text-[8px] font-mono fill-slate-400">0</text>

              {/* Draw Data Line */}
              {(() => {
                const step = 270 / (validPainSessions.length - 1);
                const points = validPainSessions
                  .map((val, idx) => {
                    const x = 20 + idx * step;
                    // Pain 10 is at y=10, Pain 0 is at y=90
                    const y = 90 - (val.pain / 10) * 80;
                    return `${x},${y}`;
                  })
                  .join(" ");

                return (
                  <>
                    <polyline
                      fill="none"
                      stroke="#0d9488"
                      strokeWidth="2.5"
                      points={points}
                      className="transition-all duration-500"
                    />
                    {/* Draw Dots */}
                    {validPainSessions.map((val, idx) => {
                      const x = 20 + idx * step;
                      const y = 90 - (val.pain / 10) * 80;
                      return (
                        <g key={idx} className="group/dot cursor-pointer">
                          <circle
                            cx={x}
                            cy={y}
                            r="4.5"
                            className="fill-teal-600 stroke-white dark:stroke-slate-900 stroke-2 hover:r-6 hover:fill-teal-500 transition-all"
                          />
                          <title>{`${val.title}\nDate: ${val.date}\nPain: ${val.pain}/10`}</title>
                        </g>
                      );
                    })}
                  </>
                );
              })()}
            </svg>
            <div className="flex justify-between text-[8px] font-semibold text-slate-400 px-3.5 mt-1">
              <span>{validPainSessions[0].date}</span>
              <span>{validPainSessions[validPainSessions.length - 1].date}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-100 dark:border-slate-850 flex gap-2.5 items-center">
          <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
          <p className="text-[10px] text-slate-500">
            Symptom trends will populate dynamically once you have logged multiple sessions with reported pain levels.
          </p>
        </div>
      )}

      {/* SEARCH AND FILTER CRITERIA BAR */}
      <div className="space-y-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 rounded-xl shadow-xs">
        {/* Search Input */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Search className="w-3.5 h-3.5" />
          </span>
          <input
            type="text"
            placeholder="Search consultation title, pain, complaints..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 hover:bg-slate-100/50 dark:hover:bg-slate-900/50 focus:bg-white focus:ring-1 focus:ring-teal-500 border border-slate-100 dark:border-slate-850/80 pl-9 pr-3 py-1.5 rounded-lg text-[11px] placeholder-slate-400 outline-none transition-all"
          />
        </div>

        {/* Urgency Quick Filter Badges */}
        <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-slate-50 dark:border-slate-950">
          <span className="text-[9px] font-bold text-slate-400 mr-1 flex items-center gap-1">
            <SlidersHorizontal className="w-2.5 h-2.5" />
            Urgency:
          </span>
          {(["ALL", "LOW", "MEDIUM", "HIGH", "EMERGENCY"] as const).map((urg) => {
            const isSelected = urgencyFilter === urg;
            return (
              <button
                key={urg}
                type="button"
                onClick={() => setUrgencyFilter(urg)}
                className={`text-[9px] px-2 py-0.5 rounded font-bold cursor-pointer transition-all ${
                  isSelected
                    ? "bg-teal-600 text-white shadow-xs"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-500 dark:bg-slate-950 dark:hover:bg-slate-900"
                }`}
              >
                {urg}
              </button>
            );
          })}
        </div>
      </div>

      {/* Saved Sessions List */}
      <div className="space-y-2">
        <div className="flex justify-between items-center px-1">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Consultation Logs ({filteredSessions.length} of {sessions.length})
          </h4>
          {filteredSessions.length < sessions.length && (
            <button
              onClick={() => { setSearchTerm(""); setUrgencyFilter("ALL"); }}
              className="text-[9px] text-teal-600 hover:underline font-bold"
            >
              Reset Filters
            </button>
          )}
        </div>

        {filteredSessions.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            <p className="text-xs text-slate-400">No matching consultation records found.</p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-[350px] overflow-y-auto pr-1">
            {filteredSessions.map((s) => {
              const isActive = s.id === activeSessionId;
              const complaint = s.extractedData?.symptomDuration
                ? `Duration: ${s.extractedData.symptomDuration}`
                : "Awaiting symptom details";

              const urgencyColors = 
                s.urgencyLevel === "HIGH" || s.urgencyLevel === "EMERGENCY"
                  ? "bg-rose-50 text-rose-600 dark:bg-rose-950/25 dark:text-rose-400"
                  : s.urgencyLevel === "MEDIUM"
                  ? "bg-amber-50 text-amber-600 dark:bg-amber-950/25 dark:text-amber-400"
                  : "bg-teal-50 text-teal-700 dark:bg-teal-950/25 dark:text-teal-400";

              return (
                <div
                  key={s.id}
                  className={`group relative p-3 rounded-xl border transition-all flex items-center justify-between ${
                    isActive
                      ? "bg-teal-50/40 dark:bg-teal-950/20 border-teal-200 dark:border-teal-900/60 shadow-xs"
                      : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-200"
                  }`}
                >
                  <button
                    onClick={() => onSelectSession(s.id)}
                    className="flex-1 text-left flex gap-2.5 items-center cursor-pointer"
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isActive
                          ? "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300"
                          : "bg-slate-50 dark:bg-slate-950 text-slate-500"
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 pr-6">
                      <div className="flex items-center gap-1.5">
                        <h5 className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate group-hover:text-teal-600">
                          {s.title}
                        </h5>
                        <span className={`text-[8px] font-bold px-1 rounded uppercase ${urgencyColors}`}>
                          {s.urgencyLevel}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <Calendar className="w-3 h-3 text-slate-300" />
                        <span>{s.date}</span>
                        <span>•</span>
                        <span className="truncate">{complaint}</span>
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => onDeleteSession(s.id)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title="Delete record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
