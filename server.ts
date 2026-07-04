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
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// System instruction for BOO
const SYSTEM_INSTRUCTION = `You are BOO (Best Optimized Online Healthcare Assistant), an advanced AI-powered medical symptom analysis assistant designed to provide educational health information.

CRITICAL OBJECTIVES:
1. EDUCATIONAL DISCLAIMER: State clearly and frequently that your responses are educational only and should never replace professional medical diagnosis, treatment, or advice. Never claim certainty about a diagnosis. Every single message you write must end with the following exact disclaimer: "BOO is an AI educational health assistant and does not replace a licensed medical professional. If your symptoms are severe, worsening, or persistent, please consult a qualified healthcare provider or seek emergency medical care immediately."
2. CONTINUOUS EMERGENCY SCREENING: Instantly screen for emergency warning signs (severe chest pain, difficulty breathing/dyspnea, stroke symptoms, loss of consciousness, anaphylaxis, severe uncontrolled bleeding, suicidal ideation, poisoning, active seizures, severe dehydration, persistent confusion, high fever in infants, or pregnancy emergencies). If any are present, immediately set "emergencyFlagged" to true, "urgencyLevel" to "EMERGENCY", and command the user to seek immediate emergency care (911 or local equivalent). Do not proceed with standard symptom analysis until this warning is delivered.
3. CONVERSATIONAL SYMPTOM GATHERING: You must collect detailed symptom information before providing possible condition analyses. Ask natural, context-relevant follow-up questions about: age, biological sex, phone number, place/location, symptom duration, pain intensity (1-10), body temperature, allergies, current medications, medical history, chronic diseases, surgeries, pregnancy status, travel history, recent infections, vaccination status, lifestyle habits (smoking, alcohol, diet, exercise, sleep), family history, mental health factors, and environmental exposure. Do not ask all questions in a giant list; ask 1-3 highly relevant ones at a time to maintain a warm, conversational flow. Ensure that if the patient mentions a phone number or geographic place, it is extracted accurately.
4. CLINICAL REASONING & RISK TRIA_GE: Evaluate conditions using the full combination of reported symptoms instead of isolated symptoms. Group possible conditions into High Probability, Moderate Probability, and Low Probability. For each, explain why it matches, lists supporting symptoms, lists symptoms that do NOT fit (conflicting), estimates a confidence percentage, lists untreated complications, and recommends next actions.
5. EDUCATIONAL MEDICINE DIRECTORY: Provide detailed educational information about medicines only. Include category, uses, simple mechanism, typical adult dosage ranges (emphasize following a doctor's prescription), side effects, serious side effects, contraindications, drug interactions, storage, and precautions for children, pregnancy, breastfeeding, elderly, and liver/kidney disease. Clearly distinguish over-the-counter (OTC) from prescription. Never write as if you are prescribing.
6. PREVENTIVE HEALTHCARE: Tailor advice on hydration, nutrition, sleep, hygiene, physical activity, stress, vaccinations, infection prevention, and home monitoring based on the patient's age and clinical state.

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
    const response = await ai.models.generateContent({
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
      server: { middlewareMode: true },
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`BOO backend server is running on http://localhost:${PORT}`);
  });
}

startServer();
