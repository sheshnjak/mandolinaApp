/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getFrequencyForNote } from "./types";

class MandolinSynth {
  private ctx: AudioContext | null = null;
  private masterVolumeNode: GainNode | null = null;
  private activeOscillators: { osc1: OscillatorNode; osc2: OscillatorNode; gainNode: GainNode }[] = [];
  private volume: number = 0.6; // Default volume (0.0 to 1.0)
  
  constructor() {
    // Lazy initialize to bypass browser autoplay policies
  }

  private init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.masterVolumeNode = this.ctx.createGain();
      this.masterVolumeNode.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterVolumeNode.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterVolumeNode && this.ctx) {
      this.masterVolumeNode.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  getVolume(): number {
    return this.volume;
  }

  /**
   * Plays a single plucked mandolin note (double strings chorused)
   */
  playNote(noteName: string, octave: number, durationSec: number = 1.5) {
    try {
      this.init();
      if (!this.ctx || !this.masterVolumeNode) return;

      const freq = getFrequencyForNote(noteName, octave);
      const now = this.ctx.currentTime;

      // Create a gain node for this specific note's pluck envelope
      const noteGain = this.ctx.createGain();
      noteGain.gain.setValueAtTime(0, now);
      // Instant pluck attack
      noteGain.gain.linearRampToValueAtTime(1.0, now + 0.005);
      // Plucked string decay
      noteGain.gain.exponentialRampToValueAtTime(0.3, now + 0.15);
      // Release to 0
      noteGain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

      // MANDOLIN SPECIFIC: Two strings tuned to almost the exact same frequency,
      // but slightly detuned to create the double-string (course) chorus effect!
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();

      // We mix Triangle (mellow pluck) with a bit of Sawtooth (metallic steel brightness)
      // to model mandolin string acoustics
      osc1.type = "triangle";
      osc2.type = "triangle";

      osc1.frequency.setValueAtTime(freq, now);
      osc2.frequency.setValueAtTime(freq, now);

      // Micro-detune standard mandolin strings (+3 cents and -3 cents)
      osc1.detune.setValueAtTime(-4, now);
      osc2.detune.setValueAtTime(4, now);

      // Add a subtle high harmonic to simulate steel pluck click
      const clickOsc = this.ctx.createOscillator();
      const clickGain = this.ctx.createGain();
      clickOsc.type = "sine";
      clickOsc.frequency.setValueAtTime(freq * 3, now); // 3rd harmonic (bright/metallic)
      clickGain.gain.setValueAtTime(0.15, now);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04); // decay extremely fast

      // Connect everything
      osc1.connect(noteGain);
      osc2.connect(noteGain);
      clickOsc.connect(clickGain);
      clickGain.connect(noteGain);

      noteGain.connect(this.masterVolumeNode);

      // Start and Stop
      osc1.start(now);
      osc2.start(now);
      clickOsc.start(now);

      osc1.stop(now + durationSec);
      osc2.stop(now + durationSec);
      clickOsc.stop(now + durationSec);

      // Track active node for potential cleanup
      const activeItem = { osc1, osc2, gainNode: noteGain };
      this.activeOscillators.push(activeItem);

      // Clean up reference after note is done playing
      setTimeout(() => {
        this.activeOscillators = this.activeOscillators.filter(item => item !== activeItem);
      }, durationSec * 1000 + 100);

    } catch (e) {
      console.error("Failed to play note via Web Audio API", e);
    }
  }

  /**
   * Triggers a fast repeated sequence of pluck attacks for a given note (Tremolo effect)
   * Returns a function to stop the tremolo.
   */
  startTremolo(noteName: string, octave: number, speedHz: number = 8): () => void {
    try {
      this.init();
      if (!this.ctx || !this.masterVolumeNode) return () => {};

      let isPlaying = true;
      const intervalMs = 1000 / speedHz;
      
      const playStroke = () => {
        if (!isPlaying || !this.ctx) return;
        
        const freq = getFrequencyForNote(noteName, octave);
        const now = this.ctx.currentTime;
        
        // Tremolo strokes are very short and quick
        const strokeGain = this.ctx.createGain();
        strokeGain.gain.setValueAtTime(0, now);
        strokeGain.gain.linearRampToValueAtTime(0.9, now + 0.002);
        strokeGain.gain.exponentialRampToValueAtTime(0.1, now + (intervalMs / 1000) * 0.8);
        strokeGain.gain.setValueAtTime(0, now + intervalMs / 1000);
        
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        
        osc1.type = "triangle";
        osc2.type = "triangle";
        
        osc1.frequency.setValueAtTime(freq, now);
        osc2.frequency.setValueAtTime(freq, now);
        
        // Slightly wider detune for fast picking vibration
        osc1.detune.setValueAtTime(-6, now);
        osc2.detune.setValueAtTime(6, now);
        
        osc1.connect(strokeGain);
        osc2.connect(strokeGain);
        strokeGain.connect(this.masterVolumeNode!);
        
        osc1.start(now);
        osc2.start(now);
        
        osc1.stop(now + intervalMs / 1000);
        osc2.stop(now + intervalMs / 1000);
        
        setTimeout(() => {
          if (isPlaying) {
            playStroke();
          }
        }, intervalMs);
      };
      
      // Start the loop
      playStroke();
      
      return () => {
        isPlaying = false;
      };
    } catch (e) {
      console.error("Failed to start tremolo", e);
      return () => {};
    }
  }

  stopAll() {
    try {
      this.activeOscillators.forEach(item => {
        item.osc1.disconnect();
        item.osc2.disconnect();
        item.gainNode.disconnect();
      });
      this.activeOscillators = [];
    } catch (e) {
      console.error("Failed to stop oscillators", e);
    }
  }
}

export const synth = new MandolinSynth();
