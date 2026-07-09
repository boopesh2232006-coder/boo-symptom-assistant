export interface ExtractedData {
  age?: string;
  biologicalSex?: string;
  symptomDuration?: string;
  painIntensity?: string;
  bodyTemperature?: string;
  allergies?: string[];
  currentMedications?: string[];
  chronicDiseases?: string[];
  surgeries?: string[];
  pregnancyStatus?: string;
  travelHistory?: string;
  recentInfections?: string;
  vaccinationStatus?: string;
  lifestyleHabits?: {
    smoking?: string;
    alcohol?: string;
    diet?: string;
    exercise?: string;
    sleepQuality?: string;
  };
  familyMedicalHistory?: string[];
  mentalHealthFactors?: string;
  environmentalExposure?: string;
  phoneNumber?: string;
  place?: string;
  gpsLatitude?: number;
  gpsLongitude?: number;
  gpsAccuracy?: number;
  gpsAddress?: string;
}

export interface PossibleCondition {
  name: string;
  probabilityCategory: 'High Probability' | 'Moderate Probability' | 'Low Probability' | string;
  reasoning: string;
  supportingSymptoms?: string[];
  conflictingSymptoms?: string[];
  confidencePercentage: number;
  complicationsIfUntreated?: string;
  recommendedAction: string;
}

export interface EducationalMedicine {
  name: string;
  category: string;
  type: 'Over-the-Counter' | 'Prescription' | string;
  commonUses: string;
  mechanismOfAction: string;
  commonAdultDosageRange?: string;
  commonSideEffects?: string[];
  seriousSideEffects?: string[];
  contraindications?: string[];
  drugInteractions?: string[];
  storageInstructions?: string;
  precautions?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  title: string;
  date: string;
  messages: Message[];
  extractedData: ExtractedData;
  urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY' | string;
  emergencyFlagged: boolean;
  possibleConditions: PossibleCondition[];
  educationalMedicines: EducationalMedicine[];
  recommendedHomeCare: string[];
  preventiveMeasures: string[];
  recommendedSpecialist?: string;
}

export interface HospitalFacility {
  name: string;
  type: string;
  lat: number;
  lng: number; // aligned with HospitalLocator
  distance?: number;
  address?: string;
  phoneNumber?: string;
  rating?: number;
  userRatingCount?: number;
  isOpenNow?: boolean;
  traumaLevel?: string;
  erWaitTime?: string;
  icuBedsAvailable?: number;
  specialtyService?: string;
  region?: string;
  place?: string;
  facilities?: string[];
}
