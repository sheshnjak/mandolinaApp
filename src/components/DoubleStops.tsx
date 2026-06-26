/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { motion } from "motion/react";
import { DoubleStop, generateDoubleStopsForScale } from "../types";
import { synth } from "../audio";
import { Play, ArrowUpRight } from "lucide-react";
import { TRANSLATIONS } from "../translations";

interface DoubleStopsProps {
  rootNote: string;
  scaleName: string;
  onSelectDoubleStop: (frets: { stringIndex: number; fret: number }[]) => void;
  selectedDoubleStopIndex: number | null;
  onSelectDoubleStopIndex: (idx: number | null) => void;
  language?: "hr" | "en";
}

export const DoubleStops: React.FC<DoubleStopsProps> = ({
  rootNote,
  scaleName,
  onSelectDoubleStop,
  selectedDoubleStopIndex,
  onSelectDoubleStopIndex,
  language = "hr"
}) => {
  const t = TRANSLATIONS[language];

  // Generate/fetch double stops for the active root key and scale
  const activeDoubleStops = React.useMemo(() => {
    return generateDoubleStopsForScale(rootNote, scaleName);
  }, [rootNote, scaleName]);

  // Handle playing a double stop (both notes played closely)
  const handlePlayDoubleStop = (ds: DoubleStop) => {
    const baseStringNotes = ["G3", "D4", "A4", "E5"];
    
    // Play both notes of the double stop
    ds.strings.forEach((stringIdx, orderIdx) => {
      const fret = ds.frets[orderIdx];
      const noteInfo = synth["ctx"] ? getNoteAtFretLocal(baseStringNotes[stringIdx], fret) : { name: ds.notes[orderIdx], octave: stringIdx + 3 };
      
      setTimeout(() => {
        synth.playNote(noteInfo.name, noteInfo.octave, 1.4);
      }, orderIdx * 20); // extreme micro-delay for realistic strum texture
    });
  };

  // Local helper for frequency calculations
  const getNoteAtFretLocal = (baseNote: string, fret: number) => {
    const CHROMATIC_NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const match = baseNote.match(/^([A-G]#?)([0-9])$/);
    if (!match) return { name: "C", octave: 4 };
    const noteName = match[1];
    const startOctave = parseInt(match[2], 10);
    const startIndex = CHROMATIC_NOTES.indexOf(noteName);
    const targetIndex = (startIndex + fret) % 12;
    const octavesShifted = Math.floor((startIndex + fret) / 12);
    return { name: CHROMATIC_NOTES[targetIndex], octave: startOctave + octavesShifted };
  };

  const handleSelectDoubleStop = (ds: DoubleStop, idx: number) => {
    onSelectDoubleStopIndex(idx);
    
    // Convert to fretboard format
    const formatted = ds.strings.map((stringIndex, orderIdx) => ({
      stringIndex,
      fret: ds.frets[orderIdx]
    }));
    
    onSelectDoubleStop(formatted);
    handlePlayDoubleStop(ds);
  };

  return (
    <div className="flex flex-col w-full max-w-sm mx-auto bg-[#0a0a0a] rounded-2xl p-4 border border-white/10 shadow-xl select-none">
      
      {/* Header Info */}
      <div className="flex justify-between items-center px-1 mb-4">
        <span className="text-xs font-mono text-white/40 uppercase tracking-widest">
          {language === "en" ? "DOUBLE STOPS" : "DVOZVUCI"}: {rootNote}
        </span>
        <span className="text-[10px] text-white/30">{t["ds_desc"]}</span>
      </div>

      {/* Double Stop List */}
      <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
        {activeDoubleStops.map((ds, idx) => {
          const isActive = selectedDoubleStopIndex === idx;
          return (
            <motion.div
              key={`${ds.name}-${idx}`}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelectDoubleStop(ds, idx)}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                isActive
                  ? "bg-[#F27D26]/10 border-[#F27D26] shadow-[0_0_12px_rgba(242,125,38,0.25)]"
                  : "bg-[#121214] border-white/5 hover:border-white/10 hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Micro Strum trigger */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlayDoubleStop(ds);
                  }}
                  className="w-7 h-7 rounded-full bg-white/5 hover:bg-[#F27D26]/10 hover:text-[#F27D26] hover:border-[#F27D26]/30 flex items-center justify-center border border-white/10 text-white/70 shadow"
                  id={`play-doublestop-${idx}`}
                >
                  <Play size={10} className="fill-current ml-0.5" />
                </button>

                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white tracking-wide">
                    {ds.name}
                  </span>
                  <span className="text-[10px] text-white/40 font-mono">
                    {language === "en" ? "Strings" : "Žice"}: {ds.strings.map(s => ["G", "D", "A", "E"][s]).join(" + ")}
                  </span>
                </div>
              </div>

              {/* Fingering representation */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-bold text-[#F27D26] font-mono tracking-wide">
                  [{ds.notes.join(" + ")}]
                </span>
                <ArrowUpRight size={10} className="text-white/20" />
              </div>
            </motion.div>
          );
        })}
      </div>



    </div>
  );
};
