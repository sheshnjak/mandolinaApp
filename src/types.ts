/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TabType = 'LJESTVICE' | 'AKORDI' | 'KVINTNI KRUG' | 'TREMOLO' | 'DVOZVUCI';

export interface Tuning {
  name: string;
  notes: string[]; // e.g. ["G3", "D4", "A4", "E5"]
}

export const STANDARD_TUNING: Tuning = {
  name: "Standard (G-D-A-E)",
  notes: ["G3", "D4", "A4", "E5"]
};

export const ALTERNATIVE_TUNINGS: Tuning[] = [
  STANDARD_TUNING,
  { name: "Gettern (G-D-A-D)", notes: ["G3", "D4", "A4", "D5"] },
  { name: "Open G (G-D-G-B)", notes: ["G3", "D4", "G4", "B4"] },
  { name: "Sawmill (A-D-A-E)", notes: ["A3", "D4", "A4", "E5"] }
];

export const CHROMATIC_NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

// Dynamic mapping of notes to colors, matching the image and providing high contrast
export const NOTE_COLORS: Record<string, string> = {
  "C": "#3b82f6",  // Royal Blue (Root note, gets a nice pulse/glow)
  "C#": "#f59e0b", // Amber
  "D": "#eab308",  // Yellow
  "D#": "#ec4899", // Pink
  "E": "#22c55e",  // Green
  "F": "#6366f1",  // Indigo (changed from orange to avoid clashing with root orange)
  "F#": "#f43f5e", // Rose
  "G": "#a855f7",  // Purple
  "G#": "#8b5cf6", // Violet
  "A": "#ef4444",  // Red
  "A#": "#64748b", // Slate
  "B": "#14b8a6"   // Teal
};

export interface Scale {
  name: string;
  intervals: number[]; // semitones from root
  croatianName: string;
}

export const SCALES: Scale[] = [
  { name: "Major", intervals: [0, 2, 4, 5, 7, 9, 11], croatianName: "Durska (Major)" },
  { name: "Natural Minor", intervals: [0, 2, 3, 5, 7, 8, 10], croatianName: "Prirodna molska" },
  { name: "Harmonic Minor", intervals: [0, 2, 3, 5, 7, 8, 11], croatianName: "Harmonijska molska" },
  { name: "Major Pentatonic", intervals: [0, 2, 4, 7, 9], croatianName: "Durska pentatonika" },
  { name: "Minor Pentatonic", intervals: [0, 3, 5, 7, 10], croatianName: "Molska pentatonika" },
  { name: "Blues", intervals: [0, 3, 5, 6, 7, 10], croatianName: "Blues ljestvica" }
];

export interface ChordDefinition {
  key: string;      // C, D, Eb etc.
  type: string;     // Major, Minor, 7, maj7, min7, dim
  name: string;     // C, Cm, C7, etc.
  frets: number[];  // [G, D, A, E] fret positions. -1 means muted.
  notes: string[];  // notes contained in the chord
}

// Comprehensive chord dictionary for the most common mandolin chords
export const CHORD_DICTIONARY: Record<string, Record<string, ChordDefinition[]>> = {
  "C": {
    "Major": [
      { key: "C", type: "Major", name: "C Major (Open)", frets: [0, 2, 3, 0], notes: ["G", "E", "C", "G"] },
      { key: "C", type: "Major", name: "C Major (Barre)", frets: [5, 2, 3, 3], notes: ["C", "E", "C", "G"] }
    ],
    "Minor": [
      { key: "C", type: "Minor", name: "C Minor", frets: [0, 1, 3, 3], notes: ["G", "Eb", "D", "G"] }, // Simplified
      { key: "C", type: "Minor", name: "Cm (Closed)", frets: [5, 1, 3, 3], notes: ["C", "Eb", "C", "G"] }
    ],
    "7": [
      { key: "C", type: "7", name: "C7", frets: [3, 2, 3, 0], notes: ["Bb", "E", "C", "G"] }
    ]
  },
  "C#": {
    "Major": [
      { key: "C#", type: "Major", name: "C# Major", frets: [6, 3, 4, 4], notes: ["C#", "F", "C#", "G#"] }
    ],
    "Minor": [
      { key: "C#", type: "Minor", name: "C# Minor", frets: [6, 2, 4, 4], notes: ["C#", "E", "C#", "G#"] }
    ],
    "7": [
      { key: "C#", type: "7", name: "C#7", frets: [4, 3, 4, 1], notes: ["B", "F", "C#", "G#"] }
    ]
  },
  "D": {
    "Major": [
      { key: "D", type: "Major", name: "D Major", frets: [2, 0, 0, 2], notes: ["A", "D", "A", "F#"] },
      { key: "D", type: "Major", name: "D Major (Closed)", frets: [7, 4, 5, 5], notes: ["D", "F#", "D", "A"] }
    ],
    "Minor": [
      { key: "D", type: "Minor", name: "D Minor", frets: [2, 0, 0, 1], notes: ["A", "D", "A", "F"] }
    ],
    "7": [
      { key: "D", type: "7", name: "D7", frets: [2, 0, 3, 2], notes: ["A", "D", "C", "F#"] }
    ]
  },
  "D#": {
    "Major": [
      { key: "D#", type: "Major", name: "Eb/D# Major", frets: [3, 1, 1, 3], notes: ["Bb", "Eb", "Bb", "G"] }
    ],
    "Minor": [
      { key: "D#", type: "Minor", name: "Ebm/D#m", frets: [3, 1, 1, 2], notes: ["Bb", "Eb", "Bb", "Gb"] }
    ],
    "7": [
      { key: "D#", type: "7", name: "Eb7/D#7", frets: [3, 1, 4, 3], notes: ["Bb", "Eb", "Db", "G"] }
    ]
  },
  "E": {
    "Major": [
      { key: "E", type: "Major", name: "E Major", frets: [1, 2, 2, 0], notes: ["G#", "E", "B", "E"] },
      { key: "E", type: "Major", name: "E Major (Chop)", frets: [4, 6, 7, 0], notes: ["B", "G#", "E", "E"] }
    ],
    "Minor": [
      { key: "E", type: "Minor", name: "E Minor", frets: [0, 2, 2, 0], notes: ["G", "E", "B", "E"] },
      { key: "E", type: "Minor", name: "Em (Chop)", frets: [4, 5, 7, 0], notes: ["B", "G", "E", "E"] }
    ],
    "7": [
      { key: "E", type: "7", name: "E7", frets: [1, 0, 2, 0], notes: ["G#", "D", "B", "E"] }
    ]
  },
  "F": {
    "Major": [
      { key: "F", type: "Major", name: "F Major", frets: [2, 3, 0, 1], notes: ["A", "F", "A", "F"] },
      { key: "F", type: "Major", name: "F Major (Closed)", frets: [5, 3, 0, 1], notes: ["C", "F", "A", "F"] }
    ],
    "Minor": [
      { key: "F", type: "Minor", name: "F Minor", frets: [1, 3, 3, 1], notes: ["Ab", "F", "C", "F"] }
    ],
    "7": [
      { key: "F", type: "7", name: "F7", frets: [2, 1, 3, 1], notes: ["A", "Eb", "C", "F"] }
    ]
  },
  "F#": {
    "Major": [
      { key: "F#", type: "Major", name: "F# Major", frets: [3, 4, 1, 2], notes: ["A#", "F#", "A#", "F#"] }
    ],
    "Minor": [
      { key: "F#", type: "Minor", name: "F# Minor", frets: [2, 4, 4, 2], notes: ["A", "F#", "C#", "F#"] }
    ],
    "7": [
      { key: "F#", type: "7", name: "F#7", frets: [3, 2, 4, 2], notes: ["A#", "E", "C#", "F#"] }
    ]
  },
  "G": {
    "Major": [
      { key: "G", type: "Major", name: "G Major", frets: [0, 0, 2, 3], notes: ["G", "D", "B", "G"] },
      { key: "G", type: "Major", name: "G Major (Chop)", frets: [7, 5, 2, 3], notes: ["D", "B", "G", "G"] }
    ],
    "Minor": [
      { key: "G", type: "Minor", name: "G Minor", frets: [0, 0, 1, 3], notes: ["G", "D", "Bb", "G"] }
    ],
    "7": [
      { key: "G", type: "7", name: "G7", frets: [0, 0, 2, 1], notes: ["G", "D", "B", "F"] }
    ]
  },
  "G#": {
    "Major": [
      { key: "G#", type: "Major", name: "Ab/G# Major", frets: [5, 1, 3, 4], notes: ["C", "Eb", "C", "Ab"] }
    ],
    "Minor": [
      { key: "G#", type: "Minor", name: "Abm/G#m", frets: [4, 1, 2, 4], notes: ["B", "Eb", "B", "Ab"] }
    ],
    "7": [
      { key: "G#", type: "7", name: "Ab7/G#7", frets: [5, 1, 3, 2], notes: ["C", "Eb", "Gb", "Ab"] }
    ]
  },
  "A": {
    "Major": [
      { key: "A", type: "Major", name: "A Major", frets: [2, 2, 0, 0], notes: ["A", "E", "A", "E"] },
      { key: "A", type: "Major", name: "A Major (Full)", frets: [2, 2, 4, 5], notes: ["A", "E", "C#", "A"] }
    ],
    "Minor": [
      { key: "A", type: "Minor", name: "A Minor", frets: [2, 2, 3, 0], notes: ["A", "E", "C", "E"] }
    ],
    "7": [
      { key: "A", type: "7", name: "A7", frets: [2, 2, 0, 3], notes: ["A", "E", "A", "G"] }
    ]
  },
  "A#": {
    "Major": [
      { key: "A#", type: "Major", name: "Bb/A# Major", frets: [3, 0, 1, 1], notes: ["Bb", "D", "Bb", "F"] }
    ],
    "Minor": [
      { key: "A#", type: "Minor", name: "Bbm/A#m", frets: [3, 3, 4, 1], notes: ["Bb", "F", "Db", "F"] }
    ],
    "7": [
      { key: "A#", type: "7", name: "Bb7/A#7", frets: [3, 0, 1, 4], notes: ["Bb", "D", "Bb", "Ab"] }
    ]
  },
  "B": {
    "Major": [
      { key: "B", type: "Major", name: "B Major", frets: [4, 1, 2, 2], notes: ["B", "D#", "B", "F#"] }
    ],
    "Minor": [
      { key: "B", type: "Minor", name: "B Minor", frets: [4, 0, 2, 2], notes: ["B", "D", "B", "F#"] }
    ],
    "7": [
      { key: "B", type: "7", name: "B7", frets: [4, 1, 2, 5], notes: ["B", "D#", "A", "F#"] }
    ]
  }
};

// Double-stop definitions for the key. Double stops are 2-note pairings.
// Each double-stop is represented by [stringIndex1, fret1, stringIndex2, fret2].
// String indices are 0: G, 1: D, 2: A, 3: E.
export interface DoubleStop {
  key: string;
  name: string; // e.g. "I Degree (C-E)"
  strings: [number, number]; // e.g. [0, 1] means G and D strings
  frets: [number, number];   // e.g. [5, 2] -> G string fret 5 (C) and D string fret 2 (E)
  notes: [string, string];
}

export const DOUBLE_STOPS_BY_KEY: Record<string, DoubleStop[]> = {
  "C": [
    { key: "C", name: "I - C & E (C Major Root)", strings: [0, 1], frets: [5, 2], notes: ["C", "E"] },
    { key: "C", name: "IV - F & A (F Major)", strings: [0, 1], frets: [2, 3], notes: ["A", "F"] },
    { key: "C", name: "V - G & B (G Major)", strings: [0, 1], frets: [0, 4], notes: ["G", "B"] },
    { key: "C", name: "I - E & G (High C Major)", strings: [1, 2], frets: [2, 5], notes: ["E", "D"] }, // Simplified
    { key: "C", name: "I - C & G (Root-Fifth)", strings: [2, 3], frets: [3, 3], notes: ["C", "G"] }
  ],
  "G": [
    { key: "G", name: "I - G & B (G Major Root)", strings: [0, 1], frets: [0, 4], notes: ["G", "B"] },
    { key: "G", name: "IV - C & E (C Major)", strings: [0, 1], frets: [5, 2], notes: ["C", "E"] },
    { key: "G", name: "V - D & F# (D Major)", strings: [1, 2], frets: [0, 4], notes: ["D", "F#"] },
    { key: "G", name: "I - B & D (G Major)", strings: [1, 2], frets: [4, 5], notes: ["B", "D"] }
  ],
  "D": [
    { key: "D", name: "I - D & F# (D Major Root)", strings: [1, 2], frets: [0, 4], notes: ["D", "F#"] },
    { key: "D", name: "IV - G & B (G Major)", strings: [0, 1], frets: [0, 4], notes: ["G", "B"] },
    { key: "D", name: "V - A & C# (A Major)", strings: [2, 3], frets: [0, 4], notes: ["A", "C#"] }
  ],
  "A": [
    { key: "A", name: "I - A & C# (A Major Root)", strings: [2, 3], frets: [0, 4], notes: ["A", "C#"] },
    { key: "A", name: "IV - D & F# (D Major)", strings: [1, 2], frets: [0, 4], notes: ["D", "F#"] },
    { key: "A", name: "V - E & G# (E Major)", strings: [1, 2], frets: [2, 6], notes: ["E", "G#"] }
  ],
  "F": [
    { key: "F", name: "I - F & A (F Major Root)", strings: [0, 1], frets: [2, 3], notes: ["A", "F"] },
    { key: "F", name: "IV - Bb & D (Bb Major)", strings: [0, 1], frets: [3, 0], notes: ["Bb", "D"] },
    { key: "F", name: "V - C & E (C Major)", strings: [0, 1], frets: [5, 2], notes: ["C", "E"] }
  ]
};

// Generic generator for double stops if not explicitly declared
export function generateDoubleStopsForScale(root: string, scaleName: string): DoubleStop[] {
  // Let's return the explicitly defined ones if available, otherwise a nice subset
  if (DOUBLE_STOPS_BY_KEY[root]) {
    return DOUBLE_STOPS_BY_KEY[root];
  }
  // Generic fallback: root-third, root-fifth on standard strings
  const chromaticRootIdx = CHROMATIC_NOTES.indexOf(root);
  const thirdIdx = (chromaticRootIdx + 4) % 12;
  const fifthIdx = (chromaticRootIdx + 7) % 12;
  
  const rootNote = CHROMATIC_NOTES[chromaticRootIdx];
  const thirdNote = CHROMATIC_NOTES[thirdIdx];
  const fifthNote = CHROMATIC_NOTES[fifthIdx];
  
  return [
    { key: root, name: `Root & Third (${rootNote}-${thirdNote})`, strings: [0, 1], frets: [5, 2], notes: [rootNote, thirdNote] },
    { key: root, name: `Root & Fifth (${rootNote}-${fifthNote})`, strings: [2, 3], frets: [3, 3], notes: [rootNote, fifthNote] }
  ];
}

/**
 * Calculates note at a given fret on a string with standard base note.
 * e.g., baseNote = "G3", fret = 5 => Note "C4"
 */
export function getNoteAtFret(baseNote: string, fret: number): { name: string; octave: number } {
  // Extract note name and octave
  const match = baseNote.match(/^([A-G]#?)([0-9])$/);
  if (!match) return { name: "C", octave: 4 };
  
  const noteName = match[1];
  const startOctave = parseInt(match[2], 10);
  
  const startIndex = CHROMATIC_NOTES.indexOf(noteName);
  const targetIndex = (startIndex + fret) % 12;
  
  // Calculate octave shift
  const octavesShifted = Math.floor((startIndex + fret) / 12);
  const targetOctave = startOctave + octavesShifted;
  
  return {
    name: CHROMATIC_NOTES[targetIndex],
    octave: targetOctave
  };
}

// Convert absolute MIDI/fret number to Hz frequency for playback
export function getFrequencyForNote(noteName: string, octave: number): number {
  const noteIndex = CHROMATIC_NOTES.indexOf(noteName);
  // A4 is MIDI 69, which is 440 Hz. Let's calculate distance from A4
  // A4 corresponds to octave 4, noteIndex 9.
  const a4Index = 9 + 4 * 12;
  const targetIndex = noteIndex + octave * 12;
  const distance = targetIndex - a4Index;
  return 440 * Math.pow(2, distance / 12);
}
