/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Music, 
  Settings, 
  Sliders, 
  Volume2, 
  CheckCircle2, 
  X,
  Layers,
  Scale,
  Activity,
  Disc
} from "lucide-react";
import { 
  CHROMATIC_NOTES, 
  SCALES, 
  STANDARD_TUNING, 
  ALTERNATIVE_TUNINGS, 
  Tuning, 
  TabType,
  CHORD_DICTIONARY
} from "./types";
import { TRANSLATIONS, LanguageType } from "./translations";
import { Fretboard } from "./components/Fretboard";
import { Chords } from "./components/Chords";
import { CircleOfFifths } from "./components/CircleOfFifths";
import { TremoloTrainer } from "./components/TremoloTrainer";
import { DoubleStops } from "./components/DoubleStops";
import { synth } from "./audio";

// Custom high-fidelity notation icons for bottom navigation
const ScalesIcon = ({ size, className }: { size: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="2" y1="6" x2="22" y2="6" strokeWidth="0.8" stroke="currentColor" opacity="0.25" />
    <line x1="2" y1="10" x2="22" y2="10" strokeWidth="0.8" stroke="currentColor" opacity="0.25" />
    <line x1="2" y1="14" x2="22" y2="14" strokeWidth="0.8" stroke="currentColor" opacity="0.25" />
    <line x1="2" y1="18" x2="22" y2="18" strokeWidth="0.8" stroke="currentColor" opacity="0.25" />
    <circle cx="4.5" cy="18" r="1.8" fill="currentColor" />
    <circle cx="8.5" cy="15" r="1.8" fill="currentColor" />
    <circle cx="12.5" cy="12" r="1.8" fill="currentColor" />
    <circle cx="16.5" cy="9" r="1.8" fill="currentColor" />
    <circle cx="20.5" cy="6" r="1.8" fill="currentColor" />
    <path d="M6.3 18V10" strokeWidth="1" stroke="currentColor" />
    <path d="M10.3 15V7" strokeWidth="1" stroke="currentColor" />
    <path d="M14.3 12V4" strokeWidth="1" stroke="currentColor" />
    <path d="M18.3 9V1" strokeWidth="1" stroke="currentColor" />
    <path d="M22.3 6v-5" strokeWidth="1" stroke="currentColor" />
  </svg>
);

const ChordsIcon = ({ size, className }: { size: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="2" y1="6" x2="22" y2="6" strokeWidth="0.8" stroke="currentColor" opacity="0.25" />
    <line x1="2" y1="10" x2="22" y2="10" strokeWidth="0.8" stroke="currentColor" opacity="0.25" />
    <line x1="2" y1="14" x2="22" y2="14" strokeWidth="0.8" stroke="currentColor" opacity="0.25" />
    <line x1="2" y1="18" x2="22" y2="18" strokeWidth="0.8" stroke="currentColor" opacity="0.25" />
    <circle cx="11" cy="18" r="1.8" fill="currentColor" />
    <circle cx="11" cy="14" r="1.8" fill="currentColor" />
    <circle cx="11" cy="10" r="1.8" fill="currentColor" />
    <path d="M12.8 18V4" strokeWidth="1" stroke="currentColor" />
  </svg>
);

const DoubleStopsIcon = ({ size, className }: { size: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="2" y1="6" x2="22" y2="6" strokeWidth="0.8" stroke="currentColor" opacity="0.25" />
    <line x1="2" y1="10" x2="22" y2="10" strokeWidth="0.8" stroke="currentColor" opacity="0.25" />
    <line x1="2" y1="14" x2="22" y2="14" strokeWidth="0.8" stroke="currentColor" opacity="0.25" />
    <line x1="2" y1="18" x2="22" y2="18" strokeWidth="0.8" stroke="currentColor" opacity="0.25" />
    <circle cx="11" cy="14" r="1.8" fill="currentColor" />
    <circle cx="11" cy="10" r="1.8" fill="currentColor" />
    <path d="M12.8 14V4" strokeWidth="1" stroke="currentColor" />
  </svg>
);

const CircleIcon = ({ size, className }: { size: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.2" fill="none" />
    <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="0.8" fill="none" opacity="0.5" />
    <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="0.8" fill="currentColor" />
    {/* 12 small dots around the circle representing the 12 keys */}
    <circle cx="12" cy="4.5" r="0.9" fill="currentColor" />
    <circle cx="15.75" cy="5.5" r="0.9" fill="currentColor" />
    <circle cx="18.5" cy="8.25" r="0.9" fill="currentColor" />
    <circle cx="19.5" cy="12" r="0.9" fill="currentColor" />
    <circle cx="18.5" cy="15.75" r="0.9" fill="currentColor" />
    <circle cx="15.75" cy="18.5" r="0.9" fill="currentColor" />
    <circle cx="12" cy="19.5" r="0.9" fill="currentColor" />
    <circle cx="8.25" cy="18.5" r="0.9" fill="currentColor" />
    <circle cx="5.5" cy="15.75" r="0.9" fill="currentColor" />
    <circle cx="4.5" cy="12" r="0.9" fill="currentColor" />
    <circle cx="5.5" cy="8.25" r="0.9" fill="currentColor" />
    <circle cx="8.25" cy="5.5" r="0.9" fill="currentColor" />
  </svg>
);

export default function App() {
  // Localization state
  const [language, setLanguage] = React.useState<LanguageType>(() => {
    const saved = localStorage.getItem("mandolina_lang");
    return (saved === "en" || saved === "hr") ? saved : "hr";
  });

  const t = TRANSLATIONS[language];

  // Application Primary State
  const [activeTab, setActiveTab] = React.useState<TabType>("LJESTVICE");
  const [selectedRoot, setSelectedRoot] = React.useState<string>("C");
  const [selectedScaleIndex, setSelectedScaleIndex] = React.useState<number>(0); // Default: Major
  const [showMode, setShowMode] = React.useState<"all" | "root" | "triads">("all");
  
  // Customization & Settings State
  const [leftHanded, setLeftHanded] = React.useState<boolean>(false);
  const [tuning, setTuning] = React.useState<Tuning>(STANDARD_TUNING);
  const [volume, setVolume] = React.useState<number>(0.6);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState<boolean>(false);

  // Active Chord/Double-stop overlays on fretboard
  const [activeChordFrets, setActiveChordFrets] = React.useState<number[]>([0, 2, 3, 0]); // G Major default
  const [activeDoubleStopFrets, setActiveDoubleStopFrets] = React.useState<{ stringIndex: number; fret: number }[]>([]);
  const [activeDoubleStopIdx, setActiveDoubleStopIdx] = React.useState<number | null>(null);

  const activeScale = SCALES[selectedScaleIndex];

  // Sync language with localStorage
  React.useEffect(() => {
    localStorage.setItem("mandolina_lang", language);
  }, [language]);

  // Set initial volume
  React.useEffect(() => {
    synth.setVolume(volume);
  }, [volume]);

  // Handle key select from circle of fifths
  const handleSelectKeyFromCircle = (root: string, scaleName: string) => {
    setSelectedRoot(root);
    const scaleIdx = SCALES.findIndex(s => s.name === scaleName);
    if (scaleIdx !== -1) {
      setSelectedScaleIndex(scaleIdx);
    }
    // Switch back to Scales tab for instant visual feedback
    setActiveTab("LJESTVICE");
  };

  // Update chord overlays when the selected key changes, preserving the selected chord type if possible
  const prevRootRef = React.useRef<string>(selectedRoot);

  React.useEffect(() => {
    const prevRoot = prevRootRef.current;
    prevRootRef.current = selectedRoot;

    let lastChordType = "Major";
    if (prevRoot) {
      const prevKeyChords = CHORD_DICTIONARY[prevRoot] || {};
      outer: for (const [type, chords] of Object.entries(prevKeyChords)) {
        for (const chord of chords) {
          if (chord.frets.join(",") === activeChordFrets.join(",")) {
            lastChordType = type;
            break outer;
          }
        }
      }
    }

    const keyChords = CHORD_DICTIONARY[selectedRoot] || {};
    const sameTypeChords = keyChords[lastChordType] || [];
    const firstChord = sameTypeChords[0] || Object.values(keyChords).flat()[0];

    if (firstChord) {
      setActiveChordFrets(firstChord.frets);
    } else {
      setActiveChordFrets([0, 0, 2, 3]); // Fallback to G Major shape
    }
    setActiveDoubleStopFrets([]);
    setActiveDoubleStopIdx(null);
  }, [selectedRoot]);

  // Dynamically resolve the active chord's name based on activeChordFrets and selectedRoot
  const activeChordName = React.useMemo(() => {
    const keyChords = CHORD_DICTIONARY[selectedRoot] || {};
    for (const cat of Object.values(keyChords)) {
      for (const chord of cat) {
        if (chord.frets.join(",") === activeChordFrets.join(",")) {
          return chord.name;
        }
      }
    }
    return undefined;
  }, [selectedRoot, activeChordFrets]);

  return (
    <div className="h-dvh bg-[#020202] text-zinc-100 flex items-center justify-center font-sans md:py-2 px-0 md:px-2 overflow-hidden">
      
      {/* 
        PORTRAIT PHONE CONTAINER
        Provides a realistic mobile-frame mockup for desktop and expands responsively on mobile.
      */}
      <div className="w-full max-w-md h-full md:h-[830px] md:max-h-[96dvh] bg-[#050505] rounded-none md:rounded-[24px] shadow-2xl border-x border-b md:border border-white/10 flex flex-col overflow-hidden relative">
        
        {/* Glow Effects in Background */}
        <div className="absolute top-0 left-1/4 w-40 h-40 bg-[#F27D26]/8 rounded-full blur-[60px] pointer-events-none" />
        <div className="absolute bottom-20 right-1/4 w-40 h-40 bg-white/3 rounded-full blur-[80px] pointer-events-none" />
 
        {/* Floating Settings Gear Button in Top-Right Corner */}
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="absolute top-2 right-2 p-1.5 rounded-md bg-[#0a0a0c]/60 hover:bg-[#121214] text-white/50 hover:text-white/80 border border-white/10 transition active:scale-95 cursor-pointer z-50 shadow-md"
          title={t["settings"]}
          id="settings-trigger-btn"
        >
          <Settings size={12} />
        </button>
 
        {/* 2. DYNAMIC DROPDOWNS & FILTER TOOLBAR */}
        <section className="px-3.5 py-2.5 bg-[#0a0a0c] border-b border-white/5 flex flex-col gap-2 z-10">
          
          {/* Key Selector - Compact Single-row Grid */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center pl-1 pr-8">
              <label className="text-[10px] font-bold text-white/40 tracking-wider uppercase font-mono">
                {t["root_key"]}
              </label>
              <span className="text-[10px] font-mono font-extrabold text-[#F27D26] bg-[#F27D26]/12 px-2 py-0.5 rounded border border-[#F27D26]/20">
                {selectedRoot}
              </span>
            </div>
            
            <div className="grid grid-cols-12 gap-[3px]">
              {CHROMATIC_NOTES.map(note => {
                const isActive = selectedRoot === note;
                return (
                  <button
                    key={note}
                    onClick={() => setSelectedRoot(note)}
                    className={`py-2 rounded-lg text-[11px] sm:text-xs font-black text-center transition-all cursor-pointer border ${
                      isActive
                        ? "bg-[#F27D26] border-[#F27D26] text-white shadow-[0_0_8px_rgba(242,125,38,0.5)] scale-[1.03]"
                        : "bg-[#121214] border-white/5 hover:border-white/10 text-white/50 hover:text-white"
                    }`}
                    id={`key-root-slide-${note}`}
                  >
                    {note}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scale Selector - 3-Column Touch Grid */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-bold text-white/40 tracking-wider uppercase font-mono">
                {t["scale_type"]}
              </label>
              <span className="text-[10px] font-mono font-extrabold text-[#F27D26] bg-[#F27D26]/12 px-2 py-0.5 rounded border border-[#F27D26]/20">
                {language === "en" ? SCALES[selectedScaleIndex]?.name : SCALES[selectedScaleIndex]?.croatianName}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {SCALES.map((scale, idx) => {
                const isActive = selectedScaleIndex === idx;
                const displayName = language === "en" ? scale.name : scale.croatianName;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedScaleIndex(idx)}
                    className={`px-2 py-2 rounded-lg text-[11px] sm:text-xs font-black text-center transition-all cursor-pointer border truncate ${
                      isActive
                        ? "bg-[#F27D26] border-[#F27D26] text-white shadow-[0_0_8px_rgba(242,125,38,0.45)]"
                        : "bg-[#121214] border-white/5 hover:border-white/10 text-white/50 hover:text-white"
                    }`}
                    id={`scale-type-slide-${idx}`}
                  >
                    {displayName}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Visibility toggle Row - applies to Scales view */}
          {activeTab === "LJESTVICE" && (
            <div className="flex items-center justify-between bg-black/30 p-2 rounded-xl border border-white/5">
              <span className="text-[9.5px] font-mono font-bold text-white/40 uppercase tracking-widest pl-1">
                {t["show_notes"]}
              </span>
              <div className="flex bg-[#121214] p-0.5 rounded-lg border border-white/10">
                {[
                  { id: "all" as const, label: t["show_all"] },
                  { id: "root" as const, label: t["show_root"] },
                  { id: "triads" as const, label: t["show_triads"] }
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setShowMode(opt.id)}
                    className={`px-3 py-1 text-[10px] sm:text-[10.5px] font-black rounded-md transition cursor-pointer ${
                      showMode === opt.id
                        ? "bg-[#F27D26] text-white shadow-sm shadow-orange-950/20"
                        : "text-white/40 hover:text-white"
                    }`}
                    id={`show-mode-btn-${opt.id}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* 3. DYNAMIC WORKSPACE (SCROLLABLE AREA) */}
        <main className="flex-1 overflow-y-auto px-4 py-2.5 space-y-3 pb-28">
          <AnimatePresence mode="wait">
            
            {/* A. LJESTVICE (SCALES) PRIMARY VIEW */}
            {activeTab === "LJESTVICE" && (
              <motion.div
                key="scales-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-3"
              >
                {/* Mathematical Logarithmic Fretboard */}
                <Fretboard
                  rootNote={selectedRoot}
                  scaleIntervals={activeScale.intervals}
                  showMode={showMode}
                  tuning={tuning}
                  leftHanded={leftHanded}
                  language={language}
                />
              </motion.div>
            )}

            {/* B. AKORDI (CHORDS) VIEW */}
            {activeTab === "AKORDI" && (
              <motion.div
                key="chords-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                {/* Visual Fretboard locked to selected chord */}
                <Fretboard
                  rootNote={selectedRoot}
                  scaleIntervals={activeScale.intervals}
                  showMode="chords"
                  selectedChordFrets={activeChordFrets}
                  tuning={tuning}
                  leftHanded={leftHanded}
                  language={language}
                />

                {/* Chords interface */}
                <Chords
                  rootNote={selectedRoot}
                  onSelectChord={setActiveChordFrets}
                  selectedChordName={activeChordName}
                  leftHanded={leftHanded}
                  language={language}
                />
              </motion.div>
            )}

            {/* C. DVOZVUCI (DOUBLE-STOPS) VIEW */}
            {activeTab === "DVOZVUCI" && (
              <motion.div
                key="double-stops-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                <Fretboard
                  rootNote={selectedRoot}
                  scaleIntervals={activeScale.intervals}
                  showMode="doublestops"
                  activeDoubleStopFrets={activeDoubleStopFrets}
                  tuning={tuning}
                  leftHanded={leftHanded}
                  language={language}
                />

                <DoubleStops
                  rootNote={selectedRoot}
                  scaleName={activeScale.name}
                  onSelectDoubleStop={setActiveDoubleStopFrets}
                  selectedDoubleStopIndex={activeDoubleStopIdx}
                  onSelectDoubleStopIndex={setActiveDoubleStopIdx}
                  language={language}
                />
              </motion.div>
            )}

            {/* D. TREMOLO TRAINING VIEW */}
            {activeTab === "TREMOLO" && (
              <motion.div
                key="tremolo-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                <TremoloTrainer rootNote={selectedRoot} language={language} />
              </motion.div>
            )}

            {/* E. KVINTNI KRUG VIEW */}
            {activeTab === "KVINTNI KRUG" && (
              <motion.div
                key="circle-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                <CircleOfFifths
                  activeRoot={selectedRoot}
                  activeScaleName={activeScale.name}
                  onSelectKey={handleSelectKeyFromCircle}
                  language={language}
                />
              </motion.div>
            )}

          </AnimatePresence>
        </main>

        {/* 4. TACTILE BOTTOM NAVIGATION TABS - PILL/NOTATION ICONS WITH NEW CUSTOM SVG NOTATION ICONS */}
        <nav className="absolute bottom-0 inset-x-0 bg-[#050505] border-t border-white/10 px-1 py-2 flex justify-between items-center z-20 select-none shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
          {[
            { id: "LJESTVICE" as TabType, label: t["tab_scales"], icon: ScalesIcon },
            { id: "AKORDI" as TabType, label: t["tab_chords"], icon: ChordsIcon },
            { id: "DVOZVUCI" as TabType, label: t["tab_doublestops"], icon: DoubleStopsIcon },
            { id: "TREMOLO" as TabType, label: t["tab_tremolo"], icon: Activity },
            { id: "KVINTNI KRUG" as TabType, label: t["tab_circle"], icon: CircleIcon }
          ].map(tab => {
            const isSelected = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  // stop tremolo if moving to another tab
                  synth.stopAll();
                }}
                className="flex-1 flex flex-col items-center justify-center py-1 transition cursor-pointer"
                style={{ touchAction: "manipulation" }}
                id={`nav-tab-${tab.id}`}
              >
                <Icon size={20} className={`mb-1 transition-all ${
                  isSelected 
                    ? "text-[#F27D26] scale-105" 
                    : "text-white/35 hover:text-white/60"
                }`} />
                <span className={`text-[9.5px] sm:text-[10px] font-black tracking-wide uppercase transition-all ${
                  isSelected 
                    ? "text-[#F27D26]" 
                    : "text-white/35 hover:text-white/70"
                }`}>
                  {tab.label}
                </span>
                {isSelected && (
                  <motion.div
                    layoutId="active-tab-indicator"
                    className="h-[1.5px] w-4 bg-[#F27D26] rounded-full mt-0.5"
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  />
                )}
              </button>
            );
          })}
        </nav>
 
        {/* 5. INTERACTIVE SETTINGS MODAL */}
        <AnimatePresence>
          {isSettingsOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-5 select-none"
            >
              <motion.div
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                className="bg-[#0a0a0c] w-full max-w-sm rounded-2xl border border-white/10 p-5 space-y-4 shadow-2xl"
              >
                {/* Modal Header */}
                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                  <span className="text-xs font-bold text-white/40 font-mono flex items-center gap-1.5">
                    <Sliders size={13} /> {t["settings_title"]}
                  </span>
                  <button
                    onClick={() => setIsSettingsOpen(false)}
                    className="p-1 rounded-full bg-white/5 hover:bg-white/10 text-white/50 transition cursor-pointer"
                    id="close-settings-btn"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Language Option */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white block">{t["language"]}</label>
                  <div className="grid grid-cols-2 gap-2 bg-[#121214] p-1 rounded-xl border border-white/10">
                    <button
                      onClick={() => setLanguage("hr")}
                      className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        language === "hr"
                          ? "bg-[#F27D26] text-white shadow"
                          : "text-white/40 hover:text-white"
                      }`}
                      id="lang-select-hr"
                    >
                      Hrvatski
                    </button>
                    <button
                      onClick={() => setLanguage("en")}
                      className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        language === "en"
                          ? "bg-[#F27D26] text-white shadow"
                          : "text-white/40 hover:text-white"
                      }`}
                      id="lang-select-en"
                    >
                      English
                    </button>
                  </div>
                </div>
 
                {/* Left-Handed Toggle */}
                <div className="flex items-center justify-between py-1">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white">{t["left_handed"]}</span>
                    <span className="text-[10px] text-white/35">{t["left_handed_desc"]}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={leftHanded}
                    onChange={(e) => setLeftHanded(e.target.checked)}
                    className="w-4 h-4 rounded text-[#F27D26] accent-[#F27D26] cursor-pointer bg-[#0a0a0b] border-white/10"
                    id="settings-left-handed-toggle"
                  />
                </div>
 
                {/* Master Sound Volume */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-white">
                    <span className="flex items-center gap-1"><Volume2 size={12} /> {t["volume"]}</span>
                    <span className="font-mono text-white/40">{Math.round(volume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-[#F27D26]"
                    id="settings-volume-slider"
                  />
                </div>
 
                {/* Custom Tunings */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white block">{t["tuning"]}</label>
                  <select
                    value={tuning.name}
                    onChange={(e) => {
                      const found = ALTERNATIVE_TUNINGS.find(t => t.name === e.target.value);
                      if (found) setTuning(found);
                    }}
                    className="w-full bg-[#121214] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#F27D26]"
                    id="settings-tuning-select"
                  >
                    {ALTERNATIVE_TUNINGS.map(t => (
                      <option key={t.name} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>
 
                {/* PWA offline support card */}
                <div className="p-3 bg-[#F27D26]/10 border border-[#F27D26]/20 rounded-xl flex items-start gap-2 text-[10px] text-[#F27D26]">
                  <CheckCircle2 size={13} className="text-[#F27D26] shrink-0 mt-0.5" />
                  <span><b>{t["pwa_offline"]}</b> {t["pwa_offline_desc"]}</span>
                </div>
 
                {/* Save button */}
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="w-full py-2 bg-[#F27D26] hover:bg-[#F27D26]/90 text-white font-bold text-xs rounded-xl shadow-lg transition active:scale-98 cursor-pointer"
                  id="settings-save-btn"
                >
                  {t["save_close"]}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

    </div>
  );
}
