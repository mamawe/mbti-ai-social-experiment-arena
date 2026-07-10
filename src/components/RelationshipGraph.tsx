import React, { useMemo, useState } from "react";
import { Character, Relationship } from "../types";

interface RelationshipGraphProps {
  characters: Character[];
  relationships: Relationship[];
  selectedCharacterId: string | null;
  onSelectCharacter: (id: string) => void;
}

interface CompatibilityDetail {
  score: number;      // Conflict score 0-100 (where 100 means extreme conflict, 0 means perfect harmony)
  level: "极高" | "较高" | "中等" | "温和" | "极低"; // Conflict level
  desc: string;       // Dynamic explanation
}

export function getMbtiCompatibility(mbtiA: string, mbtiB: string): CompatibilityDetail {
  const typeA = mbtiA.toUpperCase();
  const typeB = mbtiB.toUpperCase();
  
  if (typeA === typeB) {
    return { score: 15, level: "极低", desc: "相同性格类型。拥有极高的天然认同感与工作节奏，但在思维盲区上容易重叠、缺乏制衡。" };
  }
  
  const key = [typeA, typeB].sort().join("-");
  
  const map: Record<string, CompatibilityDetail> = {
    // Louis (ENTJ) mappings
    "ENFP-ENTJ": { score: 65, level: "较高", desc: "主导Te与主导Ne的碰撞。ENTJ注重绝对结果与组织效率，而ENFP强调个人价值观与创意可能，极易在执行细节中产生理念撕裂。" },
    "ENTJ-ISTJ": { score: 40, level: "中等", desc: "均属理性实干派。ENTJ着眼未来战略转型(Ni)，ISTJ着眼当下经验稳健(Si)。虽然决策标准一致，但在方向和变通性上会有不合。" },
    "ENTP-ENTJ": { score: 50, level: "中等", desc: "智力交锋频繁。ENTP喜欢不断发散、质疑框架，而ENTJ倾向迅速收敛、形成决策路线。易在『只说不做』与『独断专行』间发生争执。" },
    "ENTJ-ISFJ": { score: 85, level: "极高", desc: "功能轴完全错位。ENTJ的铁腕逻辑与战略推进，会极大地踩痛并无视ISFJ的温和情感需求与秩序底线，是高管层中最致命的裂痕隐患。" },
    "ENTJ-INTJ": { score: 20, level: "极低", desc: "极高相容性。同属Te-Ni轴，共享长远目光与严密逻辑，无需多言即可在变革布局与业务精简上达成深度战略默契。" },
    
    // Emily (ENFP) mappings
    "ENFP-ISTJ": { score: 75, level: "极高", desc: "经典的对立。ENFP的跳跃思维与规则蔑视，会让严谨、按部就班的ISTJ感到失控与崩溃；而ISTJ的保守纠偏则会让ENFP感到创意窒息。" },
    "ENFP-ENTP": { score: 30, level: "温和", desc: "同属Ne主导的创意狂人，话题丰富度高。不过在涉及裁员与执行底牌等现实冰冷话题时，情感(Fi)与逻辑(Ti)可能分道扬镳。" },
    "ENFP-ISFJ": { score: 45, level: "中等", desc: "关系较为温和。两者都具备充沛的同理心，但ISFJ希望稳固现状、守序执着，而ENFP渴望激进探索，常引发前进方向上的温和拉扯。" },
    "ENFP-INTJ": { score: 25, level: "极低", desc: "经典的灵感伴侣（Ne-Ni/Fi-Te互补）。ENFP能用丰富的愿景启发INTJ，而INTJ的深邃逻辑则能将ENFP的发散构想完美落实。理论配合度极佳。" },
    
    // Ian (ISTJ) mappings
    "ENTP-ISTJ": { score: 90, level: "极高", desc: "终极认知冲突。ISTJ恪守经验、厌恶不确定风险，而ENTP以打破既有规章、拥抱混乱与重构为乐。两人在决策方法论上势同水火。" },
    "ISFJ-ISTJ": { score: 20, level: "极低", desc: "同属于稳重型执行者。共享Si主导带来的细致与务实，虽然在重大人事（裁员）上因思考/情感取向略有分歧，但彼此工作节奏高度舒适。" },
    "INTJ-ISTJ": { score: 35, level: "温和", desc: "务实而理性的合作关系。INTJ的系统思考和ISTJ的执行严谨能完美对接，唯一的分歧在于是否需要为了远景(Ni)打破当下业务(Si)。" },
    
    // Ethan (ENTP) mappings
    "ENTP-ISFJ": { score: 80, level: "极高", desc: "认知反向冲突。ENTP为了解构而不断试探底线，这让以安全感、团队和谐与保守规矩为首要信条的ISFJ面临极大的心理防御，火药味极浓。" },
    "ENTP-INTJ": { score: 35, level: "温和", desc: "高质量智力搭档。Ne的发散可能性和Ni的收敛穿透力能产生强烈化学反应，但在具体立场的『精细化』与『颠覆性』上偶有激烈争鸣。" },
    
    // Ivy (ISFJ) mappings
    "INTJ-ISFJ": { score: 60, level: "较高", desc: "逻辑与温情的内在对立。INTJ的冰冷重组、出售建议(Te)会严重威胁到ISFJ誓死守护的『团队温度与员工忠诚度』(Fe)，构成暗流涌动的价值抗衡。" },
  };
  
  return map[key] || { score: 50, level: "中等", desc: "中等兼容，在决策导向上能有局部互补，但在压力下需要注意沟通摩擦。" };
}

export default function RelationshipGraph({
  characters,
  relationships,
  selectedCharacterId,
  onSelectCharacter,
}: RelationshipGraphProps) {
  const [viewMode, setViewMode] = useState<"network" | "compatibility">("network");
  const [selectedCell, setSelectedCell] = useState<{ charAId: string; charBId: string } | null>(null);

  // Hexagon layout dimensions
  const width = 360;
  const height = 360;
  const cx = width / 2;
  const cy = height / 2;
  const r = 110; // circle radius

  // Map character ids to their coordinates
  const nodePositions = useMemo(() => {
    const pos: Record<string, { x: number; y: number; angle: number }> = {};
    characters.forEach((char, index) => {
      const angle = (index * 2 * Math.PI) / characters.length - Math.PI / 2;
      pos[char.id] = {
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
        angle,
      };
    });
    return pos;
  }, [characters, cx, cy, r]);

  // Find relationships for the selected/focused node, or show all top relationships if none is selected
  const activeRelationships = useMemo(() => {
    if (selectedCharacterId) {
      return relationships.filter(
        (rel) => rel.from === selectedCharacterId || rel.to === selectedCharacterId
      );
    }
    // If no node selected, show strong relations (Trust > 70 or Resentment > 30)
    return relationships.filter((rel) => rel.trust > 65 || rel.resentment > 30);
  }, [relationships, selectedCharacterId]);

  return (
    <div id="relationship-graph-container" className="flex flex-col items-center justify-center p-4 bg-slate-900/60 rounded-2xl border border-slate-800 backdrop-blur-md shadow-inner relative overflow-hidden w-full">
      {/* Header with Mode Toggle */}
      <div className="w-full flex justify-between items-center mb-3">
        <div className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
          {viewMode === "network" ? "人际关系网图 / Network Graph" : "人格理论冲突热图 / MBTI Compatibility"}
        </div>
        
        <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800">
          <button
            onClick={() => setViewMode("network")}
            className={`px-2 py-1 rounded text-[10px] font-mono transition-all ${
              viewMode === "network"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            关系网
          </button>
          <button
            onClick={() => {
              setViewMode("compatibility");
              // Default select Louis & Emily cell
              if (characters.length >= 2) {
                setSelectedCell({ charAId: characters[0].id, charBId: characters[1].id });
              }
            }}
            className={`px-2 py-1 rounded text-[10px] font-mono transition-all ${
              viewMode === "compatibility"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            人格兼容性
          </button>
        </div>
      </div>

      {viewMode === "network" ? (
        <>
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full max-w-[320px] h-auto select-none"
          >
            {/* Connection Lines */}
            <defs>
              <marker
                id="arrow-green"
                viewBox="0 0 10 10"
                refX="24"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M0,0 L10,5 L0,10 z" fill="#10b981" />
              </marker>
              <marker
                id="arrow-red"
                viewBox="0 0 10 10"
                refX="24"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M0,0 L10,5 L0,10 z" fill="#f43f5e" />
              </marker>
              <marker
                id="arrow-slate"
                viewBox="0 0 10 10"
                refX="24"
                refY="5"
                markerWidth="5"
                markerHeight="5"
                orient="auto-start-reverse"
              >
                <path d="M0,0 L10,5 L0,10 z" fill="#475569" />
              </marker>
            </defs>

            <g>
              {activeRelationships.map((rel, idx) => {
                const start = nodePositions[rel.from];
                const end = nodePositions[rel.to];
                if (!start || !end) return null;

                // Determine relation type
                const isTrust = rel.trust > rel.resentment;
                const intensity = isTrust ? rel.trust : rel.resentment;
                
                // Render beautiful curved or offset lines to prevent overlap
                const midX = (start.x + end.x) / 2;
                const midY = (start.y + end.y) / 2;
                
                // Add a slight curve perpendicular to the line direction
                const dx = end.x - start.x;
                const dy = end.y - start.y;
                const len = Math.sqrt(dx * dx + dy * dy);
                const ux = dx / len;
                const uy = dy / len;
                const offsetDist = selectedCharacterId ? 10 : 15;
                const controlX = midX + uy * offsetDist;
                const controlY = midY - ux * offsetDist;

                // Calculate precise quadratic curve midpoint at t=0.5
                const midCurveX = 0.25 * start.x + 0.5 * controlX + 0.25 * end.x;
                const midCurveY = 0.25 * start.y + 0.5 * controlY + 0.25 * end.y;

                let strokeColor = "#475569"; // grey fallback
                let markerId = "arrow-slate";
                let strokeDash = "0";
                let isDeepCoop = rel.trust >= 70;
                let isHighConflict = rel.resentment >= 60;
                let lineClass = "transition-all duration-300";

                if (isDeepCoop) {
                  strokeColor = "#10b981"; // emerald trust
                  markerId = "arrow-green";
                  lineClass += " animate-flow-line";
                } else if (rel.trust > 65) {
                  strokeColor = "#10b981"; // emerald trust
                  markerId = "arrow-green";
                } else if (isHighConflict) {
                  strokeColor = "#ef4444"; // intense crimson conflict
                  markerId = "arrow-red";
                  strokeDash = "3,3";
                  lineClass += " animate-pulse";
                } else if (rel.resentment > 30) {
                  strokeColor = "#f43f5e"; // rose resentment
                  markerId = "arrow-red";
                  strokeDash = "3,3";
                }

                // Opacity proportional to intensity
                const opacity = Math.min(1.0, Math.max(0.2, intensity / 100));
                const pathD = `M ${start.x} ${start.y} Q ${controlX} ${controlY} ${end.x} ${end.y}`;

                return (
                  <g key={`${rel.from}-${rel.to}-${idx}`}>
                    {/* Glow Background Path for deep coop / high conflict */}
                    {(isDeepCoop || isHighConflict) && (
                      <path
                        d={pathD}
                        fill="none"
                        stroke={isDeepCoop ? "#10b981" : "#ef4444"}
                        strokeWidth={6}
                        strokeOpacity={0.25}
                        className="blur-[1.5px] transition-all duration-300"
                      />
                    )}

                    {/* Main Connection Path */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={selectedCharacterId ? (rel.from === selectedCharacterId ? 2.5 : 1.2) : (isDeepCoop || isHighConflict ? 2 : 1.5)}
                      strokeOpacity={opacity}
                      strokeDasharray={strokeDash}
                      markerEnd={`url(#${markerId})`}
                      className={lineClass}
                    />

                    {/* Floating Interactive Badge at midpoint */}
                    {(isDeepCoop || isHighConflict) && (
                      <g 
                        transform={`translate(${midCurveX}, ${midCurveY})`}
                        className="animate-float-icon cursor-help"
                      >
                        <title>{isDeepCoop ? `深度合作 (信任值 ${rel.trust}%)` : `激烈冲突 (隔阂值 ${rel.resentment}%)`}</title>
                        <circle 
                          r="8.5" 
                          fill="#0b0f19" 
                          stroke={isDeepCoop ? "#10b981" : "#ef4444"} 
                          strokeWidth="1.5" 
                          className="shadow-md"
                        />
                        <text 
                          textAnchor="middle" 
                          dominantBaseline="central" 
                          fontSize="9" 
                          y="0"
                        >
                          {isDeepCoop ? "🤝" : "⚡"}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>

            {/* Character Nodes */}
            <g>
              {characters.map((char) => {
                const pos = nodePositions[char.id];
                if (!pos) return null;

                const isSelected = selectedCharacterId === char.id;
                const stressColorClass = 
                  char.stress > 70 ? "#f43f5e" : char.stress > 40 ? "#f59e0b" : "#10b981";

                return (
                  <g
                    key={char.id}
                    onClick={() => onSelectCharacter(char.id)}
                    className="cursor-pointer group"
                    transform={`translate(${pos.x}, ${pos.y})`}
                  >
                    {/* Outer Stress Ring */}
                    <circle
                      r="24"
                      fill="none"
                      stroke={stressColorClass}
                      strokeWidth="2.5"
                      strokeDasharray="4,2"
                      className={`opacity-80 group-hover:scale-110 transition-transform duration-300 ${char.stress > 70 ? "animate-spin" : ""}`}
                      style={{ transformOrigin: "0px 0px" }}
                    />

                    {/* Inner Hover Glow */}
                    <circle
                      r={isSelected ? "22" : "20"}
                      fill={isSelected ? "#1e293b" : "#0f172a"}
                      stroke={isSelected ? "#38bdf8" : "#334155"}
                      strokeWidth={isSelected ? "2.5" : "1.5"}
                      className="transition-all duration-300"
                    />

                    {/* Character Avatar Emojis */}
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize="20"
                      y="-1"
                    >
                      {char.avatar}
                    </text>

                    {/* Tag Banner */}
                    <g transform="translate(0, 36)">
                      {/* Background rect for name */}
                      <rect
                        x="-35"
                        y="-8"
                        width="70"
                        height="16"
                        rx="4"
                        fill="#1e293b"
                        stroke={isSelected ? "#38bdf8" : "#475569"}
                        strokeWidth="1"
                        className="transition-all duration-300"
                      />
                      
                      {/* Name Text */}
                      <text
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill={isSelected ? "#38bdf8" : "#f8fafc"}
                        fontSize="9.5"
                        fontWeight="500"
                        className="font-sans"
                      >
                        {char.mbti}
                      </text>
                    </g>
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-3.5 mt-2 text-[10px] font-mono text-slate-400">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-0.5 bg-emerald-500"></span>
              <span>合作 (Trust)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-0.5 bg-rose-500 border-dashed border-t"></span>
              <span>对立 (Resentment)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full border border-amber-500 border-dashed animate-spin"></span>
              <span>高压力 (Stress)</span>
            </div>
          </div>
        </>
      ) : (
        /* Compatibility Heatmap View */
        <div className="w-full flex flex-col gap-3 animate-fadeIn mt-1">
          {/* Heatmap Grid */}
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850 overflow-x-auto">
            <div className="min-w-[280px]">
              {/* Header Row */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                <div className="text-[9px] font-mono text-slate-600 flex items-center justify-center">MBTI</div>
                {characters.map((colChar) => (
                  <div key={colChar.id} className="flex flex-col items-center justify-center py-1 bg-slate-900/30 rounded border border-slate-850/40">
                    <span className="text-[12px]">{colChar.avatar}</span>
                    <span className="text-[8px] font-mono text-slate-400 mt-0.5">{colChar.mbti}</span>
                  </div>
                ))}
              </div>

              {/* Rows */}
              {characters.map((rowChar) => (
                <div key={rowChar.id} className="grid grid-cols-7 gap-1 mb-1">
                  {/* Row Header Label */}
                  <div className="flex flex-col items-center justify-center py-1 bg-slate-900/30 rounded border border-slate-850/40">
                    <span className="text-[12px]">{rowChar.avatar}</span>
                    <span className="text-[8px] font-mono text-slate-400 mt-0.5">{rowChar.mbti}</span>
                  </div>

                  {/* Columns */}
                  {characters.map((colChar) => {
                    const isSelf = rowChar.id === colChar.id;
                    const comp = getMbtiCompatibility(rowChar.mbti, colChar.mbti);
                    const isSelected = selectedCell?.charAId === rowChar.id && selectedCell?.charBId === colChar.id;

                    // Color coding for conflict index
                    let cellBg = "bg-slate-900/20 border-slate-900/40 text-slate-600";
                    if (!isSelf) {
                      if (comp.score >= 75) {
                        cellBg = isSelected 
                          ? "bg-rose-600 border-rose-400 text-white shadow-lg font-bold" 
                          : "bg-rose-950/40 border-rose-900/50 hover:bg-rose-900/50 text-rose-300";
                      } else if (comp.score >= 50) {
                        cellBg = isSelected
                          ? "bg-amber-600 border-amber-400 text-white shadow-lg font-bold"
                          : "bg-amber-950/30 border-amber-900/40 hover:bg-amber-900/40 text-amber-300";
                      } else {
                        cellBg = isSelected
                          ? "bg-emerald-600 border-emerald-400 text-white shadow-lg font-bold"
                          : "bg-emerald-950/40 border-emerald-900/40 hover:bg-emerald-900/40 text-emerald-300";
                      }
                    }

                    return (
                      <button
                        key={colChar.id}
                        disabled={isSelf}
                        onClick={() => setSelectedCell({ charAId: rowChar.id, charBId: colChar.id })}
                        className={`h-9 rounded border flex flex-col items-center justify-center transition-all cursor-pointer ${cellBg} ${isSelf ? "cursor-not-allowed opacity-20" : "active:scale-95"}`}
                      >
                        {!isSelf && (
                          <>
                            <span className="text-[11px] font-mono font-bold">{comp.score}</span>
                            <span className="text-[7.5px] tracking-tighter opacity-80">{comp.level}</span>
                          </>
                        )}
                        {isSelf && <span className="text-[9px] font-mono font-bold">-</span>}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Color bar legend */}
          <div className="flex justify-between items-center px-1 text-[9px] font-mono text-slate-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-950/80 border border-emerald-800"></span> 极低冲突 (0-39)</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-950/80 border border-amber-800"></span> 中度冲突 (40-69)</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-rose-950/80 border border-rose-800"></span> 极高冲突 (70-100)</span>
          </div>

          {/* Conflict Analysis Detail Card */}
          {selectedCell && (() => {
            const charA = characters.find(c => c.id === selectedCell.charAId);
            const charB = characters.find(c => c.id === selectedCell.charBId);
            if (!charA || !charB) return null;
            const comp = getMbtiCompatibility(charA.mbti, charB.mbti);
            
            // Current real-time relationship stats
            const relAB = relationships.find(r => r.from === charA.id && r.to === charB.id);
            const realResentment = relAB ? relAB.resentment : 0;
            const realTrust = relAB ? relAB.trust : 50;

            return (
              <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 text-xs flex flex-col gap-2 transition-all">
                <div className="flex justify-between items-center border-b border-slate-900 pb-1.5">
                  <div className="flex items-center gap-1.5 font-bold">
                    <span>{charA.avatar} {charA.name}</span>
                    <span className="text-[9px] bg-slate-800 px-1 rounded text-slate-400 font-mono">{charA.mbti}</span>
                    <span className="text-slate-600 font-normal">与</span>
                    <span>{charB.avatar} {charB.name}</span>
                    <span className="text-[9px] bg-slate-800 px-1 rounded text-slate-400 font-mono">{charB.mbti}</span>
                  </div>
                  <div className="text-[10px] font-mono font-bold flex gap-1 items-center">
                    <span className="text-slate-500">理论冲突:</span>
                    <span className={comp.score >= 75 ? "text-rose-400" : comp.score >= 50 ? "text-amber-400" : "text-emerald-400"}>
                      {comp.score}% ({comp.level})
                    </span>
                  </div>
                </div>

                <p className="text-slate-400 leading-relaxed text-[11px] text-justify">
                  {comp.desc}
                </p>

                {/* Real-time board state vs theoretical */}
                <div className="grid grid-cols-2 gap-2 bg-slate-900/30 p-2 rounded-lg text-[10px] font-mono mt-0.5 border border-slate-900">
                  <div>
                    <span className="text-slate-500 block">当前实时的互信/偏见:</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-emerald-400">信任: {realTrust}%</span>
                      <span className="text-rose-400">怨恨: {realResentment}%</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 block">战术裂痕研判:</span>
                    <span className={realResentment > 50 || comp.score > 70 ? "text-rose-400 font-bold" : "text-slate-400"}>
                      {realResentment > 60 
                        ? "⚡ 严重破裂，难以达成任何共识" 
                        : comp.score > 70 
                        ? "⚠️ 理论冲突大，容易被挑唆或爆料摧毁" 
                        : "🤝 关系稳健，利于在危机中互补结盟"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
