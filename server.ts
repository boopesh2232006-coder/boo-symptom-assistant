import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize Google GenAI client securely on server side
let aiInstance: GoogleGenAI | null = null;
function getGoogleGenAI(): GoogleGenAI {
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiInstance;
}

// System instruction for BOO
const SYSTEM_INSTRUCTION = `You are BOO (Best Optimized Online Healthcare Assistant), an advanced AI-powered medical symptom analysis assistant designed to provide educational health information.

CRITICAL OBJECTIVES:
1. EDUCATIONAL DISCLAIMER: State clearly and frequently that your responses are educational only and should never replace professional medical diagnosis, treatment, or advice. Never claim certainty about a diagnosis. Every single message you write must end with the following exact disclaimer: "BOO is an AI educational health assistant and does not replace a licensed medical professional. If your symptoms are severe, worsening, or persistent, please consult a qualified healthcare provider or seek emergency medical care immediately."
2. CONTINUOUS EMERGENCY SCREENING: Instantly screen for emergency warning signs (severe chest pain, difficulty breathing/dyspnea, stroke symptoms, loss of consciousness, anaphylaxis, severe uncontrolled bleeding, suicidal ideation, poisoning, active seizures, severe dehydration, persistent confusion, high fever in infants, or pregnancy emergencies). If any are present, immediately set "emergencyFlagged" to true, "urgencyLevel" to "EMERGENCY", and command the user to seek immediate emergency care (911 or local equivalent). Do not proceed with standard symptom analysis until this warning is delivered.
3. CONVERSATIONAL SYMPTOM GATHERING: You must collect detailed symptom information before providing possible condition analyses. Ask natural, context-relevant follow-up questions about: age, biological sex, phone number, place/location, symptom duration, pain intensity (1-10), body temperature, allergies, current medications, medical history, chronic diseases, surgeries, pregnancy status, travel history, recent infections, vaccination status, lifestyle habits (smoking, alcohol, diet, exercise, sleep), family history, mental health factors, and environmental exposure. Do not ask all questions in a giant list; ask 1-3 highly relevant ones at a time to maintain a warm, conversational flow. Ensure that if the patient mentions a phone number or geographic place, it is extracted accurately.
   - GENDER-SPECIFIC DETAILS: When biological sex is identified or relevant symptoms are mentioned, ask follow-up questions tailored to that cohort:
     * For women: ask about pregnancy status, breastfeeding, menstrual cycle details, last menstrual period, or gynecological concerns.
     * For men: ask about prostate concerns, urinary flow/stream changes, or groin/testicular symptoms.
4. CLINICAL REASONING & RISK TRIAGE: Evaluate conditions using the full combination of reported symptoms instead of isolated symptoms. Group possible conditions into High Probability, Moderate Probability, and Low Probability. For each, explain why it matches, lists supporting symptoms, lists symptoms that do NOT fit (conflicting), estimates a confidence percentage, lists untreated complications, and recommends next actions.
5. EDUCATIONAL MEDICINE DIRECTORY: Provide detailed educational information about medicines only. Include category, uses, simple mechanism, typical adult dosage ranges (emphasize following a doctor's prescription), side effects, serious side effects, contraindications, drug interactions, storage, and precautions for children, pregnancy, breastfeeding, elderly, and liver/kidney disease. Clearly distinguish over-the-counter (OTC) from prescription. Never write as if you are prescribing.
6. PREVENTIVE HEALTHCARE: Tailor advice on hydration, nutrition, sleep, hygiene, physical activity, stress, vaccinations, infection prevention, and home monitoring based on the patient's age and clinical state.
7. HEALTHCARE FACILITIES DIRECTORY: If the user asks about local healthcare resources, hospitals, clinics, or medical shops (pharmacies):
   - Provide educational details of facilities, locations, services, or contact info. Mention prominent regional options (e.g., AIIMS, Max, Fortis, KEM, Narayana, Manipal for India/Asia; CVS, Walgreens, Rite Aid, Stanford Hospital for US) based on their mentioned location/country.
   - Inform them that they can click on the "Hospitals" or "Facilities" tab in the dashboard on the right side of the screen to view interactive maps, locate nearest facilities, search by ZIP or city, calculate routing paths, or simulate ambulance dispatch and ER wait times.

Always output your response in the requested structured JSON schema. Keep the 'message' formatted with clean markdown, utilizing bullet points or neat tables when appropriate.`;

// Endpoint to process chat and clinical extraction
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, patientState, language } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid messages format" });
    }

    const hasApiKey = process.env.GEMINI_API_KEY && 
                      process.env.GEMINI_API_KEY.trim() !== "" && 
                      process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY";

    if (!hasApiKey) {
      console.log("⚠️ GEMINI_API_KEY is not set. Using Mock Clinical Response Mode.");
      
      const lastMsg = messages[messages.length - 1]?.content || "";
      const lastMsgLower = lastMsg.toLowerCase();
      
      // Determine if it is an emergency
      const isEmergency = lastMsgLower.includes("chest pain") || 
                          lastMsgLower.includes("breath") || 
                          lastMsgLower.includes("stroke") || 
                          lastMsgLower.includes("unconscious") || 
                          lastMsgLower.includes("seizure") || 
                          lastMsgLower.includes("bleeding") ||
                          lastMsgLower.includes("emergency");

      // Simple extraction regex helpers
      const ageMatch = lastMsg.match(/(\d+)\s*(yo|years old|years|year old)/i) || lastMsg.match(/age\s*:\s*(\d+)/i) || lastMsg.match(/\b(\d{1,2})\b/);
      const age = ageMatch ? ageMatch[1] : (patientState?.age || null);
      
      const sexMatch = lastMsg.match(/\b(male|female|man|woman|boy|girl)\b/i);
      const biologicalSex = sexMatch ? sexMatch[1].charAt(0).toUpperCase() + sexMatch[1].slice(1).toLowerCase() : (patientState?.biologicalSex || null);

      const durationMatch = lastMsg.match(/for\s+(\d+\s*(days|day|hours|hour|weeks|week))/i);
      const symptomDuration = durationMatch ? durationMatch[1] : (patientState?.symptomDuration || null);

      const painMatch = lastMsg.match(/pain\s*(of|intensity)?\s*(\d+)\b/i) || lastMsg.match(/(\d+)\s*\/\s*10/);
      const painIntensity = painMatch ? `${painMatch[2] || painMatch[1]}/10` : (patientState?.painIntensity || null);

      const tempMatch = lastMsg.match(/(\d{2,3}(?:\.\d)?\s*(?:f|c|fahrenheit|celsius)?)\b/i);
      const bodyTemperature = tempMatch ? tempMatch[1] : (patientState?.bodyTemperature || null);

      let urgencyLevel: "LOW" | "MEDIUM" | "HIGH" | "EMERGENCY" = "LOW";
      if (isEmergency) {
        urgencyLevel = "EMERGENCY";
      } else if (painIntensity && parseInt(painIntensity) > 7) {
        urgencyLevel = "HIGH";
      } else if (painIntensity && parseInt(painIntensity) > 4) {
        urgencyLevel = "MEDIUM";
      }

      const disclaimer = "\n\nBOO is an AI educational health assistant and does not replace a licensed medical professional. If your symptoms are severe, worsening, or persistent, please consult a qualified healthcare provider or seek emergency medical care immediately.";
      
      let message = "";
      let possibleConditions: any[] = [];
      let educationalMedicines: any[] = [];
      let recommendedHomeCare: string[] = [];
      let preventiveMeasures: string[] = [];
      let recommendedSpecialist = "Primary Care Physician (PCP)";

      if (isEmergency) {
        message = `### 🚨 CRITICAL EMERGENCY WARNING: EMERGENCY CLINICAL STATE DETECTED\n\nYou have described symptoms that could indicate a life-threatening medical emergency (such as severe chest pain, breathing difficulty, or potential cardiovascular/respiratory compromise).\n\n**Action Required:**\n* Call 911 or your local emergency number immediately.\n* Do not attempt to drive yourself to the hospital.\n* Have someone stay with you if possible.${disclaimer}`;
        possibleConditions = [
          {
            name: "Acute Coronary Syndrome (ACS) / Myocardial Infarction",
            probabilityCategory: "High Probability",
            reasoning: "Chest pain, radiating pain, and acute onset are high-risk indicators of cardiovascular event.",
            supportingSymptoms: ["Chest pain", "Shortness of breath"],
            conflictingSymptoms: [],
            confidencePercentage: 85,
            complicationsIfUntreated: "Permanent heart muscle damage, cardiac arrest, or death.",
            recommendedAction: "Call emergency services (911) immediately.",
          }
        ];
        recommendedHomeCare = ["Sit down and rest in a comfortable position", "Loosen tight clothing", "Try to stay calm"];
        preventiveMeasures = ["Regular cardiac screening", "Manage blood pressure and cholesterol", "Avoid strenuous physical activity until cleared by a doctor"];
        recommendedSpecialist = "Cardiologist / Emergency Medicine Specialist";
      } else if (lastMsgLower.includes("headache") || lastMsgLower.includes("migraine") || lastMsgLower.includes("dizzy")) {
        message = `Based on your described symptoms of headache or migraine, here is some educational guidance. Headaches are frequently benign but can indicate stress, hydration issues, or vascular spasm.${disclaimer}`;
        possibleConditions = [
          {
            name: "Migraine Headache Disorder",
            probabilityCategory: "Moderate Probability",
            reasoning: "Unilateral or throbbing headache patterns often align with migraine pathophysiology.",
            supportingSymptoms: ["Headache", "Dizziness"],
            conflictingSymptoms: [],
            confidencePercentage: 75,
            complicationsIfUntreated: "Chronic migraine progression, severe cognitive disruption.",
            recommendedAction: "Rest in a quiet, dark room and consult a PCP if symptoms worsen.",
          }
        ];
        educationalMedicines = [
          {
            name: "Ibuprofen (Advil)",
            category: "NSAID (Non-steroidal anti-inflammatory drug)",
            type: "Over-the-Counter",
            commonUses: "Reduction of swelling, pain relief, and fever reduction.",
            mechanismOfAction: "Inhibits cyclooxygenase (COX) enzymes to prevent prostaglandin synthesis.",
            commonAdultDosageRange: "200mg to 400mg every 4-6 hours as needed (not to exceed 1,200mg per 24 hours).",
            commonSideEffects: ["Stomach upset", "Heartburn", "Mild dizziness"],
            seriousSideEffects: ["Gastrointestinal bleeding", "Kidney impairment"],
            contraindications: ["Active stomach ulcers", "Severe kidney disease"],
            drugInteractions: ["Aspirin", "Warfarin (increases bleeding risk)", "Lisinopril"],
            storageInstructions: "Store in a dry place at room temperature.",
            precautions: "Take with food to minimize GI distress. Do not use in late pregnancy."
          }
        ];
        recommendedHomeCare = ["Apply a cold compress to your forehead", "Stay hydrated", "Avoid bright screens and loud noises"];
        preventiveMeasures = ["Maintain a consistent sleep schedule", "Reduce caffeine intake", "Track headache triggers in a diary"];
        recommendedSpecialist = "Neurologist";
      } else if (lastMsgLower.includes("sugar") || lastMsgLower.includes("diabetes") || lastMsgLower.includes("glucose")) {
        message = `Based on your mention of blood sugar or diabetes indicators, this guide offers educational context. Proper metabolic management is essential for long-term health.${disclaimer}`;
        possibleConditions = [
          {
            name: "Diabetes Mellitus Type 2",
            probabilityCategory: "High Probability",
            reasoning: "Elevated blood sugar levels suggest insulin resistance or relative insulin deficiency.",
            supportingSymptoms: ["High glucose levels"],
            conflictingSymptoms: [],
            confidencePercentage: 80,
            complicationsIfUntreated: "Neuropathy, retinopathy, renal failure, cardiovascular disease.",
            recommendedAction: "Schedule a comprehensive evaluation with an Endocrinologist.",
          }
        ];
        educationalMedicines = [
          {
            name: "Metformin (Glucophage)",
            category: "Biguanide (Antidiabetic)",
            type: "Prescription",
            commonUses: "Improving glycemic control in adults with type 2 diabetes mellitus.",
            mechanismOfAction: "Decreases hepatic glucose production and increases peripheral insulin sensitivity.",
            commonAdultDosageRange: "500mg to 1,000mg twice daily with meals (maximum 2,550mg/day).",
            commonSideEffects: ["Diarrhea", "Nausea", "Abdominal discomfort"],
            seriousSideEffects: ["Lactic acidosis (rare but life-threatening)"],
            contraindications: ["Severe renal impairment (eGFR < 30 mL/min)", "Acute metabolic acidosis"],
            drugInteractions: ["Contrast dye", "Cimetidine"],
            storageInstructions: "Store at room temperature (15-30°C).",
            precautions: "Avoid excessive alcohol. Discard prior to contrast-imaging procedures."
          }
        ];
        recommendedHomeCare = ["Follow a low-glycemic diet", "Engage in moderate aerobic exercise", "Regularly monitor blood glucose levels"];
        preventiveMeasures = ["Schedule annual eye and kidney exams", "Maintain healthy weight", "Aesthetic screening of diabetic feet"];
        recommendedSpecialist = "Endocrinologist";
      } else if (lastMsgLower.includes("pressure") || lastMsgLower.includes("hypertension") || lastMsgLower.includes("bp")) {
        message = `Based on your mention of high blood pressure, here is educational guidance. Maintaining optimal systolic and diastolic pressure limits vascular fatigue.${disclaimer}`;
        possibleConditions = [
          {
            name: "Primary Arterial Hypertension",
            probabilityCategory: "High Probability",
            reasoning: "Elevated systemic blood pressure readings meet clinical criteria for hypertension.",
            supportingSymptoms: ["High blood pressure readings"],
            conflictingSymptoms: [],
            confidencePercentage: 85,
            complicationsIfUntreated: "Stroke, myocardial infarction, congestive heart failure, chronic kidney disease.",
            recommendedAction: "Review daily blood pressure logs with a Primary Care Physician.",
          }
        ];
        educationalMedicines = [
          {
            name: "Lisinopril (Zestril)",
            category: "ACE Inhibitor (Antihypertensive)",
            type: "Prescription",
            commonUses: "Treatment of hypertension and heart failure; improves survival post-MI.",
            mechanismOfAction: "Inhibits angiotensin-converting enzyme, preventing vasoconstriction and aldosterone release.",
            commonAdultDosageRange: "10mg to 40mg once daily.",
            commonSideEffects: ["Dry cough", "Dizziness", "Headache"],
            seriousSideEffects: ["Angioedema (swelling of face/throat)", "Hyperkalemia"],
            contraindications: ["History of angioedema", "Pregnancy (causes fetal toxicity)"],
            drugInteractions: ["Spironolactone (increases potassium)", "NSAIDs (reduces efficacy)"],
            storageInstructions: "Store at room temperature away from moisture.",
            precautions: "Monitor kidney function and serum potassium levels regularly."
          }
        ];
        recommendedHomeCare = ["Reduce daily sodium intake (< 2,300mg/day)", "Manage stress through deep breathing", "Limit alcohol and caffeine intake"];
        preventiveMeasures = ["Get 150 minutes of moderate aerobic exercise weekly", "Maintain a DASH-based diet plan", "Regular BP self-monitoring"];
        recommendedSpecialist = "Cardiologist";
      } else if (lastMsgLower.includes("stomach") || lastMsgLower.includes("abdominal") || lastMsgLower.includes("acid") || lastMsgLower.includes("heartburn")) {
        message = `Based on your gastrointestinal symptoms like stomach pain or acid reflux, here is some educational guidance. These symptoms are common in gastroduodenal irritation or acid reflux.${disclaimer}`;
        possibleConditions = [
          {
            name: "Gastroesophageal Reflux Disease (GERD) / Gastritis",
            probabilityCategory: "High Probability",
            reasoning: "Upper abdominal burning or reflux symptoms frequently align with gastric acid hypersecretion.",
            supportingSymptoms: ["Stomach pain", "Heartburn"],
            conflictingSymptoms: [],
            confidencePercentage: 85,
            complicationsIfUntreated: "Esophageal stricture, Barrett's esophagus, peptic ulcer disease.",
            recommendedAction: "Avoid lying down immediately after meals and consult a gastroenterologist.",
          }
        ];
        educationalMedicines = [
          {
            name: "Omeprazole (Prilosec)",
            category: "Proton Pump Inhibitor (Acid Reducer)",
            type: "Over-the-Counter",
            commonUses: "Treatment of frequent heartburn, acid reflux, and gastric irritation.",
            mechanismOfAction: "Suppresses gastric acid secretion by specific inhibition of the H+/K+-ATPase enzyme system.",
            commonAdultDosageRange: "20mg once daily, 30-60 minutes before breakfast.",
            commonSideEffects: ["Headache", "Abdominal pain", "Mild diarrhea"],
            seriousSideEffects: ["Clostridioides difficile-associated diarrhea", "Bone fractures (long-term use)"],
            contraindications: ["Hypersensitivity to omeprazole"],
            drugInteractions: ["Clopidogrel", "Ketoconazole"],
            storageInstructions: "Store in a tightly closed container at room temperature.",
            precautions: "Do not crush or chew capsules. Consult a doctor for prolonged use."
          }
        ];
        recommendedHomeCare = ["Avoid spicy, fatty, and acidic foods", "Eat smaller meals more frequently", "Elevate the head of your bed by 6 inches"];
        preventiveMeasures = ["Do not eat within 3 hours of sleeping", "Manage body weight", "Limit caffeine and carbonated beverage intake"];
        recommendedSpecialist = "Gastroenterologist";
      } else if (lastMsgLower.includes("diarrhea") || lastMsgLower.includes("vomit") || lastMsgLower.includes("dehydration") || lastMsgLower.includes("loose stools")) {
        message = `Based on your symptoms of loose stools or vomiting, preventing dehydration is the primary clinical objective. These symptoms are typical in acute gastroenteritis.${disclaimer}`;
        possibleConditions = [
          {
            name: "Acute Viral Gastroenteritis / Food Poisoning",
            probabilityCategory: "High Probability",
            reasoning: "Sudden onset of vomiting and watery diarrhea indicates acute gastrointestinal inflammation.",
            supportingSymptoms: ["Diarrhea", "Vomiting"],
            conflictingSymptoms: [],
            confidencePercentage: 90,
            complicationsIfUntreated: "Severe dehydration, hypovolemic shock, electrolyte imbalance.",
            recommendedAction: "Focus on fluid replacement and seek immediate care if you cannot retain fluids.",
          }
        ];
        educationalMedicines = [
          {
            name: "Oral Rehydration Salts (ORS)",
            category: "Electrolyte Replacer",
            type: "Over-the-Counter",
            commonUses: "Prevention and treatment of dehydration due to diarrhea and vomiting.",
            mechanismOfAction: "Utilizes sodium-glucose cotransporters in the small intestine to maximize water absorption.",
            commonAdultDosageRange: "Dissolve 1 packet in 1 Liter of clean water; drink 200-400ml after each loose motion.",
            commonSideEffects: ["Nausea (if consumed too quickly)"],
            seriousSideEffects: ["Hypernatremia (extremely rare if prepared correctly)"],
            contraindications: ["Intestinal obstruction", "Severe kidney failure"],
            drugInteractions: ["None significant"],
            storageInstructions: "Store packets in dry room temperature. Consume mixed solution within 24 hours.",
            precautions: "Always dissolve in the exact amount of water specified. Do not boil the prepared solution."
          },
          {
            name: "Loperamide (Imodium)",
            category: "Antidiarrheal Agent",
            type: "Over-the-Counter",
            commonUses: "Symptomatic control of acute diarrhea.",
            mechanismOfAction: "Slows intestinal motility by binding to opiate receptors on the gut wall, allowing more water absorption.",
            commonAdultDosageRange: "4mg initially, followed by 2mg after each loose stool (not to exceed 8mg/day for OTC use).",
            commonSideEffects: ["Constipation", "Abdominal cramping", "Dizziness"],
            seriousSideEffects: ["Toxic megacolon", "QT prolongation / Cardiac events (at high doses)"],
            contraindications: ["Infectious diarrhea (with high fever or bloody stool)", "Ulcerative colitis"],
            drugInteractions: ["Ketoconazole", "Ritonavir"],
            storageInstructions: "Store at room temperature.",
            precautions: "Do not use if diarrhea is bacterial/parasitic (indicated by blood/mucus or high fever) as slowing motility traps the pathogen."
          }
        ];
        recommendedHomeCare = ["Drink ORS solution in small, frequent sips", "Follow a bland BRAT diet once vomiting stops", "Rest and avoid dairy, juices, and caffeine"];
        preventiveMeasures = ["Practice strict hand hygiene before eating", "Ensure proper cooking and refrigeration of food", "Avoid drinking untreated water"];
        recommendedSpecialist = "Primary Care Physician (PCP) / Gastroenterologist";
      } else if (lastMsgLower.includes("allergy") || lastMsgLower.includes("rash") || lastMsgLower.includes("itching") || lastMsgLower.includes("sneeze")) {
        message = `Based on your symptoms of rash, itching, or sneezing, here is educational guidance. Allergic responses result from hypersensitive immune reactions to foreign substances.${disclaimer}`;
        possibleConditions = [
          {
            name: "Allergic Rhinitis / Urticaria",
            probabilityCategory: "High Probability",
            reasoning: "Pruritus (itching), sneezing, and skin rashes are typical manifestations of histamine release.",
            supportingSymptoms: ["Itching", "Sneezing", "Rash"],
            conflictingSymptoms: [],
            confidencePercentage: 85,
            complicationsIfUntreated: "Chronic dermatitis, secondary skin infections from scratching, asthma exacerbation.",
            recommendedAction: "Identify and avoid suspected allergens; consult a doctor for allergy testing.",
          }
        ];
        educationalMedicines = [
          {
            name: "Cetirizine (Zyrtec)",
            category: "Antihistamine (H1 Receptor Antagonist)",
            type: "Over-the-Counter",
            commonUses: "Relief of allergy symptoms such as sneezing, runny nose, itchy eyes, and hives.",
            mechanismOfAction: "Selectively inhibits peripheral histamine H1 receptors, blocking histamine activity.",
            commonAdultDosageRange: "5mg to 10mg once daily.",
            commonSideEffects: ["Drowsiness", "Dry mouth", "Fatigue"],
            seriousSideEffects: ["Severe allergic reaction (anaphylaxis) - rare"],
            contraindications: ["Hypersensitivity to cetirizine or hydroxyzine"],
            drugInteractions: ["Alcohol (increases drowsiness)", "Sedatives"],
            storageInstructions: "Store at room temperature.",
            precautions: "Use caution when driving or operating machinery as it may cause mild drowsiness."
          }
        ];
        recommendedHomeCare = ["Use a cool, damp compress on itchy skin", "Avoid hot showers which worsen hives", "Keep indoor windows closed during high pollen seasons"];
        preventiveMeasures = ["Vacuum carpets and wash bed linens regularly", "Use hypoallergenic bedding covers", "Bathe pets weekly to reduce dander"];
        recommendedSpecialist = "Allergist / Immunologist";
      } else if (lastMsgLower.includes("asthma") || lastMsgLower.includes("wheez") || lastMsgLower.includes("breath")) {
        message = `Based on your breathing complaints or wheezing, here is educational guidance. Airway hyper-responsiveness can constrict lung capacity.${disclaimer}`;
        possibleConditions = [
          {
            name: "Mild Bronchospasm / Asthma Exacerbation",
            probabilityCategory: "Moderate Probability",
            reasoning: "Wheezing and shortness of breath point toward reversible lower airway obstruction.",
            supportingSymptoms: ["Wheezing", "Breathing difficulty"],
            conflictingSymptoms: [],
            confidencePercentage: 80,
            complicationsIfUntreated: "Severe respiratory distress, hypoxemia, respiratory failure.",
            recommendedAction: "Use prescribed rescue inhalers immediately and seek emergency care if distress worsens.",
          }
        ];
        educationalMedicines = [
          {
            name: "Albuterol (ProAir)",
            category: "Beta-2 Agonist (Bronchodilator)",
            type: "Prescription",
            commonUses: "Quick relief of bronchospasm in patients with asthma or COPD.",
            mechanismOfAction: "Relaxes bronchial smooth muscle by stimulating beta-2 adrenergic receptors.",
            commonAdultDosageRange: "1 to 2 inhalations (90mcg/puff) every 4-6 hours as needed.",
            commonSideEffects: ["Tremor", "Nervousness", "Rapid heart rate (tachycardia)"],
            seriousSideEffects: ["Paradoxical bronchospasm", "Hypokalemia"],
            contraindications: ["Hypersensitivity to albuterol"],
            drugInteractions: ["Beta-blockers (antagonize albuterol)", "Diuretics"],
            storageInstructions: "Store at room temperature; do not expose to extreme heat or puncture.",
            precautions: "Ensure proper inhaler spacer technique. Seek immediate help if rescue dose fails to work."
          }
        ];
        recommendedHomeCare = ["Sit upright and attempt slow, deep breathing", "Remain calm (anxiety constricts airways)", "Ensure room air is humidified or free of dust"];
        preventiveMeasures = ["Avoid tobacco smoke, strong fumes, and cold air", "Receive annual flu and pneumococcal vaccines", "Use a peak flow meter to monitor lung volumes daily"];
        recommendedSpecialist = "Pulmonologist";
      } else if (lastMsgLower.includes("urination") || lastMsgLower.includes("urine") || lastMsgLower.includes("burning")) {
        message = `Based on your symptoms of burning or painful urination, here is educational guidance. Lower urinary tract irritation is frequently bacterial in nature.${disclaimer}`;
        possibleConditions = [
          {
            name: "Acute Uncomplicated Urinary Tract Infection (UTI)",
            probabilityCategory: "High Probability",
            reasoning: "Dysuria (burning urination) and increased frequency are primary indicators of bladder wall inflammation.",
            supportingSymptoms: ["Burning urination", "Urinary frequency"],
            conflictingSymptoms: [],
            confidencePercentage: 90,
            complicationsIfUntreated: "Pyelonephritis (kidney infection), urosepsis.",
            recommendedAction: "Consult a healthcare provider for a urinalysis and appropriate antibiotic prescription.",
          }
        ];
        educationalMedicines = [
          {
            name: "Ciprofloxacin (Cipro)",
            category: "Fluoroquinolone Antibiotic",
            type: "Prescription",
            commonUses: "Treatment of bacterial infections, including urinary tract infections.",
            mechanismOfAction: "Inhibits bacterial DNA gyrase and topoisomerase IV, stopping bacterial replication.",
            commonAdultDosageRange: "250mg to 500mg twice daily for 3 days (for simple cystitis).",
            commonSideEffects: ["Nausea", "Diarrhea", "Headache"],
            seriousSideEffects: ["Tendon rupture or tendinitis", "QT prolongation", "Peripheral neuropathy"],
            contraindications: ["Concurrent tizanidine use", "History of tendon disorders"],
            drugInteractions: ["Antacids (reduces absorption)", "Dairy products", "Theophylline"],
            storageInstructions: "Store at room temperature in a dry place.",
            precautions: "Drink plenty of water. Avoid direct sunlight. Complete the entire course of therapy."
          }
        ];
        recommendedHomeCare = ["Increase water intake significantly to flush the bladder", "Apply a heating pad to the pelvic area to relieve pressure", "Avoid bladder irritants like coffee, alcohol, and spicy foods"];
        preventiveMeasures = ["Urinate immediately following sexual intercourse", "Wipe from front to back after using the restroom", "Avoid holding urine for extended periods"];
        recommendedSpecialist = "Urologist";
      } else if (lastMsgLower.includes("fever") || lastMsgLower.includes("cough") || lastMsgLower.includes("cold") || lastMsgLower.includes("throat")) {
        message = `Based on your described symptoms of fever or cough, here is some educational guidance to help monitor your symptoms. This combination is common in upper respiratory pathology.${disclaimer}`;
        possibleConditions = [
          {
            name: "Acute Viral Upper Respiratory Infection",
            probabilityCategory: "High Probability",
            reasoning: "Cough and fever combination is typical of viral respiratory syndrome.",
            supportingSymptoms: ["Cough", "Fever"],
            conflictingSymptoms: [],
            confidencePercentage: 90,
            complicationsIfUntreated: "Secondary bacterial infection (such as Bronchitis or Pneumonia).",
            recommendedAction: "Rest, monitor temperature, and seek PCP visit if symptoms persist > 7 days.",
          }
        ];
        educationalMedicines = [
          {
            name: "Acetaminophen (Tylenol)",
            category: "Analgesic & Antipyretic",
            type: "Over-the-Counter",
            commonUses: "Temporary relief of minor aches, pains, and reduction of fever.",
            mechanismOfAction: "Acts primarily in the central nervous system to inhibit prostaglandin synthesis, thereby reducing pain and fever signals.",
            commonAdultDosageRange: "325mg to 650mg every 4-6 hours as needed (not to exceed 3,000mg per 24 hours).",
            commonSideEffects: ["Nausea", "Headache"],
            seriousSideEffects: ["Severe liver damage (hepatotoxicity) if exceeded", "Allergic reaction (rash, swelling)"],
            contraindications: ["Severe liver impairment", "Known allergy to acetaminophen"],
            drugInteractions: ["Alcohol (increases liver damage risk)", "Warfarin"],
            storageInstructions: "Store at room temperature (15-30°C) in a dry place.",
            precautions: "Consult a doctor for children's dosing, pregnancy, or if you have liver disease."
          }
        ];
        recommendedHomeCare = ["Maintain hydration (warm teas, water)", "Adequate bed rest", "Use saline throat sprays or throat lozenges"];
        preventiveMeasures = ["Frequent handwashing", "Get the annual influenza vaccine", "Avoid contact with sick individuals"];
        recommendedSpecialist = "Primary Care Physician (PCP)";
      } else if (lastMsgLower.includes("hospital") || lastMsgLower.includes("clinic") || lastMsgLower.includes("pharmacy") || lastMsgLower.includes("medical shop") || lastMsgLower.includes("medicine shop") || lastMsgLower.includes("locator") || lastMsgLower.includes("where is")) {
        message = `### 🏥 Healthcare Facilities & Medical Shops Directory

Here is some educational information regarding local healthcare resources:
* **Hospitals & Trauma Centers:** Major regional centers like **AIIMS (All India Institute of Medical Sciences)**, **Max Hospital**, **Fortis Hospital**, **KEM Hospital**, **Kokilaben Hospital**, **Narayana Health**, or **Manipal Hospital** offer 24/7 emergency care, ICU beds, and specialized trauma wings.
* **Pharmacies & Medical Shops:** For prescription and OTC medications, national chains such as **Apollo Pharmacy**, **MedPlus Medicine Shop**, and **Netmeds Wellness** (in India/Asia), or **CVS Pharmacy**, **Walgreens**, and **Rite Aid** (in the US) provide medication dispensing, storage advice, and basic health supplies.
* **Clinics:** Local outpatient clinics are suitable for non-emergency consultations, simple infections, and routine diagnostics.

👉 **Interactive Map Integration:**
You can view active routing, ambulance dispatch simulation, and locate the nearest pharmacy, clinic, or level-1 trauma center by clicking on the **"Hospitals"** or **"Facilities"** tab in the dashboard on the right side of your screen. This tool computes real-time routing vectors and estimates ER wait times based on your GPS coordinates or ZIP code.${disclaimer}`;
      } else if (lastMsgLower.includes("female") || lastMsgLower.includes("woman") || lastMsgLower.includes("pregnancy") || lastMsgLower.includes("menstru") || lastMsgLower.includes("breastfeed") || lastMsgLower.includes("gyneco") || lastMsgLower.includes("period")) {
        message = `### ♀️ Female Health & Symptom Analysis

We are analyzing your symptoms with consideration of female-specific health factors. To provide the most accurate educational guidance, please share the following details:
1. **Pregnancy/Breastfeeding Status:** Are you currently pregnant (if so, which trimester?) or breastfeeding?
2. **Menstrual Details:** What was the date of your Last Menstrual Period (LMP)? Are your cycles regular, and do you experience severe cramping or heavy bleeding?
3. **Associated Symptoms:** Do you have any lower abdominal/pelvic pain, abnormal discharge, fever, or painful urination?
4. **General Symptoms:** What is the duration of your symptoms and pain intensity (1-10)?${disclaimer}`;
        possibleConditions = [
          {
            name: "Dysmenorrhea / Pelvic Inflammatory Disease (PID) consideration",
            probabilityCategory: "Moderate Probability",
            reasoning: "Reported female health history or lower pelvic complaints warrant screening for uterine, ovarian, or cyclic inflammation.",
            supportingSymptoms: ["Pelvic complaints", "Female health indicator"],
            conflictingSymptoms: [],
            confidencePercentage: 65,
            complicationsIfUntreated: "Chronic pelvic pain, fertility complications, or ascending reproductive tract infections.",
            recommendedAction: "Schedule a comprehensive examination with a Gynecologist.",
          }
        ];
        recommendedSpecialist = "Gynecologist";
      } else if (lastMsgLower.includes("male") || lastMsgLower.includes("man") || lastMsgLower.includes("prostate") || lastMsgLower.includes("testic") || lastMsgLower.includes("groin") || lastMsgLower.includes("scrot")) {
        message = `### ♂️ Male Health & Symptom Analysis

We are analyzing your symptoms with consideration of male-specific health factors. To help customize your educational guidance, please share the following details:
1. **Urinary Symptoms:** Have you noticed a weak urinary stream, difficulty starting urination, frequent nighttime urination (nocturia), or a feeling of incomplete emptying?
2. **Groin/Testicular Details:** Are you experiencing any localized pain, swelling, heaviness, or lumps in the testicular or groin region?
3. **Associated Symptoms:** Do you have a fever, back pain, or pain/burning during urination or ejaculation?
4. **General Symptoms:** How long have you had these symptoms, and what is their pain level (1-10)?${disclaimer}`;
        possibleConditions = [
          {
            name: "Prostatitis / Benign Prostatic Hyperplasia (BPH) consideration",
            probabilityCategory: "Moderate Probability",
            reasoning: "Reported male health cohort indicators or lower urinary tract discomfort can represent prostate enlargement or inflammation.",
            supportingSymptoms: ["Urinary/groin complaints", "Male health indicator"],
            conflictingSymptoms: [],
            confidencePercentage: 60,
            complicationsIfUntreated: "Acute urinary retention, bladder damage, recurrent UTIs, or renal impairment.",
            recommendedAction: "Consult with a Urologist for a physical exam and PSA/urinalysis tests.",
          }
        ];
        recommendedSpecialist = "Urologist";
      } else {
        message = `Welcome to BOO. I am listening to your health concerns. Please share more details about your symptoms, such as their duration, pain intensity (on a scale of 1-10), and if you have any other relevant health history.${disclaimer}`;
      }

      return res.json({
        message,
        extractedData: {
          age: age || null,
          biologicalSex: biologicalSex || null,
          symptomDuration: symptomDuration || null,
          painIntensity: painIntensity || null,
          bodyTemperature: bodyTemperature || null,
          allergies: patientState?.allergies || [],
          currentMedications: patientState?.currentMedications || [],
          chronicDiseases: patientState?.chronicDiseases || [],
          surgeries: patientState?.surgeries || [],
          pregnancyStatus: patientState?.pregnancyStatus || null,
          travelHistory: patientState?.travelHistory || null,
          recentInfections: patientState?.recentInfections || null,
          vaccinationStatus: patientState?.vaccinationStatus || null,
          lifestyleHabits: patientState?.lifestyleHabits || {
            smoking: null,
            alcohol: null,
            diet: null,
            exercise: null,
            sleepQuality: null,
          },
          familyMedicalHistory: patientState?.familyMedicalHistory || [],
          mentalHealthFactors: patientState?.mentalHealthFactors || null,
          environmentalExposure: patientState?.environmentalExposure || null,
          phoneNumber: patientState?.phoneNumber || null,
          place: patientState?.place || null,
        },
        urgencyLevel,
        emergencyFlagged: isEmergency,
        possibleConditions,
        educationalMedicines,
        recommendedHomeCare,
        preventiveMeasures,
        recommendedSpecialist,
      });
    }

    // Format conversation history for Gemini
    // @google/genai contents structure: [{ role: "user" | "model", parts: [{ text: "..." }] }]
    const contents = messages.map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    // Append instructions with current state for continuity
    const stateContext = patientState
      ? `\n\n[Clinical State Context of Patient So Far: ${JSON.stringify(patientState)}]`
      : "";

    const languageInstruction = language
      ? `\n\n[CRITICAL: Please write your primary conversation response (the "message" field in the JSON) in the following language: "${language}". Also translate all other text-based fields inside the JSON, such as condition reasoning, recommendedAction, commonUses, mechanismOfAction, recommendedHomeCare, and preventiveMeasures, into "${language}" so that the patient can read their entire clinical report in their preferred language. Do not translate structural JSON keys or technical enum codes like urgencyLevel.]`
      : "";

    contents.push({
      role: "user",
      parts: [
        {
          text: `Please analyze the latest user response and conversation. Extract any updated demographics/symptoms into the structured JSON fields. Answer the patient with empathy, professional caution, and structured medical reasoning.${stateContext}${languageInstruction}`,
        },
      ],
    });

    // Request content generation with a strict JSON schema matching BOO's requirements
    const response = await getGoogleGenAI().models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            message: {
              type: Type.STRING,
              description: "The primary conversational response from BOO. Must be highly detailed, empathetic, professional, structured with markdown where appropriate, and MUST end with the required disclaimer.",
            },
            extractedData: {
              type: Type.OBJECT,
              description: "Information extracted about the patient from the entire dialogue. Keep fields null or unmodified if not discussed.",
              properties: {
                age: { type: Type.STRING, description: "Patient's age, e.g. '45'" },
                biologicalSex: { type: Type.STRING, description: "Biological sex, e.g. 'Female'" },
                symptomDuration: { type: Type.STRING, description: "How long symptoms have lasted, e.g. '3 days'" },
                painIntensity: { type: Type.STRING, description: "Pain intensity score on 1-10 scale, e.g. '6/10'" },
                bodyTemperature: { type: Type.STRING, description: "Reported body temperature, e.g. '101.2 F' or '38.4 C'" },
                allergies: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "List of allergies reported.",
                },
                currentMedications: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "List of currently active medications.",
                },
                chronicDiseases: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "List of chronic diseases (e.g. Hypertension, Diabetes).",
                },
                surgeries: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "List of past surgeries.",
                },
                pregnancyStatus: { type: Type.STRING, description: "Pregnancy or breastfeeding status, if applicable." },
                travelHistory: { type: Type.STRING, description: "Recent travel details." },
                recentInfections: { type: Type.STRING, description: "Recent infectious exposures or infections." },
                vaccinationStatus: { type: Type.STRING, description: "Vaccination details." },
                lifestyleHabits: {
                  type: Type.OBJECT,
                  properties: {
                    smoking: { type: Type.STRING },
                    alcohol: { type: Type.STRING },
                    diet: { type: Type.STRING },
                    exercise: { type: Type.STRING },
                    sleepQuality: { type: Type.STRING },
                  },
                },
                familyMedicalHistory: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Diseases or conditions in the family.",
                },
                mentalHealthFactors: { type: Type.STRING, description: "Reported mental health factors or stress." },
                environmentalExposure: { type: Type.STRING, description: "Toxic chemical, mold, or extreme environment exposure." },
                phoneNumber: { type: Type.STRING, description: "Patient's phone number if mentioned in chat." },
                place: { type: Type.STRING, description: "Patient's current physical place, town, or city if mentioned." },
              },
            },
            urgencyLevel: {
              type: Type.STRING,
              description: "Urgency categorization. MUST be one of: 'LOW', 'MEDIUM', 'HIGH', 'EMERGENCY'.",
            },
            emergencyFlagged: {
              type: Type.BOOLEAN,
              description: "True if any red-flag emergency symptoms are present, calling for immediate 911/ER attention.",
            },
            possibleConditions: {
              type: Type.ARRAY,
              description: "List of probable medical conditions. Only populate if there is sufficient data.",
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Condition name, e.g. 'Acute Viral Bronchitis'" },
                  probabilityCategory: {
                    type: Type.STRING,
                    description: "High Probability, Moderate Probability, or Low Probability.",
                  },
                  reasoning: { type: Type.STRING, description: "Clinical match rationale." },
                  supportingSymptoms: { type: Type.ARRAY, items: { type: Type.STRING } },
                  conflictingSymptoms: { type: Type.ARRAY, items: { type: Type.STRING } },
                  confidencePercentage: { type: Type.INTEGER, description: "Confidence rating from 0 to 100" },
                  complicationsIfUntreated: { type: Type.STRING, description: "Potential severe progression." },
                  recommendedAction: { type: Type.STRING, description: "Next step (e.g., see PCP, telemedicine, monitor)." },
                },
                required: ["name", "probabilityCategory", "reasoning", "confidencePercentage", "recommendedAction"],
              },
            },
            educationalMedicines: {
              type: Type.ARRAY,
              description: "Educational entries of medicines mentioned in conversation or highly relevant.",
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Name of medicine, e.g. 'Ibuprofen'" },
                  category: { type: Type.STRING, description: "Category, e.g. 'NSAID (Non-steroidal anti-inflammatory drug)'" },
                  type: { type: Type.STRING, description: "Over-the-Counter or Prescription" },
                  commonUses: { type: Type.STRING },
                  mechanismOfAction: { type: Type.STRING, description: "Explain how it works in plain English." },
                  commonAdultDosageRange: { type: Type.STRING },
                  commonSideEffects: { type: Type.ARRAY, items: { type: Type.STRING } },
                  seriousSideEffects: { type: Type.ARRAY, items: { type: Type.STRING } },
                  contraindications: { type: Type.ARRAY, items: { type: Type.STRING } },
                  drugInteractions: { type: Type.ARRAY, items: { type: Type.STRING } },
                  storageInstructions: { type: Type.STRING },
                  precautions: { type: Type.STRING, description: "Precautions regarding kids, seniors, pregnancy, liver/kidney disease" },
                },
                required: ["name", "category", "type", "commonUses", "mechanismOfAction"],
              },
            },
            recommendedHomeCare: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Conservative home remedies like rest, hydration, salt water gargles.",
            },
            preventiveMeasures: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Infection prevention, lifestyle improvements, vaccines, screening.",
            },
            recommendedSpecialist: {
              type: Type.STRING,
              description: "The medical specialist to consult, e.g. 'Pulmonologist', 'Cardiologist', 'PCP'.",
            },
          },
          required: ["message", "urgencyLevel", "emergencyFlagged"],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from Gemini");
    }

    const resultJson = JSON.parse(text.trim());
    res.json(resultJson);
  } catch (err: any) {
    console.error("Error in /api/chat:", err);
    res.status(500).json({
      error: "Internal clinical analysis error",
      details: err.message,
    });
  }
});

// Setup Vite Dev Server / Static Hosting
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true' ? { port: 0 } : false,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware mounted");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Static files served from", distPath);
  }

  function startListen(portToTry: number) {
    const serverInstance = app.listen(portToTry, "0.0.0.0", () => {
      console.log(`BOO backend server is running on http://localhost:${portToTry}`);
    });

    serverInstance.on("error", (err: any) => {
      if (err.code === "EADDRINUSE") {
        console.warn(`Port ${portToTry} is already in use. Retrying on port ${portToTry + 1}...`);
        startListen(portToTry + 1);
      } else {
        console.error("Server error:", err);
      }
    });
  }

  startListen(PORT);
}

startServer();
