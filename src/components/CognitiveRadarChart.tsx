import React from "react";

interface CognitiveRadarChartProps {
  mbti: string;
  stress: number;   // 0 - 100
  morale: number;   // 0 - 100
  characterName: string;
}

// Order of the 8 cognitive functions around the radar wheel:
// 1. Te (Extraverted Thinking)
// 2. Ne (Extraverted Intuition)
// 3. Se (Extraverted Sensing)
// 4. Fe (Extraverted Feeling)
// 5. Fi (Introverted Feeling)
// 6. Si (Introverted Sensing)
// 7. Ni (Introverted Intuition)
// 8. Ti (Introverted Thinking)
const FUNCTION_NAMES = ["Te", "Ne", "Se", "Fe", "Fi", "Si", "Ni", "Ti"];

const FUNCTION_LABELS: Record<string, { label: string; desc: string }> = {
  Te: { label: "外倾思维 Te", desc: "逻辑组织、客观决策与高效执行" },
  Ne: { label: "外倾直觉 Ne", desc: "头脑风暴、发散联想与可能性探索" },
  Se: { label: "外倾感觉 Se", desc: "当下行动、现实感知与危机应变" },
  Fe: { label: "外倾情感 Fe", desc: "群体共鸣、关系维系与共识寻求" },
  Fi: { label: "内倾情感 Fi", desc: "核心价值、道德自洽与内心信念" },
  Si: { label: "内倾感觉 Si", desc: "经验留存、细节严谨与规章秩序" },
  Ni: { label: "内倾直觉 Ni", desc: "深度洞察、格局趋势与未来预见" },
  Ti: { label: "内倾思维 Ti", desc: "原理剖析、精准定义与内部架构" },
};

// Base profiles of MBTI types present in the meeting: ENTJ, ENFP, ISTJ, ENTP, ISFJ, INTJ
// Base values for Dominant (90), Auxiliary (75), Tertiary (55), Inferior (30).
// Shadow functions get lower baseline ranges.
const BASE_PROFILES: Record<string, Record<string, number>> = {
  ENTJ: { Te: 92, Ni: 80, Se: 60, Fi: 25, Ti: 50, Ne: 45, Fe: 35, Si: 20 },
  ENFP: { Ne: 92, Fi: 82, Te: 60, Si: 25, Ni: 50, Fe: 55, Ti: 35, Se: 40 },
  ISTJ: { Si: 92, Te: 80, Fi: 60, Ne: 25, Se: 45, Ti: 50, Fe: 30, Ni: 35 },
  ENTP: { Ne: 92, Ti: 82, Fe: 60, Si: 25, Ni: 50, Te: 55, Fi: 35, Se: 45 },
  ISFJ: { Si: 92, Fe: 82, Ti: 60, Ne: 25, Se: 45, Fi: 50, Te: 30, Ni: 35 },
  INTJ: { Ni: 92, Te: 82, Fi: 60, Se: 25, Ne: 50, Ti: 55, Fe: 30, Si: 45 },
};

export default function CognitiveRadarChart({ mbti, stress, morale, characterName }: CognitiveRadarChartProps) {
  // Safe fallback profile
  const profileMbti = BASE_PROFILES[mbti.toUpperCase()] ? mbti.toUpperCase() : "ENTJ";
  const baseData = BASE_PROFILES[profileMbti];

  // Dynamically calculate actual values under pressure/morale conditions:
  // - High stress causes "grip" where inferior function acts erratically (sometimes spikes in defensive/unhealthy ways, or crashes).
  //   And dominant function over-asserts (increases, tunnel-vision).
  // - Low morale decreases cooperative functions like Fe or Te, and increases defensive functions.
  const dynamicData: Record<string, number> = {};
  
  // Find dominant, aux, tertiary, inferior functions for this type
  // Sorted by base value to find hierarchy
  const hierarchy = Object.entries(baseData).sort((a, b) => b[1] - a[1]);
  const domFunc = hierarchy[0][0];
  const auxFunc = hierarchy[1][0];
  const tertFunc = hierarchy[2][0];
  const infFunc = hierarchy[3][0];

  FUNCTION_NAMES.forEach((f) => {
    let value = baseData[f];

    // High stress dynamic adjustments
    if (stress > 65) {
      if (f === domFunc) {
        // Dominant function over-asserts and becomes hyper-activated (tunnel-vision)
        value = Math.min(100, value + (stress - 65) * 0.25);
      } else if (f === auxFunc) {
        // Auxiliary function drops as stress reduces cognitive balance
        value = Math.max(30, value - (stress - 65) * 0.3);
      } else if (f === infFunc) {
        // Inferior function "grip" state: spikes erratically as defensive stress response
        value = Math.min(95, value + (stress - 65) * 0.7);
      } else {
        // Other shadow functions fluctuate slightly downwards
        value = Math.max(15, value - 5);
      }
    }

    // Morale dynamic adjustments
    if (morale < 45) {
      const drop = (45 - morale) * 0.3;
      if (f === "Fe" || f === "Te") {
        // Extroverted judging cooperative functions decline when morale is low (passive-aggressive)
        value = Math.max(20, value - drop);
      } else if (f === "Fi" || f === "Ti") {
        // Introverted judging functions over-rationalize or lock up inward
        value = Math.min(100, value + drop * 0.5);
      }
    } else if (morale > 75) {
      const bonus = (morale - 75) * 0.2;
      if (f === domFunc || f === auxFunc) {
        // Positive boost for top cognitive channels
        value = Math.min(100, value + bonus);
      }
    }

    dynamicData[f] = Math.round(value);
  });

  // Radar layout configuration
  const size = 220;
  const center = size / 2;
  const radius = size * 0.38; // Max radius length

  const getCoordinates = (index: number, val: number) => {
    // 0 index is top (angle -Math.PI / 2)
    const angle = (index * (2 * Math.PI)) / 8 - Math.PI / 2;
    const r = (val / 100) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  // Generate SVG points string
  const pointsCurrent = FUNCTION_NAMES.map((f, i) => {
    const { x, y } = getCoordinates(i, dynamicData[f]);
    return `${x},${y}`;
  }).join(" ");

  const pointsBase = FUNCTION_NAMES.map((f, i) => {
    const { x, y } = getCoordinates(i, baseData[f]);
    return `${x},${y}`;
  }).join(" ");

  // Grid levels (25%, 50%, 75%, 100%)
  const gridLevels = [25, 50, 75, 100];

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 relative overflow-hidden animate-fadeIn">
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <span className="text-pink-400">📊</span>
          认知功能雷达 / Cognitive Function Radar
        </h3>
        <span className="text-[9.5px] font-mono text-slate-500 bg-slate-950/50 px-1.5 py-0.5 rounded border border-slate-850">
          基于 MBTI 动态演算
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 justify-between">
        {/* Radar SVG */}
        <div className="relative flex-shrink-0 select-none">
          <svg width={size} height={size} className="overflow-visible">
            {/* Concentric grid octagons */}
            {gridLevels.map((lvl) => {
              const pts = Array.from({ length: 8 })
                .map((_, i) => {
                  const angle = (i * (2 * Math.PI)) / 8 - Math.PI / 2;
                  const r = (lvl / 100) * radius;
                  const x = center + r * Math.cos(angle);
                  const y = center + r * Math.sin(angle);
                  return `${x},${y}`;
                })
                .join(" ");

              return (
                <g key={lvl}>
                  <polygon
                    points={pts}
                    fill="none"
                    stroke="#334155"
                    strokeWidth="0.75"
                    strokeDasharray={lvl === 100 ? "0" : "2,2"}
                  />
                  {/* Grid level text indicator */}
                  <text
                    x={center}
                    y={center - (lvl / 100) * radius + 8}
                    textAnchor="middle"
                    fill="#475569"
                    fontSize="8"
                    fontFamily="monospace"
                  >
                    {lvl}%
                  </text>
                </g>
              );
            })}

            {/* Axes / Spokes */}
            {FUNCTION_NAMES.map((f, i) => {
              const angle = (i * (2 * Math.PI)) / 8 - Math.PI / 2;
              const outerX = center + radius * Math.cos(angle);
              const outerY = center + radius * Math.sin(angle);
              
              // Text label placement (extended slightly outward)
              const labelRadius = radius + 15;
              const labelX = center + labelRadius * Math.cos(angle);
              const labelY = center + labelRadius * Math.sin(angle);

              // Determine alignment for label
              let textAnchor = "middle";
              if (Math.cos(angle) > 0.1) textAnchor = "start";
              else if (Math.cos(angle) < -0.1) textAnchor = "end";

              return (
                <g key={f}>
                  {/* Axis Line */}
                  <line
                    x1={center}
                    y1={center}
                    x2={outerX}
                    y2={outerY}
                    stroke="#1e293b"
                    strokeWidth="1"
                  />
                  {/* Axis Label */}
                  <text
                    x={labelX}
                    y={labelY + 3} // vertical centering correction
                    textAnchor={textAnchor}
                    fill={
                      f === domFunc
                        ? "#f472b6" // Dominant: pink
                        : f === auxFunc
                        ? "#a78bfa" // Aux: purple
                        : f === infFunc
                        ? "#60a5fa" // Inferior: blue
                        : "#94a3b8" // Others: gray
                    }
                    fontSize="10"
                    fontWeight={f === domFunc ? "bold" : "medium"}
                    fontFamily="monospace"
                  >
                    {f}
                  </text>
                </g>
              );
            })}

            {/* Default/Ideal Baseline Profile (Dashed Line) */}
            <polygon
              points={pointsBase}
              fill="none"
              stroke="#64748b"
              strokeWidth="1"
              strokeDasharray="3,3"
              strokeOpacity={0.6}
            />

            {/* Current Pressure-distorted Profile (Solid Area with glow) */}
            <polygon
              points={pointsCurrent}
              fill="url(#radar-gradient)"
              fillOpacity={0.3}
              stroke="#f472b6"
              strokeWidth="2"
              className="transition-all duration-500"
            />

            {/* Definitions for gradient and filters */}
            <defs>
              <radialGradient id="radar-gradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ec4899" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#ec4899" stopOpacity="0.6" />
              </radialGradient>
            </defs>

            {/* Vertices indicator dots */}
            {FUNCTION_NAMES.map((f, i) => {
              const { x, y } = getCoordinates(i, dynamicData[f]);
              const isDom = f === domFunc;
              const isInf = f === infFunc;
              return (
                <circle
                  key={f}
                  cx={x}
                  cy={y}
                  r={isDom ? 4.5 : 3.5}
                  fill={isDom ? "#ec4899" : isInf ? "#3b82f6" : "#a78bfa"}
                  stroke="#0b0f19"
                  strokeWidth="1"
                  className="transition-all duration-500"
                />
              );
            })}
          </svg>
        </div>

        {/* Dynamic function breakdown details */}
        <div className="flex-1 min-w-0 w-full space-y-2 text-xs">
          <div className="text-[11px] text-slate-400 font-semibold mb-1">
            🔍 MBTI 认知层次解读:
          </div>
          
          <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px]">
            <div className="bg-slate-950/30 p-1.5 rounded border border-slate-850/40">
              <span className="text-pink-400 font-bold">主导功能 ({domFunc}):</span>
              <div className="text-slate-300 truncate mt-0.5" title={FUNCTION_LABELS[domFunc].desc}>
                {domFunc} ({dynamicData[domFunc]}%) - {stress > 65 ? "超负荷过载" : "会议核心驱动"}
              </div>
            </div>
            <div className="bg-slate-950/30 p-1.5 rounded border border-slate-850/40">
              <span className="text-blue-400 font-bold">劣势功能 ({infFunc}):</span>
              <div className="text-slate-300 truncate mt-0.5" title={FUNCTION_LABELS[infFunc].desc}>
                {infFunc} ({dynamicData[infFunc]}%) - {stress > 65 ? "阴影执念/压力失控" : "常规隐藏特质"}
              </div>
            </div>
          </div>

          <div className="space-y-1 mt-1 text-[10px] leading-relaxed text-slate-400 max-h-[100px] overflow-y-auto pr-1 custom-scrollbar">
            {hierarchy.slice(0, 4).map(([f]) => (
              <div key={f} className="flex gap-1.5 items-start">
                <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${f === domFunc ? "bg-pink-400" : f === auxFunc ? "bg-purple-400" : "bg-indigo-400"}`}></span>
                <div>
                  <strong className="text-slate-300 font-mono text-[10.5px]">{FUNCTION_LABELS[f].label}</strong>: {FUNCTION_LABELS[f].desc}
                  <span className="text-[9.5px] text-slate-500 ml-1 font-mono">({dynamicData[f]}%)</span>
                </div>
              </div>
            ))}
          </div>

          <p className="text-[9.5px] text-slate-500 italic mt-1 bg-slate-950/20 px-2 py-1.5 rounded border border-slate-850/30">
            {stress > 65 
              ? `⚠️ ${characterName} 处于高度压力状态！其主导功能 ${domFunc} 表现出极度隧道思维，劣势功能 ${infFunc} 出现非理性爆发，决策灵活度极度受限。`
              : `💡 当前心境平和，八大认知功能运转和谐，能够理性而富有弹性的权衡各项利益与主张。`}
          </p>
        </div>
      </div>
    </div>
  );
}
