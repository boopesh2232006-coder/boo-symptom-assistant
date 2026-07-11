import React, { useState, useEffect } from "react";
import { STATES_AND_UT, STATE_DISTRICTS, getHospitalsForStateAndDistrict, HospitalDetail } from "../data/hospitalsData";
import { 
  Building2, 
  MapPin, 
  Phone, 
  Search, 
  Filter, 
  Activity, 
  Calendar, 
  UserCheck, 
  Award, 
  Compass, 
  Bed, 
  FlameKindling, 
  Droplet, 
  ShieldAlert, 
  CheckCircle2, 
  HeartHandshake
} from "lucide-react";
import { LanguageCode, TRANSLATIONS } from "../lib/translations";

interface HospitalDetailsProps {
  language?: LanguageCode;
}

export const HospitalDetails: React.FC<HospitalDetailsProps> = ({ language = "en" }) => {
  const t = TRANSLATIONS[language];

  // Default selection
  const [selectedState, setSelectedState] = useState<string>("Delhi");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("New Delhi");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("all");
  
  // Facility filter toggles
  const [filterEmergency, setFilterEmergency] = useState<boolean>(false);
  const [filterICU, setFilterICU] = useState<boolean>(false);
  const [filterOxygen, setFilterOxygen] = useState<boolean>(false);
  const [filterBloodBank, setFilterBloodBank] = useState<boolean>(false);

  // Sync district select options when state changes
  const districts = STATE_DISTRICTS[selectedState] || [];
  useEffect(() => {
    if (districts.length > 0 && !districts.includes(selectedDistrict)) {
      setSelectedDistrict(districts[0]);
    }
  }, [selectedState, districts, selectedDistrict]);

  const hospitals = getHospitalsForStateAndDistrict(selectedState, selectedDistrict);

  // Apply search query, hospital type, and facility filters
  const filteredHospitals = hospitals.filter(h => {
    const matchesSearch = 
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.specialties.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
      h.address.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = selectedType === "all" || h.type === selectedType;

    const matchesEmergency = !filterEmergency || h.facilities.some(f => f.toLowerCase().includes("emergency") || f.toLowerCase().includes("er"));
    const matchesICU = !filterICU || h.bedsICU > 0;
    const matchesOxygen = !filterOxygen || h.bedsOxygen > 0;
    const matchesBloodBank = !filterBloodBank || h.facilities.some(f => f.toLowerCase().includes("blood bank"));

    return matchesSearch && matchesType && matchesEmergency && matchesICU && matchesOxygen && matchesBloodBank;
  });

  // Calculate summary metrics
  const totalBeds = filteredHospitals.reduce((acc, curr) => acc + curr.bedsGeneral, 0);
  const totalICUBeds = filteredHospitals.reduce((acc, curr) => acc + curr.bedsICU, 0);
  const totalOxygenBeds = filteredHospitals.reduce((acc, curr) => acc + curr.bedsOxygen, 0);

  return (
    <div className="flex flex-col h-full bg-slate-50/50 dark:bg-slate-950/20 p-4 space-y-4 overflow-y-auto">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-2xs flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-bold text-sm sm:text-base text-slate-850 dark:text-white">
            Details of State & District Hospitals
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Access master administrative records, bed registries, specialist details, and service lists of state government and district headquarters hospitals.
          </p>
        </div>
      </div>

      {/* Select State and District Filters Grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-2xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* State Selector */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Select State / Union Territory
            </label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full text-xs font-semibold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-700 dark:text-slate-200 cursor-pointer transition-all"
            >
              {STATES_AND_UT.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* District Selector */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Select District
            </label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full text-xs font-semibold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-700 dark:text-slate-200 cursor-pointer transition-all"
            >
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Search bar */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Search Name / Specialty
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. AIIMS, Cardiology..."
                className="w-full text-xs font-semibold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-700 dark:text-slate-200"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>
        </div>

        {/* Filter Categories and Facilities checkbox */}
        <div className="border-t border-slate-100 dark:border-slate-850 pt-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs mr-2 font-medium">
            <Filter className="w-3.5 h-3.5 text-teal-650" />
            <span>Refine Registry:</span>
          </div>

          {/* Hospital Type Selector */}
          <div className="flex gap-1.5">
            {["all", "State Government Hospital", "District Hospital", "Community Health Centre", "Super Speciality Hospital"].map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                  selectedType === type
                    ? "bg-teal-600 border-teal-600 text-white shadow-xs"
                    : "bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                }`}
              >
                {type === "all" ? "All Types" : type}
              </button>
            ))}
          </div>

          {/* Facility Checkboxes */}
          <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-600 dark:text-slate-400 ml-auto select-none">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={filterEmergency}
                onChange={(e) => setFilterEmergency(e.target.checked)}
                className="w-3.5 h-3.5 rounded-sm accent-teal-600 cursor-pointer"
              />
              <span>24/7 ER</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={filterICU}
                onChange={(e) => setFilterICU(e.target.checked)}
                className="w-3.5 h-3.5 rounded-sm accent-teal-600 cursor-pointer"
              />
              <span>ICU Beds</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={filterOxygen}
                onChange={(e) => setFilterOxygen(e.target.checked)}
                className="w-3.5 h-3.5 rounded-sm accent-teal-600 cursor-pointer"
              />
              <span>Oxygen Beds</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={filterBloodBank}
                onChange={(e) => setFilterBloodBank(e.target.checked)}
                className="w-3.5 h-3.5 rounded-sm accent-teal-600 cursor-pointer"
              />
              <span>Blood Bank</span>
            </label>
          </div>
        </div>
      </div>

      {/* Summary Statistics Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 rounded-2xl shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-650 dark:text-teal-400 flex items-center justify-center shrink-0">
            <Building2 className="w-4.5 h-4.5" />
          </div>
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Found Facilities</span>
            <span className="text-sm font-bold text-slate-800 dark:text-white mt-0.5 block">{filteredHospitals.length}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 rounded-2xl shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Bed className="w-4.5 h-4.5" />
          </div>
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">General Beds</span>
            <span className="text-sm font-bold text-slate-800 dark:text-white mt-0.5 block">{totalBeds}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 rounded-2xl shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Activity className="w-4.5 h-4.5" />
          </div>
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total ICU Beds</span>
            <span className="text-sm font-bold text-slate-800 dark:text-white mt-0.5 block">{totalICUBeds}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 rounded-2xl shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Compass className="w-4.5 h-4.5" />
          </div>
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Oxygen Beds</span>
            <span className="text-sm font-bold text-slate-800 dark:text-white mt-0.5 block">{totalOxygenBeds}</span>
          </div>
        </div>
      </div>

      {/* Hospital Detailed Listings */}
      <div className="space-y-3">
        {filteredHospitals.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-2xl text-center flex flex-col items-center justify-center shadow-2xs">
            <ShieldAlert className="w-10 h-10 text-slate-350 dark:text-slate-650 animate-pulse mb-3" />
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">No Hospitals Found</h4>
            <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
              No state or district facilities match your selected criteria or search query. Try expanding your filters.
            </p>
          </div>
        ) : (
          filteredHospitals.map((hospital, idx) => (
            <div 
              key={idx} 
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4.5 rounded-2xl shadow-2xs space-y-4 hover:border-teal-500/30 transition-all border-l-4 border-l-teal-600"
            >
              {/* Top Row: Name, Rating, and Type Badge */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-block px-2 py-0.5 text-[9px] font-bold bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 border border-teal-100 dark:border-teal-900 rounded-md">
                      {hospital.type}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">Est. {hospital.establishedYear}</span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-800 dark:text-white mt-1.5 leading-snug">
                    {hospital.name}
                  </h3>
                </div>
                
                {/* Rating Badge */}
                <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50 px-2 py-0.5 rounded-lg text-xs font-bold shrink-0 self-start">
                  <span>★</span>
                  <span>{hospital.rating.toFixed(1)}</span>
                </div>
              </div>

              {/* Middle Section: Beds Statistics */}
              <div className="grid grid-cols-3 gap-3 bg-slate-50/50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-100 dark:border-slate-850">
                <div className="text-center space-y-0.5">
                  <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">General Beds</span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{hospital.bedsGeneral}</span>
                </div>
                <div className="text-center border-x border-slate-150 dark:border-slate-800 space-y-0.5">
                  <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">ICU Beds</span>
                  <span className="text-xs font-bold text-teal-600 dark:text-teal-400">{hospital.bedsICU}</span>
                </div>
                <div className="text-center space-y-0.5">
                  <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">Oxygen Beds</span>
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{hospital.bedsOxygen}</span>
                </div>
              </div>

              {/* Details & Location/Contact Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Left details */}
                <div className="space-y-2 text-slate-600 dark:text-slate-400">
                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{hospital.address}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <a href={`tel:${hospital.phoneNumber}`} className="text-teal-650 hover:underline font-semibold font-mono">
                      {hospital.phoneNumber}
                    </a>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      Medical Superintendent: <strong className="text-slate-700 dark:text-slate-350">{hospital.chiefMedicalOfficer}</strong>
                    </span>
                  </div>
                </div>

                {/* Right details: Specialties */}
                <div className="space-y-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Specialties & Care Wings</span>
                    <div className="flex flex-wrap gap-1">
                      {hospital.specialties.map((s, sIdx) => (
                        <span 
                          key={sIdx} 
                          className="px-2 py-0.5 bg-slate-50 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-400 rounded-md border border-slate-100 dark:border-slate-800 font-semibold"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Row: Facilities checklist */}
              <div className="border-t border-slate-100 dark:border-slate-850 pt-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Equipped Amenities</span>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                  {hospital.facilities.map((f, fIdx) => (
                    <div key={fIdx} className="flex items-center gap-1 text-[11px] font-medium text-slate-650 dark:text-slate-450">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Hospital Master Details Footer Disclaimer */}
      <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1.5 border-t border-slate-100 dark:border-slate-850 pt-3">
        <HeartHandshake className="w-3.5 h-3.5 text-teal-650" />
        <span>Registered District Health Officer (DHO) database records. Handled under secure public directory guidelines.</span>
      </div>
    </div>
  );
};
