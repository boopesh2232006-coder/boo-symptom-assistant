import React, { useState } from "react";
import { AlertTriangle, Plus, Trash2, Heart, ShieldAlert, Sparkles } from "lucide-react";

interface InteractionRule {
  drugs: string[];
  severity: "Severe" | "Moderate" | "Mild";
  title: string;
  description: string;
}

const INTERACTION_DATABASE: InteractionRule[] = [
  {
    drugs: ["ibuprofen", "aspirin"],
    severity: "Moderate",
    title: "Increased Bleeding Risk",
    description: "Combining multiple NSAIDs increases the hazard of gastrointestinal bleeding, ulcers, and kidney irritation. Ibuprofen can also reduce the cardioprotective benefits of low-dose aspirin."
  },
  {
    drugs: ["acetaminophen", "alcohol"],
    severity: "Severe",
    title: "Hepatotoxicity Risk (Liver Toxicity)",
    description: "Chronic alcohol consumption paired with high doses of acetaminophen (Tylenol) can cause acute liver failure due to depletion of glutathione levels required to detoxify acetaminophen's toxic metabolite."
  },
  {
    drugs: ["lisinopril", "spironolactone"],
    severity: "Moderate",
    title: "Hyperkalemia Hazard (High Potassium)",
    description: "Both ACE inhibitors (Lisinopril) and potassium-sparing diuretics (Spironolactone) increase potassium levels in the blood. Combining them can lead to dangerous cardiac arrhythmias."
  },
  {
    drugs: ["warfarin", "aspirin"],
    severity: "Severe",
    title: "Extreme Hemorrhagic Risk (Bleeding)",
    description: "Combining the anticoagulant Warfarin with antiplatelet Aspirin dramatically elevates the threat of internal, gastrointestinal, and cranial bleeding. Must only be taken together under close specialist supervision."
  },
  {
    drugs: ["sildenafil", "nitroglycerin"],
    severity: "Severe",
    title: "Life-Threatening Hypotension",
    description: "Sildenafil (Viagra) potentates the vasodilatory actions of organic nitrates (Nitroglycerin). Taking these together can cause a sudden, severe, and potentially fatal drop in blood pressure."
  },
  {
    drugs: ["fluoxetine", "phenelzine"],
    severity: "Severe",
    title: "Serotonin Syndrome Risk",
    description: "Fluoxetine (an SSRI) combined with Phenelzine (an MAOI) can cause a toxic accumulation of serotonin in the central nervous system, leading to hyperthermia, rigidity, mental status changes, and death."
  },
  {
    drugs: ["calcium", "levothyroxine"],
    severity: "Mild",
    title: "Reduced Thyroid Hormone Absorption",
    description: "Calcium supplements can bind to Levothyroxine in the gut, reducing its absorption. Administer Levothyroxine at least 4 hours apart from calcium supplements."
  },
  {
    drugs: ["simvastatin", "grapefruit juice"],
    severity: "Moderate",
    title: "Increased Statin Levels (Myopathy Risk)",
    description: "Grapefruit juice inhibits the CYP3A4 enzyme, leading to elevated blood levels of Simvastatin. This significantly increases the risk of muscle pain (myopathy) and rhabdomyolysis."
  },
  {
    drugs: ["metformin", "contrast dye"],
    severity: "Severe",
    title: "Lactic Acidosis Hazard",
    description: "Iodinated contrast media used in medical imaging can cause temporary renal impairment, which can lead to a toxic accumulation of Metformin, resulting in potentially fatal lactic acidosis."
  }
];

export const InteractionChecker: React.FC = () => {
  const [selectedMeds, setSelectedMeds] = useState<string[]>([]);
  const [medInput, setMedInput] = useState("");

  const handleAddMed = (e: React.FormEvent) => {
    e.preventDefault();
    const formatted = medInput.trim();
    if (!formatted) return;

    if (!selectedMeds.some((m) => m.toLowerCase() === formatted.toLowerCase())) {
      setSelectedMeds([...selectedMeds, formatted]);
    }
    setMedInput("");
  };

  const handleRemoveMed = (index: number) => {
    setSelectedMeds(selectedMeds.filter((_, i) => i !== index));
  };

  // Find interactions between any pairs in selectedMeds
  const findInteractions = () => {
    const activeRules: InteractionRule[] = [];
    const lowerMeds = selectedMeds.map((m) => m.toLowerCase());

    for (let i = 0; i < lowerMeds.length; i++) {
      for (let j = i + 1; j < lowerMeds.length; j++) {
        const medA = lowerMeds[i];
        const medB = lowerMeds[j];

        // Search in database
        const match = INTERACTION_DATABASE.find(
          (rule) =>
            (rule.drugs[0] === medA && rule.drugs[1] === medB) ||
            (rule.drugs[0] === medB && rule.drugs[1] === medA)
        );

        if (match) {
          activeRules.push(match);
        }
      }
    }
    return activeRules;
  };

  const activeInteractions = findInteractions();

  return (
    <div className="space-y-4">
      {/* Search/Add Box */}
      <form onSubmit={handleAddMed} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center gap-2 pb-1 border-b border-slate-200 dark:border-slate-800">
          <ShieldAlert className="w-4 h-4 text-rose-500" />
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Drug-Drug Interaction Checker
          </h4>
        </div>

        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
          Select or add multiple medications to analyze potential dangerous reactions. Examples: <strong>Aspirin + Warfarin</strong>, <strong>Ibuprofen + Aspirin</strong>, <strong>Acetaminophen + Alcohol</strong>.
        </p>

        <div className="flex gap-2">
          <input
            type="text"
            value={medInput}
            onChange={(e) => setMedInput(e.target.value)}
            placeholder="Search or enter medicine name..."
            className="flex-1 text-xs font-medium bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-850 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-rose-500 text-slate-700 dark:text-slate-100"
            list="common-interactive-meds"
          />
          <datalist id="common-interactive-meds">
            <option value="Aspirin" />
            <option value="Ibuprofen" />
            <option value="Acetaminophen" />
            <option value="Alcohol" />
            <option value="Lisinopril" />
            <option value="Spironolactone" />
            <option value="Warfarin" />
            <option value="Sildenafil" />
            <option value="Nitroglycerin" />
            <option value="Fluoxetine" />
            <option value="Phenelzine" />
            <option value="Calcium" />
            <option value="Levothyroxine" />
            <option value="Simvastatin" />
            <option value="Grapefruit Juice" />
            <option value="Metformin" />
            <option value="Contrast Dye" />
          </datalist>
          <button
            type="submit"
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>
      </form>

      {/* Selected Medications Shelf */}
      <div className="space-y-2">
        <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
          Cabinet to Analyze ({selectedMeds.length})
        </h5>
        {selectedMeds.length === 0 ? (
          <p className="text-[11px] text-slate-400 italic">No drugs selected for analysis.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {selectedMeds.map((med, idx) => (
              <span
                key={idx}
                className="text-xs px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-750 font-bold flex items-center gap-1.5"
              >
                <span>{med}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveMed(idx)}
                  className="text-slate-400 hover:text-red-500 cursor-pointer"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Interaction Reports */}
      {selectedMeds.length >= 2 && (
        <div className="space-y-2.5 pt-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h5 className="text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
              Safety Screening Results ({activeInteractions.length})
            </h5>
          </div>

          {activeInteractions.length === 0 ? (
            <div className="bg-emerald-50/50 dark:bg-emerald-950/10 p-3.5 rounded-xl border border-emerald-150 dark:border-emerald-900/30 flex items-start gap-2.5">
              <Heart className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div className="text-[11px]">
                <strong className="text-emerald-800 dark:text-emerald-400 block font-bold">
                  No Known Interactions Found
                </strong>
                <p className="text-emerald-600 dark:text-emerald-500 mt-0.5 leading-relaxed font-medium">
                  No primary warning triggers match between the selected agents. Note: Always consult with a pharmacist/physician for a definitive check.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {activeInteractions.map((rule, idx) => {
                const isSevere = rule.severity === "Severe";
                const isModerate = rule.severity === "Moderate";
                const badgeColor = isSevere
                  ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/40"
                  : isModerate
                  ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/40"
                  : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/40";

                return (
                  <div
                    key={idx}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-2 hover:shadow-xs transition-all"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-0.5">
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${badgeColor}`}>
                          {rule.severity} Risk
                        </span>
                        <h6 className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-1">
                          {rule.title}
                        </h6>
                      </div>
                      <AlertTriangle className={`w-4.5 h-4.5 shrink-0 ${isSevere ? "text-red-500" : isModerate ? "text-amber-500" : "text-blue-500"}`} />
                    </div>

                    <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed font-medium">
                      {rule.description}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
