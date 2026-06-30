/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { motion } from "motion/react";
import { CHORD_DICTIONARY, ChordDefinition, CHROMATIC_NOTES, getNoteAtFret, NOTE_COLORS } from "../types";
import { synth } from "../audio";
import { Play, Search, HelpCircle, RefreshCw } from "lucide-react";
import { TRANSLATIONS } from "../translations";

interface ChordsProps {
  rootNote: string;
  onSelectChord: (frets: number[]) => void;
  selectedChordName?: string;
  leftHanded: boolean;
  language?: "hr" | "en";
}

export const Chords: React.FC<ChordsProps> = ({
  rootNote,
  onSelectChord,
  selectedChordName,
  leftHanded,
  language = "hr"
}) => {
  const t = TRANSLATIONS[language];
  
  // We support two sub-modes inside the Chords tab:
  // 1. "library" - Select standard chords in the current key
  // 2. "reverse" - Reverse Chord Finder (click frets to identify chord)
  const [subTab, setSubTab] = React.useState<"library" | "reverse">("library");
  
  // Reverse Finder State: [G, D, A, E] frets. -1 = Muted, 0 = Open, 1-7 = Fretted
  const [reverseFrets, setReverseFrets] = React.useState<number[]>([0, 0, 2, 3]); // G Major default

  // Auto-sync reverse frets to main fretboard in real-time when in reverse finder tab
  React.useEffect(() => {
    if (subTab === "reverse") {
      onSelectChord(reverseFrets);
    }
  }, [reverseFrets, subTab, onSelectChord]);

  // Restore the selected library chord on the main fretboard when returning to library tab
  React.useEffect(() => {
    if (subTab === "library") {
      const keyChords = CHORD_DICTIONARY[rootNote] || {};
      const firstChord = Object.values(keyChords).flat()[0];
      if (firstChord) {
        onSelectChord(firstChord.frets);
      }
    }
  }, [subTab, rootNote, onSelectChord]);

  // Calculate logarithmic fret ratios for realistic layout in Reverse Finder
  const fretPercentages = React.useMemo(() => {
    const positions: number[] = [0];
    const totalFrets = 7 + 1;
    for (let i = 1; i <= totalFrets; i++) {
      const ratio = 1 - Math.pow(2, -i / 12);
      positions.push(ratio);
    }
    const maxRatio = positions[totalFrets - 1];
    return positions.map(pos => (pos / maxRatio) * 100);
  }, []);

  // Fetch chord list for active rootNote
  const availableChords = React.useMemo(() => {
    const keyChords = CHORD_DICTIONARY[rootNote] || {};
    return Object.values(keyChords).flat();
  }, [rootNote]);

  // Handle playing a chord definition
  const handlePlayChord = (chord: ChordDefinition) => {
    // Strum chord with slight delay per string for realistic texture
    const stringsInOrder = ["G3", "D4", "A4", "E5"];
    
    chord.frets.forEach((fret, idx) => {
      if (fret !== -1) {
        const noteInfo = getNoteAtFret(stringsInOrder[idx], fret);
        setTimeout(() => {
          synth.playNote(noteInfo.name, noteInfo.octave, 1.2);
        }, idx * 45); // strumming speed
      }
    });
  };

  // Chord Auto-Recognition (Simple Heuristic for Mandolin 4-course)
  const detectedChord = React.useMemo(() => {
    const activeNotesSet = new Set<string>();
    const stringsInOrder = ["G3", "D4", "A4", "E5"];
    
    reverseFrets.forEach((f, idx) => {
      if (f !== -1) {
        const noteInfo = getNoteAtFret(stringsInOrder[idx], f);
        activeNotesSet.add(noteInfo.name);
      }
    });

    const notesArray = Array.from(activeNotesSet).sort();
    if (notesArray.length === 0) {
      return { name: language === "en" ? "Muted / No Notes" : "Prigušeno / Bez tonova", notes: [] };
    }

    // Try to match the active notes and frets with our dictionary
    for (const key of Object.keys(CHORD_DICTIONARY)) {
      const keyChords = CHORD_DICTIONARY[key];
      for (const catChords of Object.values(keyChords)) {
        for (const chord of catChords) {
          // Check if frets match exactly
          const fretMatch = chord.frets.every((f, idx) => f === reverseFrets[idx]);
          if (fretMatch) {
            return { name: chord.name, notes: chord.notes };
          }
        }
      }
    }

    // Secondary Note Matching Fallback (if they didn't match shapes exactly but spelled notes)
    const spelling = notesArray.join(",");
    
    // Quick spelling database for common chords
    const spellings: Record<string, string> = {
      "C,E,G": "C Major",
      "C,D#,G": "C Minor",
      "C,E,G,A#": "C7",
      "D,F#,A": "D Major",
      "D,F,A": "D Minor",
      "C,D,F#,A": "D7",
      "E,G#,B": "E Major",
      "E,G,B": "E Minor",
      "D,E,G#,B": "E7",
      "F,A,C": "F Major",
      "F,G#,C": "F Minor",
      "C,D#,F,A": "F7",
      "D,G,B": "G Major",
      "D,G,A#": "G Minor",
      "D,F,G,B": "G7",
      "C#,E,A": "A Major",
      "C,E,A": "A Minor",
      "C,G,A,E": "A7",
      "D#,F#,B": "B Major",
      "D,F#,B": "B Minor",
      "A,B,D#,F#": "B7"
    };

    if (spellings[spelling]) {
      return { name: spellings[spelling], notes: notesArray };
    }

    // Check if it's a Power Chord (Root and Fifth)
    if (notesArray.length === 2) {
      const firstIdx = CHROMATIC_NOTES.indexOf(notesArray[0]);
      const secondIdx = CHROMATIC_NOTES.indexOf(notesArray[1]);
      const diff1 = (secondIdx - firstIdx + 12) % 12;
      const diff2 = (firstIdx - secondIdx + 12) % 12;
      if (diff1 === 7) return { name: `${notesArray[0]}5`, notes: notesArray };
      if (diff2 === 7) return { name: `${notesArray[1]}5`, notes: notesArray };
    }

    return { 
      name: `${notesArray[0]} ${notesArray.length > 2 ? (language === "en" ? "Chord" : "Akord") : "Interval"}`, 
      notes: notesArray 
    };
  }, [reverseFrets, language]);

  // Handle strumming reverse-finder chord
  const handlePlayReverseChord = () => {
    const stringsInOrder = ["G3", "D4", "A4", "E5"];
    reverseFrets.forEach((f, idx) => {
      if (f !== -1) {
        const noteInfo = getNoteAtFret(stringsInOrder[idx], f);
        setTimeout(() => {
          synth.playNote(noteInfo.name, noteInfo.octave, 1.2);
        }, idx * 45);
      }
    });
  };

  // Adjust string fret in Reverse Finder
  const adjustFret = (stringIdx: number, dir: number) => {
    setReverseFrets(prev => {
      const next = [...prev];
      let val = next[stringIdx];
      
      if (val === -1 && dir === 1) {
        val = 0; // unmute to open
      } else {
        val += dir;
        if (val < -1) val = -1; // -1 is muted (X)
        if (val > 7) val = 7; // limit to 7 frets
      }
      
      next[stringIdx] = val;
      return next;
    });
  };

  // Select a chord from the library
  const handleSelectChordInLib = (chord: ChordDefinition) => {
    onSelectChord(chord.frets);
    // Auto-strum for sweet instant audio feedback
    handlePlayChord(chord);
  };

  // Sync current Reverse finder frets to main fretboard
  const handleSyncReverseToFretboard = () => {
    onSelectChord(reverseFrets);
  };

  return (
    <div className="bg-[#0a0a0a] rounded-2xl p-4 border border-white/10 shadow-xl select-none max-w-sm mx-auto">
      
      {/* Tab select bar */}
      <div className="flex bg-[#121214] p-1 rounded-xl border border-white/10 mb-4">
        <button
          onClick={() => setSubTab("library")}
          className={`flex-1 py-1.5 text-center text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            subTab === "library"
              ? "bg-[#F27D26] text-white shadow-sm shadow-orange-950/20"
              : "text-white/40 hover:text-white/70"
          }`}
          id="chord-tab-library"
        >
          {language === "en" ? "Chord Library" : "Knjižnica akorda"}
        </button>
        <button
          onClick={() => setSubTab("reverse")}
          className={`flex-1 py-1.5 text-center text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            subTab === "reverse"
              ? "bg-[#F27D26] text-white shadow-sm shadow-orange-950/20"
              : "text-white/40 hover:text-white/70"
          }`}
          id="chord-tab-reverse"
        >
          {language === "en" ? "Reverse Finder" : "Tražilica (Reverse Finder)"}
        </button>
      </div>

      {subTab === "library" ? (
        // ----------------- LIBRARY MODE -----------------
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
              {language === "en" ? "CHORDS IN KEY:" : "AKORDI U KLJUČU:"} {rootNote}
            </span>
            <span className="text-[9px] text-white/30">
              {language === "en" ? "Tap to view on fretboard" : "Dodirni za prikaz na vratu"}
            </span>
          </div>

          {availableChords.length > 0 ? (
            <div className="grid grid-cols-1 gap-2.5 max-h-[240px] overflow-y-auto pr-1">
              {availableChords.map((chord, idx) => {
                const isActive = selectedChordName === chord.name;
                return (
                  <motion.div
                    key={`${chord.name}-${idx}`}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelectChordInLib(chord)}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                      isActive
                        ? "bg-[#F27D26]/10 border-[#F27D26] shadow-[0_0_12px_rgba(242,125,38,0.25)]"
                        : "bg-[#121214] border-white/5 hover:border-white/10 hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Interactive Visual Play Trigger */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayChord(chord);
                        }}
                        className="w-7 h-7 rounded-full bg-white/5 hover:bg-[#F27D26]/10 hover:text-[#F27D26] hover:border-[#F27D26]/30 flex items-center justify-center border border-white/10 text-white/70 shadow"
                        id={`play-chord-${chord.name}`}
                      >
                        <Play size={10} className="fill-current ml-0.5" />
                      </button>

                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white tracking-wide">
                          {chord.name}
                        </span>
                        <span className="text-[10px] text-white/40 font-mono tracking-wide">
                          {language === "en" ? "Notes" : "Tonovi"}: {chord.notes.join(", ")}
                        </span>
                      </div>
                    </div>

                    {/* Fret values indicator */}
                    <div className="flex gap-1 items-center bg-black/40 px-2 py-1 rounded-md border border-white/10 font-mono text-xs">
                      {chord.frets.map((f, fIdx) => (
                        <span 
                          key={fIdx} 
                          className={f === -1 ? "text-red-500 font-bold" : "text-white/70"}
                        >
                          {f === -1 ? "x" : f}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-white/30 text-xs">
              {language === "en" 
                ? `No saved chords for selected key ${rootNote}.`
                : `Nema spremljenih akorda za odabrani ključ ${rootNote}.`}
            </div>
          )}


        </div>
      ) : (
        // ----------------- REVERSE FINDER MODE -----------------
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
              {language === "en" ? "CHORD DETECTOR" : "DETEKTOR AKORDA"}
            </span>
            <button
              onClick={() => setReverseFrets([0, 0, 2, 3])}
              className="text-[10px] text-white/40 hover:text-white flex items-center gap-1 font-mono cursor-pointer"
              id="reset-reverse-finder"
            >
              <RefreshCw size={10} /> {language === "en" ? "Reset (G)" : "Resetiraj (G)"}
            </button>
          </div>

          {/* Slikovni interaktivni vrat mandoline */}
          {(() => {
            const FRET_COUNT = 7;
            const fretsArray = Array.from({ length: FRET_COUNT }, (_, i) => i + 1); // [1, 2, 3, 4, 5, 6, 7]
            const displayIndices = leftHanded ? [3, 2, 1, 0] : [0, 1, 2, 3];
            const stringsInOrder = ["G3", "D4", "A4", "E5"];

            return (
              <div className="bg-[#121214] p-4 rounded-xl border border-white/5 flex flex-col items-center">
                
                {/* Visual Fretboard Layout matching main Fretboard component */}
                <div className="relative w-full flex items-start justify-center" style={{ height: "345px" }}>
                  
                  {/* Left Label/Number column (Open/Mute status labels and fret numbers) */}
                  <div className="relative w-10 select-none" style={{ height: "335px" }}>
                    {/* Label at the top, matching the h-10 header row height */}
                    <div className="absolute top-0 left-0 right-0 h-10 flex flex-col items-center justify-center pr-1.5">
                      <span className="text-[7.5px] font-black text-[#F27D26] uppercase tracking-wider font-mono leading-tight text-right w-full">
                        {language === "en" ? "OPEN" : "OTVOR"}
                      </span>
                      <span className="text-[6.5px] text-white/30 font-mono leading-none mt-0.5 text-right w-full">
                        {language === "en" ? "MUTE" : "PRIG."}
                      </span>
                    </div>

                    {/* Fret numbers container, starting at 40px (top-10) with 295px height */}
                    <div className="absolute top-10 left-0 right-0 bottom-0">
                      {fretsArray.map((fretNum) => {
                        const topPos = (fretPercentages[fretNum - 1] + fretPercentages[fretNum]) / 2;
                        return (
                          <div
                            key={fretNum}
                            className="absolute right-1.5 flex items-center justify-center w-6.5 h-6.5 rounded-lg bg-[#0a0a0a] border border-white/10 text-[9.5px] font-mono font-bold text-white shadow-md shadow-black/85"
                            style={{ top: `${topPos}%`, transform: "translateY(-50%)" }}
                          >
                            {fretNum}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Fretboard main container (constrained narrow neck like Fretboard.tsx) */}
                  <div className="relative w-[190px] h-full flex flex-col" style={{ height: "335px" }}>
                    
                    {/* String controls on top representing Open / Mute status */}
                    <div className="flex justify-around w-full h-10 items-center border-b border-white/10 select-none pb-1 px-1">
                      {displayIndices.map((stringIdx) => {
                        const fretVal = reverseFrets[stringIdx];
                        const isMuted = fretVal === -1;
                        const isOpen = fretVal === 0;
                        const isFretted = fretVal > 0;
                        
                        return (
                          <button
                            key={stringIdx}
                            onClick={() => {
                              setReverseFrets(prev => {
                                const updated = [...prev];
                                // Toggle: if muted, set to open (0), else set to muted (-1)
                                updated[stringIdx] = prev[stringIdx] === -1 ? 0 : -1;
                                return updated;
                              });
                            }}
                            className={`w-7.5 h-7.5 rounded-lg flex flex-col items-center justify-center transition active:scale-95 cursor-pointer relative z-40 border ${
                              isOpen
                                ? "bg-[#F27D26]/20 border-[#F27D26] text-[#F27D26] shadow-[0_0_8px_rgba(242,125,38,0.25)]"
                                : isFretted
                                ? "bg-[#F27D26]/12 border-[#F27D26]/60 text-white shadow-[0_0_8px_rgba(242,125,38,0.15)]"
                                : "bg-black/40 border-red-500/20 text-red-500/80"
                            }`}
                            title={isOpen ? "Open" : isMuted ? "Muted" : `Fret ${fretVal}`}
                            id={`reverse-open-mute-btn-${stringIdx}`}
                          >
                            <span className="text-[10px] font-black font-mono leading-tight">
                              {isOpen ? "O" : isMuted ? "✕" : fretVal}
                            </span>
                            <span className="text-[6px] font-mono opacity-60 uppercase leading-none mt-0.5">
                              {isOpen 
                                ? (language === "en" ? "open" : "otv") 
                                : isMuted 
                                ? (language === "en" ? "mute" : "prig") 
                                : (language === "en" ? "fret" : "prg")}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Fretboard Neck with rich warm rosewood wood background */}
                    <div 
                      className="relative flex-1 w-full bg-[#2e1d13] border-x border-white/15 shadow-2xl overflow-hidden rounded-b-md"
                      style={{
                        backgroundImage: `
                          linear-gradient(90deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 18%, rgba(0,0,0,0) 82%, rgba(0,0,0,0.8) 100%),
                          linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 100%)
                        `,
                        height: "295px"
                      }}
                    >
                      {/* Wood grain */}
                      <div 
                        className="absolute inset-0 opacity-60 pointer-events-none" 
                        style={{
                          backgroundImage: `
                            repeating-linear-gradient(90deg, 
                              #150905 0px, #150905 1.5px, 
                              transparent 1.5px, transparent 14px, 
                              #1d0d07 15px, #1d0d07 16px, 
                              transparent 16px, transparent 36px
                            ),
                            repeating-linear-gradient(86deg, 
                              #190a04 0px, #190a04 1px, 
                              transparent 1px, transparent 18px, 
                              #241109 19px, #241109 20px, 
                              transparent 20px, transparent 40px
                            )
                          `,
                          mixBlendMode: "multiply"
                        }} 
                      />

                      {/* Pearl Position Markers on frets 3, 5, 7 */}
                      {[3, 5, 7].map(f => {
                        const topPos = (fretPercentages[f - 1] + fretPercentages[f]) / 2;
                        return (
                          <div
                            key={`dot-reverse-${f}`}
                            className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white/45 border border-white/20 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.9),0_0_6px_rgba(255,255,255,0.35)] opacity-90 z-0"
                            style={{ top: `${topPos}%` }}
                          />
                        );
                      })}

                      {/* Nut */}
                      <div 
                        className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-b from-[#f8fafc] via-[#f1f5f9] to-[#cbd5e1] border-b border-zinc-900 z-10 shadow-[0_1.5px_3px_rgba(0,0,0,0.9)]" 
                        style={{ borderRadius: "1px 1px 0 0" }}
                      />

                      {/* Fret wires (Horizontal 3D metal silver lines) */}
                      {fretPercentages.map((percentage, idx) => {
                        if (idx === 0) return null; // skip nut
                        return (
                          <div
                            key={`fret-reverse-${idx}`}
                            className="absolute left-0 right-0 h-[3px] z-10"
                            style={{ 
                              top: `${percentage}%`,
                              background: "linear-gradient(to bottom, #475569 0%, #cbd5e1 30%, #ffffff 50%, #64748b 80%, #1e293b 100%)",
                              boxShadow: "0 1px 2px rgba(0,0,0,0.8), 0 -0.5px 0.5px rgba(0,0,0,0.5)"
                            }}
                          />
                        );
                      })}

                      {/* Double Strings (4 courses with realistic dimensions & silvery steel gradients) */}
                      <div className="absolute inset-0 flex justify-around px-1 pointer-events-none z-20">
                        {displayIndices.map((stringIdx) => {
                          let stringStyle: React.CSSProperties = {};
                          let stringWidth = "w-[1px]";
                          
                          if (stringIdx === 0) {
                            // G: Thickest silver steel course
                            stringWidth = "w-[2.4px]";
                            stringStyle = {
                              background: "linear-gradient(90deg, #374151 0%, #9ca3af 20%, #f8fafc 45%, #e2e8f0 60%, #9ca3af 75%, #374151 100%)",
                              boxShadow: "0.5px 0 2.5px rgba(0,0,0,0.9)"
                            };
                          } else if (stringIdx === 1) {
                            // D: Medium silver steel course
                            stringWidth = "w-[1.8px]";
                            stringStyle = {
                              background: "linear-gradient(90deg, #4b5563 0%, #cbd5e1 25%, #f8fafc 50%, #cbd5e1 75%, #4b5563 100%)",
                              boxShadow: "0.5px 0 2px rgba(0,0,0,0.85)"
                            };
                          } else if (stringIdx === 2) {
                            // A: Thin silver steel course
                            stringWidth = "w-[1.1px]";
                            stringStyle = {
                              background: "linear-gradient(90deg, #64748b 0%, #e2e8f0 35%, #ffffff 50%, #cbd5e1 65%, #475569 100%)",
                              boxShadow: "0.5px 0 1.5px rgba(0,0,0,0.8)"
                            };
                          } else {
                            // E: Thinnest silver steel course
                            stringWidth = "w-[0.8px]";
                            stringStyle = {
                              background: "linear-gradient(90deg, #94a3b8 0%, #f1f5f9 50%, #475569 100%)",
                              boxShadow: "0.5px 0 1px rgba(0,0,0,0.75)"
                            };
                          }

                          return (
                            <div key={`course-reverse-${stringIdx}`} className="h-full flex gap-[2.4px] justify-center items-center opacity-95">
                              {/* Double string 1 */}
                              <div className={`h-full ${stringWidth}`} style={stringStyle} />
                              {/* Double string 2 */}
                              <div className={`h-full ${stringWidth}`} style={stringStyle} />
                            </div>
                          );
                        })}
                      </div>

                      {/* Clickable Note Badges Layer & Interactive tap overlay */}
                      <div className="absolute inset-0 flex justify-around px-1 z-30 h-full">
                        {displayIndices.map((stringIdx) => {
                          const stringBase = stringsInOrder[stringIdx];
                          return (
                            <div key={`notes-course-reverse-${stringIdx}`} className="h-full flex flex-col justify-between relative" style={{ width: "24px" }}>
                              {fretsArray.map((fretNum) => {
                                const isActive = reverseFrets[stringIdx] === fretNum;
                                const noteInfo = getNoteAtFret(stringBase, fretNum);
                                const isRoot = noteInfo.name === rootNote;
                                
                                const topStart = fretPercentages[fretNum - 1];
                                const topEnd = fretPercentages[fretNum];
                                const height = topEnd - topStart;

                                const style: React.CSSProperties = {
                                  position: "absolute",
                                  top: `${topStart}%`,
                                  height: `${height}%`,
                                  width: "100%",
                                  left: "0"
                                };

                                return (
                                  <button
                                    key={`${fretNum}-${stringIdx}`}
                                    onClick={() => {
                                      setReverseFrets(prev => {
                                        const updated = [...prev];
                                        // Toggle behavior: if already active, set to -1 (muted). Otherwise, set to this fret.
                                        updated[stringIdx] = isActive ? -1 : fretNum;
                                        return updated;
                                      });
                                    }}
                                    style={style}
                                    className="w-full relative focus:outline-none cursor-pointer flex items-center justify-center group"
                                    id={`reverse-fret-cell-${stringIdx}-${fretNum}`}
                                    title={`${noteInfo.name}${noteInfo.octave}`}
                                  >
                                    {/* Hover glow */}
                                    <span className="absolute inset-0 bg-white/0 group-hover:bg-[#F27D26]/5 transition-all pointer-events-none" />

                                    {/* Glowing Note Marker matching Fretboard.tsx note design */}
                                    {isActive ? (
                                      <motion.div
                                        layoutId={`reverse-marker-${stringIdx}`}
                                        initial={{ scale: 0.5, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="relative w-7.5 h-7.5 sm:w-8.5 sm:h-8.5 rounded-full flex items-center justify-center text-xs font-black shadow-lg transition-all duration-150 z-40"
                                        style={{ 
                                          backgroundColor: isRoot ? "#F27D26" : (NOTE_COLORS[noteInfo.name] || "rgba(255, 255, 255, 0.1)"),
                                          boxShadow: isRoot 
                                            ? "0 0 16px rgba(242,125,38,0.85), inset 0 1px 1px rgba(255,255,255,0.4)"
                                            : `0 2px 5px rgba(0,0,0,0.7), 0 0 12px ${NOTE_COLORS[noteInfo.name] || "rgba(255,255,255,0.15)"}, inset 0 1px 1px rgba(255,255,255,0.2)`,
                                          border: isRoot ? "1.5px solid rgba(255, 255, 255, 0.6)" : "1px solid rgba(255, 255, 255, 0.25)",
                                          color: "rgba(255, 255, 255, 0.95)",
                                          textShadow: "0 1px 2px rgba(0,0,0,0.6)",
                                        }}
                                      >
                                        <span>{noteInfo.name}</span>
                                      </motion.div>
                                    ) : (
                                      // Discovery preview mode on hover
                                      <span className="opacity-0 group-hover:opacity-40 text-[9px] font-mono text-white/50 transition">
                                        {noteInfo.name}
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>

                    </div>

                  </div>
                </div>

              </div>
            );
          })()}

          {/* Results Analysis Panel */}
          <div className="bg-gradient-to-br from-[#121214] to-[#0a0a0b] p-4 rounded-xl border border-white/10 shadow-md space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-0.5">
                <span className="text-[9px] text-white/30 font-mono tracking-widest uppercase">
                  {language === "en" ? "Recognized Chord" : "Prepoznati Akord"}
                </span>
                <h4 className="text-lg font-black text-white tracking-wide font-serif italic">
                  {detectedChord.name}
                </h4>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handlePlayReverseChord}
                  className="w-8 h-8 rounded-full bg-[#F27D26] hover:bg-[#F27D26]/90 text-white flex items-center justify-center shadow shadow-orange-950 transition active:scale-95 cursor-pointer"
                  title={language === "en" ? "Play chord" : "Odsviraj akord"}
                  id="play-reverse-chord"
                >
                  <Play size={11} className="fill-current ml-0.5" />
                </button>
                <button
                  onClick={handleSyncReverseToFretboard}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 flex items-center justify-center transition active:scale-95 cursor-pointer"
                  title={language === "en" ? "Show on main fretboard" : "Prikaži na velikom vratu"}
                  id="sync-reverse-to-fretboard"
                >
                  <Search size={11} />
                </button>
              </div>
            </div>

            {/* Note breakdown in spelling */}
            <div className="pt-2 border-t border-white/5 flex flex-wrap gap-1.5 items-center">
              <span className="text-[10px] text-white/40 font-mono">
                {language === "en" ? "Active pitches:" : "Aktivni tonovi:"}
              </span>
              {detectedChord.notes.length > 0 ? (
                detectedChord.notes.map((note, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-[#F27D26]/10 text-[#F27D26] border border-[#F27D26]/30 rounded text-xs font-bold font-mono shadow-sm"
                  >
                    {note}
                  </span>
                ))
              ) : (
                <span className="text-xs text-white/30 italic">
                  {language === "en" ? "All strings muted" : "Sve žice prigušene"}
                </span>
              )}
            </div>

            {/* Detailed String Breakdown */}
            <div className="grid grid-cols-4 gap-1 text-center bg-black/40 p-2 rounded-lg text-[9px] font-mono text-white/40">
              {reverseFrets.map((f, idx) => {
                const baseStringNotes = ["G3", "D4", "A4", "E5"];
                const noteInfo = f !== -1 ? getNoteAtFret(baseStringNotes[idx], f) : null;
                return (
                  <div key={idx} className="flex flex-col gap-0.5 border-r border-white/5 last:border-none">
                    <span>{language === "en" ? "Str" : "Žica"} {4 - idx}</span>
                    <span className={`font-bold ${f === -1 ? "text-white/20" : "text-white/80"}`}>
                      {f === -1 ? "x" : `${noteInfo?.name}${noteInfo?.octave}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
