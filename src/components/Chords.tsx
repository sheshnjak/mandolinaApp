/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { motion } from "motion/react";
import { CHORD_DICTIONARY, ChordDefinition, CHROMATIC_NOTES, getNoteAtFret } from "../types";
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

          {/* String-Fret Selection Panel (Interactive Sliders / Drum controls) */}
          <div className="bg-[#121214] p-4 rounded-xl border border-white/5 space-y-3.5">
            <div className="grid grid-cols-4 gap-2 text-center">
              {["G (4)", "D (3)", "A (2)", "E (1)"].map((lbl, idx) => (
                <div key={idx} className="text-[9px] font-bold text-white/40 font-mono uppercase tracking-wider">
                  {lbl} {language === "en" ? "Str" : "Žica"}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-4 gap-2">
              {reverseFrets.map((fretVal, stringIdx) => (
                <div key={stringIdx} className="flex flex-col items-center gap-2">
                  {/* Up button */}
                  <button
                    onClick={() => adjustFret(stringIdx, 1)}
                    className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 hover:text-[#F27D26] border border-white/10 flex items-center justify-center text-white font-semibold text-sm active:scale-90 transition cursor-pointer"
                    id={`adjust-up-string-${stringIdx}`}
                  >
                    +
                  </button>

                  {/* Value display */}
                  <div className="w-12 h-14 bg-[#0a0a0b] border border-white/10 rounded-xl flex flex-col items-center justify-center shadow-inner">
                    <span className="text-[9px] text-white/30 font-mono">{language === "en" ? "Fret" : "Prag"}</span>
                    <span className={`text-lg font-black font-mono ${fretVal === -1 ? "text-red-500" : "text-[#F27D26]"}`}>
                      {fretVal === -1 ? "X" : fretVal}
                    </span>
                  </div>

                  {/* Down button */}
                  <button
                    onClick={() => adjustFret(stringIdx, -1)}
                    className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 hover:text-[#F27D26] border border-white/10 flex items-center justify-center text-white font-semibold text-sm active:scale-90 transition cursor-pointer"
                    id={`adjust-down-string-${stringIdx}`}
                  >
                    -
                  </button>
                </div>
              ))}
            </div>
          </div>

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
