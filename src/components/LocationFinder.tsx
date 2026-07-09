import React, { useState, useEffect, useRef } from "react";
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { ChatSession } from "../types";
import {
  MapPin,
  Search,
  Navigation,
  Building2,
  PhoneCall,
  Crosshair,
  AlertTriangle,
  Heart,
  Activity,
  Compass,
  Car,
  Clock,
  Star,
  Award,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Map as MapIcon
} from "lucide-react";

// Google Maps Platform API Key Setup
const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  "";
const hasValidKey = Boolean(API_KEY) && API_KEY !== "YOUR_API_KEY";

export interface SpecialtyHospital {
  name: string;
  specialty: string;
  diseases: string[];
  state: string;
  district: string;
  address: string;
  lat: number;
  lng: number;
  techFeatures: string[];
  contact: string;
  rating: number;
}

// Curated high-tech specialty hospitals across states based on diseases
const HIGH_TECH_HOSPITALS: SpecialtyHospital[] = [
  {
    name: "AIIMS (All India Institute of Medical Sciences) - New Delhi",
    specialty: "Endocrinology, Diabetes, Complex Diagnoses & Autoimmune",
    diseases: ["diabetes", "thyroid", "endocrine", "metabolic", "rare disease", "hormonal", "autoimmune", "gland"],
    state: "Delhi",
    district: "South West Delhi",
    address: "Ansari Nagar, New Delhi, Delhi 110029",
    lat: 28.5672,
    lng: 77.2100,
    techFeatures: ["National genomic diagnostics hub", "AI-driven metabolic profile tracking", "Advanced peptide receptor radionuclide therapy"],
    contact: "+91-11-26588500",
    rating: 4.8
  },
  {
    name: "Safdarjung Hospital - New Delhi",
    specialty: "Trauma Resuscitation, Burns Treatment & Orthopedics",
    diseases: ["burn", "trauma", "orthopedic", "emergency", "fever", "fracture", "accident"],
    state: "Delhi",
    district: "South West Delhi",
    address: "Safdarjung Hospital, Ansari Nagar, New Delhi, Delhi 110029",
    lat: 28.5685,
    lng: 77.2065,
    techFeatures: ["Largest specialized burn recovery center in Delhi", "24/7 dedicated orthopedics ER"],
    contact: "+91-11-26707100",
    rating: 4.4
  },
  {
    name: "Medanta - The Medicity, Gurugram",
    specialty: "Cardiology & Cardiac Surgery",
    diseases: ["chest pain", "heart", "cardiac", "myocardial", "angina", "hypertension", "arrhythmia", "vascular", "palpitation"],
    state: "Haryana",
    district: "Gurugram",
    address: "CH Baktawar Singh Road, Sector 38, Gurugram, Haryana 122001",
    lat: 28.4262,
    lng: 77.0410,
    techFeatures: ["Robotic hybrid heart operations", "Indias first specialized heart transplant center", "Intra-vascular ultrasound imaging"],
    contact: "+91-124-4141414",
    rating: 4.7
  },
  {
    name: "Tata Memorial Hospital, Mumbai",
    specialty: "Oncology & Advanced Immunotherapy",
    diseases: ["cancer", "tumor", "oncology", "lymphoma", "leukemia", "chemotherapy", "carcinoma", "biopsy"],
    state: "Maharashtra",
    district: "Mumbai City",
    address: "Dr. E Borges Road, Parel, Mumbai, Maharashtra 400012",
    lat: 19.0028,
    lng: 72.8423,
    techFeatures: ["Targeted CAR-T cell immunotherapy programs", "Indias largest oncology pathology sequencing", "Proton beam therapy pavilion"],
    contact: "+91-22-24177000",
    rating: 4.8
  },
  {
    name: "KEM Hospital (King Edward Memorial) - Mumbai",
    specialty: "General Medicine & Outpatient Services",
    diseases: ["fever", "cough", "cold", "throat", "infection", "outpatient", "emergency"],
    state: "Maharashtra",
    district: "Mumbai City",
    address: "Acharya Donde Marg, Parel, Mumbai, Maharashtra 400012",
    lat: 19.0025,
    lng: 72.8421,
    techFeatures: ["High-capacity outpatient clinic", "Regional diagnostics center"],
    contact: "+91-22-24107000",
    rating: 4.2
  },
  {
    name: "Ruby Hall Clinic - Pune",
    specialty: "Cardiology, Nephrology & Renal Transplant Center",
    diseases: ["kidney", "renal", "cardiac", "heart", "bypass", "urination", "bladder"],
    state: "Maharashtra",
    district: "Pune",
    address: "40 Sassoon Road, Pune, Maharashtra 411001",
    lat: 18.5312,
    lng: 73.8755,
    techFeatures: ["Robotic kidney transplant surgeries", "Dual cath lab installation"],
    contact: "+91-20-66450507",
    rating: 4.7
  },
  {
    name: "KEM Hospital - Pune",
    specialty: "Pediatrics, Neonatal Care & Gynecology",
    diseases: ["fever", "pediatric", "neonatal", "pregnancy", "mother care", "baby", "delivery"],
    state: "Maharashtra",
    district: "Pune",
    address: "489 Rasta Peth, Pune, Maharashtra 411011",
    lat: 18.5203,
    lng: 73.8690,
    techFeatures: ["Level III neonatal intensive care unit", "High-risk pregnancy delivery wing"],
    contact: "+91-20-66037300",
    rating: 4.6
  },
  {
    name: "NIMHANS (National Institute of Mental Health & Neuro Sciences), Bengaluru",
    specialty: "Neurology, Neurosurgery & Neuro-psychiatry",
    diseases: ["headache", "migraine", "neurology", "stroke", "seizure", "neuropathy", "brain", "dizziness", "nerve"],
    state: "Karnataka",
    district: "Bengaluru Urban",
    address: "Hosur Road, Lakkasandra, Bengaluru, Karnataka 560029",
    lat: 12.9428,
    lng: 77.5992,
    techFeatures: ["Intraoperative 3T MRI neuro-navigation", "Neuromodulation deep brain stimulation (DBS)", "Advanced robotic neuro-rehabilitation labs"],
    contact: "+91-80-26995000",
    rating: 4.9
  },
  {
    name: "Narayana Health City - Bengaluru",
    specialty: "Cardiology & Multi-Organ Transplants",
    diseases: ["chest pain", "heart", "cardiac", "bypass", "transplant", "kidney transplant", "liver transplant"],
    state: "Karnataka",
    district: "Bengaluru Urban",
    address: "258/A, Bommasandra Industrial Area, Anekal Taluk, Bengaluru, Karnataka 560099",
    lat: 12.8258,
    lng: 77.6890,
    techFeatures: ["World-class cardiac bypass facilities", "State-of-the-art organ harvest unit"],
    contact: "+91-80-71222222",
    rating: 4.7
  },
  {
    name: "Apollo BGS Hospitals - Mysuru",
    specialty: "Gastroenterology, Hepatology & Nephrology",
    diseases: ["stomach", "liver", "kidney", "gastro", "diarrhea", "vomit", "acid"],
    state: "Karnataka",
    district: "Mysuru",
    address: "Adhichunchanagiri Road, Kuvempunagar, Mysuru, Karnataka 570023",
    lat: 12.3168,
    lng: 76.6277,
    techFeatures: ["Indias leading liver care facility in region", "SLED dialysis units"],
    contact: "+91-821-2568888",
    rating: 4.7
  },
  {
    name: "JSS Hospital - Mysuru",
    specialty: "Primary General Care, Pediatrics & Infectious Diseases",
    diseases: ["fever", "cough", "infection", "outpatient", "pediatric", "cold", "flu"],
    state: "Karnataka",
    district: "Mysuru",
    address: "MG Road, Mysuru, Karnataka 570004",
    lat: 12.3025,
    lng: 76.6545,
    techFeatures: ["Regional clinical diagnostic testing core", "Integrated pediatric outreach wing"],
    contact: "+91-821-2335555",
    rating: 4.5
  },
  {
    name: "Apollo Hospitals - Greams Road, Chennai",
    specialty: "Transplant Surgery & Advanced Nephrology",
    diseases: ["transplant", "kidney transplant", "liver transplant", "autoimmune", "immunology", "cardiology", "heart"],
    state: "Tamil Nadu",
    district: "Chennai",
    address: "21, Greams Lane, Off Greams Road, Chennai, Tamil Nadu 600006",
    lat: 13.0608,
    lng: 80.2520,
    techFeatures: ["Dual organ transplant program", "Robotic renal surgery suite", "Precision tissue typing HLA diagnostics"],
    contact: "+91-44-28290200",
    rating: 4.8
  },
  {
    name: "Rajiv Gandhi Government General Hospital - Chennai",
    specialty: "General Medicine & Trauma Resuscitation",
    diseases: ["fever", "cough", "cold", "general", "outpatient", "emergency", "accident", "trauma"],
    state: "Tamil Nadu",
    district: "Chennai",
    address: "Poonamallee High Rd, near Central Station, Park Town, Chennai, Tamil Nadu 600003",
    lat: 13.0827,
    lng: 80.2754,
    techFeatures: ["24/7 massive ER triage wing", "State-run free dialysis bank"],
    contact: "+91-44-25305000",
    rating: 4.5
  },
  {
    name: "Kovai Medical Center and Hospital (KMCH) - Coimbatore",
    specialty: "Oncology, Multi-organ Transplant & Cardiac Care",
    diseases: ["cancer", "heart", "cardiac", "stroke", "neurology", "oncology", "tumor"],
    state: "Tamil Nadu",
    district: "Coimbatore",
    address: "99, Avinashi Rd, Phase II, Balaji Nagar, Coimbatore, Tamil Nadu 641014",
    lat: 11.0267,
    lng: 77.0344,
    techFeatures: ["Advanced TrueBeam radiotherapy", "Comprehensive stroke rescue protocols"],
    contact: "+91-422-4323800",
    rating: 4.7
  },
  {
    name: "PSG Super Speciality Hospital - Coimbatore",
    specialty: "Pulmonology, Pediatrics & Advanced Critical Care",
    diseases: ["pulmonology", "asthma", "wheezing", "cough", "pediatric", "breathing", "shortness of breath"],
    state: "Tamil Nadu",
    district: "Coimbatore",
    address: "Avinashi Rd, Peelamedu, Coimbatore, Tamil Nadu 641004",
    lat: 11.0253,
    lng: 77.0011,
    techFeatures: ["Pediatric sleep monitoring lab", "Advanced respiratory therapy center"],
    contact: "+91-422-2570170",
    rating: 4.6
  },
  {
    name: "Government Rajaji Hospital - Madurai",
    specialty: "Trauma, Emergency Resuscitation & Orthopedics",
    diseases: ["fever", "accident", "trauma", "emergency", "fracture", "burn", "pain"],
    state: "Tamil Nadu",
    district: "Madurai",
    address: "Panagal Rd, Goripalayam, Madurai, Tamil Nadu 625020",
    lat: 9.9258,
    lng: 78.1215,
    techFeatures: ["24/7 regional trauma response unit", "High-capacity critical care ICU ward"],
    contact: "+91-452-2532535",
    rating: 4.3
  },
  {
    name: "Apollo Speciality Hospital - Madurai",
    specialty: "Neurology, Neurosurgery & Cardiac Sciences",
    diseases: ["neurology", "seizure", "stroke", "heart", "cardiac", "headache", "brain"],
    state: "Tamil Nadu",
    district: "Madurai",
    address: "Lake View Rd, K.K. Nagar, Madurai, Tamil Nadu 625020",
    lat: 9.9321,
    lng: 78.1402,
    techFeatures: ["Intraoperative neuro monitoring suite", "Cath lab with 3D rotational angiography"],
    contact: "+91-452-2580892",
    rating: 4.7
  },
  {
    name: "Mayo Clinic - Rochester Campus",
    specialty: "Endocrinology, Diabetes & Complex Diagnoses",
    diseases: ["diabetes", "thyroid", "endocrine", "metabolic", "rare disease", "hormonal", "autoimmune", "gland"],
    state: "Minnesota (MN)",
    district: "Olmsted",
    address: "200 1st St SW, Rochester, MN 55905",
    lat: 44.022,
    lng: -92.466,
    techFeatures: ["AI-guided early pancreatic tracking", "Whole-exome genomic sequencing", "Proton beam therapy"],
    contact: "+1 (507) 284-2511",
    rating: 4.9
  },
  {
    name: "Cleveland Clinic - Heart, Vascular & Thoracic Institute",
    specialty: "Cardiology & Cardiac Surgery",
    diseases: ["chest pain", "heart", "cardiac", "myocardial", "angina", "hypertension", "arrhythmia", "vascular", "palpitation"],
    state: "Ohio (OH)",
    district: "Cuyahoga",
    address: "9500 Euclid Ave, Cleveland, OH 44195",
    lat: 41.503,
    lng: -81.621,
    techFeatures: ["Robotic mitral valve micro-repair", "Sync-AV adaptive pacing synchronization", "3D patient heart clone printing"],
    contact: "+1 (216) 444-2200",
    rating: 4.9
  }
];

export interface HospitalFacilityLocal {
  name: string;
  type: "Pharmacy" | "Clinic" | "Specialty Hospital" | string;
  lat: number;
  lng: number;
  distance?: number;
  address?: string;
  phoneNumber?: string;
  rating?: number;
  userRatingCount?: number;
  isOpenNow?: boolean;
}

interface LocationFinderProps {
  session?: ChatSession;
}

export const LocationFinder: React.FC<LocationFinderProps> = ({ session }) => {
  // Define default coordinate around Stanford/Palo Alto area as patient home coordinate
  const [homeCoords, setHomeCoords] = useState<{ lat: number; lng: number }>({
    lat: 37.4275,
    lng: -122.1697
  });
  const [homeAddress, setHomeAddress] = useState<string>("Stanford, California");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeSubTab, setActiveSubTab] = useState<"nearby" | "hightech">("nearby");
  const [mapTypeFilter, setMapTypeFilter] = useState<"all" | "pharmacy" | "clinic">("all");

  useEffect(() => {
    if (session?.extractedData?.gpsLatitude && session?.extractedData?.gpsLongitude) {
      setHomeCoords({
        lat: session.extractedData.gpsLatitude,
        lng: session.extractedData.gpsLongitude
      });
      if (session.extractedData.gpsAddress) {
        setHomeAddress(session.extractedData.gpsAddress);
      } else if (session.extractedData.place) {
        setHomeAddress(session.extractedData.place);
      }
    }
  }, [
    session?.id,
    session?.extractedData?.gpsLatitude,
    session?.extractedData?.gpsLongitude,
    session?.extractedData?.gpsAddress,
    session?.extractedData?.place
  ]);

  if (!hasValidKey) {
    return (
      <MapContainer
        session={session}
        homeCoords={homeCoords}
        setHomeCoords={setHomeCoords}
        homeAddress={homeAddress}
        setHomeAddress={setHomeAddress}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeSubTab={activeSubTab}
        setActiveSubTab={setActiveSubTab}
        mapTypeFilter={mapTypeFilter}
        setMapTypeFilter={setMapTypeFilter}
        isSimulated={true}
      />
    );
  }

  return (
    <APIProvider apiKey={API_KEY} version="weekly" libraries={["places", "routes"]}>
      <MapContainer
        session={session}
        homeCoords={homeCoords}
        setHomeCoords={setHomeCoords}
        homeAddress={homeAddress}
        setHomeAddress={setHomeAddress}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeSubTab={activeSubTab}
        setActiveSubTab={setActiveSubTab}
        mapTypeFilter={mapTypeFilter}
        setMapTypeFilter={setMapTypeFilter}
        isSimulated={false}
      />
    </APIProvider>
  );
};

// Sub-component wrapper that has access to Google Maps Hooks
const DISTRICT_COORDINATES: Record<string, { lat: number; lng: number; address: string; state: string }> = {
  "South West Delhi": { lat: 28.5672, lng: 77.2100, address: "Ansari Nagar, New Delhi, Delhi, India", state: "Delhi" },
  "Gurugram": { lat: 28.4262, lng: 77.0410, address: "Sector 38, Gurugram, Haryana, India", state: "Haryana" },
  "Mumbai City": { lat: 19.0028, lng: 72.8423, address: "Parel, Mumbai, Maharashtra, India", state: "Maharashtra" },
  "Pune": { lat: 18.5203, lng: 73.8690, address: "Rasta Peth, Pune, Maharashtra, India", state: "Maharashtra" },
  "Bengaluru Urban": { lat: 12.9428, lng: 77.5992, address: "Hosur Road, Bengaluru, Karnataka, India", state: "Karnataka" },
  "Mysuru": { lat: 12.3168, lng: 76.6277, address: "Kuvempunagar, Mysuru, Karnataka, India", state: "Karnataka" },
  "Chennai": { lat: 13.0608, lng: 80.2520, address: "Greams Road, Chennai, Tamil Nadu, India", state: "Tamil Nadu" },
  "Coimbatore": { lat: 11.0267, lng: 77.0344, address: "Avinashi Road, Coimbatore, Tamil Nadu, India", state: "Tamil Nadu" },
  "Madurai": { lat: 9.9258, lng: 78.1215, address: "Panagal Road, Madurai, Tamil Nadu, India", state: "Tamil Nadu" }
};

const MapContainer: React.FC<{
  session?: ChatSession;
  homeCoords: { lat: number; lng: number };
  setHomeCoords: React.Dispatch<React.SetStateAction<{ lat: number; lng: number }>>;
  homeAddress: string;
  setHomeAddress: React.Dispatch<React.SetStateAction<string>>;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  activeSubTab: "nearby" | "hightech";
  setActiveSubTab: React.Dispatch<React.SetStateAction<"nearby" | "hightech">>;
  mapTypeFilter: "all" | "pharmacy" | "clinic";
  setMapTypeFilter: React.Dispatch<React.SetStateAction<"all" | "pharmacy" | "clinic">>;
  isSimulated?: boolean;
}> = ({
  session,
  homeCoords,
  setHomeCoords,
  homeAddress,
  setHomeAddress,
  searchQuery,
  setSearchQuery,
  activeSubTab,
  setActiveSubTab,
  mapTypeFilter,
  setMapTypeFilter,
  isSimulated = false
}) => {
  const map = isSimulated ? null : useMap();
  const placesLib = isSimulated ? null : useMapsLibrary("places");
  const routesLib = isSimulated ? null : useMapsLibrary("routes");

  const [selectedState, setSelectedState] = useState<string>("All");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("All");

  const [pharmacies, setPharmacies] = useState<HospitalFacilityLocal[]>([]);
  const [clinics, setClinics] = useState<HospitalFacilityLocal[]>([]);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Selected place for Detail view, InfoWindow anchoring, and Directions routing
  const [selectedPlace, setSelectedPlace] = useState<HospitalFacilityLocal | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);

  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  // Detect matching specialty hospital based on patient's diagnosed disease state
  const matchedSpecialtyHospital = (() => {
    if (!session || !session.possibleConditions || session.possibleConditions.length === 0) {
      return HIGH_TECH_HOSPITALS[4]; // Default to Massachusetts General if empty
    }
    // Attempt keyword search
    for (const condition of session.possibleConditions) {
      const condNameLower = condition.name.toLowerCase();
      const match = HIGH_TECH_HOSPITALS.find(hospital =>
        hospital.diseases.some(keyword => condNameLower.includes(keyword))
      );
      if (match) return match;
    }
    // Fallback to specialist recommendation
    if (session.recommendedSpecialist) {
      const specLower = session.recommendedSpecialist.toLowerCase();
      const match = HIGH_TECH_HOSPITALS.find(hospital =>
        hospital.specialty.toLowerCase().includes(specLower)
      );
      if (match) return match;
    }
    return HIGH_TECH_HOSPITALS[1]; // Fallback to Cleveland Clinic Cardiology
  })();

  // Geocode address or run a place search to set patient's "Home Address"
  const handleAddressSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    if (isSimulated || !placesLib) {
      setLoadingPlaces(true);
      setTimeout(() => {
        const query = searchQuery.trim();
        setHomeAddress(query);
        const matched = Object.entries(DISTRICT_COORDINATES).find(
          ([dist, details]) => dist.toLowerCase().includes(query.toLowerCase()) || details.state.toLowerCase().includes(query.toLowerCase())
        );
        if (matched) {
          setHomeCoords({ lat: matched[1].lat, lng: matched[1].lng });
          setHomeAddress(matched[1].address);
          setSelectedState(matched[1].state);
          setSelectedDistrict(matched[0]);
        } else {
          const seed = query.length;
          setHomeCoords({
            lat: 13.0608 + (seed % 5) * 0.05 - 0.1,
            lng: 80.2520 + (seed % 3) * 0.05 - 0.05
          });
        }
        setSelectedPlace(null);
        setRouteInfo(null);
        setLoadingPlaces(false);
      }, 600);
      return;
    }

    setLoadingPlaces(true);
    setSearchError(null);

    placesLib.Place.searchByText({
      textQuery: searchQuery,
      fields: ["displayName", "location", "formattedAddress"],
      maxResultCount: 1
    })
      .then(({ places }) => {
        if (places && places[0] && places[0].location) {
          const loc = places[0].location;
          const coords = { lat: loc.lat(), lng: loc.lng() };
          setHomeCoords(coords);
          setHomeAddress(places[0].formattedAddress || places[0].displayName || searchQuery);
          map?.setCenter(coords);
          map?.setZoom(13);
          setSelectedPlace(null);
          setRouteInfo(null);
          clearPolylines();
        } else {
          setSearchError("No locations found for this address. Try typing a city or ZIP code.");
        }
      })
      .catch(err => {
        console.error("Geocoding failed:", err);
        setSearchError("Failed to search location. Showing simulated coordinates.");
      })
      .finally(() => {
        setLoadingPlaces(false);
      });
  };

  // Get current device location
  const handleGetDeviceLocation = () => {
    if (!navigator.geolocation) {
      setSearchError("Geolocation is not supported by your browser.");
      return;
    }
    setLoadingPlaces(true);
    setSearchError(null);

    navigator.geolocation.getCurrentPosition(
      position => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setHomeCoords(coords);
        
        if (!isSimulated && typeof window !== "undefined" && (window as any).google?.maps?.Geocoder) {
          try {
            const geocoder = new (window as any).google.maps.Geocoder();
            geocoder.geocode({ location: coords }, (results: any, status: string) => {
              if (status === "OK" && results && results[0]) {
                setHomeAddress(results[0].formatted_address);
              } else {
                setHomeAddress("My Current Location");
              }
            });
          } catch (e) {
            console.error("Geocoder failed:", e);
            setHomeAddress("My Current Location");
          }
        } else {
          setHomeAddress(`GPS Coords: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`);
        }

        if (map) {
          map.setCenter(coords);
          map.setZoom(13);
        }
        setSelectedPlace(null);
        setRouteInfo(null);
        clearPolylines();
        setLoadingPlaces(false);
      },
      err => {
        console.error("Geolocation error:", err);
        setSearchError("Location permission denied. Please enter your address manually.");
        setLoadingPlaces(false);
      }
    );
  };

  // Auto-detect user's current GPS location on component mount
  const autoLocatedRef = useRef(false);
  useEffect(() => {
    if (!autoLocatedRef.current && (map || isSimulated)) {
      autoLocatedRef.current = true;
      handleGetDeviceLocation();
    }
  }, [map, isSimulated]);

  // Clear routes
  const clearPolylines = () => {
    polylinesRef.current.forEach(p => p.setMap(null));
    polylinesRef.current = [];
  };

  // Compute navigation route to selected marker
  const handleComputeRoute = (destinationCoords: { lat: number; lng: number }) => {
    const distanceMiles = getDistanceMiles(
      homeCoords.lat,
      homeCoords.lng,
      destinationCoords.lat,
      destinationCoords.lng
    );

    if (isSimulated || !routesLib || !map) {
      const simulatedDuration = Math.max(2, Math.round(distanceMiles * 1.8));
      setRouteInfo({
        distance: `${distanceMiles.toFixed(1)} miles`,
        duration: `${simulatedDuration} mins (Est. Driving)`
      });
      return;
    }

    clearPolylines();

    if (distanceMiles > 250) {
      setRouteInfo({
        distance: `${distanceMiles.toFixed(0)} miles`,
        duration: "Cross-state (Suggested flight/referral)"
      });
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(homeCoords);
      bounds.extend(destinationCoords);
      map.fitBounds(bounds);
      return;
    }

    routesLib.Route.computeRoutes({
      origin: homeCoords,
      destination: destinationCoords,
      travelMode: "DRIVING",
      fields: ["path", "distanceMeters", "durationMillis", "viewport"]
    })
      .then(({ routes }) => {
        if (routes && routes[0]) {
          const route = routes[0];
          const polylines = route.createPolylines();
          polylines.forEach(p => {
            p.setMap(map);
            p.setOptions({
              strokeColor: "#0d9488",
              strokeWeight: 5,
              strokeOpacity: 0.8
            });
          });
          polylinesRef.current = polylines;

          const meters = route.distanceMeters || 0;
          const miles = (meters / 1609.34).toFixed(1);
          const minutes = Math.round((route.durationMillis || 0) / 60000);

          setRouteInfo({
            distance: `${miles} miles`,
            duration: minutes > 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes} mins`
          });

          if (route.viewport) {
            map.fitBounds(route.viewport);
          }
        }
      })
      .catch(err => {
        console.error("Failed to compute route polyline:", err);
        setRouteInfo({
          distance: `${distanceMiles.toFixed(1)} miles`,
          duration: `${Math.round(distanceMiles * 1.5)} mins (Est. Driving)`
        });
      });
  };

  // Helper distance calculator
  function getDistanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3958.8; // Earth radius in miles
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Load nearby Places (Pharmacies & Small Clinics) whenever homeCoords changes
  useEffect(() => {
    if (isSimulated || !placesLib || !homeCoords) {
      simulateLocalPlaces();
      return;
    }

    setLoadingPlaces(true);
    setSearchError(null);

    // 1. Search Nearby Pharmacies (Medical Shops)
    const pharmPromise = placesLib.Place.searchNearby({
      locationRestriction: { center: homeCoords, radius: 4000 },
      includedTypes: ["pharmacy"],
      fields: [
        "displayName",
        "location",
        "formattedAddress",
        "rating",
        "userRatingCount",
        "nationalPhoneNumber",
        "regularOpeningHours"
      ],
      maxResultCount: 8
    })
      .then(({ places }) => {
        return places.map(p => ({
          name: p.displayName || "Local Pharmacy",
          type: "Pharmacy",
          lat: p.location?.lat() || homeCoords.lat,
          lng: p.location?.lng() || homeCoords.lng,
          address: p.formattedAddress || "Address nearby",
          phoneNumber: p.nationalPhoneNumber || "+1 (Local)",
          rating: p.rating || 4.5,
          userRatingCount: p.userRatingCount || 12,
          isOpenNow: p.regularOpeningHours ? true : undefined
        }));
      })
      .catch(err => {
        console.warn("Pharmacy Places API search failed, fallback active:", err);
        return simulateFallbackPharmacies(homeCoords.lat, homeCoords.lng);
      });

    // 2. Search Nearby Small Clinics
    const clinicPromise = placesLib.Place.searchNearby({
      locationRestriction: { center: homeCoords, radius: 4000 },
      includedTypes: ["doctor", "medical_clinic"],
      fields: [
        "displayName",
        "location",
        "formattedAddress",
        "rating",
        "userRatingCount",
        "nationalPhoneNumber",
        "regularOpeningHours"
      ],
      maxResultCount: 8
    })
      .then(({ places }) => {
        return places.map(p => ({
          name: p.displayName || "Family Clinic",
          type: "Clinic",
          lat: p.location?.lat() || homeCoords.lat,
          lng: p.location?.lng() || homeCoords.lng,
          address: p.formattedAddress || "Address nearby",
          phoneNumber: p.nationalPhoneNumber || "+1 (Local)",
          rating: p.rating || 4.4,
          userRatingCount: p.userRatingCount || 8,
          isOpenNow: p.regularOpeningHours ? true : undefined
        }));
      })
      .catch(err => {
        console.warn("Clinic Places API search failed, fallback active:", err);
        return simulateFallbackClinics(homeCoords.lat, homeCoords.lng);
      });

    Promise.all([pharmPromise, clinicPromise])
      .then(([pharmList, clinicList]) => {
        setPharmacies(pharmList);
        setClinics(clinicList);
      })
      .catch(err => {
        console.error("Places extraction failed:", err);
        simulateLocalPlaces();
      })
      .finally(() => {
        setLoadingPlaces(false);
      });
  }, [placesLib, homeCoords]);

  // Fallback simulation helpers
  const simulateLocalPlaces = () => {
    const ph = simulateFallbackPharmacies(homeCoords.lat, homeCoords.lng);
    const cl = simulateFallbackClinics(homeCoords.lat, homeCoords.lng);
    setPharmacies(ph);
    setClinics(cl);
  };

  const simulateFallbackPharmacies = (lat: number, lng: number): HospitalFacilityLocal[] => {
    const isIndia = selectedState !== "All" && selectedState !== "California" && selectedState !== "Ohio" && selectedState !== "Massachusetts";
    const namePrefix = isIndia ? "Apollo Pharmacy" : "CVS Pharmacy";
    const namePrefix2 = isIndia ? "MedPlus Medicine Shop" : "Walgreens Pharmacy";
    const namePrefix3 = isIndia ? "Netmeds Wellness Shop" : "Rite Aid Pharmacy";
    
    const phone1 = isIndia ? "+91 44 2432 9000" : "+1 (800) 746-7287";
    const phone2 = isIndia ? "+91 44 4567 8900" : "+1 (800) 925-4733";
    const phone3 = isIndia ? "+91 44 3322 1100" : "+1 (800) 748-3243";

    return [
      {
        name: `${namePrefix} - ${selectedDistrict !== "All" ? selectedDistrict : "Central"} Branch`,
        type: "Pharmacy",
        lat: lat + 0.005,
        lng: lng - 0.006,
        address: `${selectedDistrict !== "All" ? selectedDistrict : "City Center"} Hub, ${selectedState !== "All" ? selectedState : "California"}`,
        phoneNumber: phone1,
        rating: 4.6,
        userRatingCount: 42,
        isOpenNow: true
      },
      {
        name: `${namePrefix2} - Local Medical Shop`,
        type: "Pharmacy",
        lat: lat - 0.008,
        lng: lng + 0.012,
        address: `Hospital Road, ${selectedDistrict !== "All" ? selectedDistrict : "City"} District, ${selectedState !== "All" ? selectedState : "California"}`,
        phoneNumber: phone2,
        rating: 4.3,
        userRatingCount: 29,
        isOpenNow: true
      },
      {
        name: `${namePrefix3} - 24/7 Medstore`,
        type: "Pharmacy",
        lat: lat + 0.014,
        lng: lng + 0.003,
        address: `Market Bazaar Road, ${selectedDistrict !== "All" ? selectedDistrict : "City"} District, ${selectedState !== "All" ? selectedState : "California"}`,
        phoneNumber: phone3,
        rating: 4.8,
        userRatingCount: 15,
        isOpenNow: false
      }
    ];
  };

  const simulateFallbackClinics = (lat: number, lng: number): HospitalFacilityLocal[] => {
    const isIndia = selectedState !== "All" && selectedState !== "California" && selectedState !== "Ohio" && selectedState !== "Massachusetts";
    const namePrefix = isIndia ? "Primary Health Centre (PHC)" : "Community Health Clinic";
    const namePrefix2 = isIndia ? "Dr. Mohan's Speciality Clinic" : "Express Urgent Care Clinic";
    const namePrefix3 = isIndia ? "Medi-Care Family Clinic" : "Family Health General Clinic";

    const phone1 = isIndia ? "+91 44 2811 0001" : "+1 (650) 723-4001";
    const phone2 = isIndia ? "+91 44 2811 0002" : "+1 (650) 412-8811";
    const phone3 = isIndia ? "+91 44 2811 0003" : "+1 (650) 333-2211";

    return [
      {
        name: `${namePrefix} - ${selectedDistrict !== "All" ? selectedDistrict : "District"} Branch`,
        type: "Clinic",
        lat: lat + 0.009,
        lng: lng + 0.004,
        address: `Health Plaza Rd, ${selectedDistrict !== "All" ? selectedDistrict : "City Center"}`,
        phoneNumber: phone1,
        rating: 4.7,
        userRatingCount: 33,
        isOpenNow: true
      },
      {
        name: namePrefix2,
        type: "Clinic",
        lat: lat - 0.004,
        lng: lng - 0.011,
        address: `Urgent Care Circle, ${selectedDistrict !== "All" ? selectedDistrict : "District"} Area`,
        phoneNumber: phone2,
        rating: 4.5,
        userRatingCount: 52,
        isOpenNow: true
      },
      {
        name: namePrefix3,
        type: "Clinic",
        lat: lat + 0.011,
        lng: lng - 0.015,
        address: `Doctors Street, ${selectedDistrict !== "All" ? selectedDistrict : "District"} Hub`,
        phoneNumber: phone3,
        rating: 4.2,
        userRatingCount: 19,
        isOpenNow: true
      }
    ];
  };

  const availableDistricts = (() => {
    if (selectedState === "All") {
      return ["All", "South West Delhi", "Gurugram", "Mumbai City", "Pune", "Bengaluru Urban", "Mysuru", "Chennai", "Coimbatore", "Madurai", "Olmsted", "Cuyahoga"];
    }
    const filtered = HIGH_TECH_HOSPITALS.filter(h => h.state === selectedState);
    const districts = Array.from(new Set(filtered.map(h => h.district)));
    return ["All", ...districts];
  })();

  const currentMarkers = (() => {
    if (activeSubTab === "hightech") {
      let list = HIGH_TECH_HOSPITALS;
      if (selectedState !== "All") {
        list = list.filter(h => h.state === selectedState);
      }
      if (selectedDistrict !== "All") {
        list = list.filter(h => h.district === selectedDistrict);
      }
      return list.map(h => ({
        name: h.name,
        type: "Specialty Hospital",
        lat: h.lat,
        lng: h.lng,
        address: h.address,
        phoneNumber: h.contact,
        rating: h.rating,
        specialty: h.specialty,
        techFeatures: h.techFeatures
      }));
    } else {
      let list: HospitalFacilityLocal[] = [];
      if (mapTypeFilter === "all" || mapTypeFilter === "pharmacy") {
        list = [...list, ...pharmacies];
      }
      if (mapTypeFilter === "all" || mapTypeFilter === "clinic") {
        list = [...list, ...clinics];
      }
      return list;
    }
  })();

  // Pan and select marker from list
  const handleSelectPlaceFromList = (place: HospitalFacilityLocal) => {
    setSelectedPlace(place);
    map?.setCenter({ lat: place.lat, lng: place.lng });
    map?.setZoom(14);
    handleComputeRoute({ lat: place.lat, lng: place.lng });
  };

  // Coordinates translation for simulated SVG radar map
  const renderSvgSimulationMap = () => {
    const width = 600;
    const height = 500;
    const centerX = width / 2;
    const centerY = height / 2;
    const geoScale = 4000;

    const getLocalX = (lng: number) => {
      const dlng = lng - homeCoords.lng;
      return centerX + dlng * geoScale;
    };

    const getLocalY = (lat: number) => {
      const dlat = lat - homeCoords.lat;
      return centerY - dlat * geoScale;
    };

    const patientX = centerX;
    const patientY = centerY;

    return (
      <div className="w-full h-full bg-slate-950 text-white relative overflow-hidden font-sans border border-slate-900 rounded-b-2xl md:rounded-r-2xl md:rounded-bl-none flex flex-col justify-between" id="simulated-radar-container-lf">
        <div className="absolute top-3 left-3 right-3 flex justify-between items-center z-10 pointer-events-none">
          <div className="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-lg px-2.5 py-1.5 text-[9px] flex items-center gap-2">
            <span className="w-2 h-2 bg-teal-500 rounded-full animate-ping" />
            <span className="font-mono text-teal-400 font-bold tracking-wider uppercase">Active Dispatch Grid</span>
          </div>
          <div className="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-lg px-2.5 py-1.5 text-[9px] font-mono text-slate-405">
            RADAR_RADIUS: 10KM
          </div>
        </div>

        <div className="absolute bottom-3 left-3 right-3 z-10">
          <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800/80 p-3 rounded-xl flex items-start gap-2.5 shadow-xl animate-fadeIn">
            <div className="p-1.5 bg-teal-500/10 text-teal-400 rounded-lg shrink-0 mt-0.5">
              <Compass className="w-4 h-4 animate-spin-slow" />
            </div>
            <div className="text-[10px] space-y-0.5 leading-snug">
              <span className="font-bold text-slate-200 block">House Anchor Area</span>
              <p className="text-slate-400">{homeAddress}</p>
              <p className="text-[9px] text-slate-500 italic mt-0.5">
                Click any clinic/pharmacy or pin on the grid to calculate routing paths.
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 w-full h-full relative cursor-crosshair">
          <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`}>
            <defs>
              <pattern id="radar-grid-lf" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.04" />
              </pattern>
              <radialGradient id="radar-sweep-lf" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#0d9488" stopOpacity="0.15" />
                <stop offset="60%" stopColor="#0d9488" stopOpacity="0.03" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0" />
              </radialGradient>
            </defs>

            <rect width="100%" height="100%" fill="url(#radar-grid-lf)" />
            <circle cx={centerX} cy={centerY} r="60" fill="none" stroke="#0d9488" strokeWidth="0.8" strokeDasharray="3 4" strokeOpacity="0.25" />
            <circle cx={centerX} cy={centerY} r="120" fill="none" stroke="#0d9488" strokeWidth="1" strokeOpacity="0.15" />
            <circle cx={centerX} cy={centerY} r="180" fill="none" stroke="#0d9488" strokeWidth="0.8" strokeDasharray="6 3" strokeOpacity="0.1" />

            <line x1="0" y1={centerY} x2={width} y2={centerY} stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.1" />
            <line x1={centerX} y1="0" x2={centerX} y2={height} stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.1" />
            <circle cx={centerX} cy={centerY} r="200" fill="url(#radar-sweep-lf)" className="animate-pulse" />

            {/* Draw route path line if selected */}
            {selectedPlace && (
              <>
                <line
                  x1={patientX}
                  y1={patientY}
                  x2={getLocalX(selectedPlace.lng)}
                  y2={getLocalY(selectedPlace.lat)}
                  stroke="#0d9488"
                  strokeWidth="3"
                  strokeDasharray="5 4"
                  className="animate-dash"
                  strokeLinecap="round"
                  strokeOpacity="0.85"
                />
                <circle
                  cx={getLocalX(selectedPlace.lng)}
                  cy={getLocalY(selectedPlace.lat)}
                  r="12"
                  fill="none"
                  stroke="#0d9488"
                  strokeWidth="2"
                  className="animate-ping"
                  style={{ animationDuration: "1.5s" }}
                />
              </>
            )}

            {/* Patient location node */}
            <g transform={`translate(${patientX}, ${patientY})`} className="cursor-pointer">
              <circle r="14" fill="#0d9488" fillOpacity="0.15" className="animate-ping" style={{ animationDuration: "2s" }} />
              <circle r="7" fill="#0d9488" stroke="#ffffff" strokeWidth="1.5" className="shadow-lg" />
              <text y="-14" textAnchor="middle" fill="#0d9488" className="text-[9px] font-bold font-mono tracking-tight bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                👤 PATIENT ORIGIN
              </text>
            </g>

            {/* Plotted Places markers */}
            {currentMarkers.map((place, idx) => {
              const x = getLocalX(place.lng);
              const y = getLocalY(place.lat);
              const isSelected = selectedPlace?.name === place.name;

              if (x < 15 || x > width - 15 || y < 15 || y > height - 15) return null;

              let markerColor = "#f59e0b"; // Clinic
              if (place.type === "Pharmacy") {
                markerColor = "#0d9488";
              } else if (place.type === "Specialty Hospital") {
                markerColor = "#ef4444";
              }

              return (
                <g
                  key={idx}
                  transform={`translate(${x}, ${y})`}
                  className="cursor-pointer group"
                  onClick={() => {
                    setSelectedPlace(place);
                    handleComputeRoute({ lat: place.lat, lng: place.lng });
                  }}
                >
                  {isSelected && (
                    <circle r="16" fill={markerColor} fillOpacity="0.2" className="animate-pulse" />
                  )}
                  <circle
                    r="8"
                    fill={isSelected ? "#ffffff" : markerColor}
                    stroke={isSelected ? markerColor : "#ffffff"}
                    strokeWidth="1.5"
                    className="transition-all duration-200 group-hover:scale-120"
                  />
                  <text
                    y="18"
                    textAnchor="middle"
                    fill={isSelected ? markerColor : "#cbd5e1"}
                    className="text-[8px] font-semibold tracking-tight pointer-events-none bg-slate-950/80 px-1 py-0.5 rounded"
                  >
                    {place.name.split(" ")[0]}..
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/40" id="maps-platform-assistant">
      {/* Search and Address Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 p-4 shrink-0 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
              <Compass className="w-4 h-4 text-teal-600 animate-spin-slow" />
              Interactive Health Map Assistant
            </h4>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Locating medical shops, family clinics, and all-state high-tech specialty hospitals.
            </p>
          </div>
          
          {/* Quick toggle between Nearby Services & High-Tech Specialty Hospitals */}
          <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-lg shrink-0 w-full sm:w-auto">
            <button
              onClick={() => {
                setActiveSubTab("nearby");
                setSelectedPlace(null);
                setRouteInfo(null);
                clearPolylines();
              }}
              className={`flex-1 sm:flex-none text-[10px] font-bold px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                activeSubTab === "nearby"
                  ? "bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-sm"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              Nearby Shops & Clinics
            </button>
            <button
              onClick={() => {
                setActiveSubTab("hightech");
                setSelectedPlace(null);
                setRouteInfo(null);
                clearPolylines();
              }}
              className={`flex-1 sm:flex-none text-[10px] font-bold px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                activeSubTab === "hightech"
                  ? "bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-sm"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              High-Tech Disease Specialists
            </button>
          </div>
        </div>

        {/* District & State dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50/50 dark:bg-slate-950/20 p-2.5 rounded-xl border border-slate-150 dark:border-slate-800">
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider min-w-[32px]">State:</span>
            <select
              value={selectedState}
              onChange={(e) => {
                const state = e.target.value;
                setSelectedState(state);
                setSelectedDistrict("All");
                if (state !== "All") {
                  const firstHosp = HIGH_TECH_HOSPITALS.find(h => h.state === state);
                  if (firstHosp) {
                    setHomeCoords({ lat: firstHosp.lat, lng: firstHosp.lng });
                    setHomeAddress(`${firstHosp.district}, ${firstHosp.state}`);
                    setSelectedPlace(null);
                    setRouteInfo(null);
                  }
                }
              }}
              className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              <option value="All">All States</option>
              <option value="Delhi">Delhi</option>
              <option value="Haryana">Haryana</option>
              <option value="Maharashtra">Maharashtra</option>
              <option value="Karnataka">Karnataka</option>
              <option value="Tamil Nadu">Tamil Nadu</option>
              <option value="Minnesota (MN)">Minnesota (USA)</option>
              <option value="Ohio (OH)">Ohio (USA)</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider min-w-[32px]">District:</span>
            <select
              value={selectedDistrict}
              onChange={(e) => {
                const dist = e.target.value;
                setSelectedDistrict(dist);
                if (dist !== "All") {
                  const coords = DISTRICT_COORDINATES[dist];
                  if (coords) {
                    setHomeCoords({ lat: coords.lat, lng: coords.lng });
                    setHomeAddress(coords.address);
                    setSelectedState(coords.state);
                    setSelectedPlace(null);
                    setRouteInfo(null);
                  }
                }
              }}
              className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              {availableDistricts.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Address input */}
        <form onSubmit={handleAddressSearch} className="flex gap-2">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Enter your house address, city, or ZIP code..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-teal-500"
            />
          </div>
          <button
            type="submit"
            disabled={loadingPlaces || !searchQuery.trim()}
            className="bg-slate-800 hover:bg-slate-900 text-white font-medium text-xs px-3.5 rounded-xl flex items-center justify-center cursor-pointer disabled:opacity-50 shrink-0"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleGetDeviceLocation}
            className="border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 p-2.5 rounded-xl flex items-center justify-center text-teal-600 cursor-pointer shrink-0"
            title="Locate me via GPS"
          >
            <Crosshair className="w-4 h-4" />
          </button>
        </form>

        {searchError && (
          <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 px-3 py-2 rounded-lg flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
            <span className="text-[10px] text-rose-700 dark:text-rose-400 leading-normal">{searchError}</span>
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
          <div className="flex items-center gap-1">
            <span className="font-bold text-slate-700 dark:text-slate-300">House Anchor:</span>
            <span className="text-teal-600 dark:text-teal-400 max-w-[200px] sm:max-w-xs truncate font-medium">
              {homeAddress}
            </span>
          </div>
          <span className="text-[9px] text-slate-400 font-mono">
            {homeCoords.lat.toFixed(4)}°N, {homeCoords.lng.toFixed(4)}°W
          </span>
        </div>
      </div>

      {/* Split Workstation Panel */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0">
        {/* Left column (40% width on md+): Side list & assistant */}
        <div className="md:col-span-5 border-r border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col min-h-0 overflow-y-auto max-h-[480px] md:max-h-none">
          
          {/* AI MAP ASSISTANT INTELLIGENCE PANEL */}
          <div className="p-4 bg-teal-50/40 dark:bg-teal-950/10 border-b border-teal-100/30 dark:border-teal-900/20">
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="w-4 h-4 text-teal-600 animate-pulse" />
              <span className="text-xs font-bold text-teal-800 dark:text-teal-400">Map Assistant Diagnostics</span>
            </div>
            
            <p className="text-[11px] text-slate-600 dark:text-slate-350 leading-relaxed font-medium">
              🧠 Based on patient case files, the recommended specialty center is{" "}
              <strong className="text-teal-700 dark:text-teal-300 underline cursor-pointer" onClick={() => handleSelectPlaceFromList({
                name: matchedSpecialtyHospital.name,
                type: "Specialty Hospital",
                lat: matchedSpecialtyHospital.lat,
                lng: matchedSpecialtyHospital.lng,
                address: matchedSpecialtyHospital.address,
                phoneNumber: matchedSpecialtyHospital.contact,
                rating: matchedSpecialtyHospital.rating
              })}>
                {matchedSpecialtyHospital.name}
              </strong> ({matchedSpecialtyHospital.specialty}).
            </p>

            {/* Selected item status or routes detail */}
            {selectedPlace ? (
              <div className="mt-3 bg-white dark:bg-slate-950 p-2.5 rounded-xl border border-teal-100/40 dark:border-teal-900/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                    📍 Active Destination
                  </span>
                  {selectedPlace.isOpenNow !== undefined && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${selectedPlace.isOpenNow ? "bg-green-50 text-green-600 border border-green-100" : "bg-rose-50 text-rose-600 border border-rose-100"}`}>
                      {selectedPlace.isOpenNow ? "Open Now" : "Closed"}
                    </span>
                  )}
                </div>
                <h5 className="text-[11px] font-bold text-slate-800 dark:text-white line-clamp-1">{selectedPlace.name}</h5>
                <p className="text-[10px] text-slate-400">{selectedPlace.address}</p>
                {selectedPlace.phoneNumber && (
                  <p className="text-[10px] text-teal-650 dark:text-teal-400 font-semibold flex items-center gap-1 mt-0.5">
                    📞 Phone: {selectedPlace.phoneNumber}
                  </p>
                )}

                {routeInfo ? (
                  <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/40 p-1.5 rounded-md text-[10px]">
                    <div>
                      <span className="text-slate-400 block">Driving Distance</span>
                      <strong className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5">
                        <Car className="w-3.5 h-3.5 text-teal-600" /> {routeInfo.distance}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Estimated Time</span>
                      <strong className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-teal-600" /> {routeInfo.duration}
                      </strong>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => handleComputeRoute({ lat: selectedPlace.lat, lng: selectedPlace.lng })}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-semibold py-1.5 rounded-lg flex items-center justify-center gap-1 mt-1 transition-all cursor-pointer shadow-sm"
                  >
                    <Car className="w-3 h-3" /> Calculate Directions From House
                  </button>
                )}
              </div>
            ) : (
              <p className="text-[10px] text-slate-400 italic mt-2">
                Click any shop or clinic marker below or on the map to query driving times and details of the medical shop or clinic.
              </p>
            )}
          </div>

          {/* Type filters for Nearby tab */}
          {activeSubTab === "nearby" && (
            <div className="p-3 bg-slate-50/50 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-800 flex gap-1.5 shrink-0">
              <button
                onClick={() => setMapTypeFilter("all")}
                className={`text-[9px] font-bold px-2.5 py-1 rounded-md border transition-all cursor-pointer ${
                  mapTypeFilter === "all"
                    ? "bg-slate-800 text-white border-slate-800 dark:bg-slate-700 dark:border-slate-600"
                    : "bg-white text-slate-500 border-slate-200 dark:bg-slate-900 dark:border-slate-800 hover:bg-slate-50"
                }`}
              >
                All Nearby ({pharmacies.length + clinics.length})
              </button>
              <button
                onClick={() => setMapTypeFilter("pharmacy")}
                className={`text-[9px] font-bold px-2.5 py-1 rounded-md border transition-all cursor-pointer ${
                  mapTypeFilter === "pharmacy"
                    ? "bg-teal-600 text-white border-teal-600"
                    : "bg-white text-slate-500 border-slate-200 dark:bg-slate-900 dark:border-slate-800 hover:bg-slate-50"
                }`}
              >
                🏪 Medical Shops ({pharmacies.length})
              </button>
              <button
                onClick={() => setMapTypeFilter("clinic")}
                className={`text-[9px] font-bold px-2.5 py-1 rounded-md border transition-all cursor-pointer ${
                  mapTypeFilter === "clinic"
                    ? "bg-amber-600 text-white border-amber-600"
                    : "bg-white text-slate-500 border-slate-200 dark:bg-slate-900 dark:border-slate-800 hover:bg-slate-50"
                }`}
              >
                🩺 Small Clinics ({clinics.length})
              </button>
            </div>
          )}

          {/* List display */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
            {loadingPlaces && (
              <div className="flex flex-col items-center justify-center py-10 space-y-2">
                <div className="w-6 h-6 rounded-full border-2 border-teal-500/20 border-t-teal-600 animate-spin" />
                <span className="text-[10px] text-slate-400">Loading locations around house coordinates...</span>
              </div>
            )}

            {!loadingPlaces && currentMarkers.length === 0 && (
              <p className="text-center text-xs text-slate-400 py-10">No locations found. Try adjusting filters.</p>
            )}

            {!loadingPlaces &&
              currentMarkers.map((place, idx) => {
                const isSelected = selectedPlace?.name === place.name;
                const distanceMiles = getDistanceMiles(homeCoords.lat, homeCoords.lng, place.lat, place.lng);

                return (
                  <div
                    key={idx}
                    onClick={() => handleSelectPlaceFromList(place)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer text-left ${
                      isSelected
                        ? "bg-teal-50/50 border-teal-300 shadow-sm dark:bg-teal-950/10 dark:border-teal-900/60"
                        : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-200 hover:bg-slate-50/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {place.type === "Pharmacy" ? (
                            <span className="px-1.5 py-0.5 text-[8px] font-bold bg-teal-50 text-teal-600 dark:bg-teal-950/30 rounded">
                              Pharmacy
                            </span>
                          ) : place.type === "Clinic" ? (
                            <span className="px-1.5 py-0.5 text-[8px] font-bold bg-amber-50 text-amber-600 dark:bg-amber-950/30 rounded">
                              Clinic
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 text-[8px] font-bold bg-rose-50 text-rose-600 dark:bg-rose-950/30 rounded flex items-center gap-0.5">
                              <Award className="w-2.5 h-2.5" /> High-Tech Hospital
                            </span>
                          )}

                          <h5 className="text-[11px] font-bold text-slate-800 dark:text-white leading-tight">
                            {place.name}
                          </h5>
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-1">{place.address}</p>
                        
                        {place.specialty && (
                          <p className="text-[10px] text-teal-600 dark:text-teal-400 font-medium">
                            ★ Specialization: {place.specialty}
                          </p>
                        )}

                        {place.techFeatures && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {place.techFeatures.slice(0, 2).map((tf, i) => (
                              <span key={i} className="text-[8px] bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-slate-500 px-1.5 py-0.5 rounded">
                                ⚙️ {tf}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-350 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                          {distanceMiles < 1 ? "Nearby" : `${distanceMiles.toFixed(1)} mi`}
                        </span>
                        {place.rating && (
                          <div className="flex items-center gap-0.5 text-amber-500 justify-end mt-1.5">
                            <Star className="w-2.5 h-2.5 fill-amber-500" />
                            <span className="text-[9px] font-bold">{place.rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Right column (70% width on md+): The Live Google Map! */}
        <div className="md:col-span-7 relative min-h-[350px] md:min-h-none">
          {isSimulated ? (
            renderSvgSimulationMap()
          ) : (
            <Map
              mapId="DEMO_MAP_ID"
              defaultCenter={homeCoords}
              defaultZoom={11}
              gestureHandling="greedy"
              disableDefaultUI={false}
              internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
              style={{ width: "100%", height: "100%" }}
            >
              {/* 1. Mark Patient's House Location */}
              <AdvancedMarker position={homeCoords} title="My House / Starting point">
                <Pin background="#0f766e" borderColor="#115e59" glyphColor="#fff">
                  🏠
                </Pin>
              </AdvancedMarker>

              {/* 2. Plotted Places list markers */}
              {currentMarkers.map((place, idx) => {
                const isSelected = selectedPlace?.name === place.name;
                
                // Custom pins
                let pinBg = "#f59e0b"; // Orange for Clinic
                let glyph = "🩺";
                if (place.type === "Pharmacy") {
                  pinBg = "#0d9488"; // Teal for Pharmacy
                  glyph = "🏪";
                } else if (place.type === "Specialty Hospital") {
                  pinBg = "#ef4444"; // Red for Specialty Hospital
                  glyph = "🏛️";
                }

                return (
                  <AdvancedMarker
                    key={idx}
                    position={{ lat: place.lat, lng: place.lng }}
                    title={place.name}
                    onClick={() => {
                      setSelectedPlace(place);
                      handleComputeRoute({ lat: place.lat, lng: place.lng });
                    }}
                  >
                    <Pin background={pinBg} scale={isSelected ? 1.3 : 1.0} glyphColor="#fff">
                      {glyph}
                    </Pin>
                  </AdvancedMarker>
                );
              })}

              {/* 3. Popup details InfoWindow for selected marker */}
              {selectedPlace && (
                <InfoWindow
                  position={{ lat: selectedPlace.lat, lng: selectedPlace.lng }}
                  onCloseClick={() => {
                    setSelectedPlace(null);
                    setRouteInfo(null);
                    clearPolylines();
                  }}
                  maxWidth={300}
                >
                  <div className="p-1 space-y-1.5 text-slate-800">
                    <div className="flex items-center gap-1">
                      <span className={`text-[8px] font-bold px-1 rounded uppercase ${selectedPlace.type === "Pharmacy" ? "bg-teal-50 text-teal-600" : selectedPlace.type === "Clinic" ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"}`}>
                        {selectedPlace.type}
                      </span>
                      {selectedPlace.rating && (
                        <span className="text-[9px] text-amber-500 font-bold flex items-center gap-0.5">
                          ★ {selectedPlace.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 font-sans leading-snug">{selectedPlace.name}</h4>
                    <p className="text-[10px] text-slate-500 leading-normal">{selectedPlace.address}</p>
                    
                    {selectedPlace.phoneNumber && (
                      <div className="flex items-center gap-1 text-[9px] text-slate-500 pt-0.5">
                        <PhoneCall className="w-3 h-3 text-teal-600 shrink-0" />
                        <span>{selectedPlace.phoneNumber}</span>
                      </div>
                    )}

                    {selectedPlace.specialty && (
                      <p className="text-[9px] text-teal-600 font-bold mt-1">
                        🧬 Specialty: {selectedPlace.specialty}
                      </p>
                    )}

                    <div className="flex gap-1.5 pt-2">
                      <button
                        onClick={() => handleComputeRoute({ lat: selectedPlace.lat, lng: selectedPlace.lng })}
                        className="bg-teal-600 hover:bg-teal-700 text-white text-[9px] font-bold px-2 py-1 rounded flex items-center gap-0.5 cursor-pointer"
                      >
                        <Car className="w-3 h-3" /> Get Directions
                      </button>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedPlace.name + " " + (selectedPlace.address || ""))}`}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[9px] font-semibold px-2 py-1 rounded text-center block"
                      >
                        Open Google Maps
                      </a>
                    </div>
                  </div>
                </InfoWindow>
              )}
            </Map>
          )}
        </div>
      </div>
    </div>
  );
};
