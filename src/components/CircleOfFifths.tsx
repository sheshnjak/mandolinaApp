/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { CHROMATIC_NOTES } from "../types";
import { TRANSLATIONS } from "../translations";

interface CircleOfFifthsProps {
  activeRoot: string;
  activeScaleName: string;
  onSelectKey: (root: string, scaleName: string) => void;
  language?: "hr" | "en";
}

interface Wedge {
  major: string;
  minor: string;
  sharpsFlats: string;
  label: string;
}

// Ordered clockwise starting from C Major at the top (12 o'clock)
const WEDGES: Wedge[] = [
  { major: "C", minor: "A", sharpsFlats: "C", label: "0" },
  { major: "G", minor: "E", sharpsFlats: "G", label: "1 ♯" },
  { major: "D", minor: "B", sharpsFlats: "D", label: "2 ♯" },
  { major: "A", minor: "F#", sharpsFlats: "A", label: "3 ♯" },
  { major: "E", minor: "C#", sharpsFlats: "E", label: "4 ♯" },
  { major: "B", minor: "G#", sharpsFlats: "B", label: "5 ♯" },
  { major: "F#", minor: "D#", sharpsFlats: "F#", label: "6 ♯ / 6 ♭" },
  { major: "C#", minor: "A#", sharpsFlats: "C#", label: "7 ♯ / 5 ♭" },
  { major: "G#", minor: "F", sharpsFlats: "G#", label: "4 ♭" },
  { major: "D#", minor: "C", sharpsFlats: "D#", label: "3 ♭" },
  { major: "A#", minor: "G", sharpsFlats: "A#", label: "2 ♭" },
  { major: "F", minor: "D", sharpsFlats: "F", label: "1 ♭" }
];

export const CircleOfFifths: React.FC<CircleOfFifthsProps> = ({
  activeRoot,
  activeScaleName,
  onSelectKey,
  language = "hr"
}) => {
  const t = TRANSLATIONS[language];
  const size = 300;
  const center = size / 2;
  const rOuter = 135;
  const rMid = 92;
  const rInner = 58;
  const rCore = 34;

  // Converts polar coordinates to Cartesian
  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians)
    };
  };

  // Helper to generate path for an SVG arc segment (wedge)
  const describeArcSegment = (
    x: number,
    y: number,
    innerRadius: number,
    outerRadius: number,
    startAngle: number,
    endAngle: number
  ) => {
    const startOuter = polarToCartesian(x, y, outerRadius, endAngle);
    const endOuter = polarToCartesian(x, y, outerRadius, startAngle);
    const startInner = polarToCartesian(x, y, innerRadius, endAngle);
    const endInner = polarToCartesian(x, y, innerRadius, startAngle);

    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    return [
      "M", startOuter.x, startOuter.y,
      "A", outerRadius, outerRadius, 0, largeArcFlag, 0, endOuter.x, endOuter.y,
      "L", endInner.x, endInner.y,
      "A", innerRadius, innerRadius, 0, largeArcFlag, 1, startInner.x, startInner.y,
      "Z"
    ].join(" ");
  };

  const handleSegmentClick = (note: string, isMinor: boolean) => {
    const targetScale = isMinor ? "Natural Minor" : "Major";
    onSelectKey(note, targetScale);
  };

  // Find the wedge index of the active key to highlight its diatonic family/group
  const activeWedgeIdx = WEDGES.findIndex(w => 
    activeScaleName === "Major" ? w.major === activeRoot : w.minor === activeRoot
  );

  const isWedgeInGroup = (idx: number) => {
    if (activeWedgeIdx === -1) return false;
    const diff = (idx - activeWedgeIdx + 12) % 12;
    return diff === 0 || diff === 1 || diff === 11;
  };

  return (
    <div className="flex flex-col items-center w-full max-w-sm mx-auto select-none">
      <div className="relative flex items-center justify-center w-full" style={{ height: "300px" }}>
        <svg width={size} height={size} className="overflow-visible drop-shadow-2xl">
          {/* Defs for gradients and filters */}
          <defs>
            <radialGradient id="glow-grad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#F27D26" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#050505" stopOpacity="0" />
            </radialGradient>
            <filter id="shadow">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.5" />
            </filter>
          </defs>

          {/* Ambient center glow */}
          <circle cx={center} cy={center} r={rOuter + 8} fill="url(#glow-grad)" />

          {/* Outer circle frame */}
          <circle cx={center} cy={center} r={rOuter} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          <circle cx={center} cy={center} r={rMid} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
          <circle cx={center} cy={center} r={rInner} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />

          {/* Draw wedges */}
          {WEDGES.map((wedge, idx) => {
            const angleStep = 360 / 12;
            const startAngle = idx * angleStep - angleStep / 2;
            const endAngle = (idx + 1) * angleStep - angleStep / 2;
            const midAngle = idx * angleStep;

            const isWedgeActive = idx === activeWedgeIdx;
            const inGroup = isWedgeInGroup(idx);

            const isMajorActive = activeRoot === wedge.major && activeScaleName === "Major";
            const isMinorActive = activeRoot === wedge.minor && activeScaleName === "Natural Minor";

            // Cohesive high-fidelity diatonic group highlighting
            const isMajorInGroup = inGroup;
            const majorFill = isMajorActive 
              ? "rgba(242, 125, 38, 0.42)" 
              : isMajorInGroup 
                ? "rgba(242, 125, 38, 0.20)" 
                : "transparent";
            const majorStroke = isMajorActive 
              ? "#F27D26" 
              : isMajorInGroup 
                ? "rgba(242, 125, 38, 0.60)" 
                : "rgba(255, 255, 255, 0.03)";
            const majorStrokeWidth = isMajorActive ? 1.8 : isMajorInGroup ? 1.2 : 0.5;

            const isMinorInGroup = inGroup;
            const minorFill = isMinorActive 
              ? "rgba(242, 125, 38, 0.36)" 
              : isMinorInGroup 
                ? "rgba(242, 125, 38, 0.16)" 
                : "transparent";
            const minorStroke = isMinorActive 
              ? "#F27D26" 
              : isMinorInGroup 
                ? "rgba(242, 125, 38, 0.50)" 
                : "rgba(255, 255, 255, 0.03)";
            const minorStrokeWidth = isMinorActive ? 1.5 : isMinorInGroup ? 0.9 : 0.5;

            // Make group notes pop beautifully, dim the others
            const majorTextFill = isMajorActive
              ? "#F27D26"
              : isMajorInGroup
                ? "rgba(255, 255, 255, 0.98)"
                : "rgba(255, 255, 255, 0.18)";

            const minorTextFill = isMinorActive
              ? "#F27D26"
              : isMinorInGroup
                ? "rgba(255, 255, 255, 0.88)"
                : "rgba(255, 255, 255, 0.12)";

            // Coords for labels
            const posOuterLabel = polarToCartesian(center, center, (rOuter + rMid) / 2, midAngle);
            const posInnerLabel = polarToCartesian(center, center, (rMid + rInner) / 2, midAngle);
            const posSignatures = polarToCartesian(center, center, rOuter + 14, midAngle);

            return (
              <g key={idx} className="transition-all duration-200">
                {/* Outer Wedge (Major Keys) */}
                <path
                  d={describeArcSegment(center, center, rMid, rOuter, startAngle, endAngle)}
                  fill={majorFill}
                  stroke={majorStroke}
                  strokeWidth={majorStrokeWidth}
                  className="cursor-pointer hover:fill-white/5 transition-colors"
                  onClick={() => handleSegmentClick(wedge.major, false)}
                />

                {/* Inner Wedge (Minor Keys) */}
                <path
                  d={describeArcSegment(center, center, rInner, rMid, startAngle, endAngle)}
                  fill={minorFill}
                  stroke={minorStroke}
                  strokeWidth={minorStrokeWidth}
                  className="cursor-pointer hover:fill-white/5 transition-colors"
                  onClick={() => handleSegmentClick(wedge.minor, true)}
                />

                {/* Key Labels */}
                <text
                  x={posOuterLabel.x}
                  y={posOuterLabel.y + 4}
                  textAnchor="middle"
                  fill={majorTextFill}
                  className={`text-xs select-none pointer-events-none font-sans font-bold`}
                >
                  {wedge.major}
                </text>

                <text
                  x={posInnerLabel.x}
                  y={posInnerLabel.y + 3}
                  textAnchor="middle"
                  fill={minorTextFill}
                  className="text-[10px] select-none pointer-events-none font-sans font-medium"
                >
                  {wedge.minor}m
                </text>

                {/* Key Signatures (Sharps and Flats) */}
                {wedge.label !== "0" && (
                  <text
                    x={posSignatures.x}
                    y={posSignatures.y + 3}
                    textAnchor="middle"
                    fill={inGroup ? "rgba(255, 255, 255, 0.40)" : "rgba(255, 255, 255, 0.10)"}
                    className="text-[8px] font-mono select-none pointer-events-none"
                  >
                    {wedge.label}
                  </text>
                )}

                {/* Key signature visual tags in the background inner edge */}
                {idx % 3 === 0 && (
                  <circle
                    cx={polarToCartesian(center, center, rInner - 8, midAngle).x}
                    cy={polarToCartesian(center, center, rInner - 8, midAngle).y}
                    r="1.5"
                    fill={inGroup ? "rgba(242, 125, 38, 0.40)" : "rgba(255, 255, 255, 0.15)"}
                    className="pointer-events-none"
                  />
                )}
              </g>
            );
          })}

          {/* Core Center Disk (holds signature info) */}
          <circle
            cx={center}
            cy={center}
            r={rCore}
            fill="#050505"
            stroke="#F27D26"
            strokeWidth="2"
            filter="url(#shadow)"
          />

          {/* Selected status labels in central disk */}
          <text x={center} y={center - 10} textAnchor="middle" fill="rgba(255,255,255,0.3)" className="text-[8px] font-mono tracking-widest uppercase">
            {t["circle_active"]}
          </text>
          <text x={center} y={center + 8} textAnchor="middle" fill="#F27D26" className="text-sm font-black font-sans tracking-tight">
            {activeRoot}
          </text>
          <text x={center} y={center + 20} textAnchor="middle" fill="rgba(255,255,255,0.5)" className="text-[8px] font-medium font-sans">
            {activeScaleName === "Major" ? t["circle_major"] : t["circle_minor"]}
          </text>
        </svg>
      </div>
    </div>
  );
};
