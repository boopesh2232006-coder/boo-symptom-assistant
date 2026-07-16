import React, { useState, useEffect } from "react";
import { ChatSession, ExtractedData } from "../types";
import { LocationFinder } from "./LocationFinder";
import { HospitalLocator } from "./HospitalLocator";
import { HistoryPanel } from "./HistoryPanel";
import { MedicationScheduler } from "./MedicationScheduler";
import { InteractionChecker } from "./InteractionChecker";
import { SymptomTracker } from "./SymptomTracker";
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
  Building2,
  Printer,
  Sparkles
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
  onSendMessage?: (customText?: string) => void;
}

interface MasterMedicine {
  name: string;
  category: string;
  type: string;
  commonUses: string;
  mechanismOfAction: string;
  commonAdultDosageRange: string;
  pediatricDosage: string;
  adultDosage: string;
  geriatricDosage: string;
  commonSideEffects: string[];
  seriousSideEffects: string[];
  contraindications: string[];
  storageInstructions: string;
  precautions: string;
  symptoms: string[];
}

const MASTER_MEDICINE_DATABASE: MasterMedicine[] = [
  {
    name: "Acetaminophen (Tylenol)",
    category: "Analgesic & Antipyretic",
    type: "Over-the-Counter",
    commonUses: "Temporary relief of minor aches, pains, headaches, and reduction of fever.",
    mechanismOfAction: "Inhibits prostaglandin synthesis in the central nervous system to block pain and fever pathways.",
    commonAdultDosageRange: "325mg to 650mg every 4-6 hours as needed (do not exceed 3,000mg per 24 hours).",
    pediatricDosage: "10-15 mg/kg body weight per dose every 4-6 hours (maximum 5 doses per 24 hours). Avoid in infants under 12 weeks unless specified by a pediatrician.",
    adultDosage: "325mg to 650mg every 4-6 hours as needed, or 1000mg every 6 hours (do not exceed 3,000mg to 4,000mg per 24 hours).",
    geriatricDosage: "Consider a lower maximum daily limit (e.g. 2,000mg to 2,500mg) due to potential hepatic decline or chronic kidney disease.",
    commonSideEffects: ["Nausea", "Headache"],
    seriousSideEffects: ["Severe liver damage (hepatotoxicity) if daily limit is exceeded", "Severe allergic skin reactions"],
    contraindications: ["Severe liver impairment", "Known allergy to acetaminophen"],
    storageInstructions: "Store at room temperature in a dry place.",
    precautions: "Consult a doctor if you have liver disease. Avoid using other products containing acetaminophen simultaneously.",
    symptoms: ["fever", "pain", "headache", "cold", "flu", "cough"]
  },
  {
    name: "Ibuprofen (Advil / Motrin)",
    category: "NSAID (Non-steroidal anti-inflammatory drug)",
    type: "Over-the-Counter",
    commonUses: "Reduction of inflammation, swelling, fever, and relief of acute body or muscle pain.",
    mechanismOfAction: "Inhibits cyclooxygenase (COX-1 and COX-2) enzymes, preventing prostaglandin production.",
    commonAdultDosageRange: "200mg to 400mg every 4-6 hours with food as needed (maximum 1,200mg/day for OTC use).",
    pediatricDosage: "5-10 mg/kg body weight per dose every 6-8 hours with food (maximum 40 mg/kg/day). Avoid in infants under 6 months.",
    adultDosage: "200mg to 400mg every 4-6 hours with food as needed, or up to 800mg every 8 hours for prescription-strength anti-inflammatory use (max 3,200mg/day).",
    geriatricDosage: "Use lowest effective dose for shortest duration; high risk of gastrointestinal bleeding/ulceration and renal impairment. Monitor renal function.",
    commonSideEffects: ["Stomach upset", "Heartburn", "Mild dizziness"],
    seriousSideEffects: ["Gastrointestinal bleeding/ulcers", "Increased cardiovascular event risk", "Kidney dysfunction"],
    contraindications: ["Active stomach ulcers", "Severe kidney disease", "Post-heart bypass surgery"],
    storageInstructions: "Store at room temperature in a dry place.",
    precautions: "Always take with food to protect the stomach lining. Do not use in late pregnancy.",
    symptoms: ["pain", "headache", "migraine", "fever", "joint pain", "muscle pain", "back pain", "toothache", "inflammation"]
  },
  {
    name: "Omeprazole (Prilosec)",
    category: "Proton Pump Inhibitor (Acid Reducer)",
    type: "Over-the-Counter / Prescription",
    commonUses: "Heartburn, acid reflux, GERD, and healing of stomach ulcers.",
    mechanismOfAction: "Suppresses gastric acid secretion by blocking the H+/K+-ATPase proton pump in parietal cells.",
    commonAdultDosageRange: "20mg once daily, 30-60 minutes before breakfast, for up to 14 days.",
    pediatricDosage: "10mg to 20mg once daily (for children > 1 year and above 10kg, under pediatrician supervision).",
    adultDosage: "20mg once daily before breakfast (for GERD/heartburn), or up to 40mg once daily for active erosive esophagitis.",
    geriatricDosage: "Generally same as adult dosage; monitor for bone density reduction and calcium/magnesium malabsorption during prolonged use.",
    commonSideEffects: ["Headache", "Abdominal pain", "Mild diarrhea", "Flatulence"],
    seriousSideEffects: ["Clostridioides difficile-associated diarrhea", "Kidney inflammation", "Bone fractures (long-term use)"],
    contraindications: ["Hypersensitivity to proton pump inhibitors"],
    storageInstructions: "Store at room temperature away from moisture.",
    precautions: "Do not crush or chew capsules. Seek medical review if heartburn persists for more than 2 weeks.",
    symptoms: ["acid reflux", "heartburn", "stomach pain", "indigestion", "gerd", "acidity", "gastritis"]
  },
  {
    name: "Cetirizine (Zyrtec)",
    category: "Antihistamine (H1 Receptor Antagonist)",
    type: "Over-the-Counter",
    commonUses: "Relief of allergy symptoms, sneezing, runny nose, itchy watery eyes, and hives.",
    mechanismOfAction: "Selectively blocks peripheral H1 histamine receptors to prevent allergic cascade.",
    commonAdultDosageRange: "5mg to 10mg once daily.",
    pediatricDosage: "2.5mg once daily (ages 2-5 years); 5mg to 10mg once daily (ages 6 years and older). Do not use under 2 years unless prescribed.",
    adultDosage: "5mg to 10mg once daily depending on symptom severity.",
    geriatricDosage: "Start at 5mg once daily; clearance may be reduced in seniors with renal impairment. Monitor for mild drowsiness.",
    commonSideEffects: ["Drowsiness", "Dry mouth", "Fatigue"],
    seriousSideEffects: ["Severe allergic reactions (anaphylaxis) - rare"],
    contraindications: ["Allergy to cetirizine or hydroxyzine"],
    storageInstructions: "Store at room temperature.",
    precautions: "May cause mild drowsiness; avoid driving or operating heavy machinery until you know how it affects you.",
    symptoms: ["allergy", "rash", "itching", "sneezing", "runny nose", "watery eyes", "hives"]
  },
  {
    name: "Albuterol (ProAir / Ventolin)",
    category: "Beta-2 Agonist (Bronchodilator)",
    type: "Prescription",
    commonUses: "Quick relief of wheezing, chest tightness, and shortness of breath in asthma or COPD.",
    mechanismOfAction: "Stimulates beta-2 adrenergic receptors, relaxing bronchial smooth muscle and dilating airways.",
    commonAdultDosageRange: "1 to 2 inhalations (90mcg/puff) every 4-6 hours as needed for wheezing.",
    pediatricDosage: "1 to 2 inhalations (90mcg/puff) every 4-6 hours as needed, under adult supervision. Spacers are recommended for infants.",
    adultDosage: "1 to 2 inhalations (90mcg/puff) every 4-6 hours as needed for bronchospasm, or 2 inhalations 15-30 minutes before exercise.",
    geriatricDosage: "Same as adult; monitor closely for increased heart rate, tremors, palpitations, or arrhythmias in senior patients.",
    commonSideEffects: ["Nervousness", "Muscle tremors", "Increased heart rate (tachycardia)"],
    seriousSideEffects: ["Paradoxical bronchospasm (airways closing)", "Hypokalemia"],
    contraindications: ["Hypersensitivity to albuterol or milk proteins (for some dry powder inhalers)"],
    storageInstructions: "Store at room temperature; keep away from flame or extreme heat.",
    precautions: "Carry your rescue inhaler at all times. Seek immediate emergency care if rescue inhaler fails to relieve breathing distress.",
    symptoms: ["asthma", "wheezing", "shortness of breath", "cough", "copd", "breathing difficulty"]
  },
  {
    name: "Metformin (Glucophage)",
    category: "Antidiabetic (Biguanide)",
    type: "Prescription",
    commonUses: "First-line oral management of Type 2 Diabetes Mellitus to lower blood glucose.",
    mechanismOfAction: "Decreases hepatic glucose output, decreases intestinal glucose absorption, and improves insulin sensitivity.",
    commonAdultDosageRange: "500mg to 1000mg twice daily with meals (maximum 2,550mg/day).",
    pediatricDosage: "Start at 500mg once daily (ages 10+ years); maximum 2,000mg/day. Safety not established for children under 10 years.",
    adultDosage: "500mg to 1000mg twice daily with meals, or 850mg once daily (maximum 2,550mg/day for immediate-release).",
    geriatricDosage: "Start at a lower dose (e.g. 500mg/day) to minimize GI side effects. Adjust based on eGFR renal function (avoid if eGFR < 30 mL/min).",
    commonSideEffects: ["Diarrhea", "Nausea", "Metallic taste", "Abdominal discomfort"],
    seriousSideEffects: ["Lactic acidosis (rare but critical metabolic emergency)"],
    contraindications: ["Severe kidney disease (eGFR < 30 mL/min)", "Acute or chronic metabolic acidosis"],
    storageInstructions: "Store at room temperature.",
    precautions: "Limit alcohol intake to reduce lactic acidosis risk. Hold medication prior to contrast imaging scans.",
    symptoms: ["diabetes", "high blood sugar", "high glucose"]
  },
  {
    name: "Lisinopril (Zestril)",
    category: "ACE Inhibitor (Antihypertensive)",
    type: "Prescription",
    commonUses: "Treatment of high blood pressure (hypertension) and heart failure; improves post-MI survival.",
    mechanismOfAction: "Inhibits angiotensin-converting enzyme, preventing angiotensin II vasoconstriction.",
    commonAdultDosageRange: "10mg to 40mg once daily.",
    pediatricDosage: "0.07 mg/kg once daily (ages 6 years and older; maximum starting dose 5mg). Adjust based on blood pressure response.",
    adultDosage: "10mg once daily starting dose, maintenance dose range is 10mg to 40mg once daily.",
    geriatricDosage: "Start at a lower dose (e.g. 5mg once daily) due to increased sensitivity and potential renal decline. Monitor potassium levels.",
    commonSideEffects: ["Dry cough", "Dizziness", "Headache", "Fatigue"],
    seriousSideEffects: ["Angioedema (swelling of face, lips, tongue, or airway)", "Hyperkalemia"],
    contraindications: ["History of angioedema", "Pregnancy (known to cause fetal injury or death)"],
    storageInstructions: "Store at room temperature away from moisture.",
    precautions: "A dry cough is a common side effect; contact your doctor to switch meds if it is bothersome. Avoid potassium supplements.",
    symptoms: ["high blood pressure", "hypertension", "heart failure"]
  },
  {
    name: "Ciprofloxacin (Cipro)",
    category: "Fluoroquinolone Antibiotic",
    type: "Prescription",
    commonUses: "Treatment of bacterial urinary tract infections (UTIs) and prostate infections.",
    mechanismOfAction: "Inhibits bacterial DNA gyrase and topoisomerase IV enzymes, preventing DNA replication.",
    commonAdultDosageRange: "250mg to 500mg twice daily for 3 to 7 days.",
    pediatricDosage: "Generally avoided due to arthropathy risk, unless for complicated UTIs or anthrax exposure (10-20 mg/kg every 12 hours).",
    adultDosage: "250mg to 500mg twice daily for 3 to 7 days for acute uncomplicated UTI, or up to 750mg twice daily for severe bone/joint infections.",
    geriatricDosage: "Adjust dose based on renal function (creatinine clearance); monitor for central nervous system side effects (delirium, confusion) and tendonitis.",
    commonSideEffects: ["Nausea", "Diarrhea", "Headache", "Vomiting"],
    seriousSideEffects: ["Tendon rupture or tendinitis", "QT cardiac interval prolongation", "Severe nerve pain (neuropathy)"],
    contraindications: ["Concurrent tizanidine administration", "History of fluoroquinolone-induced tendon damage"],
    storageInstructions: "Store at room temperature in a dry place.",
    precautions: "Drink plenty of water. Avoid taking with dairy or antacids containing calcium/magnesium. Complete the entire course.",
    symptoms: ["uti", "burning urination", "urinary infection", "bacterial infection"]
  },
  {
    name: "Oral Rehydration Salts (ORS)",
    category: "Electrolyte Replacer",
    type: "Over-the-Counter",
    commonUses: "Rehydration and electrolyte replenishment during active diarrhea and vomiting.",
    mechanismOfAction: "Utilizes sodium-glucose cotransporters in intestinal mucosal cells to maximize water absorption.",
    commonAdultDosageRange: "Dissolve 1 packet in 1 Liter of clean water; sip 200-400ml after every loose stool.",
    pediatricDosage: "Sip 50-100ml after every loose stool (infants/children should be offered small frequent sips to prevent vomiting).",
    adultDosage: "Sip 200-400ml after every loose stool; drink freely as hydration requires (approx 2 to 4 Liters per day).",
    geriatricDosage: "Sip 200-400ml; monitor fluid overload risk in senior patients with congestive heart failure or severe renal failure.",
    commonSideEffects: ["Nausea if swallowed too quickly"],
    seriousSideEffects: ["Electrolyte imbalance (only if prepared with incorrect water volume)"],
    contraindications: ["Intestinal obstruction", "Severe kidney failure"],
    storageInstructions: "Store in a dry place. Mixed solution must be discarded after 24 hours.",
    precautions: "Strictly follow dilution volumes. Do not mix with juices or boil the prepared solution.",
    symptoms: ["diarrhea", "vomiting", "dehydration", "food poisoning", "loose stools"]
  }
];

interface SymptomDefinition {
  id: string;
  name: string;
  category: "General" | "Respiratory" | "Digestive" | "Neurological" | "Cardiovascular";
}

const COMMON_SYMPTOMS: SymptomDefinition[] = [
  { id: "fever", name: "Fever / Temperature", category: "General" },
  { id: "fatigue", name: "Fatigue / Weakness", category: "General" },
  { id: "chills", name: "Chills", category: "General" },
  { id: "body_aches", name: "Body Aches / Muscle Pain", category: "General" },
  
  { id: "cough", name: "Cough", category: "Respiratory" },
  { id: "sore_throat", name: "Sore Throat", category: "Respiratory" },
  { id: "runny_nose", name: "Runny / Stuffy Nose", category: "Respiratory" },
  { id: "shortness_of_breath", name: "Shortness of Breath", category: "Respiratory" },
  
  { id: "nausea", name: "Nausea / Vomiting", category: "Digestive" },
  { id: "diarrhea", name: "Diarrhea", category: "Digestive" },
  { id: "stomach_pain", name: "Abdominal / Stomach Pain", category: "Digestive" },
  { id: "acid_reflux", name: "Heartburn / Acid Reflux", category: "Digestive" },
  
  { id: "headache", name: "Headache", category: "Neurological" },
  { id: "dizziness", name: "Dizziness / Lightheadedness", category: "Neurological" },
  { id: "confusion", name: "Confusion", category: "Neurological" },
  
  { id: "chest_pain", name: "Chest Pain", category: "Cardiovascular" },
  { id: "palpitations", name: "Palpitations / Fast Heartbeat", category: "Cardiovascular" }
];

interface RuleCondition {
  name: string;
  symptoms: string[];
  painRange: [number, number];
  urgency: "LOW" | "MEDIUM" | "HIGH" | "EMERGENCY";
  rationale: string;
  complications: string;
}

const CLINICAL_RULES: RuleCondition[] = [
  {
    name: "Acute Gastroenteritis (Food Poisoning)",
    symptoms: ["nausea", "diarrhea", "stomach_pain"],
    painRange: [3, 8],
    urgency: "MEDIUM",
    rationale: "Matching digestive symptoms (nausea, diarrhea, stomach pain) typically suggest metabolic or gastrointestinal tract infections.",
    complications: "Severe dehydration, electrolyte imbalance."
  },
  {
    name: "Migraine Headache",
    symptoms: ["headache", "nausea", "dizziness"],
    painRange: [6, 10],
    urgency: "HIGH",
    rationale: "Unilateral or severe pulsing headache accompanied by nausea and dizziness corresponds to classic migraine aura/episodes.",
    complications: "Chronic migraine progression, severe cognitive exhaustion."
  },
  {
    name: "Upper Respiratory Infection (Common Cold)",
    symptoms: ["cough", "sore_throat", "runny_nose", "fever"],
    painRange: [1, 4],
    urgency: "LOW",
    rationale: "Cough, runny nose, sore throat, and low-grade fever are standard manifestations of common rhinovirus infections.",
    complications: "Sinusitis, bronchitis, secondary middle ear infection."
  },
  {
    name: "Influenza (Flu)",
    symptoms: ["fever", "fatigue", "chills", "body_aches", "cough"],
    painRange: [4, 7],
    urgency: "MEDIUM",
    rationale: "Abrupt onset of high fever, systemic muscle aches, extreme exhaustion, chills, and respiratory dry cough strongly align with Influenza.",
    complications: "Pneumonia, respiratory failure, myocarditis."
  },
  {
    name: "Potential Cardiovascular/Ischemic Event",
    symptoms: ["chest_pain", "shortness_of_breath", "palpitations"],
    painRange: [7, 10],
    urgency: "EMERGENCY",
    rationale: "🚨 EMERGENCY ALERT: Acute chest pain accompanied by dyspnea/shortness of breath represents high risk for myocardial ischemia or pulmonary embolism.",
    complications: "Myocardial infarction, cardiac arrest, respiratory failure."
  },
  {
    name: "Tension Headache",
    symptoms: ["headache", "fatigue"],
    painRange: [2, 5],
    urgency: "LOW",
    rationale: "Mild to moderate bilateral headache associated with muscle fatigue, typically originating from stress or sleep deprivation.",
    complications: "Chronic daily headaches, severe sleep cycle disruption."
  },
  {
    name: "Dehydration / Heat Exhaustion",
    symptoms: ["dizziness", "fatigue", "headache", "nausea"],
    painRange: [2, 6],
    urgency: "MEDIUM",
    rationale: "Dizziness, systemic weakness, headache, and secondary nausea point to electrolyte imbalance and low intravascular volume.",
    complications: "Heat stroke, kidney damage, hypovolemic shock."
  },
  {
    name: "Gastroesophageal Reflux Disease (GERD)",
    symptoms: ["acid_reflux", "stomach_pain", "cough"],
    painRange: [2, 5],
    urgency: "LOW",
    rationale: "Acid reflux and epigastric discomfort, sometimes inducing a dry cough due to vocal cord irritation by stomach acid.",
    complications: "Esophagitis, esophageal stricture, Barrett's esophagus."
  }
];



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
  onSendMessage,
}) => {
  const [localActiveTab, setLocalActiveTab] = useState<"chart" | "diagnosis" | "medicines" | "care" | "hospitals" | "history">("chart");
  const activeTab = propActiveTab !== undefined ? propActiveTab : localActiveTab;
  const setActiveTab = propSetActiveTab !== undefined ? propSetActiveTab : setLocalActiveTab;
  const t = TRANSLATIONS[language];

  const [expandedCondition, setExpandedCondition] = useState<string | null>(null);
  const [expandedMedicine, setExpandedMedicine] = useState<string | null>(null);
  const [medSubTab, setMedSubTab] = useState<"info" | "scheduler" | "interactions">("info");
  const [symptomSearch, setSymptomSearch] = useState("");
  const [selectedSymptomTag, setSelectedSymptomTag] = useState<string | null>(null);
  const [expandedMasterMedicine, setExpandedMasterMedicine] = useState<string | null>(null);

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

  // Dynamic Symptom Matcher Wizard state
  const [wizardSymptoms, setWizardSymptoms] = useState<string[]>([]);
  const [wizardPainScale, setWizardPainScale] = useState<number>(5);
  const [wizardDurationVal, setWizardDurationVal] = useState<number>(1);
  const [wizardDurationUnit, setWizardDurationUnit] = useState<"hours" | "days" | "weeks">("days");
  const [wizardSex, setWizardSex] = useState<string>("Unspecified");
  const [wizardAgeGroup, setWizardAgeGroup] = useState<string>("adult");
  const [wizardMatches, setWizardMatches] = useState<any[]>([]);

  useEffect(() => {
    if (wizardSymptoms.length === 0) {
      setWizardMatches([]);
      return;
    }

    const matches: any[] = [];
    CLINICAL_RULES.forEach((rule) => {
      const common = rule.symptoms.filter((s) => wizardSymptoms.includes(s));
      if (common.length > 0) {
        const symptomRatio = common.length / rule.symptoms.length;
        let painMultiplier = 1.0;
        
        const [minPain, maxPain] = rule.painRange;
        if (wizardPainScale >= minPain && wizardPainScale <= maxPain) {
          painMultiplier = 1.0;
        } else {
          const dist = Math.min(Math.abs(wizardPainScale - minPain), Math.abs(wizardPainScale - maxPain));
          painMultiplier = Math.max(0.6, 1.0 - dist * 0.08);
        }

        const confidence = Math.round(symptomRatio * 90 * painMultiplier + (wizardSymptoms.length > rule.symptoms.length ? -5 : 0));
        const finalConfidence = Math.min(98, Math.max(15, confidence));

        if (finalConfidence >= 30) {
          matches.push({
            name: rule.name,
            probabilityCategory: rule.urgency === "EMERGENCY" ? "High Probability" : rule.urgency === "HIGH" ? "High Probability" : rule.urgency === "MEDIUM" ? "Moderate Probability" : "Low Probability",
            reasoning: rule.rationale,
            supportingSymptoms: common.map((s) => COMMON_SYMPTOMS.find((cs) => cs.id === s)?.name || s),
            conflictingSymptoms: rule.symptoms.filter((s) => !wizardSymptoms.includes(s)).map((s) => COMMON_SYMPTOMS.find((cs) => cs.id === s)?.name || s),
            confidencePercentage: finalConfidence,
            complicationsIfUntreated: rule.complications,
            recommendedAction: rule.urgency === "EMERGENCY" ? "Seek emergency medical care immediately" : "Consult a healthcare provider"
          });
        }
      }
    });

    matches.sort((a, b) => b.confidencePercentage - a.confidencePercentage);
    setWizardMatches(matches);
  }, [wizardSymptoms, wizardPainScale]);

  const handleAnalyzeWithAI = () => {
    if (!onSendMessage) return;
    const list = wizardSymptoms.map((s) => COMMON_SYMPTOMS.find((cs) => cs.id === s)?.name || s).join(", ");
    const genderStr = wizardSex !== "Unspecified" ? `Biological sex is ${wizardSex}.` : "";
    const promptMessage = `I am experiencing the following symptoms: ${list}. The pain intensity is ${wizardPainScale}/10. This has been going on for ${wizardDurationVal} ${wizardDurationUnit}. ${genderStr} Please perform a dynamic clinical analysis and tell me possible conditions.`;
    
    if (setActiveTab) {
      setActiveTab("chart");
    }
    onSendMessage(promptMessage);
  };

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
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="no-print text-[10px] font-bold bg-white hover:bg-slate-50 dark:bg-slate-905 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg border border-slate-250 dark:border-slate-800 flex items-center gap-1 cursor-pointer transition-colors shadow-xs hover:shadow-sm"
            >
              <Printer className="w-3.5 h-3.5 text-teal-650" />
              Print Chart
            </button>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border bg-white dark:bg-slate-900">
              {t.urgencyLabel}: {urgency}
            </span>
          </div>
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

              {/* Symptom recovery diary */}
              <div className="border-t border-slate-150 dark:border-slate-800 pt-4 mt-2">
                <SymptomTracker session={session} />
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
              <div className="bg-slate-50/40 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 space-y-6">
                <div className="space-y-1">
                  <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Symptom Matcher & Case Builder
                  </h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Build your clinical case parameters dynamically to compile suggestions and query BOO AI.
                  </p>
                </div>

                {/* Biological Sex and Age group */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Biological Sex</label>
                    <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg">
                      {["Male", "Female", "Unspecified"].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setWizardSex(s)}
                          className={`text-[10px] font-bold py-1 px-1.5 rounded-md text-center transition-all cursor-pointer ${
                            wizardSex === s
                              ? "bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-sm"
                              : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-350"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Age Group</label>
                    <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg">
                      {["Child", "Adult", "Senior"].map((a) => (
                        <button
                          key={a}
                          type="button"
                          onClick={() => setWizardAgeGroup(a.toLowerCase())}
                          className={`text-[10px] font-bold py-1 px-1.5 rounded-md text-center transition-all cursor-pointer ${
                            wizardAgeGroup === a.toLowerCase()
                              ? "bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-sm"
                              : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-350"
                          }`}
                        >
                          {a}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Timeline Duration */}
                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Timeline Background (Duration)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={wizardDurationVal}
                      onChange={(e) => setWizardDurationVal(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs text-slate-900 dark:text-white focus:border-teal-500 focus:outline-none"
                    />
                    <div className="flex bg-slate-100 dark:bg-slate-900 p-0.5 rounded-xl flex-1">
                      {["hours", "days", "weeks"].map((unit) => (
                        <button
                          key={unit}
                          type="button"
                          onClick={() => setWizardDurationUnit(unit as any)}
                          className={`text-[10px] font-bold py-1.5 rounded-lg text-center flex-1 transition-all cursor-pointer ${
                            wizardDurationUnit === unit
                              ? "bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-sm"
                              : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-350"
                          }`}
                        >
                          {unit}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Pain Scale Selector */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Pain Intensity Scale</label>
                    <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded">
                      {wizardPainScale}/10 (
                      {wizardPainScale <= 3 ? "Mild" : wizardPainScale <= 6 ? "Moderate" : wizardPainScale <= 8 ? "Severe" : "Critical"}
                      )
                    </span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    value={wizardPainScale * 10}
                    onChange={(e) => setWizardPainScale(Math.round(parseInt(e.target.value) / 10))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-850 rounded-lg appearance-none cursor-pointer accent-teal-600"
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 font-semibold px-0.5">
                    <span>1 (Very Mild)</span>
                    <span>5 (Moderate)</span>
                    <span>10 (Worst Pain)</span>
                  </div>
                </div>

                {/* Symptoms Selector */}
                <div className="space-y-2.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Reported Symptoms</label>
                  
                  {/* Render by Category */}
                  {(["General", "Respiratory", "Digestive", "Neurological", "Cardiovascular"] as const).map((cat) => {
                    const catSymptoms = COMMON_SYMPTOMS.filter((s) => s.category === cat);
                    return (
                      <div key={cat} className="space-y-1">
                        <span className="text-[9px] font-bold text-slate-450 dark:text-slate-500 block pl-0.5">{cat}</span>
                        <div className="flex flex-wrap gap-1.5">
                          {catSymptoms.map((s) => {
                            const isSelected = wizardSymptoms.includes(s.id);
                            return (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => {
                                  if (isSelected) {
                                    setWizardSymptoms(wizardSymptoms.filter((id) => id !== s.id));
                                  } else {
                                    setWizardSymptoms([...wizardSymptoms, s.id]);
                                  }
                                }}
                                className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                                  isSelected
                                    ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                                    : "bg-white dark:bg-slate-900 border-slate-250 dark:border-slate-800 text-slate-700 dark:text-slate-350 hover:border-slate-300 dark:hover:border-slate-750"
                                }`}
                              >
                                {s.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Dynamic Suggestion Matches */}
                {wizardMatches.length > 0 && (
                  <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Client-Side Dynamic Suggestions ({wizardMatches.length})
                      </span>
                    </div>
                    
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {wizardMatches.map((match, i) => (
                        <div
                          key={i}
                          className="p-3 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 rounded-xl flex items-start justify-between gap-3 shadow-xs hover:border-slate-300 dark:hover:border-slate-750 transition-all"
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <h6 className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-tight">
                                {match.name}
                              </h6>
                              <span className={`text-[8px] px-1 py-0.2 rounded font-bold uppercase tracking-wider leading-none border ${
                                match.probabilityCategory === "High Probability"
                                  ? "bg-rose-50 border-rose-100 text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/40"
                                  : "bg-amber-50 border-amber-100 text-amber-600 dark:bg-amber-950/20 dark:border-amber-900/40"
                              }`}>
                                {match.probabilityCategory}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                              {match.reasoning}
                            </p>
                          </div>
                          
                          <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded shrink-0">
                            {match.confidencePercentage}% Match
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* AI Query Button */}
                    <button
                      type="button"
                      onClick={handleAnalyzeWithAI}
                      className="w-full bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-700 hover:to-emerald-600 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:translate-y-0.5"
                    >
                      <Sparkles className="w-4 h-4 shrink-0" />
                      <span>Sync & Analyze with BOO AI</span>
                    </button>
                  </div>
                )}
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
            {/* Sub Tabs */}
            <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 rounded-xl p-1 gap-1 no-print">
              <button
                onClick={() => setMedSubTab("info")}
                className={`flex-1 py-1.5 text-center text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                  medSubTab === "info"
                    ? "bg-white text-teal-600 dark:bg-slate-800 dark:text-teal-400 shadow-xs"
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-350"
                }`}
              >
                Pill Cabinet & Info
              </button>
              <button
                onClick={() => setMedSubTab("scheduler")}
                className={`flex-1 py-1.5 text-center text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                  medSubTab === "scheduler"
                    ? "bg-white text-teal-600 dark:bg-slate-800 dark:text-teal-400 shadow-xs"
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-350"
                }`}
              >
                Pill Scheduler Log
              </button>
              <button
                onClick={() => setMedSubTab("interactions")}
                className={`flex-1 py-1.5 text-center text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                  medSubTab === "interactions"
                    ? "bg-white text-teal-600 dark:bg-slate-800 dark:text-teal-400 shadow-xs"
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-350"
                }`}
              >
                Interaction Checker
              </button>
            </div>

            {medSubTab === "info" && (
              <div className="space-y-4 animate-fadeIn">
                {/* Master Lookup UI */}
                <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 no-print">
                  <div className="flex items-center gap-1.5 pb-1.5 border-b border-slate-200 dark:border-slate-800">
                    <Pill className="w-4 h-4 text-teal-600 animate-pulse" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      Master Medicine Symptom Lookup
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Search for a symptom or click any quick-tag below to discover master medicine information (dosage, uses, precautions, etc.).
                  </p>

                  <div className="relative">
                    <input
                      type="text"
                      value={symptomSearch}
                      onChange={(e) => {
                        setSymptomSearch(e.target.value);
                        setSelectedSymptomTag(null);
                      }}
                      placeholder="Type a symptom e.g. fever, headache, reflux, asthma, allergy..."
                      className="w-full bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-850 rounded-lg pl-3 pr-3 py-2 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>

                  {/* Symptom Tags */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {["Fever", "Headache", "Acid Reflux", "Allergy", "Asthma", "High BP", "UTI", "Diarrhea", "Vomiting"].map((tag) => {
                      const isActive = selectedSymptomTag === tag;
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            setSelectedSymptomTag(isActive ? null : tag);
                            setSymptomSearch("");
                          }}
                          className={`text-[8.5px] font-bold px-2 py-1 rounded-md border transition-all cursor-pointer ${
                            isActive
                              ? "bg-teal-600 text-white border-teal-600"
                              : "bg-white text-slate-500 border-slate-200 dark:bg-slate-900 dark:border-slate-800 hover:bg-slate-50"
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Filtered Master Medicines */}
                {(() => {
                  const query = symptomSearch.trim().toLowerCase();
                  const activeTag = selectedSymptomTag?.toLowerCase();
                  
                  const filtered = MASTER_MEDICINE_DATABASE.filter((med) => {
                    if (activeTag) {
                      const tagMap: Record<string, string> = {
                        "acid reflux": "acid",
                        "high bp": "hypertension",
                      };
                      const queryTerm = tagMap[activeTag] || activeTag;
                      return med.symptoms.some(s => s.includes(queryTerm)) || med.name.toLowerCase().includes(queryTerm) || med.category.toLowerCase().includes(queryTerm);
                    }
                    if (query) {
                      return med.symptoms.some(s => s.includes(query)) || med.name.toLowerCase().includes(query) || med.category.toLowerCase().includes(query) || med.commonUses.toLowerCase().includes(query);
                    }
                    return false;
                  });

                  if (filtered.length === 0 && (query || activeTag)) {
                    return (
                      <p className="text-center text-xs text-slate-400 py-4 italic bg-slate-50/50 dark:bg-slate-950/20 rounded-xl">
                        No master medicine details found matching "{selectedSymptomTag || symptomSearch}".
                      </p>
                    );
                  }

                  if (filtered.length > 0) {
                    return (
                      <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3 no-print">
                        <span className="text-[9px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider block pl-1">
                          Matched Master Medicines ({filtered.length})
                        </span>
                        {filtered.map((med, idx) => {
                          const isExpanded = expandedMasterMedicine === med.name;
                          return (
                            <div
                              key={idx}
                              className="bg-white dark:bg-slate-900 border border-teal-100 dark:border-teal-955 rounded-xl overflow-hidden hover:shadow-xs transition-all"
                            >
                              <button
                                onClick={() => setExpandedMasterMedicine(isExpanded ? null : med.name)}
                                className="w-full p-3 flex items-start justify-between text-left cursor-pointer bg-teal-50/10 dark:bg-teal-950/5"
                              >
                                <div className="space-y-1 min-w-0 pr-4">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <h5 className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">
                                      {med.name}
                                    </h5>
                                    <span className="text-[8.5px] px-1.5 py-0.2 rounded font-bold bg-teal-50 border border-teal-200 dark:bg-teal-950/30 dark:border-teal-900/30 text-teal-600 dark:text-teal-400">
                                      {med.category}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                                    Uses: {med.commonUses}
                                  </p>
                                </div>
                                <div className="flex flex-col items-end shrink-0 justify-between h-full gap-1.5">
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 font-bold">
                                    {med.type}
                                  </span>
                                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                                </div>
                              </button>

                              {isExpanded && (
                                <div className="px-3.5 pb-3.5 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2 bg-slate-50/20 dark:bg-slate-950/5 text-[11px] leading-relaxed">
                                  <div>
                                    <span className="text-[9px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider block">Mechanism of Action</span>
                                    <p className="text-slate-600 dark:text-slate-350">{med.mechanismOfAction}</p>
                                  </div>

                                  {/* Age-specific Dosages Panel */}
                                  <div className="bg-slate-100/50 dark:bg-slate-950/40 p-2.5 rounded-lg border border-slate-200 dark:border-slate-850 space-y-2">
                                    <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block border-b border-slate-200 dark:border-slate-800 pb-1">
                                      Dosage Guidelines (All Age Groups)
                                    </span>
                                    <div className="space-y-1.5 text-[10.5px]">
                                      <div>
                                        <span className="font-bold text-teal-600 dark:text-teal-400">👶 Pediatrics:</span>{" "}
                                        <span className="text-slate-700 dark:text-slate-300">{med.pediatricDosage}</span>
                                      </div>
                                      <div>
                                        <span className="font-bold text-rose-600 dark:text-rose-450">👤 Adults:</span>{" "}
                                        <span className="text-slate-700 dark:text-slate-300">{med.adultDosage}</span>
                                      </div>
                                      <div>
                                        <span className="font-bold text-amber-600 dark:text-amber-450">👵 Geriatrics (Seniors):</span>{" "}
                                        <span className="text-slate-700 dark:text-slate-300">{med.geriatricDosage}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                    <div>
                                      <span className="text-[9px] font-bold text-amber-500 uppercase tracking-wider block">Common Side Effects</span>
                                      <ul className="list-disc pl-3.5 text-slate-600 dark:text-slate-400 text-[10.5px]">
                                        {med.commonSideEffects.map((se, sIdx) => <li key={sIdx}>{se}</li>)}
                                      </ul>
                                    </div>
                                    <div>
                                      <span className="text-[9px] font-bold text-rose-500 uppercase tracking-wider block">Serious Side Effects</span>
                                      <ul className="list-disc pl-3.5 text-slate-600 dark:text-slate-400 text-[10.5px]">
                                        {med.seriousSideEffects.map((se, sIdx) => <li key={sIdx}>{se}</li>)}
                                      </ul>
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-[9px] font-bold text-red-500 uppercase tracking-wider block">Precautions & Warnings</span>
                                    <p className="text-slate-600 dark:text-slate-350">{med.precautions}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  }
                  return null;
                })()}

                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">
                  Active Consultation Medicines ({session.educationalMedicines.length})
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

            {medSubTab === "scheduler" && (
              <MedicationScheduler session={session} />
            )}

            {medSubTab === "interactions" && (
              <InteractionChecker />
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
