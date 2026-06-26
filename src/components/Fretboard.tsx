/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { motion } from "motion/react";
import { CHROMATIC_NOTES, NOTE_COLORS, getNoteAtFret, Tuning } from "../types";
import { synth } from "../audio";
import { Volume2, Play } from "lucide-react";
import { TRANSLATIONS } from "../translations";

interface FretboardProps {
  rootNote: string;
  scaleIntervals: number[];
  showMode: "all" | "root" | "triads" | "chords" | "doublestops";
  selectedChordFrets?: number[]; // if in chord mode
  activeDoubleStopFrets?: { stringIndex: number; fret: number }[]; // if in double-stop mode
  tuning: Tuning;
  leftHanded: boolean;
  highlightedNotes?: string[]; // notes belonging to chord/scale
  language?: "hr" | "en";
}

export const Fretboard: React.FC<FretboardProps> = ({
  rootNote,
  scaleIntervals,
  showMode,
  selectedChordFrets,
  activeDoubleStopFrets,
  tuning,
  leftHanded,
  highlightedNotes,
  language = "hr"
}) => {
  const fretCount = 7;
  const t = TRANSLATIONS[language];

  // State to track currently playing node in arpeggio for real-time visual light up
  const [activePlayingNode, setActivePlayingNode] = React.useState<{ stringIndex: number; fret: number } | null>(null);
  const playbackTimeoutsRef = React.useRef<number[]>([]);

  // Clear timeouts on unmount to avoid memory leaks
  React.useEffect(() => {
    return () => {
      playbackTimeoutsRef.current.forEach(t => window.clearTimeout(t));
    };
  }, []);

  // Calculate logarithmic fret ratios for realistic luthiery layout
  // Scale length constant to compute ratios
  const calculateFretPositions = () => {
    const positions: number[] = [0]; // Nut is at 0
    const totalFrets = fretCount + 1; // we need 8 bars to frame 7 frets
    
    // Fret equation: d = L * (1 - (1/2)^(n/12))
    for (let i = 1; i <= totalFrets; i++) {
      const ratio = 1 - Math.pow(2, -i / 12);
      positions.push(ratio);
    }
    
    // Normalize positions so the bottom of the 7th fret is at 100% of the fretboard height
    const maxRatio = positions[totalFrets - 1];
    return positions.map(pos => (pos / maxRatio) * 100);
  };

  const fretPercentages = calculateFretPositions();

  // Get notes currently on the scale
  const scaleNotes = React.useMemo(() => {
    const rootIndex = CHROMATIC_NOTES.indexOf(rootNote);
    return scaleIntervals.map(interval => CHROMATIC_NOTES[(rootIndex + interval) % 12]);
  }, [rootNote, scaleIntervals]);

  // Determine if a specific note at a string and fret should be displayed
  const shouldShowNote = (stringIndex: number, fret: number, noteName: string) => {
    // Hide notes on the 7th fret for scales, root, and triads to avoid octave redundancy of open strings
    if (fret === 7 && showMode !== "chords" && showMode !== "doublestops") {
      return false;
    }

    // If in Chord mode, check if this is the fret played in the active chord
    if (showMode === "chords" && selectedChordFrets) {
      return selectedChordFrets[stringIndex] === fret;
    }

    // If in Double stop mode, check if this is part of the active double-stop
    if (showMode === "doublestops" && activeDoubleStopFrets) {
      return activeDoubleStopFrets.some(ds => ds.stringIndex === stringIndex && ds.fret === fret);
    }

    // Otherwise, standard scale/note visibility filtering
    const isNoteInScale = scaleNotes.includes(noteName);
    if (!isNoteInScale) return false;

    if (showMode === "root") {
      return noteName === rootNote;
    }

    if (showMode === "triads") {
      // Triads are Root (1st), 3rd, and 5th scale degrees
      const rootIdx = CHROMATIC_NOTES.indexOf(rootNote);
      const thirdNote = scaleNotes[2] || ""; // Major third is 3rd element in Major Scale
      const fifthNote = scaleNotes[4] || ""; // Perfect fifth is 5th element
      return noteName === rootNote || noteName === thirdNote || noteName === fifthNote;
    }

    return true;
  };

  // Triggers audio playback
  const handlePlayNote = (noteName: string, octave: number) => {
    synth.playNote(noteName, octave);
  };

  // Play the entire current chord/scale/double-stop
  // Executes a slow arpeggio (up/down) across displayed tones and lights them up in real-time
  const playAllActiveNotes = () => {
    // Stop any currently playing arpeggio timeouts
    playbackTimeoutsRef.current.forEach(t => window.clearTimeout(t));
    playbackTimeoutsRef.current = [];
    setActivePlayingNode(null);

    const activeNotesList: { stringIndex: number; fret: number; name: string; octave: number }[] = [];

    // Collect all active/visible notes on the fretboard from lowest course (G) to highest (E)
    stringsInOrder.forEach((stringBase, sIdx) => {
      // Search from fret 0 (open) to 7
      for (let f = 0; f <= fretCount; f++) {
        const noteInfo = getNoteAtFret(stringBase, f);
        if (shouldShowNote(sIdx, f, noteInfo.name)) {
          activeNotesList.push({
            stringIndex: sIdx,
            fret: f,
            name: noteInfo.name,
            octave: noteInfo.octave
          });
        }
      }
    });

    if (activeNotesList.length === 0) return;

    // Build the "gore/dolje" (up and down) sequence
    const sequence = [...activeNotesList];
    // Append the reverse path, excluding the last one to prevent double triggering the peak
    for (let i = activeNotesList.length - 2; i >= 0; i--) {
      sequence.push(activeNotesList[i]);
    }

    let delay = 0;
    const intervalMs = 280; // Slow, melodic timing (approx 3-4 notes per second)

    sequence.forEach((note, idx) => {
      const tId = window.setTimeout(() => {
        // Play the pitch
        synth.playNote(note.name, note.octave, 0.4);
        // Highlight this exact note badge on the fretboard
        setActivePlayingNode({ stringIndex: note.stringIndex, fret: note.fret });
      }, delay);
      playbackTimeoutsRef.current.push(tId);
      delay += intervalMs;
    });

    // Clear highlight at the end of the arpeggio
    const clearId = window.setTimeout(() => {
      setActivePlayingNode(null);
    }, delay);
    playbackTimeoutsRef.current.push(clearId);
  };

  // Reverse string order if lefty handed
  const stringsInOrder = leftHanded ? [...tuning.notes].reverse() : tuning.notes;

  return (
    <div className="flex flex-col items-center w-full max-w-sm mx-auto bg-[#0a0a0a] rounded-xl p-2.5 border border-white/10 shadow-xl">
      
      {/* Top Header Controls for Fretboard */}
      <div className="flex justify-end items-center w-full mb-1.5 px-1">
        <button
          onClick={playAllActiveNotes}
          className="flex items-center gap-1 px-3 py-0.5 bg-[#F27D26] hover:bg-[#F27D26]/90 text-white text-[11px] font-semibold rounded-full transition shadow-md shadow-orange-950/20 active:scale-95 cursor-pointer"
          title={t["play_all_title"]}
          id="play-active-fretboard-notes"
        >
          <Play size={10} className="fill-current" />
          <span>{t["play_all"]}</span>
        </button>
      </div>

      <div className="relative w-full flex items-start justify-center" style={{ height: "345px" }}>
        
        {/* Fret Numbers on the left, right next to the neck! */}
        <div className="relative h-[295px] w-8 mt-10 pr-2 select-none">
          {Array.from({ length: fretCount }).map((_, i) => {
            const fretNum = i + 1;
            // Place number in the middle of each fret space
            const topPos = (fretPercentages[i] + fretPercentages[i + 1]) / 2;
            return (
              <div
                key={fretNum}
                className="absolute right-1 flex items-center justify-center w-6.5 h-6.5 rounded-lg bg-[#121214] border border-white/10 text-xs font-mono font-bold text-white shadow-md shadow-black/80"
                style={{ top: `${topPos}%`, transform: "translateY(-50%)" }}
              >
                {fretNum}
              </div>
            );
          })}
        </div>

        {/* Fretboard main container (constrained narrow neck) */}
        <div className="relative w-[190px] h-full flex flex-col">
          
          {/* String labels on top (representing open strings / fret 0) */}
          <div className="flex justify-around w-full h-10 items-center border-b border-white/10 select-none pb-1 px-1">
            {stringsInOrder.map((stringBase, idx) => {
              const noteInfo = getNoteAtFret(stringBase, 0);
              const isVisible = shouldShowNote(idx, 0, noteInfo.name);
              const isRoot = noteInfo.name === rootNote;
              const isPlaying = activePlayingNode?.stringIndex === idx && activePlayingNode?.fret === 0;
              
              return (
                <button
                  key={idx}
                  onClick={() => handlePlayNote(noteInfo.name, noteInfo.octave)}
                  className="flex flex-col items-center justify-center transition active:scale-95 cursor-pointer relative z-40 group"
                  title={`${t["play_open"]} ${noteInfo.name}`}
                  id={`open-string-${idx}`}
                >
                  {isRoot ? (
                    <div className={`w-7.5 h-7.5 rounded-lg flex items-center justify-center text-[10.5px] font-extrabold text-white bg-[#F27D26] shadow-[0_0_12px_rgba(242,125,38,0.85)] border border-orange-300/40 relative transition-all duration-150 ${isPlaying ? "scale-115 ring-2 ring-white shadow-[0_0_20px_#F27D26]" : ""}`}>
                      {noteInfo.name}
                    </div>
                  ) : isVisible ? (
                    <div 
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10.5px] font-bold text-white border border-white/20 transition-all duration-150 ${isPlaying ? "scale-115 ring-2 ring-white" : ""}`}
                      style={{ 
                        backgroundColor: NOTE_COLORS[noteInfo.name] || "rgba(255, 255, 255, 0.1)",
                        boxShadow: isPlaying 
                          ? `0 0 20px ${NOTE_COLORS[noteInfo.name] || "rgba(255,255,255,0.8)"}` 
                          : `0 0 10px ${NOTE_COLORS[noteInfo.name] || "rgba(255,255,255,0.1)"}`
                      }}
                    >
                      {noteInfo.name}
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-medium text-white/40 bg-black/40 border border-white/5 group-hover:border-white/20 group-hover:text-white/70 transition">
                      {noteInfo.name}
                    </div>
                  )}
                  {/* Subtle speaker icon or indicator */}
                  <Volume2 size={7} className="text-white/25 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
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
            {/* Highly visible, realistic vertical and wavy wood grain lines */}
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

            {/* Fret Position Marker Dots (Pearl Inlays) on frets 3, 5, 7 */}
            {[3, 5, 7].map(f => {
              const topPos = (fretPercentages[f - 1] + fretPercentages[f]) / 2;
              return (
                <div
                  key={`dot-${f}`}
                  className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white/45 border border-white/20 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.9),0_0_6px_rgba(255,255,255,0.35)] opacity-90 z-0"
                  style={{ top: `${topPos}%` }}
                />
              );
            })}

            {/* Nut (Thick bone/ivory bridge at the top of fretboard) */}
            <div 
              className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-b from-[#f8fafc] via-[#f1f5f9] to-[#cbd5e1] border-b border-zinc-900 z-10 shadow-[0_1.5px_3px_rgba(0,0,0,0.9)]" 
              style={{ borderRadius: "1px 1px 0 0" }}
            />

            {/* Fret wires (Horizontal 3D metal silver lines) */}
            {fretPercentages.map((percentage, idx) => {
              if (idx === 0) return null; // skip nut
              return (
                <div
                  key={`fret-${idx}`}
                  className="absolute left-0 right-0 h-[3px] z-10"
                  style={{ 
                    top: `${percentage}%`,
                    background: "linear-gradient(to bottom, #475569 0%, #cbd5e1 30%, #ffffff 50%, #64748b 80%, #1e293b 100%)",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.8), 0 -0.5px 0.5px rgba(0,0,0,0.5)"
                  }}
                />
              );
            })}

            {/* Strings (4 courses of double strings with realistic dimensions & silvery steel gradients) */}
            <div className="absolute inset-0 flex justify-around px-1 pointer-events-none">
              {stringsInOrder.map((stringBase, sIdx) => {
                const originalIdx = tuning.notes.indexOf(stringBase);
                
                // Real silver steel modeling based on pitch:
                // All strings have elegant metallic silver sheen gradients to prevent screen aliasing "dots"
                let stringStyle: React.CSSProperties = {};
                let stringWidth = "w-[1px]";
                
                if (originalIdx === 0) {
                  // G: Thickest silver steel course
                  stringWidth = "w-[2.4px]";
                  stringStyle = {
                    background: "linear-gradient(90deg, #374151 0%, #9ca3af 20%, #f8fafc 45%, #e2e8f0 60%, #9ca3af 75%, #374151 100%)",
                    boxShadow: "0.5px 0 2.5px rgba(0,0,0,0.9)"
                  };
                } else if (originalIdx === 1) {
                  // D: Medium silver steel course
                  stringWidth = "w-[1.8px]";
                  stringStyle = {
                    background: "linear-gradient(90deg, #4b5563 0%, #cbd5e1 25%, #f8fafc 50%, #cbd5e1 75%, #4b5563 100%)",
                    boxShadow: "0.5px 0 2px rgba(0,0,0,0.85)"
                  };
                } else if (originalIdx === 2) {
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
                  <div key={`course-${sIdx}`} className="h-full flex gap-[2.4px] justify-center items-center opacity-95 z-20">
                    {/* Double string 1 */}
                    <div className={`h-full ${stringWidth}`} style={stringStyle} />
                    {/* Double string 2 */}
                    <div className={`h-full ${stringWidth}`} style={stringStyle} />
                  </div>
                );
              })}
            </div>

            {/* Clickable Note Badges Layer */}
            <div className="absolute inset-0 flex justify-around px-1 z-30 h-full">
              {stringsInOrder.map((stringBase, sIdx) => {
                return (
                  <div key={`notes-course-${sIdx}`} className="h-full flex flex-col justify-between relative" style={{ width: "24px" }}>
                    
                    {/* Fret spaces from 1 to 7 */}
                    {Array.from({ length: fretCount }).map((_, idx) => {
                      const fIdx = idx + 1;
                      const noteInfo = getNoteAtFret(stringBase, fIdx);
                      const isVisible = shouldShowNote(sIdx, fIdx, noteInfo.name);
                      const isRoot = noteInfo.name === rootNote;
                      const isPlaying = activePlayingNode?.stringIndex === sIdx && activePlayingNode?.fret === fIdx;

                      // Position notes in the center of their respective fret spaces
                      const topStart = fretPercentages[fIdx - 1];
                      const topEnd = fretPercentages[fIdx];
                      const height = topEnd - topStart;
                      
                      const style: React.CSSProperties = { 
                        position: "absolute", 
                        top: `${topStart}%`, 
                        height: `${height}%`, 
                        width: "100%", 
                        left: "0" 
                      };

                      return (
                        <div
                          key={`fretspace-${sIdx}-${fIdx}`}
                          style={style}
                          className="flex items-center justify-center group"
                        >
                          {/* Fretted notes */}
                          {isVisible ? (
                            <motion.button
                              initial={{ scale: 0.4, opacity: 0 }}
                              animate={{ scale: isPlaying ? 1.15 : 1, opacity: 1 }}
                              transition={{ type: "spring", stiffness: 300, damping: 20 }}
                              onClick={() => handlePlayNote(noteInfo.name, noteInfo.octave)}
                              className="relative w-7.5 h-7.5 sm:w-8.5 sm:h-8.5 rounded-full flex items-center justify-center text-xs font-black cursor-pointer active:scale-95 z-40 shadow-lg transition-all duration-150"
                              style={{ 
                                backgroundColor: isRoot ? "#F27D26" : (NOTE_COLORS[noteInfo.name] || "rgba(255, 255, 255, 0.1)"),
                                boxShadow: isPlaying
                                  ? (isRoot 
                                      ? "0 0 24px #F27D26, inset 0 1px 1px rgba(255,255,255,0.6)" 
                                      : `0 0 24px ${NOTE_COLORS[noteInfo.name] || "rgba(255,255,255,0.8)"}, inset 0 1px 1px rgba(255,255,255,0.4)`)
                                  : (isRoot 
                                      ? "0 0 16px rgba(242,125,38,0.85), inset 0 1px 1px rgba(255,255,255,0.4)"
                                      : `0 2px 5px rgba(0,0,0,0.7), 0 0 12px ${NOTE_COLORS[noteInfo.name] || "rgba(255,255,255,0.15)"}, inset 0 1px 1px rgba(255,255,255,0.2)`),
                                border: isPlaying 
                                  ? "2.2px solid rgba(255, 255, 255, 0.95)" 
                                  : (isRoot ? "1.5px solid rgba(255, 255, 255, 0.6)" : "1px solid rgba(255, 255, 255, 0.25)"),
                                color: "rgba(255, 255, 255, 0.95)",
                                textShadow: "0 1px 2px rgba(0,0,0,0.6)",
                                touchAction: "manipulation"
                              }}
                              id={`note-${sIdx}-fret-${fIdx}`}
                            >
                              {isRoot && (
                                <span className={`absolute -inset-1 rounded-full border border-[#F27D26]/60 ${isPlaying ? "animate-ping" : ""} opacity-35 pointer-events-none`} />
                              )}
                              <span>
                                {noteInfo.name}
                              </span>
                            </motion.button>
                          ) : (
                            // Semi-transparent overlay to tap empty frets to play their notes (discovery mode!)
                            <button
                              onClick={() => handlePlayNote(noteInfo.name, noteInfo.octave)}
                              className="w-5 h-5 rounded-lg opacity-0 hover:opacity-30 hover:bg-white/10 flex items-center justify-center text-[9px] font-mono text-white/40 z-30 transition cursor-pointer"
                              style={{ touchAction: "manipulation" }}
                            >
                              {noteInfo.name}
                            </button>
                          )}
                        </div>
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
};
