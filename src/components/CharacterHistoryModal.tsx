import React from "react";
import { GameSession, Character, SimulationEvent } from "../types";
import { X, MessageSquare, Vote, Calendar, Award } from "lucide-react";

interface CharacterHistoryModalProps {
  session: GameSession;
  character: Character;
  onClose: () => void;
}

export default function CharacterHistoryModal({ session, character, onClose }: CharacterHistoryModalProps) {
  // Find all public messages from this character
  const speeches = session.events.filter(
    (e) => e.type === "PUBLIC_MESSAGE" && e.actorId === character.id
  );

  // Map proposals and the character's vote
  const proposalsWithVotes = session.proposals.map((prop) => {
    const vote = prop.votes[character.id] || "abstain";
    return {
      id: prop.id,
      title: prop.title,
      sponsor: prop.sponsor,
      vote,
    };
  });

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/40 flex justify-between items-center relative">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-3xl select-none">
              {character.avatar}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">{character.name}</h3>
                <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300 font-mono border border-slate-700">
                  {character.mbti}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{character.role} • 决策历史回顾</p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-all border border-transparent hover:border-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* Proposal Vote Postures */}
          <div>
            <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Vote className="w-4 h-4 text-blue-400" />
              当前决议投票轨迹 / Vote Alignment Track
            </h4>
            
            <div className="grid grid-cols-1 gap-2.5">
              {proposalsWithVotes.map((p) => (
                <div key={p.id} className="p-3 bg-slate-950/50 border border-slate-850 rounded-xl flex items-center justify-between">
                  <div className="min-w-0 pr-3">
                    <div className="text-xs font-bold text-slate-200 truncate">{p.title}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">发起人: {p.sponsor}</div>
                  </div>
                  
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border font-mono whitespace-nowrap ${
                    p.vote === "yes"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : p.vote === "no"
                      ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                      : "bg-slate-800 text-slate-400 border-slate-700"
                  }`}>
                    {p.vote === "yes" ? "赞成 (YES)" : p.vote === "no" ? "反对 (NO)" : "弃权 (ABSTAIN)"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Speech History timeline */}
          <div>
            <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              发言立场演进线 / Speaking Statements Timeline
            </h4>

            {speeches.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500 italic">
                该角色在当前会议中尚未公开发言。
              </div>
            ) : (
              <div className="relative border-l border-slate-800 ml-2.5 pl-4 space-y-4">
                {speeches.map((event, idx) => (
                  <div key={event.id} className="relative">
                    {/* Timeline Node dot */}
                    <span className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-indigo-500 border-2 border-slate-900 shadow"></span>
                    
                    <div className="bg-slate-950/40 border border-slate-850 p-3 rounded-xl">
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-1.5">
                        <span className="flex items-center gap-1 text-indigo-400">
                          <Calendar className="w-3 h-3" /> 第 {event.round} 轮发言
                        </span>
                        <span>{new Date(event.createdAt).toLocaleTimeString()}</span>
                      </div>
                      
                      <p className="text-xs text-slate-300 leading-relaxed italic">
                        &ldquo;{event.payload.publicMessage}&rdquo;
                      </p>

                      {event.payload.intention && (
                        <div className="mt-2 text-[10px] text-purple-400 font-mono flex items-center gap-1 bg-purple-950/20 px-2 py-1 rounded-md border border-purple-900/10">
                          <span className="font-semibold">发言战术:</span> {event.payload.intention}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-600 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-all"
          >
            关闭回顾
          </button>
        </div>

      </div>
    </div>
  );
}
