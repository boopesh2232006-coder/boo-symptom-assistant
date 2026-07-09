import React, { useState, useEffect } from "react";
import { ChatSession } from "../types";
import { Clock, Plus, Trash2, CheckCircle, Circle, Calendar, Pill } from "lucide-react";

interface ScheduleItem {
  id: string;
  name: string;
  dosage: string;
  times: {
    morning: boolean;
    afternoon: boolean;
    evening: boolean;
    bedtime: boolean;
  };
  days: string[]; // e.g., ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  history: { [dateStr: string]: { [timeKey: string]: boolean } }; // tracking taken pills
}

interface MedicationSchedulerProps {
  session: ChatSession;
}

export const MedicationScheduler: React.FC<MedicationSchedulerProps> = ({ session }) => {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [medName, setMedName] = useState("");
  const [dosage, setDosage] = useState("1 pill");
  const [selectedTimes, setSelectedTimes] = useState({
    morning: true,
    afternoon: false,
    evening: false,
    bedtime: false,
  });
  const [selectedDays, setSelectedDays] = useState<string[]>([
    "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"
  ]);

  const todayStr = new Date().toISOString().split("T")[0];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const currentDayName = dayNames[new Date().getDay()];

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`boo_schedules_${session.id}`);
      if (stored) {
        setSchedules(JSON.parse(stored));
      } else {
        // Initialize with session's educational medicines as template schedules
        const initial = session.educationalMedicines.map((med, idx) => ({
          id: `sched_${Date.now()}_${idx}`,
          name: med.name,
          dosage: "1 dose",
          times: { morning: true, afternoon: false, evening: true, bedtime: false },
          days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
          history: {},
        }));
        setSchedules(initial);
      }
    } catch (e) {
      console.error(e);
    }
  }, [session.id, session.educationalMedicines]);

  // Save to localStorage
  const saveSchedules = (items: ScheduleItem[]) => {
    setSchedules(items);
    try {
      localStorage.setItem(`boo_schedules_${session.id}`, JSON.stringify(items));
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medName.trim()) return;

    const newItem: ScheduleItem = {
      id: `sched_${Date.now()}`,
      name: medName.trim(),
      dosage: dosage.trim() || "1 dose",
      times: { ...selectedTimes },
      days: [...selectedDays],
      history: {},
    };

    const updated = [...schedules, newItem];
    saveSchedules(updated);

    // Reset input states
    setMedName("");
    setDosage("1 pill");
    setSelectedTimes({ morning: true, afternoon: false, evening: false, bedtime: false });
  };

  const handleDeleteSchedule = (id: string) => {
    const updated = schedules.filter((s) => s.id !== id);
    saveSchedules(updated);
  };

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const toggleTaken = (scheduleId: string, timeKey: string) => {
    const updated = schedules.map((sched) => {
      if (sched.id === scheduleId) {
        const currentHistory = sched.history[todayStr] || {};
        const isCurrentlyTaken = !!currentHistory[timeKey];
        return {
          ...sched,
          history: {
            ...sched.history,
            [todayStr]: {
              ...currentHistory,
              [timeKey]: !isCurrentlyTaken,
            },
          },
        };
      }
      return sched;
    });
    saveSchedules(updated);
  };

  return (
    <div className="space-y-5">
      {/* Add Scheduler Form */}
      <form onSubmit={handleAddSchedule} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-2 pb-1 border-b border-slate-200 dark:border-slate-800">
          <Clock className="w-4 h-4 text-teal-600" />
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Create Pill Schedule
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Medicine Name
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={medName}
                onChange={(e) => setMedName(e.target.value)}
                placeholder="e.g. Ibuprofen, Amoxicillin"
                className="flex-1 text-xs font-medium bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-850 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-750 dark:text-slate-105"
                list="extracted-meds-list"
              />
              <datalist id="extracted-meds-list">
                {session.educationalMedicines.map((m) => (
                  <option key={m.name} value={m.name} />
                ))}
              </datalist>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Dosage Instructions
            </label>
            <input
              type="text"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              placeholder="e.g. 1 pill, 5ml"
              className="w-full text-xs font-medium bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-850 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-700 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Dosage Times checkboxes */}
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Daily Times
          </label>
          <div className="flex flex-wrap gap-2">
            {Object.keys(selectedTimes).map((tKey) => {
              const active = selectedTimes[tKey as keyof typeof selectedTimes];
              return (
                <button
                  type="button"
                  key={tKey}
                  onClick={() =>
                    setSelectedTimes({
                      ...selectedTimes,
                      [tKey]: !active,
                    })
                  }
                  className={`text-[10px] px-3 py-1.5 rounded-lg border font-bold capitalize transition-all cursor-pointer ${
                    active
                      ? "bg-teal-500 text-white border-teal-500 shadow-xs"
                      : "bg-white text-slate-500 border-slate-250 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400"
                  }`}
                >
                  {tKey}
                </button>
              );
            })}
          </div>
        </div>

        {/* Days Selection */}
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Active Days
          </label>
          <div className="flex gap-1 justify-between flex-wrap">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => {
              const active = selectedDays.includes(d);
              return (
                <button
                  type="button"
                  key={d}
                  onClick={() => toggleDay(d)}
                  className={`flex-1 text-center text-[10px] py-1 rounded-md border font-bold transition-all cursor-pointer ${
                    active
                      ? "bg-teal-600 text-white border-teal-600"
                      : "bg-white text-slate-400 border-slate-250 dark:bg-slate-900 dark:border-slate-800"
                  }`}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="submit"
          disabled={!medName.trim()}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold py-2 rounded-lg transition-all shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Save Medication Schedule
        </button>
      </form>

      {/* Daily Checklist Tracker */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-teal-600" />
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Today's Pill Checklist ({currentDayName})
          </h4>
        </div>

        {schedules.filter((s) => s.days.includes(currentDayName)).length === 0 ? (
          <div className="text-center py-6 bg-slate-50 dark:bg-slate-950 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            <p className="text-[11px] text-slate-400 italic">No medications scheduled for today.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {schedules
              .filter((s) => s.days.includes(currentDayName))
              .map((sched) => (
                <div
                  key={sched.id}
                  className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Pill className="w-3.5 h-3.5 text-teal-500" />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                        {sched.name}
                      </span>
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-md font-mono">
                        {sched.dosage}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 text-[9px] text-slate-400 font-medium">
                      <span>Days: {sched.days.join(", ")}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {Object.keys(sched.times)
                      .filter((k) => sched.times[k as keyof typeof sched.times])
                      .map((tKey) => {
                        const historyToday = sched.history[todayStr] || {};
                        const taken = !!historyToday[tKey];
                        return (
                          <button
                            key={tKey}
                            onClick={() => toggleTaken(sched.id, tKey)}
                            className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                              taken
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/40"
                                : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-400"
                            }`}
                          >
                            {taken ? <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> : <Circle className="w-3 h-3 text-slate-400" />}
                            <span className="capitalize">{tKey}</span>
                          </button>
                        );
                      })}

                    <button
                      onClick={() => handleDeleteSchedule(sched.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};
