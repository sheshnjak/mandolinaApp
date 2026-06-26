/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { motion } from "motion/react";
import { CHROMATIC_NOTES } from "../types";
import { synth } from "../audio";
import { Play, Square, Activity, ArrowUp } from "lucide-react";
import { TRANSLATIONS } from "../translations";

interface TremoloTrainerProps {
  rootNote: string;
  language?: "hr" | "en";
}

type Subdivision = "8th" | "triplet" | "16th" | "32nd";

export const TremoloTrainer: React.FC<TremoloTrainerProps> = ({ 
  rootNote,
  language = "hr"
}) => {
  const t = TRANSLATIONS[language];
  
  const [bpm, setBpm] = React.useState<number>(100);
  const [subdivision, setSubdivision] = React.useState<Subdivision>("16th");
  const [isTrainerRunning, setIsTrainerRunning] = React.useState<boolean>(false);
  const [targetNote, setTargetNote] = React.useState<string>(rootNote);
  
  // Accelerando Trainer (auto-speedup)
  const [isAutoSpeedup, setIsAutoSpeedup] = React.useState<boolean>(false);
  const [speedupRate, setSpeedupRate] = React.useState<number>(5); // BPM increase per interval
  const [speedupInterval, setSpeedupInterval] = React.useState<number>(8); // interval in beats
  const [beatCount, setBeatCount] = React.useState<number>(0);

  // Audio Tremolo playback hook
  const tremoloStopRef = React.useRef<(() => void) | null>(null);

  // Sync targetNote with rootNote when rootNote changes
  React.useEffect(() => {
    setTargetNote(rootNote);
  }, [rootNote]);

  // Calculations for picking frequency (Hz)
  const picksPerBeat = React.useMemo(() => {
    switch (subdivision) {
      case "8th": return 2;
      case "triplet": return 3;
      case "16th": return 4;
      case "32nd": return 8;
    }
  }, [subdivision]);

  const picksPerSecond = React.useMemo(() => {
    return (bpm / 60) * picksPerBeat;
  }, [bpm, picksPerBeat]);

  // Visual Pendulum Ticking Period (seconds per swing)
  const swingDuration = React.useMemo(() => {
    return 60 / bpm;
  }, [bpm]);

  // Clean up audio on unmount
  React.useEffect(() => {
    return () => {
      if (tremoloStopRef.current) {
        tremoloStopRef.current();
      }
    };
  }, []);

  // Play/Stop Tremolo Audio Simulation
  const toggleTrainer = () => {
    if (isTrainerRunning) {
      if (tremoloStopRef.current) {
        tremoloStopRef.current();
        tremoloStopRef.current = null;
      }
      setIsTrainerRunning(false);
      setBeatCount(0);
    } else {
      setIsTrainerRunning(true);
      // G4 or A4 octave depending on note
      const octave = ["E", "F", "F#", "G", "G#", "A", "A#", "B"].includes(targetNote) ? 4 : 5;
      
      // Start real synthesized tremolo picking audio!
      const stopFn = synth.startTremolo(targetNote, octave, picksPerSecond);
      tremoloStopRef.current = stopFn;
    }
  };

  // Dynamic audio speed adjustment if playing while sliders move
  React.useEffect(() => {
    if (isTrainerRunning) {
      // Re-trigger with new speed
      if (tremoloStopRef.current) {
        tremoloStopRef.current();
      }
      const octave = ["E", "F", "F#", "G", "G#", "A", "A#", "B"].includes(targetNote) ? 4 : 5;
      const stopFn = synth.startTremolo(targetNote, octave, picksPerSecond);
      tremoloStopRef.current = stopFn;
    }
  }, [bpm, subdivision, targetNote, picksPerSecond, isTrainerRunning]);

  // Auto-Speedup timer simulation
  React.useEffect(() => {
    let timerId: any = null;
    if (isTrainerRunning && isAutoSpeedup) {
      // Setup a timer representing beat intervals
      const beatIntervalMs = (60 / bpm) * 1000;
      
      timerId = setInterval(() => {
        setBeatCount(prev => {
          const next = prev + 1;
          if (next >= speedupInterval) {
            // Speed up!
            setBpm(b => Math.min(220, b + speedupRate));
            return 0; // reset beats
          }
          return next;
        });
      }, beatIntervalMs);
    } else {
      setBeatCount(0);
    }

    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [isTrainerRunning, isAutoSpeedup, bpm, speedupInterval, speedupRate]);

  return (
    <div className="flex flex-col w-full max-w-sm mx-auto bg-[#0a0a0a] rounded-2xl p-4 border border-white/10 shadow-xl select-none">
      
      {/* Header Info */}
      <div className="flex justify-between items-center px-1 mb-4">
        <span className="text-xs font-mono text-white/40 uppercase tracking-widest">
          {t["tt_title"]}
        </span>
        <span className="flex items-center gap-1.5 text-[10px] bg-red-950/20 text-red-400 border border-red-900/30 px-2 py-0.5 rounded-full font-mono">
          <Activity size={9} className="animate-pulse" /> {language === "en" ? "Speed practice" : "Trening brzine"}
        </span>
      </div>

      {/* 1. VISUAL PENDULUM METRONOME */}
      <div className="relative h-28 bg-[#121214] border border-white/5 rounded-2xl overflow-hidden flex flex-col items-center justify-end p-2.5 shadow-inner">
        {/* Absolute ticks gauge background */}
        <div className="absolute inset-x-4 top-4 flex justify-between text-[8px] font-mono text-white/30">
          <span>{language === "en" ? "◄ Slower" : "◄ Ljepše"}</span>
          <span>{language === "en" ? "Center" : "Sredina"}</span>
          <span>{language === "en" ? "Faster ►" : "Brže ►"}</span>
        </div>

        {/* Metronome needle/pendulum */}
        {isTrainerRunning ? (
          <motion.div
            animate={{ rotate: [-28, 28] }}
            transition={{
              repeat: Infinity,
              repeatType: "reverse",
              duration: swingDuration,
              ease: "easeInOut"
            }}
            className="absolute bottom-2 left-1/2 transform -translate-x-1/2 origin-bottom w-0.5 h-20 bg-gradient-to-t from-[#F27D26] to-[#F27D26]/80 z-10"
            style={{ originY: "100%" }}
          >
            {/* Bob weight on pendulum */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-3 h-4 bg-white border border-[#F27D26] shadow" />
          </motion.div>
        ) : (
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-0.5 h-20 bg-zinc-800 origin-bottom" style={{ transform: "rotate(0deg)" }}>
            <div className="absolute top-10 left-1/2 transform -translate-x-1/2 w-3 h-4 bg-zinc-600 rounded border border-zinc-700 shadow" />
          </div>
        )}

        {/* Pivot Point at the bottom */}
        <div className="w-5 h-5 rounded-full bg-[#0a0a0b] border border-white/10 flex items-center justify-center z-20 shadow">
          <div className="w-2 h-2 rounded-full bg-[#F27D26]" />
        </div>
      </div>

      {/* 2. DYNAMIC READOUTS */}
      <div className="grid grid-cols-2 gap-2 mt-4">
        <div className="bg-[#121214] border border-white/5 p-3 rounded-xl flex flex-col items-center justify-center text-center">
          <span className="text-[9px] text-white/30 font-mono uppercase tracking-wider">{t["tt_speed"]}</span>
          <span className="text-xl font-black text-white tracking-tight">{bpm} BPM</span>
        </div>
        <div className="bg-[#121214] border border-white/5 p-3 rounded-xl flex flex-col items-center justify-center text-center">
          <span className="text-[9px] text-white/30 font-mono uppercase tracking-wider">{t["tt_notes_sec"]}</span>
          <span className="text-xl font-black text-[#F27D26] tracking-tight font-mono">
            {picksPerSecond.toFixed(1)} Hz
          </span>
        </div>
      </div>

      {/* 3. SETTINGS & SLIDERS */}
      <div className="space-y-4 mt-4 bg-[#121214] p-4 rounded-xl border border-white/5">
        
        {/* Target Note Selector */}
        <div className="flex justify-between items-center">
          <label className="text-xs font-semibold text-white/55">{t["tt_target_note"]}</label>
          <div className="flex gap-1">
            {CHROMATIC_NOTES.slice(0, 6).map(n => (
              <button
                key={n}
                onClick={() => setTargetNote(n)}
                className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold transition cursor-pointer ${
                  targetNote === n 
                    ? "bg-[#F27D26] text-white shadow"
                    : "bg-white/5 text-white/40 hover:text-white"
                }`}
                id={`tremolo-note-select-${n}`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* BPM Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold text-white/55">
            <span>{language === "en" ? "Tempo (BPM)" : "Tempo (BPM)"}</span>
            <span className="font-mono text-white">{bpm}</span>
          </div>
          <input
            type="range"
            min="60"
            max="220"
            value={bpm}
            onChange={(e) => setBpm(parseInt(e.target.value, 10))}
            className="w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-[#F27D26] focus:outline-none"
            id="tremolo-bpm-range"
          />
        </div>

        {/* Subdivision Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-white/55 block">{t["tt_subdivision"]}</label>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { id: "8th" as Subdivision, label: t["tt_osminke"], desc: "2/beat" },
              { id: "triplet" as Subdivision, label: t["tt_triole"], desc: "3/beat" },
              { id: "16th" as Subdivision, label: t["tt_sesnaest"], desc: "4/beat" },
              { id: "32nd" as Subdivision, label: t["tt_trideset"], desc: "8/beat" }
            ].map(sub => (
              <button
                key={sub.id}
                onClick={() => setSubdivision(sub.id)}
                className={`p-1.5 rounded-lg border flex flex-col items-center justify-center transition cursor-pointer ${
                  subdivision === sub.id
                    ? "bg-[#F27D26]/10 border-[#F27D26] text-[#F27D26] shadow"
                    : "bg-[#0a0a0b] border-white/10 text-white/40 hover:text-white"
                }`}
                id={`tremolo-subdiv-${sub.id}`}
              >
                <span className="text-[10px] font-bold">{sub.label}</span>
                <span className="text-[8px] font-mono opacity-40 mt-0.5">{sub.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Accelerando (Speedup Mode) */}
        <div className="pt-3 border-t border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white/70 flex items-center gap-1.5">
                <ArrowUp size={12} className="text-[#F27D26]" /> {t["tt_accelerando"]}
              </span>
              <span className="text-[10px] text-white/30">{t["tt_accelerando_desc"]}</span>
            </div>
            <input
              type="checkbox"
              checked={isAutoSpeedup}
              onChange={(e) => setIsAutoSpeedup(e.target.checked)}
              className="w-4 h-4 rounded text-[#F27D26] accent-[#F27D26] cursor-pointer bg-[#0a0a0b] border-white/10"
              id="tremolo-autospeedup-toggle"
            />
          </div>

          {isAutoSpeedup && (
            <div className="grid grid-cols-2 gap-3 p-2 bg-black/20 rounded-lg border border-white/5 text-[10px]">
              <div className="space-y-1">
                <span className="text-white/30 block">{t["tt_speedup"]}</span>
                <div className="flex items-center gap-1.5">
                  <select
                    value={speedupRate}
                    onChange={(e) => setSpeedupRate(parseInt(e.target.value, 10))}
                    className="bg-[#0a0a0b] border border-white/10 rounded p-1 text-white font-mono"
                    id="speedup-rate-select"
                  >
                    {[1, 2, 3, 5, 10].map(v => (
                      <option key={v} value={v}>+{v} BPM</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-white/30 block">{t["tt_every"]}</span>
                <select
                  value={speedupInterval}
                  onChange={(e) => setSpeedupInterval(parseInt(e.target.value, 10))}
                  className="bg-[#0a0a0b] border border-white/10 rounded p-1 text-white font-mono w-full"
                  id="speedup-interval-select"
                >
                  <option value="4">{language === "en" ? "4 beats (1 bar)" : "4 otkucaja (1 takt)"}</option>
                  <option value="8">{language === "en" ? "8 beats (2 bars)" : "8 otkucaja (2 takta)"}</option>
                  <option value="16">{language === "en" ? "16 beats (4 bars)" : "16 otkucaja (4 takta)"}</option>
                  <option value="32">{language === "en" ? "32 beats (8 bars)" : "32 otkucaja (8 takta)"}</option>
                </select>
              </div>

              {isTrainerRunning && (
                <div className="col-span-2 text-center text-[9px] font-mono text-orange-400 animate-pulse pt-1">
                  {language === "en" 
                    ? `Next speedup in ${speedupInterval - beatCount} beats`
                    : `Sljedeće ubrzanje za ${speedupInterval - beatCount} otkucaja`}
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* 4. ACTIONS / TRIGGER BUTTON */}
      <button
        onClick={toggleTrainer}
        className={`w-full mt-4 py-3 rounded-xl font-bold text-sm tracking-wider flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 cursor-pointer ${
          isTrainerRunning
            ? "bg-red-600 hover:bg-red-500 text-white shadow-red-950/20"
            : "bg-[#F27D26] hover:bg-[#F27D26]/90 text-white shadow-md shadow-orange-950/20"
        }`}
        id="tremolo-start-stop-btn"
      >
        {isTrainerRunning ? (
          <>
            <Square size={14} className="fill-current" />
            <span>{language === "en" ? "STOP TRAINING" : "ZAUSTAVI METRONOM"}</span>
          </>
        ) : (
          <>
            <Play size={14} className="fill-current" />
            <span>{language === "en" ? "START METRONOME" : "POKRENI METRONOM"}</span>
          </>
        )}
      </button>

    </div>
  );
};
