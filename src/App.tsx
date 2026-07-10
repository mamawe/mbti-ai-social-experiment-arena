import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Flame,
  AlertTriangle,
  DollarSign,
  Award,
  Sparkles,
  Cpu,
  Eye,
  EyeOff,
  UserCheck,
  RefreshCw,
  Lock,
  Unlock,
  Send,
  HelpCircle,
  TrendingUp,
  MessageSquare,
  Zap,
  Users,
  Shield,
  Briefcase,
  Brain,
  Download,
  Settings,
  Plus,
  Trash2,
  Activity
} from "lucide-react";
import { GameSession, Character, SimulationEvent, Proposal } from "./types";
import RelationshipGraph from "./components/RelationshipGraph";
import EvolutionTrendChart from "./components/EvolutionTrendChart";
import CharacterHistoryModal from "./components/CharacterHistoryModal";
import CognitiveRadarChart from "./components/CognitiveRadarChart";

export default function App() {
  const [session, setSession] = useState<GameSession | null>(null);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>("louis");
  const [loading, setLoading] = useState<boolean>(false);
  const [apiMode, setApiMode] = useState<boolean>(false);
  
  // New States
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [characterAnalysis, setCharacterAnalysis] = useState<string>("");
  const [analysisLoading, setAnalysisLoading] = useState<boolean>(false);
  const [dismissAlert, setDismissAlert] = useState<boolean>(false);
  
  // Notes states
  const [newNote, setNewNote] = useState<string>("");
  const [savingNote, setSavingNote] = useState<boolean>(false);

  // Notes actions
  const saveNote = async () => {
    if (!session || !newNote.trim()) return;
    const updatedNotes = [...(session.directorNotes || []), newNote.trim()];
    setSavingNote(true);
    try {
      const res = await fetch("/api/simulation/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          notes: updatedNotes
        })
      });
      const data = await res.json();
      if (data.session) {
        setSession(data.session);
        setNewNote("");
      }
    } catch (err) {
      console.error("Failed to save note:", err);
    } finally {
      setSavingNote(false);
    }
  };

  const deleteNote = async (indexToDelete: number) => {
    if (!session) return;
    const updatedNotes = (session.directorNotes || []).filter((_, idx) => idx !== indexToDelete);
    try {
      const res = await fetch("/api/simulation/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          notes: updatedNotes
        })
      });
      const data = await res.json();
      if (data.session) {
        setSession(data.session);
      }
    } catch (err) {
      console.error("Failed to delete note:", err);
    }
  };

  // Interventions states
  const [interventionType, setInterventionType] = useState<"LEAK_SECRET" | "FORCE_STATEMENT" | "SECRET_WHISPER" | "SOW_DISCORD">("LEAK_SECRET");
  const [interveneCharId, setInterveneCharId] = useState<string>("emily");
  const [interveneCharId2, setInterveneCharId2] = useState<string>("ian");
  const [customTopic, setCustomTopic] = useState<string>("");
  const [customSuggestion, setCustomSuggestion] = useState<string>("裁员");
  const [stepTopic, setStepTopic] = useState<string>("");

  // Automated Interventions rules states
  interface AutoRule {
    id: string;
    characterId: string; // specific ID or "any"
    metric: "stress" | "morale" | "socialEnergy";
    condition: "less_than" | "greater_than";
    threshold: number;
    interventionType: "LEAK_SECRET" | "FORCE_STATEMENT" | "SECRET_WHISPER" | "SOW_DISCORD";
    topic?: string;
    suggestion?: string;
    charBId?: string;
    isActive: boolean;
    cooldownRound?: number;
  }

  interface AutoTriggerLog {
    id: string;
    timestamp: string;
    round: number;
    ruleDesc: string;
    outcome: string;
  }

  const [autoRules, setAutoRules] = useState<AutoRule[]>([
    {
      id: "rule-1",
      characterId: "emily",
      metric: "morale",
      condition: "less_than",
      threshold: 30,
      interventionType: "SECRET_WHISPER",
      suggestion: "技术大转型",
      isActive: true,
    },
    {
      id: "rule-2",
      characterId: "any",
      metric: "stress",
      condition: "greater_than",
      threshold: 85,
      interventionType: "LEAK_SECRET",
      isActive: true,
    }
  ]);
  const [autoTriggerLogs, setAutoTriggerLogs] = useState<AutoTriggerLog[]>([]);
  const [showAddRuleForm, setShowAddRuleForm] = useState<boolean>(false);

  // New rule form states
  const [newRuleChar, setNewRuleChar] = useState<string>("any");
  const [newRuleMetric, setNewRuleMetric] = useState<"stress" | "morale" | "socialEnergy">("stress");
  const [newRuleCondition, setNewRuleCondition] = useState<"less_than" | "greater_than">("greater_than");
  const [newRuleThreshold, setNewRuleThreshold] = useState<number>(80);
  const [newRuleIntervention, setNewRuleIntervention] = useState<"LEAK_SECRET" | "FORCE_STATEMENT" | "SECRET_WHISPER" | "SOW_DISCORD">("LEAK_SECRET");
  const [newRuleTopic, setNewRuleTopic] = useState<string>("未来的战略方向");
  const [newRuleSuggestion, setNewRuleSuggestion] = useState<string>("技术大转型");
  const [newRuleCharB, setNewRuleCharB] = useState<string>("ian");

  const addRule = () => {
    const newRule: AutoRule = {
      id: "rule-" + Date.now(),
      characterId: newRuleChar,
      metric: newRuleMetric,
      condition: newRuleCondition,
      threshold: newRuleThreshold,
      interventionType: newRuleIntervention,
      topic: newRuleIntervention === "FORCE_STATEMENT" ? newRuleTopic : undefined,
      suggestion: newRuleIntervention === "SECRET_WHISPER" ? newRuleSuggestion : undefined,
      charBId: newRuleIntervention === "SOW_DISCORD" ? newRuleCharB : undefined,
      isActive: true
    };
    setAutoRules([...autoRules, newRule]);
    setShowAddRuleForm(false);
  };

  const deleteRule = (id: string) => {
    setAutoRules(autoRules.filter(r => r.id !== id));
  };

  const toggleRuleActive = (id: string) => {
    setAutoRules(autoRules.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));
  };

  const getInterventionLabel = (type: string) => {
    switch (type) {
      case "LEAK_SECRET": return "强制泄密";
      case "FORCE_STATEMENT": return "强制表态";
      case "SECRET_WHISPER": return "密语洗脑";
      case "SOW_DISCORD": return "挑拨离间";
      default: return type;
    }
  };

  const evaluateAutomatedRules = async (currentSession: GameSession) => {
    if (currentSession.directorEnergy <= 0 || currentSession.world.status !== "ongoing") return;

    let updatedSession = currentSession;
    let energyLeft = currentSession.directorEnergy;
    const currentRound = currentSession.world.round;

    for (let i = 0; i < autoRules.length; i++) {
      const rule = autoRules[i];
      if (!rule.isActive) continue;
      if (rule.cooldownRound === currentRound) continue;
      if (energyLeft <= 0) break;

      // Find character matching condition
      const matchingChars = currentSession.characters.filter((char) => {
        if (rule.characterId !== "any" && char.id !== rule.characterId) return false;
        
        const value = char[rule.metric];
        if (rule.condition === "less_than") {
          return value < rule.threshold;
        } else {
          return value > rule.threshold;
        }
      });

      if (matchingChars.length > 0) {
        // Trigger for the first matching character
        const targetChar = matchingChars[0];
        
        // Cooldown the rule for this round
        rule.cooldownRound = currentRound;
        
        // Prepare Payload
        let payload: any = {};
        let actionDesc = "";
        
        if (rule.interventionType === "LEAK_SECRET") {
          payload = { characterId: targetChar.id };
          actionDesc = `泄露了 ${targetChar.name} 的绝密底牌`;
        } else if (rule.interventionType === "FORCE_STATEMENT") {
          payload = { characterId: targetChar.id, topic: rule.topic || "当前的生存方案选择" };
          actionDesc = `强制 ${targetChar.name} 就话题「${rule.topic || "当前的生存方案选择"}」表态`;
        } else if (rule.interventionType === "SECRET_WHISPER") {
          payload = { characterId: targetChar.id, suggestion: rule.suggestion || "裁员止血" };
          actionDesc = `对 ${targetChar.name} 密语灌输，倾向「${rule.suggestion || "裁员止血"}」`;
        } else if (rule.interventionType === "SOW_DISCORD") {
          const charBId = rule.charBId || currentSession.characters.find(c => c.id !== targetChar.id)?.id || "ian";
          const charBName = currentSession.characters.find(c => c.id === charBId)?.name || "对方";
          payload = { charAId: targetChar.id, charBId };
          actionDesc = `挑拨 ${targetChar.name} 与 ${charBName} 的同盟关系`;
        }

        const logId = Math.random().toString(36).substring(2, 9);
        const newLog: AutoTriggerLog = {
          id: logId,
          timestamp: new Date().toLocaleTimeString(),
          round: currentRound,
          ruleDesc: `当 ${rule.characterId === "any" ? "任何角色" : targetChar.name} 的 ${
            rule.metric === "stress" ? "压力" : rule.metric === "morale" ? "士气" : "社交能量"
          } ${rule.condition === "less_than" ? "低于" : "高于"} ${rule.threshold}%`,
          outcome: `自动触发【${getInterventionLabel(rule.interventionType)}】：${actionDesc}`
        };

        try {
          const res = await fetch("/api/simulation/intervene", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId: currentSession.id,
              type: rule.interventionType,
              payload
            }),
          });
          const resData = await res.json();
          if (resData.session) {
            updatedSession = resData.session;
            energyLeft = updatedSession.directorEnergy;
            
            // Update session locally
            setSession(updatedSession);
            setAutoTriggerLogs(prev => [newLog, ...prev]);
            
            // If energy is depleted, stop evaluation
            if (energyLeft <= 0) {
              setAutoTriggerLogs(prev => [
                {
                  id: Math.random().toString(),
                  timestamp: new Date().toLocaleTimeString(),
                  round: currentRound,
                  ruleDesc: "系统通知",
                  outcome: "⚠️ 导演精力点数已归零，自动干预中止"
                },
                ...prev
              ]);
              break;
            }
          }
        } catch (err) {
          console.error("Error executing automated rule:", err);
        }
      }
    }
  };

  const timelineEndRef = useRef<HTMLDivElement | null>(null);

  // Fetch or Start Session on Mount
  useEffect(() => {
    startNewSession();
  }, []);

  // Auto-scroll timeline to bottom on new event
  useEffect(() => {
    if (timelineEndRef.current) {
      timelineEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [session?.events]);

  // Fetch MBTI psychological analysis when selected character or round changes
  useEffect(() => {
    if (!session || !selectedCharacterId) return;

    const fetchAnalysis = async () => {
      setAnalysisLoading(true);
      try {
        const res = await fetch("/api/simulation/character-analysis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: session.id,
            characterId: selectedCharacterId
          })
        });
        const data = await res.json();
        setCharacterAnalysis(data.analysis || "");
      } catch (err) {
        console.error("Failed to fetch character analysis:", err);
      } finally {
        setAnalysisLoading(false);
      }
    };

    fetchAnalysis();
  }, [selectedCharacterId, session?.id, session?.world?.round]);

  // Reset alert dismissed state on every new round to ensure warning persists
  useEffect(() => {
    setDismissAlert(false);
  }, [session?.world?.round]);

  const startNewSession = async () => {
    setLoading(true);
    setDismissAlert(false);
    try {
      const res = await fetch("/api/simulation/start", { method: "POST" });
      const data = await res.json();
      setSession(data.session);
      setApiMode(data.apiMode);
      // Select Louis as default focus
      setSelectedCharacterId("louis");
    } catch (err) {
      console.error("Failed to start session:", err);
    } finally {
      setLoading(false);
    }
  };

  const advanceDialogue = async () => {
    if (!session || session.world.status !== "ongoing") return;
    setLoading(true);
    try {
      const res = await fetch("/api/simulation/step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          customTopic: stepTopic ? stepTopic : undefined
        }),
      });
      const data = await res.json();
      if (data.session) {
        setSession(data.session);
        setStepTopic(""); // clear step topic
        await evaluateAutomatedRules(data.session);
      }
    } catch (err) {
      console.error("Error advancing simulation:", err);
    } finally {
      setLoading(false);
    }
  };

  const executeIntervention = async () => {
    if (!session || session.directorEnergy <= 0) return;
    setLoading(true);
    
    let payload: any = {};
    if (interventionType === "LEAK_SECRET") {
      payload = { characterId: interveneCharId };
    } else if (interventionType === "FORCE_STATEMENT") {
      payload = { characterId: interveneCharId, topic: customTopic || "目前的生存方案选择" };
    } else if (interventionType === "SECRET_WHISPER") {
      payload = { characterId: interveneCharId, suggestion: customSuggestion };
    } else if (interventionType === "SOW_DISCORD") {
      payload = { charAId: interveneCharId, charBId: interveneCharId2 };
    }

    try {
      const res = await fetch("/api/simulation/intervene", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          type: interventionType,
          payload
        }),
      });
      const data = await res.json();
      setSession(data.session);
      setCustomTopic(""); // clear inputs
    } catch (err) {
      console.error("Error executing intervention:", err);
    } finally {
      setLoading(false);
    }
  };

  const callImmediateVote = async () => {
    if (!session || session.world.status !== "ongoing") return;
    setLoading(true);
    try {
      const res = await fetch("/api/simulation/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.id }),
      });
      const data = await res.json();
      setSession(data.session);
    } catch (err) {
      console.error("Error triggering vote:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleGodMode = async (enable: boolean) => {
    if (!session) return;
    try {
      const res = await fetch("/api/simulation/godmode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.id, enable }),
      });
      const data = await res.json();
      setSession(data.session);
    } catch (err) {
      console.error("Error toggling God Mode:", err);
    }
  };

  const exportSimulationReport = () => {
    if (!session) return;
    
    // Structure the report elegantly
    const report = {
      experimentId: session.id,
      timestamp: new Date().toISOString(),
      worldStateAtEnd: session.world,
      finalOutcome: getEndingDetails(session.world.status),
      charactersState: session.characters.map(c => ({
        id: c.id,
        name: c.name,
        role: c.role,
        mbti: c.mbti,
        finalStress: c.stress,
        finalMorale: c.morale,
        finalDecisionStance: c.alignment,
        isSecretUnlocked: c.isSecretUnlocked
      })),
      relationships: session.relationships,
      directorNotes: session.directorNotes || [],
      dialogueHistory: session.events
        .filter(e => e.type === "PUBLIC_MESSAGE")
        .map(e => ({
          round: e.round,
          actor: session.characters.find(c => c.id === e.actorId)?.name || e.actorId,
          statement: e.payload.publicMessage,
          tacticalIntention: e.payload.intention,
          timestamp: e.createdAt
        }))
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `mbti_simulation_report_${session.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getEndingDetails = (status: string) => {
    switch (status) {
      case "ended_layoffs":
        return {
          title: "🩸 生存至上：执行大面积裁员",
          color: "text-emerald-400 border-emerald-500 bg-emerald-950/40",
          desc: "路易和伊恩的方案最终被强力通过。会议室里只剩下冰冷的解聘通知。公司通过砍掉 50% 的非核心员工，成功将存活天数延长至 70 天，稳住了基本盘。但团队士气受到彻底重创，艾米莉和伊森也因信念不合流露出辞职的意向。公司虽然活了下来，但往日的创意灵魂已经荡然无存。",
        };
      case "ended_pivot":
        return {
          title: "⚡ 创意突围：AI 创作套件大转型",
          color: "text-violet-400 border-violet-500 bg-violet-950/40",
          desc: "艾米莉和伊森点燃了大家的赌徒精神，高管会通过了极速 AI 转型计划。所有人员和预算全额压注。大家在连续熬夜 7 天后，奇迹般上线了测试版。由于产品创意极为新颖，产品在社媒上引发了轰动，并成功拿到了老股东追加的 150 万追加。公司虽然经历了极高强度的生存洗礼，但成功化危为机，实现了重生！",
        };
      case "ended_sell":
        return {
          title: "🔮 平稳落地：并入科技巨头",
          color: "text-indigo-400 border-indigo-500 bg-indigo-950/40",
          desc: "伊莎贝拉长袖善舞的收购草案被拿到桌面上。虽然路易起初暴跳如雷，但伊恩递上来的破产倒计时迫使所有人低头。最终公司成功以 500 万美金价格打包并入 Megacorp。全体员工得以全员保留，创始人变现退出。虽然失去了独立创业的自由和对核心方向的控制权，但这无疑是一个皆大欢喜的软着陆。",
        };
      case "ended_collapse_morale":
        return {
          title: "🥀 信念崩塌：团队就地解体",
          color: "text-rose-400 border-rose-500 bg-rose-950/40",
          desc: "会议室里的尖锐攻击、无休止的扯皮和人身伤害，让团队整体士气跌至谷底（士气低于 15%）。艾薇因不堪压力提交了匿名联名辞职信，伊森也当场抱走电脑，整个会议沦为闹剧。公司在还没迎来最终破产日前，管理层就已经当场决裂，团队就地解散，项目宣告失败。",
        };
      case "ended_collapse_cash":
        return {
          title: "💸 弹尽粮绝：账面资金枯竭",
          color: "text-rose-400 border-rose-500 bg-rose-950/40",
          desc: "账上资金在争论不休中彻底耗尽（现金天数归零）。公司触发了银行信贷联合清算托管，所有公章和账户被强制冻结。创始团队在最后一天仍未达成一致方案，只能遗憾地眼看公司进入无序清盘。一次原本有机会拯救的商业神话彻底破灭。",
        };
      case "ended_stalemate":
        return {
          title: "⏳ 议程流产：陷入无限撕裂僵局",
          color: "text-amber-400 border-amber-500 bg-amber-950/40",
          desc: "12 轮残酷讨论过后，三派互不妥协、各自抱团，始终没能有一份草案拿到 4 票以上。会议无限期撕裂，截止时间流逝。股东和投资人失去耐心决定行使否决权，撤回资金支持，创始人路易被排挤出局，公司被拆分清算。",
        };
      default:
        return {
          title: "沙盘演化结束",
          color: "text-slate-400 border-slate-500 bg-slate-900/60",
          desc: "演化结束，达成未定义状态。",
        };
    }
  };

  const getAlignmentBadgeColor = (align: string) => {
    switch (align) {
      case "layoffs":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "pivot":
        return "bg-violet-500/10 text-violet-400 border-violet-500/20";
      case "sell":
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  const getAlignmentLabel = (align: string) => {
    switch (align) {
      case "layoffs": return "支持裁员";
      case "pivot": return "支持转型";
      case "sell": return "支持出售";
      default: return "持中立摇摆";
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex flex-col items-center justify-center p-6 text-slate-100">
        <div className="flex flex-col items-center max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-blue-600/20 flex items-center justify-center border border-blue-500/30 animate-pulse mb-6">
            <Cpu className="w-8 h-8 text-blue-500" />
          </div>
          <h1 className="text-2xl font-display font-semibold tracking-tight text-white mb-2">
            正在初始化 AI 生存沙盘...
          </h1>
          <p className="text-slate-400 text-sm mb-6">
            系统正在构建“6 种 MBTI 人格”，注入世界状态机并分发社会关系底牌，请稍候。
          </p>
          <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full animate-progress w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  const focusedCharacter = session.characters.find((c) => c.id === selectedCharacterId);
  const isOngoing = session.world.status === "ongoing";
  const showRiskAlert = session && (session.world.teamMorale < 20 || session.world.cashDays <= 3);

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans relative selection:bg-blue-500/30 selection:text-blue-200">
      
      {/* Background radial glow */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[300px] bg-blue-900/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[300px] bg-indigo-900/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Header Banner */}
      <header className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md px-4 py-3 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center shadow-lg shadow-indigo-500/10 border border-indigo-400/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-display font-bold tracking-wide text-white uppercase">
                  MBTI AI 社会实验沙盘
                </h1>
                <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 font-mono border border-slate-700">
                  v1.2 MVP
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">
                6 人高压密室抉择 • 12 轮社会演化模拟
              </p>
            </div>
          </div>

          {/* Engine Status Indicators */}
          <div className="flex items-center gap-2 text-xs font-mono">
            {/* API mode badge */}
            <div className={`px-2 py-1 rounded-md border flex items-center gap-1.5 ${
              apiMode 
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${apiMode ? "bg-emerald-500" : "bg-amber-500"}`}></span>
              <span>{apiMode ? "Gemini 3.5 AI 驱动" : "本地决策引擎"}</span>
            </div>

            {/* God View toggle */}
            <button
              id="god-mode-toggle"
              onClick={() => toggleGodMode(!session.isGodMode)}
              className={`px-2 py-1 rounded-md border flex items-center gap-1.5 transition-all ${
                session.isGodMode
                  ? "bg-purple-500/20 text-purple-300 border-purple-500/40 font-semibold"
                  : "bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200"
              }`}
              title="上帝视角可解锁并实时查看所有角色的内心小剧场和绝密底牌"
            >
              {session.isGodMode ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>上帝视角 (God Mode): {session.isGodMode ? "开启" : "关闭"}</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Content Workspace Grid (Adaptive responsive) */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left Column (lg:col-span-4): Graph + Relationship Status */}
        <section id="relationships-section" className="lg:col-span-4 flex flex-col gap-4">
          
          {/* Network Graph */}
          <RelationshipGraph
            characters={session.characters}
            relationships={session.relationships}
            selectedCharacterId={selectedCharacterId}
            onSelectCharacter={(id) => setSelectedCharacterId(id)}
          />

          {/* Core Simulation Resource Meters */}
          <div className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-2xl p-4 flex flex-col gap-3.5">
            <h3 className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
              公司生存环境指标 / Environment Metrics
            </h3>

            {/* Cash left meter */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> 现金流储备 (Cash Reserve)
                </span>
                <span className={`font-mono font-bold ${session.world.cashDays <= 10 ? "text-rose-400 animate-pulse" : "text-emerald-400"}`}>
                  {session.world.cashDays} 天
                </span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    session.world.cashDays > 20 
                      ? "bg-emerald-500" 
                      : session.world.cashDays > 10 
                      ? "bg-amber-500" 
                      : "bg-rose-500 animate-pulse"
                  }`}
                  style={{ width: `${Math.min(100, (session.world.cashDays / 30) * 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Morale meter */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-500" /> 团队凝聚士气 (Team Morale)
                </span>
                <span className={`font-mono font-bold ${session.world.teamMorale <= 30 ? "text-rose-400 animate-pulse" : "text-amber-400"}`}>
                  {session.world.teamMorale}%
                </span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    session.world.teamMorale > 60 
                      ? "bg-emerald-500" 
                      : session.world.teamMorale > 30 
                      ? "bg-amber-500" 
                      : "bg-rose-500 animate-pulse"
                  }`}
                  style={{ width: `${session.world.teamMorale}%` }}
                ></div>
              </div>
            </div>

            {/* Consensus level meter */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-sky-400" /> 决策共识一致度 (Consensus)
                </span>
                <span className="font-mono text-sky-400 font-bold">
                  {session.world.consensusLevel}% <span className="text-[10px] text-slate-500 font-normal">/ 85%通过</span>
                </span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${session.world.consensusLevel}%` }}
                ></div>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                *共识值反映各派系立场契合度，达到 85% 会自动通过当前占优决议并宣告会议成功结束。
              </p>
            </div>

          </div>

          {/* Proposals & Vote distribution */}
          <div className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-2xl p-4 flex flex-col gap-3">
            <h3 className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
              当前对立决策提案列表 / Competing Proposals
            </h3>
            
            <div className="flex flex-col gap-2.5">
              {session.proposals.map((prop) => {
                const yesCount = Object.values(prop.votes).filter(v => v === "yes").length;
                const noCount = Object.values(prop.votes).filter(v => v === "no").length;

                return (
                  <div key={prop.id} className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                    <div className="flex justify-between items-start gap-2 mb-1.5">
                      <h4 className="text-xs font-bold text-slate-200">
                        {prop.title}
                      </h4>
                      <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap">
                        提议者: {prop.sponsor.split(" ")[0]}
                      </span>
                    </div>
                    <p className="text-[10.5px] text-slate-400 leading-relaxed mb-2">
                      {prop.description}
                    </p>
                    
                    {/* Votes bar */}
                    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
                      <span>倾向支持人员:</span>
                      <div className="flex gap-1">
                        {Object.entries(prop.votes).map(([charId, vote]) => {
                          const char = session.characters.find(c => c.id === charId);
                          if (!char) return null;
                          return (
                            <span
                              key={charId}
                              className={`px-1.5 py-0.5 rounded text-[9px] border font-sans ${
                                vote === "yes"
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                  : vote === "no"
                                  ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                  : "bg-slate-800 text-slate-400 border-slate-700"
                              }`}
                              title={`${char.name}: ${vote === "yes" ? "赞成" : vote === "no" ? "反对" : "弃权"}`}
                            >
                              {char.mbti}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </section>

        {/* Center Column (lg:col-span-5): Simulation Dialogue Timeline Feed */}
        <section className="lg:col-span-5 flex flex-col gap-4">
          
          {/* Evolution Trend Chart */}
          <EvolutionTrendChart history={session.world.history || []} />

          {/* Dialogue Timeline Box */}
          <div id="dialogue-timeline-section" className="flex flex-col bg-slate-900/30 border border-slate-800/80 rounded-2xl h-[530px] overflow-hidden backdrop-blur-md">
            
            {/* Header indicator */}
          <div className="p-3.5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-display font-bold tracking-wider text-slate-200">
                沙盘会议时间线 / Timeline Feed
              </span>
            </div>
            <div className="px-2.5 py-0.5 bg-indigo-500/10 rounded-full border border-indigo-500/20 text-[11px] font-mono text-indigo-400 font-bold">
              第 {session.world.round} / {session.world.maxRounds} 轮次
            </div>
          </div>

          {/* Timeline Scrollable Box */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            {session.events.map((event) => {
              
              if (event.type === "WORLD_EVENT") {
                return (
                  <div
                    key={event.id}
                    className="p-3 bg-indigo-950/25 border border-indigo-900/40 rounded-xl text-xs text-indigo-300 leading-relaxed font-sans flex items-start gap-2 animate-fadeIn"
                  >
                    <span className="text-base select-none">📢</span>
                    <div>{event.payload.description}</div>
                  </div>
                );
              }

              if (event.type === "USER_INTERVENTION") {
                return (
                  <div
                    key={event.id}
                    className="p-3 bg-purple-950/30 border border-purple-900/40 rounded-xl text-xs text-purple-300 leading-relaxed font-sans flex items-start gap-2 animate-fadeIn"
                  >
                    <span className="text-base select-none">💫</span>
                    <div>{event.payload.description}</div>
                  </div>
                );
              }

              // Normal Public Speech Event
              const speaker = session.characters.find((c) => c.id === event.actorId);
              if (!speaker) return null;

              const isFocused = selectedCharacterId === speaker.id;
              const hasThoughts = event.payload.privateThought || event.payload.intention;
              const showThoughts = session.isGodMode;

              return (
                <div
                  key={event.id}
                  className={`flex gap-3 items-start p-3 rounded-xl transition-all ${
                    isFocused 
                      ? "bg-slate-800/40 border border-slate-700/60 shadow-lg" 
                      : "hover:bg-slate-900/30 border border-transparent"
                  } cursor-pointer`}
                  onClick={() => setSelectedCharacterId(speaker.id)}
                >
                  {/* Speaker Avatar */}
                  <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-xl border border-slate-700 select-none flex-shrink-0">
                    {speaker.avatar}
                  </div>

                  <div className="flex-1 min-w-0">
                    
                    {/* Header */}
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <span className="text-xs font-bold text-slate-200">
                        {speaker.name}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.25 bg-slate-800 text-slate-400 rounded-md border border-slate-700 font-mono">
                        {speaker.mbti}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {speaker.role}
                      </span>
                    </div>

                    {/* Dialogue Text */}
                    <p className="text-xs text-slate-300 leading-relaxed font-sans bg-slate-950/30 p-2.5 rounded-lg border border-slate-850">
                      {event.payload.publicMessage}
                    </p>

                    {/* Private Thoughts (Conditional on God Mode) */}
                    {hasThoughts && (
                      <div className="mt-2 overflow-hidden transition-all duration-300">
                        {showThoughts ? (
                          <div className="p-2.5 bg-purple-950/20 border border-purple-900/30 rounded-lg text-[11px] leading-relaxed">
                            <div className="flex items-center gap-1.5 text-purple-400 font-semibold mb-1 font-mono">
                              <Eye className="w-3.5 h-3.5" /> 潜意识与图谋 (Peeling Mind)
                            </div>
                            <div className="text-purple-300/90 mb-1">
                              <span className="text-purple-400 font-medium">内心活动:</span> {event.payload.privateThought}
                            </div>
                            <div className="text-purple-300/90">
                              <span className="text-purple-400 font-medium">本轮战术:</span> {event.payload.intention}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-[10px] text-slate-500 italic hover:text-purple-400 select-none transition-colors"
                               title="开启顶部的「上帝视角」直接查看该角色当时说出这话时的腹黑谋略或真实焦虑">
                            <Lock className="w-3 h-3 text-slate-600" />
                            <span>该发言含隐藏心声，开启「上帝视角」可窥视。</span>
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                </div>
              );
            })}
            
            {/* Anchor scroll */}
            <div ref={timelineEndRef} />
          </div>

          {/* Interactive controls bar */}
          <div className="p-3.5 bg-slate-950/80 border-t border-slate-800 flex flex-col gap-3">
            
            {isOngoing ? (
              <>
                {/* Advanced optional next turn topic input */}
                <div className="flex items-center gap-2">
                  <span className="text-[10.5px] font-mono text-slate-400 whitespace-nowrap">引导话题:</span>
                  <input
                    type="text"
                    placeholder="输入引导议题以定制下位角色的对话倾向（选填）"
                    value={stepTopic}
                    onChange={(e) => setStepTopic(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <button
                    onClick={advanceDialogue}
                    disabled={loading}
                    className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/15 border border-blue-400/20 active:scale-95 transition-all disabled:opacity-50"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    推进对话进程 (Next Step)
                  </button>
                  
                  <button
                    onClick={callImmediateVote}
                    disabled={loading}
                    className="w-full h-11 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 border border-slate-700 active:scale-95 transition-all disabled:opacity-50"
                  >
                    <UserCheck className="w-4 h-4 text-slate-300" />
                    强启高管表决 (Force Vote)
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={startNewSession}
                className="w-full h-11 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 border border-emerald-400/20 active:scale-95 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                重启下一轮社会生存实验 / Restart Arena
              </button>
            )}

          </div>

        </div>
      </section>

      {/* Right Column (lg:col-span-3): Director Powers & Spotlight Spotlight */}
      <section id="director-sidebar-section" className="lg:col-span-3 flex flex-col gap-4">
          
          {/* Focused Character Spotlight */}
          {focusedCharacter && (
            <div className="bg-slate-900/40 border border-slate-850 backdrop-blur-md rounded-2xl p-4 flex flex-col gap-3 relative overflow-hidden animate-fadeIn">
              
              {/* Decorative accent color */}
              <div className={`absolute top-0 right-0 w-20 h-20 rounded-full blur-[30px] opacity-20 pointer-events-none bg-${focusedCharacter.color}-500`}></div>

              <h3 className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                角色深度探视 / Spotlight Character
              </h3>

              {/* Avatar and Main Info */}
              <div className="flex gap-3 items-center">
                <div 
                  className="w-12 h-12 rounded-2xl bg-slate-850 flex items-center justify-center text-3.5xl border border-slate-700 select-none cursor-pointer hover:scale-105 hover:border-indigo-500 hover:shadow-lg transition-all active:scale-95"
                  onClick={() => setIsHistoryModalOpen(true)}
                  title="点击查看个人决策历史与投票轨迹回顾"
                >
                  {focusedCharacter.avatar}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    {focusedCharacter.name}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] bg-slate-800 px-1.5 py-0.25 rounded text-slate-300 font-mono border border-slate-700">
                      {focusedCharacter.mbti}
                    </span>
                    <span className="text-[10.5px] text-slate-400 font-medium">
                      {focusedCharacter.role}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats values */}
              <div className="grid grid-cols-2 gap-3 p-2.5 bg-slate-950/40 rounded-xl border border-slate-800/80 text-xs font-mono">
                <div>
                  <div className="text-slate-500 mb-0.5">当前压力值:</div>
                  <div className={`font-bold ${focusedCharacter.stress > 70 ? "text-rose-400" : focusedCharacter.stress > 40 ? "text-amber-400" : "text-emerald-400"}`}>
                    {focusedCharacter.stress} / 100
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 mb-0.5">社交能量值:</div>
                  <div className="text-blue-400 font-bold">
                    {focusedCharacter.socialEnergy} / 100
                  </div>
                </div>
              </div>

              {/* Public Goal */}
              <div>
                <h5 className="text-[11px] font-mono text-slate-400 mb-0.5 flex items-center gap-1">
                  <Shield className="w-3 h-3 text-slate-400" /> 公开利益主张:
                </h5>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {focusedCharacter.publicGoal}
                </p>
              </div>

              {/* Alignment Badge */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-slate-400">目前流派倾向:</span>
                <span className={`px-2 py-0.5 rounded text-[10px] border ${getAlignmentBadgeColor(focusedCharacter.alignment)}`}>
                  {getAlignmentLabel(focusedCharacter.alignment)}
                </span>
              </div>

              {/* Private Goal & Secret */}
              <div className="p-3 bg-indigo-950/20 border border-indigo-900/30 rounded-xl flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <h5 className="text-[11px] font-mono text-indigo-400 font-semibold flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" /> 隐藏动机 & 绝密底牌:
                  </h5>
                  {session.isGodMode || focusedCharacter.isSecretUnlocked ? (
                    <span className="text-[8px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1 py-0.25 rounded">
                      已揭秘
                    </span>
                  ) : (
                    <span className="text-[8px] bg-slate-800 text-slate-500 border border-slate-700 px-1 py-0.25 rounded flex items-center gap-0.5">
                      <Lock className="w-2 h-2" /> 密封
                    </span>
                  )}
                </div>

                {session.isGodMode || focusedCharacter.isSecretUnlocked ? (
                  <div className="text-xs leading-relaxed text-indigo-300/95 flex flex-col gap-1.5">
                    <div>
                      <span className="font-semibold text-indigo-400">真实图谋:</span> {focusedCharacter.privateGoal}
                    </div>
                    <div className="border-t border-indigo-950 pt-1.5">
                      <span className="font-semibold text-indigo-400">绝密底牌:</span> {focusedCharacter.secret}
                    </div>
                  </div>
                ) : (
                  <p className="text-[10.5px] text-slate-500 italic">
                    该角色的绝密底牌目前已被锁闭。可通过下方的「导演干涉-强制泄密」消耗 1 点能量，公诸于众。
                  </p>
                )}
              </div>

              {/* Subjective Opinions towards others */}
              <div className="flex flex-col gap-2 mt-1">
                <h5 className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                  <Users className="w-3 h-3" /> 对会议中其他人的主观态度:
                </h5>
                <div className="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                  {session.relationships
                    .filter((r) => r.from === focusedCharacter.id)
                    .map((r) => {
                      const target = session.characters.find((c) => c.id === r.to);
                      if (!target) return null;
                      return (
                        <div key={r.to} className="p-1.5 bg-slate-950/20 rounded-lg text-[10.5px] border border-slate-850/50">
                          <div className="flex justify-between items-center mb-0.5 text-slate-300">
                            <span className="font-medium">{target.name} ({target.mbti})</span>
                            <div className="flex gap-1.5 text-[9px] font-mono">
                              <span className="text-emerald-400">信:{r.trust}</span>
                              <span className="text-rose-400">怨:{r.resentment}</span>
                            </div>
                          </div>
                          <p className="text-slate-500 text-[10px] italic leading-tight">
                            &ldquo;{r.lastReason || "初始合作关系"}&rdquo;
                          </p>
                        </div>
                      );
                    })}
                </div>
              </div>

            </div>
          )}

          {/* Cognitive Radar Chart */}
          {focusedCharacter && (
            <CognitiveRadarChart
              mbti={focusedCharacter.mbti}
              stress={focusedCharacter.stress}
              morale={focusedCharacter.morale}
              characterName={focusedCharacter.name}
            />
          )}

          {/* Focused Character MBTI Psychological Analysis */}
          {focusedCharacter && (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2.5 relative overflow-hidden animate-fadeIn">
              <h3 className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-pink-400" />
                人格心理剖析 / MBTI Stance Profile
              </h3>
              
              {analysisLoading ? (
                <div className="py-4 flex flex-col items-center justify-center gap-2">
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-[10px] text-slate-500 font-mono">正在分析 MBTI 认知功能与内心冲突...</span>
                </div>
              ) : (
                <div className="text-xs leading-relaxed text-slate-300 font-sans p-3 bg-slate-950/40 rounded-xl border border-slate-850">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse"></span>
                    <strong className="text-pink-400 font-mono text-[10.5px]">当前轮次深度解读 ({focusedCharacter.mbti}):</strong>
                  </div>
                  <p className="text-slate-300 whitespace-pre-wrap leading-relaxed text-justify">
                    {characterAnalysis}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Director Notes Notebook */}
          <div className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-2xl p-4 flex flex-col gap-3">
            <h3 className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="text-emerald-400">📝</span>
              导演观测笔记 / Director's Notes
            </h3>
            
            {/* Input textarea */}
            <div className="flex flex-col gap-2">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="记录你对当前博弈的观察、各方立场预测或实验干预构想..."
                rows={2}
                className="w-full bg-slate-950 border border-slate-850 focus:border-emerald-500/50 rounded-xl p-2.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none transition-all resize-none"
              />
              <button
                onClick={saveNote}
                disabled={savingNote || !newNote.trim()}
                className="py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-850 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-1 transition-all active:scale-95"
              >
                {savingNote ? (
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : "💾 存入沙盘档案"}
              </button>
            </div>

            {/* List of saved notes */}
            {session.directorNotes && session.directorNotes.length > 0 ? (
              <div className="max-h-[140px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {session.directorNotes.map((note, idx) => (
                  <div key={idx} className="group relative bg-slate-950/40 border border-slate-850 p-2.5 rounded-lg flex gap-2 justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <div className="text-[9px] font-mono text-emerald-400 mb-0.5 font-bold">笔记 #{idx + 1}</div>
                      <p className="text-[11px] text-slate-300 leading-relaxed whitespace-pre-wrap">{note}</p>
                    </div>
                    <button
                      onClick={() => deleteNote(idx)}
                      className="text-slate-600 hover:text-rose-400 text-[10px] font-mono transition-colors opacity-0 group-hover:opacity-100 pl-1 select-none"
                      title="删除此条笔记"
                    >
                      删除
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-slate-600 italic text-center py-2 border border-slate-850/40 border-dashed rounded-lg">
                暂无存档观测记录。观察成员决策立场并记录你的预判吧！
              </p>
            )}
          </div>

          {/* Automated Interventions Strategy Panel */}
          <div className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5 text-indigo-400" />
                自动化干预策略 / Auto Interventions
              </h3>
              <button
                onClick={() => setShowAddRuleForm(!showAddRuleForm)}
                className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-mono rounded flex items-center gap-1 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                {showAddRuleForm ? "关闭面板" : "新增规则"}
              </button>
            </div>

            <p className="text-[10.5px] text-slate-500 italic">
              设置逻辑规则，当高管的核心指标满足预设条件时，由沙盘底盘指令自动触发对应的心理干预。
            </p>

            {/* Add Rule Form */}
            {showAddRuleForm && (
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col gap-2.5 animate-fadeIn text-xs">
                <div className="text-[10px] font-mono text-indigo-400 font-bold border-b border-slate-900 pb-1">配置自动化规则</div>
                
                {/* 1. Target Character */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-slate-400 font-mono">当高管对象为:</span>
                  <select
                    value={newRuleChar}
                    onChange={(e) => setNewRuleChar(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded p-1 text-xs text-slate-200"
                  >
                    <option value="any">任何高管 (Any Character)</option>
                    {session.characters.map(c => (
                      <option key={c.id} value={c.id}>{c.avatar} {c.name} ({c.mbti})</option>
                    ))}
                  </select>
                </div>

                {/* 2. Condition Metric, Op and Threshold */}
                <div className="grid grid-cols-3 gap-1.5">
                  <div className="flex flex-col gap-1 col-span-1">
                    <span className="text-[10px] text-slate-400 font-mono">指标:</span>
                    <select
                      value={newRuleMetric}
                      onChange={(e) => setNewRuleMetric(e.target.value as any)}
                      className="bg-slate-900 border border-slate-800 rounded p-1 text-xs text-slate-200"
                    >
                      <option value="stress">压力值</option>
                      <option value="morale">士气值</option>
                      <option value="socialEnergy">社交能量</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1 col-span-1">
                    <span className="text-[10px] text-slate-400 font-mono">条件:</span>
                    <select
                      value={newRuleCondition}
                      onChange={(e) => setNewRuleCondition(e.target.value as any)}
                      className="bg-slate-900 border border-slate-800 rounded p-1 text-xs text-slate-200"
                    >
                      <option value="less_than">低于 &lt;</option>
                      <option value="greater_than">高于 &gt;</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1 col-span-1">
                    <span className="text-[10px] text-slate-400 font-mono">临界值 (%):</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={newRuleThreshold}
                      onChange={(e) => setNewRuleThreshold(Number(e.target.value))}
                      className="bg-slate-900 border border-slate-800 rounded p-1 text-xs text-slate-200"
                    />
                  </div>
                </div>

                {/* 3. Action Intervention Type */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-slate-400 font-mono">自动触发干预手段:</span>
                  <select
                    value={newRuleIntervention}
                    onChange={(e) => setNewRuleIntervention(e.target.value as any)}
                    className="bg-slate-900 border border-slate-800 rounded p-1 text-xs text-slate-200"
                  >
                    <option value="LEAK_SECRET">爆料泄密 (Leak Secret)</option>
                    <option value="FORCE_STATEMENT">定点表态 (Force Statement)</option>
                    <option value="SECRET_WHISPER">密语洗脑 (Secret Whisper)</option>
                    <option value="SOW_DISCORD">挑拨离间 (Sow Discord)</option>
                  </select>
                </div>

                {/* Conditional Fields based on intervention type */}
                {newRuleIntervention === "FORCE_STATEMENT" && (
                  <div className="flex flex-col gap-1 animate-fadeIn">
                    <span className="text-[10px] text-slate-400 font-mono font-bold">强制论述的话题:</span>
                    <input
                      type="text"
                      value={newRuleTopic}
                      onChange={(e) => setNewRuleTopic(e.target.value)}
                      placeholder="例: 会议终极立场抉择"
                      className="bg-slate-905 border border-slate-800 rounded p-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}

                {newRuleIntervention === "SECRET_WHISPER" && (
                  <div className="flex flex-col gap-1 animate-fadeIn">
                    <span className="text-[10px] text-slate-400 font-mono font-bold">暗示立场方向:</span>
                    <select
                      value={newRuleSuggestion}
                      onChange={(e) => setNewRuleSuggestion(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded p-1 text-xs text-slate-200"
                    >
                      <option value="裁员止血">大刀阔斧裁员 (layoffs)</option>
                      <option value="技术大转型">全力 AI 转型 (pivot)</option>
                      <option value="打包出售给巨头">并入科技巨头 (sell)</option>
                    </select>
                  </div>
                )}

                {newRuleIntervention === "SOW_DISCORD" && (
                  <div className="flex flex-col gap-1 animate-fadeIn">
                    <span className="text-[10px] text-slate-400 font-mono font-bold">对立挑拨对象B:</span>
                    <select
                      value={newRuleCharB}
                      onChange={(e) => setNewRuleCharB(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded p-1 text-xs text-slate-200"
                    >
                      {session.characters.map(c => (
                        <option key={c.id} value={c.id}>{c.avatar} {c.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  onClick={addRule}
                  className="mt-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded text-[11px] transition-all"
                >
                  确认启用此规则
                </button>
              </div>
            )}

            {/* Rules List */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider">当前规则库</span>
              {autoRules.length === 0 ? (
                <p className="text-[10px] text-slate-600 italic text-center py-3 bg-slate-950/20 border border-slate-850 border-dashed rounded-xl">
                  暂无自动化监控规则。请点击右上角新增规则！
                </p>
              ) : (
                <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                  {autoRules.map((rule) => {
                    const charName = rule.characterId === "any" ? "任何高管" : session.characters.find(c => c.id === rule.characterId)?.name || rule.characterId;
                    const charAvatar = rule.characterId === "any" ? "👥" : session.characters.find(c => c.id === rule.characterId)?.avatar || "";
                    
                    const metricName = rule.metric === "stress" ? "压力" : rule.metric === "morale" ? "士气" : "社交能量";
                    const opSymbol = rule.condition === "less_than" ? "<" : ">";
                    
                    let ruleActionDesc = "";
                    if (rule.interventionType === "LEAK_SECRET") ruleActionDesc = "自动爆料揭秘";
                    else if (rule.interventionType === "FORCE_STATEMENT") ruleActionDesc = `强制表态「${rule.topic || "当前方案"}」`;
                    else if (rule.interventionType === "SECRET_WHISPER") ruleActionDesc = `密语洗脑「倾向:${rule.suggestion}」`;
                    else if (rule.interventionType === "SOW_DISCORD") {
                      const bName = session.characters.find(c => c.id === rule.charBId)?.name || "指定成员";
                      ruleActionDesc = `挑拨其与 ${bName} 关系`;
                    }

                    return (
                      <div key={rule.id} className={`p-2 rounded-xl border flex justify-between items-center transition-all ${rule.isActive ? "bg-slate-950/40 border-slate-800" : "bg-slate-950/10 border-slate-900 opacity-50"}`}>
                        <div className="flex-1 min-w-0 pr-2">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-xs">{charAvatar}</span>
                            <span className="text-[11px] font-semibold text-slate-300">{charName}</span>
                            <span className="text-[10px] font-mono px-1 py-0.25 bg-slate-900 border border-slate-850 rounded text-indigo-400">
                              {metricName} {opSymbol} {rule.threshold}%
                            </span>
                          </div>
                          <div className="text-[10.5px] font-mono text-slate-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                            <span>触发动作: <strong>{ruleActionDesc}</strong></span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Switch toggle */}
                          <button
                            onClick={() => toggleRuleActive(rule.id)}
                            className={`w-7 h-4 rounded-full p-0.5 transition-colors ${rule.isActive ? "bg-emerald-600" : "bg-slate-800"}`}
                            title={rule.isActive ? "点击禁用规则" : "点击启用规则"}
                          >
                            <div className={`w-3 h-3 rounded-full bg-white transition-transform ${rule.isActive ? "translate-x-3" : "translate-x-0"}`}></div>
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => deleteRule(rule.id)}
                            className="text-slate-600 hover:text-rose-400 p-1 transition-colors"
                            title="删除规则"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Trigger Log History */}
            <div className="flex flex-col gap-1.5 border-t border-slate-850 pt-2.5">
              <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1">
                  <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
                  规则触发记录 / Trigger Log
                </span>
                {autoTriggerLogs.length > 0 && (
                  <button
                    onClick={() => setAutoTriggerLogs([])}
                    className="text-[9px] text-slate-600 hover:text-slate-400"
                  >
                    清空
                  </button>
                )}
              </div>

              {autoTriggerLogs.length === 0 ? (
                <p className="text-[9.5px] text-slate-600 italic text-center py-2">
                  本实验暂未录得自动化规则触发事件。
                </p>
              ) : (
                <div className="flex flex-col gap-1.5 max-h-[120px] overflow-y-auto pr-1 custom-scrollbar text-[10px] font-mono">
                  {autoTriggerLogs.map((log) => (
                    <div key={log.id} className="bg-slate-950/60 p-2 rounded border border-slate-900 flex flex-col gap-1 leading-tight">
                      <div className="flex justify-between text-slate-500 text-[9px]">
                        <span>[Round {log.round}] {log.timestamp}</span>
                        <span className="text-emerald-500">已执行</span>
                      </div>
                      <div className="text-slate-400">检测条件: <span className="text-slate-200">{log.ruleDesc}</span></div>
                      <div className="text-indigo-400 font-semibold">{log.outcome}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Director Interventions Panel */}
          <div className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-purple-400" />
                导演沙盘指令 / Director Controls
              </h3>
              <div className="flex items-center gap-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <span
                    key={i}
                    className={`w-2.5 h-2.5 rounded-full ${
                      i < session.directorEnergy
                        ? "bg-purple-500 shadow-md shadow-purple-500/50 animate-pulse"
                        : "bg-slate-800 border border-slate-700"
                    }`}
                  ></span>
                ))}
              </div>
            </div>

            <div className="flex justify-between text-[11px] text-slate-400 border-b border-slate-850 pb-2">
              <span>导演能量 (Energy): <strong className="text-purple-300 font-mono">{session.directorEnergy} / 3</strong></span>
              <span className="text-[10px] text-slate-500">*每次干涉将消耗 1 点能量</span>
            </div>

            {session.directorEnergy > 0 && isOngoing ? (
              <div className="flex flex-col gap-3">
                {/* Intervention Type Select */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-mono text-slate-400">选择干预手段:</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: "LEAK_SECRET", label: "爆料泄密" },
                      { id: "FORCE_STATEMENT", label: "定点表态" },
                      { id: "SECRET_WHISPER", label: "密语洗脑" },
                      { id: "SOW_DISCORD", label: "挑拨离间" }
                    ].map((btn) => (
                      <button
                        key={btn.id}
                        onClick={() => setInterventionType(btn.id as any)}
                        className={`py-1.5 rounded-lg text-[11px] font-medium border transition-all ${
                          interventionType === btn.id
                            ? "bg-purple-500/20 text-purple-300 border-purple-500/40 shadow"
                            : "bg-slate-950/40 text-slate-400 border-slate-850 hover:text-slate-200"
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Character Target Dropdowns */}
                {interventionType === "SOW_DISCORD" ? (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-mono text-slate-400">高管A:</span>
                      <select
                        value={interveneCharId}
                        onChange={(e) => setInterveneCharId(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-200 focus:outline-none"
                      >
                        {session.characters.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-mono text-slate-400">高管B:</span>
                      <select
                        value={interveneCharId2}
                        onChange={(e) => setInterveneCharId2(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-200 focus:outline-none"
                      >
                        {session.characters.filter(c => c.id !== interveneCharId).map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-mono text-slate-400">干预目标高管:</span>
                    <select
                      value={interveneCharId}
                      onChange={(e) => setInterveneCharId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-200 focus:outline-none"
                    >
                      {session.characters.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Additional custom text fields */}
                {interventionType === "FORCE_STATEMENT" && (
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-mono text-slate-400">点名论述的核心话题:</span>
                    <input
                      type="text"
                      placeholder="例如: 谁应该在第 10 天离开？"
                      value={customTopic}
                      onChange={(e) => setCustomTopic(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none"
                    />
                  </div>
                )}

                {interventionType === "SECRET_WHISPER" && (
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-mono text-slate-400">灌输的生存立场方向:</span>
                    <select
                      value={customSuggestion}
                      onChange={(e) => setCustomSuggestion(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-200 focus:outline-none"
                    >
                      <option value="裁员止血">大刀阔斧裁员 (layoffs)</option>
                      <option value="技术大转型">全力 AI 转型 (pivot)</option>
                      <option value="打包出售给巨头">并入科技巨头 (sell)</option>
                    </select>
                  </div>
                )}

                {/* Submit Action Button */}
                <button
                  onClick={executeIntervention}
                  disabled={loading}
                  className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1 shadow-lg shadow-purple-500/10 border border-purple-400/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  对沙盘下达强制指令
                </button>
              </div>
            ) : (
              <p className="text-[10.5px] text-slate-500 italic text-center p-2.5 border border-slate-850 rounded-xl">
                {!isOngoing 
                  ? "模拟已经宣告结束，沙盘干预指令无法下达。" 
                  : "导演能量已经彻底耗尽（3/3）！你只能依靠角色的自我博弈和共识进展来观看结局。"}
              </p>
            )}
          </div>

        </section>

      </main>

      {/* Game End Splash Splash Overlay */}
      {!isOngoing && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col items-center text-center shadow-2xl relative overflow-hidden">
            
            {/* Ambient lighting effects */}
            <div className="absolute top-[-50px] w-64 h-64 rounded-full blur-[80px] bg-indigo-500/15"></div>

            <div className="w-14 h-14 rounded-2xl bg-slate-850 flex items-center justify-center text-2xl border border-slate-700 select-none mb-4">
              🎓
            </div>

            <h2 className="text-xl sm:text-2xl font-display font-bold tracking-tight text-white mb-1">
              社会学沙盘演化报告
            </h2>
            <p className="text-xs text-slate-400 font-mono mb-4 uppercase tracking-wider">
              Simulation Experiment Outcome Report
            </p>

            <div className={`w-full p-4.5 rounded-2xl border mb-5 flex flex-col items-center ${getEndingDetails(session.world.status).color}`}>
              <h3 className="text-sm sm:text-base font-bold mb-1.5 flex items-center gap-1.5">
                <span className="text-lg">🎯</span>
                {getEndingDetails(session.world.status).title}
              </h3>
              <p className="text-[11.5px] leading-relaxed text-slate-200/90 max-w-xl text-justify sm:text-center">
                {getEndingDetails(session.world.status).desc}
              </p>
            </div>

            {/* Ending distribution grid */}
            <div className="w-full mb-6">
              <h4 className="text-[10.5px] font-mono font-semibold uppercase tracking-wider text-slate-400 text-left mb-2.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                🌐 全局 6 种可能演化结局分布
              </h4>
              <div className="grid grid-cols-2 gap-2 text-left">
                {[
                  { id: "ended_layoffs", title: "🩸 裁员生存优先", desc: "大刀阔斧裁撤50%冗员" },
                  { id: "ended_pivot", title: "⚡ AI 创作转型", desc: "全力压注AI研发新生态" },
                  { id: "ended_sell", title: "🔮 并入科技巨头", desc: "整体打包给Megacorp" },
                  { id: "ended_collapse_morale", title: "🥀 团队就地解体", desc: "士气耗尽，高管决裂辞职" },
                  { id: "ended_collapse_cash", title: "💸 账面资金枯竭", desc: "现金归零进入破产清算" },
                  { id: "ended_stalemate", title: "⏳ 议程无限流产", desc: "互不妥协，无法达成共识" }
                ].map((ending) => {
                  const isCurrent = session.world.status === ending.id;
                  return (
                    <div
                      key={ending.id}
                      className={`p-2.5 rounded-xl border text-xs transition-all relative ${
                        isCurrent
                          ? "bg-indigo-950/40 border-indigo-500 shadow-md shadow-indigo-500/20"
                          : "bg-slate-950/20 border-slate-850/40 opacity-55 hover:opacity-85"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={`font-semibold text-[11px] ${isCurrent ? "text-indigo-300 font-bold" : "text-slate-300"}`}>
                          {ending.title}
                        </span>
                        {isCurrent && (
                          <span className="text-[8px] bg-indigo-600 text-white px-1.5 py-0.5 rounded-md font-mono uppercase font-bold tracking-wider animate-pulse">
                            当前达成
                          </span>
                        )}
                      </div>
                      <p className="text-[9.5px] text-slate-500 leading-snug">{ending.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button
                onClick={exportSimulationReport}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 border border-slate-750 hover:border-slate-700 transition-all active:scale-95"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                导出现场报告 (Export JSON)
              </button>

              <button
                onClick={startNewSession}
                className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 border border-blue-400/20 shadow-lg active:scale-95 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                重启全新沙盘模拟 (Restart)
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Floating High Risk Alert pop-up notification */}
      {showRiskAlert && !dismissAlert && (
        <div className="fixed top-16 right-4 z-50 max-w-sm w-full bg-rose-950/95 border-2 border-rose-500 rounded-2xl p-4 shadow-xl shadow-rose-500/20 backdrop-blur-md animate-slideIn">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/30 animate-pulse text-rose-400 select-none flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <h4 className="text-xs font-bold text-rose-300 font-display uppercase tracking-wider">
                  ⚠️ 高危生存舆情警报
                </h4>
                <button 
                  onClick={() => setDismissAlert(true)}
                  className="text-slate-400 hover:text-white text-[10px] font-mono hover:underline pl-2 select-none"
                >
                  关闭
                </button>
              </div>
              
              <p className="text-[11px] text-slate-300 mt-1 leading-relaxed text-justify">
                {session.world.teamMorale < 20 && session.world.cashDays <= 3 ? (
                  <>公司面临双重末日解体危機：<strong>团队士气仅剩 {session.world.teamMorale}%</strong> 且 <strong>账面现金流仅剩最后 {session.world.cashDays} 天</strong>！高管层将瞬间分崩离析！</>
                ) : session.world.teamMorale < 20 ? (
                  <>人心已散！<strong>公司整体士气跌破 {session.world.teamMorale}% 红色警报线</strong>！成员拒绝妥协，极端对抗。请导演立即动用「爆料泄密」或「密语」进行心理干预！</>
                ) : (
                  <>弹尽粮绝！<strong>现金链仅够维持最后 {session.world.cashDays} 天</strong>！即将面临银行联合清算！请强制要求高管表态或灌输决策方向！</>
                )}
              </p>

              <div className="mt-3 flex items-center gap-1.5 text-[10px] font-semibold text-rose-400">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                <span>请导演立即干预，改变事件演化走向！</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Personal Decision History Review modal */}
      {isHistoryModalOpen && focusedCharacter && (
        <CharacterHistoryModal
          session={session}
          character={focusedCharacter}
          onClose={() => setIsHistoryModalOpen(false)}
        />
      )}

      {/* Footer credits */}
      <footer className="border-t border-slate-800 bg-slate-950/40 text-center py-4 text-[11px] text-slate-500 font-mono mt-auto select-none">
        <p>© 2026 MBTI AI Social Experiment Arena • Crafted with Deepmind Gemini</p>
      </footer>

    </div>
  );
}
