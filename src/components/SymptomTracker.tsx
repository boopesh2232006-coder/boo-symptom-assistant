import React, { useState, useEffect } from "react";
import { ChatSession } from "../types";
import { Activity, Plus, Trash2, TrendingUp, Calendar, Heart } from "lucide-react";

interface DiaryEntry {
  id: string;
  timestamp: string;
  dateStr: string;
  painLevel: number;
  temperature: number;
  notes: string;
}

interface SymptomTrackerProps {
  session: ChatSession;
}

export const SymptomTracker: React.FC<SymptomTrackerProps> = ({ session }) => {
  const [diary, setDiary] = useState<DiaryEntry[]>([]);
  const [painLevel, setPainLevel] = useState(5);
  const [temp, setTemp] = useState("98.6");
  const [notes, setNotes] = useState("");

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`boo_diary_${session.id}`);
      if (stored) {
        setDiary(JSON.parse(stored));
      } else {
        // Initialize with one base entry matching session state if available
        const painStr = session.extractedData?.painIntensity || "5";
        const painMatch = painStr.match(/(\d+)/);
        const startPain = painMatch ? parseInt(painMatch[1]) : 5;

        const tempStr = session.extractedData?.bodyTemperature || "98.6";
        const tempMatch = tempStr.match(/(\d+(?:\.\d+)?)/);
        const startTemp = tempMatch ? parseFloat(tempMatch[1]) : 98.6;

        const initial: DiaryEntry = {
          id: `diary_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
          dateStr: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          painLevel: startPain,
          temperature: startTemp,
          notes: "Initial symptom consultation evaluation recorded.",
        };
        setDiary([initial]);
      }
    } catch (e) {
      console.error(e);
    }
  }, [session.id, session.extractedData?.painIntensity, session.extractedData?.bodyTemperature]);

  // Save to localStorage
  const saveDiary = (entries: DiaryEntry[]) => {
    setDiary(entries);
    try {
      localStorage.setItem(`boo_diary_${session.id}`, JSON.stringify(entries));
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();

    const parsedTemp = parseFloat(temp);
    const validTemp = isNaN(parsedTemp) ? 98.6 : parsedTemp;

    const newEntry: DiaryEntry = {
      id: `diary_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      dateStr: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      painLevel,
      temperature: validTemp,
      notes: notes.trim(),
    };

    const updated = [...diary, newEntry];
    saveDiary(updated);

    // Reset notes input
    setNotes("");
  };

  const handleDeleteEntry = (id: string) => {
    const updated = diary.filter((d) => d.id !== id);
    saveDiary(updated);
  };

  // Generate SVG path for trend line
  const renderTrendGraph = () => {
    if (diary.length < 2) {
      return (
        <div className="h-32 flex items-center justify-center bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 italic">
          Log at least 2 tracking points to visualize trend lines.
        </div>
      );
    }

    const width = 450;
    const height = 120;
    const padding = 20;

    // Max values for scaling
    const maxPain = 10;
    const minPain = 1;

    // Map diary points to coordinates
    const stepX = (width - padding * 2) / (diary.length - 1);
    
    // Pain coordinates
    const painPoints = diary.map((d, index) => {
      const x = padding + index * stepX;
      // Invert Y since (0,0) is top-left
      const y = height - padding - ((d.painLevel - minPain) / (maxPain - minPain)) * (height - padding * 2);
      return { x, y };
    });

    const painPath = `M ${painPoints.map((p) => `${p.x} ${p.y}`).join(" L ")}`;

    return (
      <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          <span>Pain Intensity Trend (Scale 1-10)</span>
          <span className="text-teal-600">Recovery Path</span>
        </div>
        <div className="relative w-full overflow-x-auto">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[300px]">
            {/* Grid Lines */}
            <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#cbd5e1" strokeWidth={0.5} strokeDasharray="3 3" className="dark:stroke-slate-800" />
            <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#cbd5e1" strokeWidth={0.5} strokeDasharray="3 3" className="dark:stroke-slate-800" />
            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#cbd5e1" strokeWidth={0.5} strokeDasharray="3 3" className="dark:stroke-slate-800" />

            {/* Pain Line */}
            <path d={painPath} fill="none" stroke="#0d9488" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

            {/* Coordinate dots */}
            {painPoints.map((p, idx) => (
              <g key={idx}>
                <circle cx={p.x} cy={p.y} r={4} className="fill-teal-600 stroke-white dark:stroke-slate-900" strokeWidth={1.5} />
                <text x={p.x} y={p.y - 8} textAnchor="middle" className="text-[9px] fill-teal-600 dark:fill-teal-400 font-bold font-mono">
                  {diary[idx].painLevel}
                </text>
                <text x={p.x} y={height - 4} textAnchor="middle" className="text-[8px] fill-slate-400 font-medium">
                  {diary[idx].dateStr}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Log Form */}
      <form onSubmit={handleAddEntry} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center gap-2 pb-1 border-b border-slate-200 dark:border-slate-800">
          <Activity className="w-4 h-4 text-teal-600" />
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Symptom Diary Log
          </h4>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Pain Scale ({painLevel}/10)
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={painLevel}
              onChange={(e) => setPainLevel(parseInt(e.target.value))}
              className="w-full accent-teal-600"
            />
            <div className="flex justify-between text-[8px] text-slate-400 px-0.5">
              <span>Mild</span>
              <span>Moderate</span>
              <span>Severe</span>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Body Temp (&deg;F / &deg;C)
            </label>
            <input
              type="text"
              value={temp}
              onChange={(e) => setTemp(e.target.value)}
              placeholder="e.g. 98.6"
              className="w-full text-xs font-medium bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-850 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-700 dark:text-slate-100"
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Qualitative Logs / Symptom Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Describe local stiffness, coughing changes, fatigue, etc..."
            className="w-full text-xs font-medium bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-850 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-700 dark:text-slate-100 h-16 resize-none"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold py-2 rounded-lg transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Log Symptom Tracking point
        </button>
      </form>

      {/* Visual Chart */}
      {renderTrendGraph()}

      {/* Log History */}
      <div className="space-y-2">
        <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
          Recovery Logs History ({diary.length})
        </h5>
        <div className="space-y-2 max-h-56 overflow-y-auto">
          {diary.map((entry) => (
            <div
              key={entry.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-lg hover:shadow-xs transition-all flex items-start gap-2.5"
            >
              <div className="p-1.5 bg-teal-50 dark:bg-teal-950/40 text-teal-600 rounded-md shrink-0">
                <Heart className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 text-[11px] min-w-0">
                <div className="flex justify-between items-center text-slate-400 font-semibold mb-0.5">
                  <span>{entry.dateStr} at {entry.timestamp}</span>
                  <button
                    onClick={() => handleDeleteEntry(entry.id)}
                    className="text-slate-355 hover:text-red-500 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex gap-3 text-slate-700 dark:text-slate-200 font-bold mb-1">
                  <span>Pain: {entry.painLevel}/10</span>
                  <span>Temp: {entry.temperature}&deg;</span>
                </div>
                {entry.notes && (
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    {entry.notes}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
