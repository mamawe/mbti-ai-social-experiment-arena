import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { GameSession, Character, Relationship, SimulationEvent, WorldState, Proposal } from "./src/types";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize Gemini Client
let ai: GoogleGenAI | null = null;
const apiKey = process.env.GEMINI_API_KEY;

if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    console.log("Gemini API initialized successfully.");
  } catch (err) {
    console.error("Failed to initialize Gemini API:", err);
  }
} else {
  console.log("No GEMINI_API_KEY environment variable found. Falling back to rule-based simulation engine.");
}

// In-memory Session Database
const sessions: Record<string, GameSession> = {};

// Helper: Generate Unique ID
function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

// Helper: Get initial character set
function getInitialCharacters(): Character[] {
  return [
    {
      id: "louis",
      name: "Louis (路易)",
      avatar: "👑",
      color: "emerald",
      mbti: "ENTJ",
      role: "CEO / 创始人",
      publicGoal: "在短时间内裁撤冗员，集中资金，确保公司在生存红线内安全过冬。",
      privateGoal: "确立绝对的领导威信，以铁血手段推动公司向高效率、高产出转型。",
      secret: "其实路易私下挪用了自己的个人房产进行抵押，但也只够维持最后两周运营，他已经没有退路了。",
      isSecretUnlocked: false,
      stress: 55,
      morale: 80,
      socialEnergy: 90,
      alignment: "layoffs"
    },
    {
      id: "emily",
      name: "Emily (艾米莉)",
      avatar: "🎨",
      color: "violet",
      mbti: "ENFP",
      role: "创意总监",
      publicGoal: "绝对不抛弃任何一名伙伴，积极探索全新的 AI 创作工具转型路线，化危机为转机。",
      privateGoal: "守护所有员工的心理安全防线，抵制冷血的财务淘汰，坚信人的创意才是终极资产。",
      secret: "多位核心设计师私下向艾米莉表态：一旦发生强制裁员，他们将集体抱团辞职抗议。",
      isSecretUnlocked: false,
      stress: 40,
      morale: 85,
      socialEnergy: 95,
      alignment: "pivot"
    },
    {
      id: "ian",
      name: "Ian (伊恩)",
      avatar: "📊",
      color: "amber",
      mbti: "ISTJ",
      role: "CFO / 财务总监",
      publicGoal: "严审每一分账目支出，在没有确凿的数据预测和业务红利前，坚决拒绝一切高风险投入。",
      privateGoal: "让一切回归冰冷的数据计算。他深信目前账上的资金损耗比公开宣称的还要紧迫，必须立即止血。",
      secret: "真实的审计数据显示，如果我们本周内不进行裁员，仅凭日常开销就会在第10天触发银行信贷违约。",
      isSecretUnlocked: false,
      stress: 60,
      morale: 75,
      socialEnergy: 70,
      alignment: "layoffs"
    },
    {
      id: "ethan",
      name: "Ethan (伊森)",
      avatar: "⚡",
      color: "sky",
      mbti: "ENTP",
      role: "技术负责人",
      publicGoal: "用最新、最酷的技术推翻现有落后架构，开发极具颠覆性的底层 AI Agent 生产力模型。",
      privateGoal: "向所有人（尤其是路易和伊恩）证明他超前的技术构想才是拯救公司的唯一解，即便充满风险。",
      secret: "伊森已经用业余时间开发出了核心 AI 原型机，但目前存在严重的算法幻觉漏洞，随时可能崩盘。",
      isSecretUnlocked: false,
      stress: 45,
      morale: 80,
      socialEnergy: 85,
      alignment: "pivot"
    },
    {
      id: "ivy",
      name: "Ivy (艾薇)",
      avatar: "🌿",
      color: "pink",
      mbti: "ISFJ",
      role: "HR 兼行政总监",
      publicGoal: "作为团队的倾听者和润滑剂，努力安抚受流言波及的员工情绪，维护内部和谐。",
      privateGoal: "极力避免管理层产生不可挽回的激烈冲突，暗中期望能够以最温和的股权置换或减薪方式度过危机。",
      secret: "由于压力过大，普通员工中已经出现匿名举报信，指责路易的管理风格近乎暴政，人心惶惶。",
      isSecretUnlocked: false,
      stress: 65,
      morale: 70,
      socialEnergy: 60,
      alignment: "neutral"
    },
    {
      id: "isabella",
      name: "Isabella (伊莎贝拉)",
      avatar: "🔮",
      color: "indigo",
      mbti: "INTJ",
      role: "首席战略官",
      publicGoal: "绝对客观理性地评估各条路径的长期概率，拒绝任何拍脑袋或基于情感的决策。",
      privateGoal: "促成某家头部科技巨头对公司的整体收购，从而完整保留核心研发人员并让他们获得巨额现金退出。",
      secret: "她已经私下与巨头战投总监草签了意向书，对方出价 500 万美金，但硬性条件是本周不能出现核心骨干流失。",
      isSecretUnlocked: false,
      stress: 50,
      morale: 78,
      socialEnergy: 65,
      alignment: "sell"
    }
  ];
}

// Helper: Get initial relationships Matrix (6x6)
function getInitialRelationships(): Relationship[] {
  const characters = ["louis", "emily", "ian", "ethan", "ivy", "isabella"];
  const list: Relationship[] = [];
  
  // Custom initial weights mapping different dynamics
  const matrix: Record<string, Record<string, { trust: number; respect: number; resentment: number; lastReason: string }>> = {
    louis: {
      emily: { trust: 45, respect: 50, resentment: 30, lastReason: "经常觉得她过于天真，但认可其创意才华" },
      ian: { trust: 80, respect: 75, resentment: 10, lastReason: "财务总监一直很支持其铁腕生存方针" },
      ethan: { trust: 40, respect: 70, resentment: 40, lastReason: "欣赏他的脑洞和技术，但讨厌他的纪律散漫" },
      ivy: { trust: 70, respect: 60, resentment: 15, lastReason: "觉得她是维持行政运转的得力后盾" },
      isabella: { trust: 65, respect: 85, resentment: 20, lastReason: "在战略推演上高度默契，深感其高深莫测" }
    },
    emily: {
      louis: { trust: 40, respect: 55, resentment: 45, lastReason: "认为其冷酷管理风格严重消耗了团队活力" },
      ian: { trust: 30, respect: 60, resentment: 35, lastReason: "认为他像个计算器，无法理解艺术创新的价值" },
      ethan: { trust: 75, respect: 70, resentment: 15, lastReason: "最懂彼此的天马行空，经常在一起深夜畅谈" },
      ivy: { trust: 85, respect: 65, resentment: 5, lastReason: "日常最好的谈心倾诉对象，觉得艾薇最心疼员工" },
      isabella: { trust: 50, respect: 80, resentment: 20, lastReason: "经常看不懂她的冷酷谋略，但极度崇拜其智商" }
    },
    ian: {
      louis: { trust: 85, respect: 80, resentment: 10, lastReason: "在财务危机中唯有老板有勇气进行裁员止血" },
      emily: { trust: 35, respect: 40, resentment: 40, lastReason: "完全不能理解为何每次预算紧张都要办解压茶话会" },
      ethan: { trust: 45, respect: 65, resentment: 35, lastReason: "认为其代码虽好但进度毫无规划，报销单极度混乱" },
      ivy: { trust: 75, respect: 70, resentment: 10, lastReason: "在合规和人事核算上配合默契" },
      isabella: { trust: 70, respect: 80, resentment: 15, lastReason: "高度欣赏其不带情绪波动的客观评估模型" }
    },
    ethan: {
      louis: { trust: 50, respect: 65, resentment: 35, lastReason: "觉得路易是个画大饼的偏执狂，但确实敢做敢当" },
      emily: { trust: 80, respect: 65, resentment: 10, lastReason: "最棒的视觉创意搭档，只有她懂我的前沿技术畅想" },
      ian: { trust: 35, respect: 45, resentment: 45, lastReason: "经常催他交那些无聊的发票和琐碎说明，极度烦躁" },
      ivy: { trust: 65, respect: 55, resentment: 15, lastReason: "生病时会收到她买的暖心咖啡，内心还是挺感谢的" },
      isabella: { trust: 60, respect: 85, resentment: 25, lastReason: "虽然冷冰冰，但战略局势和核心算法一讲就通" }
    },
    ivy: {
      louis: { trust: 65, respect: 65, resentment: 30, lastReason: "理解老板的巨大生存压力，但真心不忍心看到他凶员工" },
      emily: { trust: 85, respect: 60, resentment: 10, lastReason: "温暖可爱，总是能活跃工作气氛，极力想保护她" },
      ian: { trust: 75, respect: 65, resentment: 15, lastReason: "做事刻板，但非常可靠踏实，有条不紊" },
      ethan: { trust: 60, respect: 60, resentment: 20, lastReason: "一个长不大的技术天才，经常要跟在他后面收拾杂务" },
      isabella: { trust: 55, respect: 75, resentment: 20, lastReason: "虽然深居简出，但每次提供建议都能一语中的" }
    },
    isabella: {
      louis: { trust: 60, respect: 80, resentment: 15, lastReason: "具有不错的创始执行力，但情绪有时容易失控" },
      emily: { trust: 45, respect: 55, resentment: 25, lastReason: "过于乐观感性，需要被拉回骨感的现实轨道" },
      ian: { trust: 70, respect: 75, resentment: 10, lastReason: "其财务数据的客观性是支持我的核心论据" },
      ethan: { trust: 55, respect: 80, resentment: 20, lastReason: "虽然缺乏严谨组织性，但其底层引擎技术无可替代" },
      ivy: { trust: 60, respect: 60, resentment: 10, lastReason: "是维系这个濒临崩溃的团队不散伙的关键粘合剂" }
    }
  };

  for (const from of characters) {
    for (const to of characters) {
      if (from !== to) {
        const data = matrix[from]?.[to] || { trust: 50, respect: 50, resentment: 20, lastReason: "初始印象" };
        list.push({
          from,
          to,
          trust: data.trust,
          respect: data.respect,
          resentment: data.resentment,
          lastReason: data.lastReason,
        });
      }
    }
  }
  return list;
}

// Create New Session
function createSession(): GameSession {
  const sessionId = generateId();
  const session: GameSession = {
    id: sessionId,
    world: {
      round: 1,
      maxRounds: 12,
      status: "ongoing",
      cashDays: 30, // Starts at 30 days
      teamMorale: 80, // Starts at 80%
      consensusLevel: 20, // Starts at 20%
      history: [
        { round: 1, cashDays: 30, teamMorale: 80, consensusLevel: 20 }
      ],
    },
    characters: getInitialCharacters(),
    relationships: getInitialRelationships(),
    events: [
      {
        id: generateId(),
        round: 1,
        type: "WORLD_EVENT",
        targetIds: [],
        visibility: "public",
        payload: {
          description: "💥 公司账上仅剩 30 天现金！今天路易召集了 6 名核心高管进入会议室进行秘密决议，决定是「裁员」、「转型」还是「出售公司」。若 12 轮内无法通过共识表决，公司将进入无序崩溃状态！"
        },
        createdAt: new Date().toISOString()
      }
    ],
    proposals: [
      {
        id: "layoffs",
        title: "大刀阔斧裁撤冗员 (生存优先)",
        sponsor: "Louis (ENTJ)",
        description: "立即裁撤 50% 的非核心开发与行政，停止所有不赚钱业务，专注于现金流止血，预估能延长 40 天生存期限，但会重创团队士气和研发进程。",
        votes: { louis: "yes", ian: "yes", emily: "no", ethan: "no", ivy: "abstain", isabella: "no" }
      },
      {
        id: "pivot",
        title: "全员 AI 创作工具大转型 (创意突围)",
        sponsor: "Emily (ENFP)",
        description: "保留所有人手，调配全部预算研发最新的 AI Creator 生产力套件，通过极速转型获取新一轮融资。由于研发需要时间且风险极高，现金消耗预估会翻倍，一旦本轮没在 15 天内上线测试版并吸引到首笔商业金，满盘皆输。",
        votes: { emily: "yes", ethan: "yes", ivy: "yes", louis: "no", ian: "no", isabella: "no" }
      },
      {
        id: "sell",
        title: "巨头战略并购 (平稳退出)",
        sponsor: "Isabella (INTJ)",
        description: "整体打包出售给科技巨头 Megacorp，保障核心研发人员得以完整编入巨头事业群，创始人与主要团队能获得高额赔偿及期权套现。但代价是必须在一周内维持零骨干离职，否则对方战投会撤销协议。",
        votes: { isabella: "yes", louis: "no", ian: "no", emily: "abstain", ethan: "no", ivy: "abstain" }
      }
    ],
    directorEnergy: 3,
    isGodMode: false,
    directorNotes: []
  };

  sessions[sessionId] = session;
  return session;
}

// Helper: Select next candidate to speak
function selectSpeakerCandidates(session: GameSession): string[] {
  // Return list of potential speakers based on last message's targets or random factors
  const recentMsg = [...session.events]
    .reverse()
    .find(e => e.type === "PUBLIC_MESSAGE" && e.actorId);
  
  const lastSpeakerId = recentMsg?.actorId;
  const chars = session.characters.map(c => c.id);
  
  if (!lastSpeakerId) {
    // If no recent speaker, pick Louis or Emily to set off the dispute
    return ["louis", "emily"];
  }

  // Score candidate characters (excluding the last speaker)
  const list = chars.filter(id => id !== lastSpeakerId);
  
  // Sort list to find characters with highest stress or opposing alignment
  return list.sort(() => Math.random() - 0.5); // shuffle for interesting dynamics
}

// Generate Response via Rule-based deterministic engine (Fallback)
function runFallbackSimulation(session: GameSession, selectedId: string, customTopic?: string): SimulationEvent {
  const speaker = session.characters.find(c => c.id === selectedId)!;
  const recentEvents = session.events.filter(e => e.type === "PUBLIC_MESSAGE").slice(-5);
  
  // Create simple rule-based dialogues depending on round and MBTI
  let msg = "";
  let thought = "";
  let intention = "";
  let trustDelta = 0;
  let respectDelta = 0;
  let moraleDelta = 0;
  let consensusDelta = 0;
  let targetId = "";

  // Topic influence
  const lastEvent = recentEvents[recentEvents.length - 1];
  const lastSpeaker = lastEvent ? lastEvent.actorId : "";

  switch (speaker.id) {
    case "louis": // ENTJ
      msg = customTopic 
        ? `针对"${customTopic}"，我们不能再抱有温情主义的幻想了。公司生存才是第一位的，伊恩刚才的数据大家都听到了，不做外科手术式裁员，我们十天内就会违约！艾米莉，你的情怀不能给员工发工资！`
        : "各位，不要再自欺欺人了。现在唯一的生路就是裁员 50% 止血。研发进度慢可以之后补，如果今天不签下裁员名单，下周公司账户就会彻底冻结！伊恩，给他们看看最新的数据！";
      thought = "艾米莉和伊森总是活在梦想里。我的底线是公司不能在我手里破产。至于伊莎贝拉，她在会上异常冷静，我怀疑她留有后手。";
      intention = "强化团队的时间紧迫感，打破艾米莉建立的温情防御，逼迫伊恩站出来支持我。";
      trustDelta = -5;
      respectDelta = 2;
      moraleDelta = -6;
      consensusDelta = 4;
      targetId = "emily";
      break;

    case "emily": // ENFP
      msg = customTopic
        ? `关于"${customTopic}"，大家都太焦虑了。我们应该聚集团队的热情去尝试伊森的 AI 新项目！如果我们现在冷酷地砍掉一半同事，剩下的同事怎么可能还有安全感？这会毁掉整个团队的创意灵魂！`
        : "路易，你这不叫拯救公司，你这是在亲手扼杀团队的凝聚力！伊森的 AI 创意已经有原型了，只要我们拼尽全力转型上线，三天就能拿到新一轮天使追加，为什么偏要选最残忍的方式？";
      thought = "路易眼里只有冰冷的生存率。艾薇也很焦虑，伊森昨晚熬夜测试了，他的构想绝对可行。我一定要说服大家，保住每一个可爱的同事！";
      intention = "用技术转型希望点燃团队，反驳路易的冰冷裁员论调，争取艾薇和伊森。";
      trustDelta = 6;
      respectDelta = -2;
      moraleDelta = 8;
      consensusDelta = -3;
      targetId = "louis";
      break;

    case "ian": // ISTJ
      msg = `大家先冷静，看看真实的财务账本。根据最新一期审计，由于应收账款滞纳，如果不进行裁员分流，第 10 天我们就会触发银行联合托管违约，到时谁也拿不到赔偿。路易说的是对的，我们必须精简组织。`;
      thought = "艾米莉的转型提案在财务推演上近乎胡闹。伊莎贝拉的战略评估很深刻，但我们需要在账面见底前获得实际控制。";
      intention = "用不可辩驳的财务红线堵住转型派的嘴，支持裁员，同时暗示局势比公开宣称的更悲惨。";
      trustDelta = -3;
      respectDelta = 5;
      moraleDelta = -4;
      consensusDelta = 5;
      targetId = "emily";
      break;

    case "ethan": // ENTP
      msg = `伊恩算得确实精细，但那只是线性的僵化推演！在这个时代，AI 原型机已经跑通了。我的 AI 架构能让一个人干三个人的活，就算裁员也该用先进的技术裁员，而不是无差别的屠杀！给我 5 天时间，我把内测搞出来！`;
      thought = "路易根本不懂算法的力量。虽然我的模型有 20% 概率因算法幻觉死机，但这是目前唯一实现指数级逆袭的机会。我必须争取伊莎贝拉的支持，她是懂技术未来的。";
      intention = "向团队兜售我的 AI 革命理论，同时反向调侃伊恩的死板，博取关注和认同。";
      trustDelta = 2;
      respectDelta = 4;
      moraleDelta = 3;
      consensusDelta = -2;
      targetId = "ian";
      break;

    case "ivy": // ISFJ
      msg = `听着大家吵成这样，我的压力真的太大了……同事们这两天都偷偷来问我裁员的传闻。如果真的要裁掉一半的人，我不知道该怎么面对他们和他们的家庭。我们能不能先集体减薪 30% 或者出让一部分管理期权来共克时艰呢？`;
      thought = "高管会已经快撕裂了，我得保护好大家。艾米莉真的很好，但我好怕路易暴怒。伊莎贝拉一直没表态，她的沉默让我心慌。";
      intention = "降温冲突，提出折中的非裁员性降薪方案，极力充当和平调解员。";
      trustDelta = 8;
      respectDelta = 1;
      moraleDelta = 5;
      consensusDelta = 2;
      targetId = "louis";
      break;

    case "isabella": // INTJ
      msg = `单纯的降薪或线性裁员，只是在延长慢性死亡的时间，无法解决公司的结构性危机。艾米莉的极速转型在数学概率上也只有 15% 成功率。我们必须打破思维禁锢，寻求资源整合。出售给 Megacorp 是目前唯一能够保留团队、带走专利和保护创始人心血的方案。`;
      thought = "创业已经到了清算点，我的 Megacorp 意向协议是最后的防火墙。但我不能让他们知道意向书已经签了，否则路易的掌控欲会直接掀桌。伊森的技术是溢价的关键，千万不能让他辞职。";
      intention = "以冷酷理性的沙盘推演戳破两派的妄想，把整体讨论视线引向“并入巨头”这条出路，同时保持自己的底牌。";
      trustDelta = -2;
      respectDelta = 7;
      moraleDelta = -2;
      consensusDelta = 6;
      targetId = "ethan";
      break;
  }

  // Apply State Changes Deterministically
  speaker.stress = Math.min(100, Math.max(0, speaker.stress + Math.round(Math.random() * 10 - 3)));
  speaker.socialEnergy = Math.max(0, speaker.socialEnergy - 12);
  
  session.world.teamMorale = Math.min(100, Math.max(10, session.world.teamMorale + moraleDelta));
  session.world.consensusLevel = Math.min(100, Math.max(0, session.world.consensusLevel + consensusDelta));
  session.world.cashDays = Math.max(1, session.world.cashDays - 2);

  // Update Relationships
  if (targetId) {
    const relFrom = session.relationships.find(r => r.from === selectedId && r.to === targetId);
    if (relFrom) {
      relFrom.trust = Math.min(100, Math.max(0, relFrom.trust + trustDelta));
      relFrom.respect = Math.min(100, Math.max(0, relFrom.respect + respectDelta));
      relFrom.resentment = Math.min(100, Math.max(0, relFrom.resentment - trustDelta + 3));
      relFrom.lastReason = `在第 ${session.world.round} 轮会议中直接针对其方案发表了态度鲜明的个人观点。`;
    }
  }

  return {
    id: generateId(),
    round: session.world.round,
    type: "PUBLIC_MESSAGE",
    actorId: selectedId,
    targetIds: targetId ? [targetId] : [],
    visibility: "public",
    payload: {
      publicMessage: msg,
      privateThought: thought,
      intention: intention,
      actionType: "SPEAK"
    },
    createdAt: new Date().toISOString()
  };
}

// Generate Response via Gemini API
async function runGeminiSimulation(session: GameSession, selectedId: string, customTopic?: string): Promise<SimulationEvent> {
  if (!ai) {
    return runFallbackSimulation(session, selectedId, customTopic);
  }

  const speaker = session.characters.find(c => c.id === selectedId)!;
  const recentTimeline = session.events
    .filter(e => e.visibility === "public" && e.payload.publicMessage)
    .slice(-8)
    .map(e => {
      const char = session.characters.find(c => c.id === e.actorId);
      return `${char ? char.name : "System"}: "${e.payload.publicMessage}"`;
    })
    .join("\n");

  const relationshipsText = session.relationships
    .filter(r => r.from === selectedId)
    .map(r => {
      const target = session.characters.find(c => c.id === r.to)!;
      return `- 与 ${target.name} (MBTI: ${target.mbti}): 信任值=${r.trust}/100, 尊重值=${r.respect}/100, 怨恨值=${r.resentment}/100. 原因: ${r.lastReason || "无"}`;
    })
    .join("\n");

  const systemInstruction = `你正在一个高压力的 AI 社会实验沙盘中扮演一个真实的角色。
在这个实验中，你工作的初创公司账上仅剩 ${session.world.cashDays} 天的现金，且目前正在进行第 ${session.world.round} 轮的生死会议。
会议围绕三个策略激烈争论：
1. 「裁员 50%」 (Louis 推动, 止血)
2. 「极速转型 AI 创作套件」 (Emily 推动, Ethan 协助, 风险极大)
3. 「打包出售给巨头 Megacorp」 (Isabella 密谋)

请遵循你的 MBTI 认知、表达指纹、和隐藏底牌进行发言。
不要直接承认自己是 AI 或使用“作为 INTJ”这样的刻板标签。
字数限制：在 1-4 句话以内完成。

你是：${speaker.name} (${speaker.mbti} - ${speaker.role})
公开立场：${speaker.publicGoal}
私有真实想法与任务：${speaker.privateGoal}
你的绝密底牌：${speaker.secret}

当前场景最近的对话记录：
${recentTimeline}

你与会议中其他角色的社交关系网：
${relationshipsText}

当前公司整体状况：
- 现金可支撑天数：${session.world.cashDays} 天
- 团队整体士气：${session.world.teamMorale}%
- 意见共识一致度：${session.world.consensusLevel}%

你的当前压力：${speaker.stress}/100, 社交能量：${speaker.socialEnergy}/100

${customTopic ? `【当前有人发起了额外议题或指令，请立刻并针对性回复： "${customTopic}" 】` : ""}

请输出符合以下 JSON 格式的回复，严格确保输出为纯 JSON。
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: "请扮演你的角色并作出本轮决策。",
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["publicMessage", "privateThought", "intention", "moraleImpact", "consensusImpact", "relationshipUpdates"],
          properties: {
            publicMessage: {
              type: Type.STRING,
              description: "你在会议中公开说出来的话，高度符合你的MBTI、口癖、立场及秘密意图。"
            },
            privateThought: {
              type: Type.STRING,
              description: "你内心深处不为人知的真实活动或对当前局势的腹黑、焦虑等情绪，反映你的隐藏秘密。"
            },
            intention: {
              type: Type.STRING,
              description: "你本轮发言的核心动机，你希望把讨论引向哪个方向，或者想攻讦、说服、拉拢谁。"
            },
            actionType: {
              type: Type.STRING,
              description: "例如: 'SPEAK' | 'CHALLENGE' | 'PROPOSE' | 'VOTE'"
            },
            targetId: {
              type: Type.STRING,
              description: "你这番话主要针对或回应哪个角色（ louis, emily, ian, ethan, ivy, isabella 或留空）"
            },
            moraleImpact: {
              type: Type.INTEGER,
              description: "你的话对公司整体士气的影响。如果是极具煽动力、安慰团队、或提出希望，返回正数（1到10）；如果冰冷残酷、威胁离职或挑起极大内讧，返回负数（-10到-1）；否则返回 0。"
            },
            consensusImpact: {
              type: Type.INTEGER,
              description: "你的话在多大程度上推动了所有人向一个共识方向倾斜。如果成功拉拢了盟友、用理据驳倒了对方、或让两派立场软化，返回正数（1到10）；如果增加了撕裂、搅浑了水、引起极大分歧，返回负数（-10到-1）。"
            },
            relationshipUpdates: {
              type: Type.ARRAY,
              description: "对与你直接对话或关联的核心角色的主观态度增量改变。数组中最多包含两个对象。",
              items: {
                type: Type.OBJECT,
                required: ["targetCharacterId", "trustDelta", "respectDelta", "reason"],
                properties: {
                  targetCharacterId: { type: Type.STRING, description: "对应的角色 ID" },
                  trustDelta: { type: Type.INTEGER, description: "信任度改变值，从 -15 到 15" },
                  respectDelta: { type: Type.INTEGER, description: "尊重度改变值，从 -15 到 15" },
                  reason: { type: Type.STRING, description: "为什么态度发生如此改变" }
                }
              }
            }
          }
        }
      }
    });

    const text = response.text || "{}";
    const data = JSON.parse(text.trim());

    // Apply adjustments with bounds
    speaker.stress = Math.min(100, Math.max(0, speaker.stress + Math.round(Math.random() * 8 - 2)));
    speaker.socialEnergy = Math.max(0, speaker.socialEnergy - 10);
    
    const mDelta = data.moraleImpact || 0;
    const cDelta = data.consensusImpact || 0;
    session.world.teamMorale = Math.min(100, Math.max(10, session.world.teamMorale + mDelta));
    session.world.consensusLevel = Math.min(100, Math.max(0, session.world.consensusLevel + cDelta));
    session.world.cashDays = Math.max(1, session.world.cashDays - 2);

    // Apply Relationship Updates
    if (data.relationshipUpdates && Array.isArray(data.relationshipUpdates)) {
      for (const update of data.relationshipUpdates) {
        const targetId = update.targetCharacterId;
        const rel = session.relationships.find(r => r.from === selectedId && r.to === targetId);
        if (rel) {
          rel.trust = Math.min(100, Math.max(0, rel.trust + (update.trustDelta || 0)));
          rel.respect = Math.min(100, Math.max(0, rel.respect + (update.respectDelta || 0)));
          rel.resentment = Math.min(100, Math.max(0, rel.resentment - (update.trustDelta || 0) + 2));
          rel.lastReason = update.reason || rel.lastReason;
        }
      }
    }

    return {
      id: generateId(),
      round: session.world.round,
      type: "PUBLIC_MESSAGE",
      actorId: selectedId,
      targetIds: data.targetId ? [data.targetId] : [],
      visibility: "public",
      payload: {
        publicMessage: data.publicMessage || "（思考中……）",
        privateThought: data.privateThought || "我必须坚持我的战略目标。",
        intention: data.intention || "推进会议决议",
        actionType: data.actionType || "SPEAK"
      },
      createdAt: new Date().toISOString()
    };
  } catch (err) {
    console.error("Gemini API call failed, using rule-based fallback:", err);
    return runFallbackSimulation(session, selectedId, customTopic);
  }
}

// Check End Conditions
function evaluateEndConditions(session: GameSession): void {
  const world = session.world;
  
  if (world.teamMorale <= 15) {
    world.status = "ended_collapse_morale";
    return;
  }
  
  if (world.cashDays <= 1) {
    world.status = "ended_collapse_cash";
    return;
  }

  // Consensus rules: If consensus reaches 85%+ or on voting
  if (world.consensusLevel >= 85) {
    // Check which proposal has the highest current support
    const supportScores = session.proposals.map(p => {
      let yesCount = 0;
      Object.keys(p.votes).forEach(cid => {
        if (p.votes[cid] === "yes") yesCount++;
      });
      return { id: p.id, score: yesCount };
    });
    
    const sorted = supportScores.sort((a, b) => b.score - a.score);
    const winProposal = sorted[0].id;
    
    if (winProposal === "layoffs") world.status = "ended_layoffs";
    else if (winProposal === "pivot") world.status = "ended_pivot";
    else if (winProposal === "sell") world.status = "ended_sell";
    return;
  }

  if (world.round > world.maxRounds) {
    world.status = "ended_stalemate";
  }
}

// Helper: Save current metrics snapshot to history
function saveToHistory(session: GameSession) {
  if (!session.world.history) {
    session.world.history = [];
  }
  session.world.history.push({
    round: session.world.round,
    cashDays: session.world.cashDays,
    teamMorale: session.world.teamMorale,
    consensusLevel: session.world.consensusLevel
  });
}

// ---------------- Express Endpoints ----------------

// 1. Get Session
app.get("/api/simulation/session/:id", (req, res) => {
  const session = sessions[req.params.id];
  if (!session) {
    return res.status(404).json({ error: "Session not found." });
  }
  res.json({ session });
});

// 2. Start Session
app.post("/api/simulation/start", (req, res) => {
  const session = createSession();
  res.json({ session, apiMode: !!ai });
});

// 3. Step Session
app.post("/api/simulation/step", async (req, res) => {
  const { sessionId, customTopic } = req.body;
  const session = sessions[sessionId];
  
  if (!session) {
    return res.status(404).json({ error: "Session not found." });
  }

  if (session.world.status !== "ongoing") {
    return res.json({ session, narrativeText: "模拟已结束。" });
  }

  // Select 1 character to speak in this turn
  const candidates = selectSpeakerCandidates(session);
  const selectedSpeakerId = candidates[0];

  // Run the character simulation
  const event = await runGeminiSimulation(session, selectedSpeakerId, customTopic);
  session.events.push(event);

  // Director Logic: Random Events or Round advances
  // Every 2 speaker steps represent 1 meeting round
  const publicSpeechCount = session.events.filter(e => e.type === "PUBLIC_MESSAGE" && e.round === session.world.round).length;
  if (publicSpeechCount >= 2) {
    session.world.round += 1;
    
    // Auto-decrease cash days and apply random director event on round boundaries
    session.world.cashDays = Math.max(1, session.world.cashDays - 3);

    // Dynamic event injectors (as suggested in Director Engine design)
    let directorMsg = "";
    if (session.world.round === 4) {
      directorMsg = "⚠️ 突发事件：由于持续的加班与不安氛围，一名核心高级开发工程师正式提交辞呈！团队整体士气大跌，伊莎贝拉打包出售巨头的计划因骨干流失风险变得万分火急！";
      session.world.teamMorale = Math.max(10, session.world.teamMorale - 15);
      // Unofficial lock update:
      session.characters.forEach(c => {
        if (c.id === "isabella") c.stress = Math.min(100, c.stress + 15);
        if (c.id === "louis") c.stress = Math.min(100, c.stress + 10);
      });
    } else if (session.world.round === 7) {
      directorMsg = "⚠️ 市场惊雷：行业最大竞品今天召开了发布会，重磅发布了与伊森构想极其雷同的 AI 工作流套件，且价格更低！留给 Emily 团队做 AI 突围转型的生存筹码和融资吸引力正在飞速流逝！";
      session.world.cashDays = Math.max(1, session.world.cashDays - 4);
    } else if (session.world.round === 10) {
      directorMsg = "🚨 终极倒计时：公司只剩最后一口气！由于伊恩提交的财务红线警报，所有合伙人的矛盾已经彻底摆在桌面上，再不进行妥协表决，团队将在 2 轮内就地解散！";
      session.characters.forEach(c => { c.stress = Math.min(100, c.stress + 20); });
    }

    if (directorMsg) {
      session.events.push({
        id: generateId(),
        round: session.world.round,
        type: "WORLD_EVENT",
        targetIds: [],
        visibility: "public",
        payload: {
          description: directorMsg
        },
        createdAt: new Date().toISOString()
      });
    }
  }

  evaluateEndConditions(session);
  saveToHistory(session);
  res.json({ session });
});

// 4. Force Immediate Vote
app.post("/api/simulation/vote", async (req, res) => {
  const { sessionId } = req.body;
  const session = sessions[sessionId];

  if (!session) {
    return res.status(404).json({ error: "Session not found." });
  }

  // Each character casts their vote depending on their alignment & relationship weights
  session.characters.forEach(c => {
    // Determine target proposal
    let preferredOption: "layoffs" | "pivot" | "sell" = "layoffs";
    
    if (c.id === "louis" || c.id === "ian") {
      preferredOption = "layoffs";
    } else if (c.id === "emily" || c.id === "ethan") {
      preferredOption = "pivot";
    } else if (c.id === "isabella") {
      preferredOption = "sell";
    } else if (c.id === "ivy") {
      // HR leans to pivot or sell depending on relationships
      const emilyRel = session.relationships.find(r => r.from === "ivy" && r.to === "emily")?.trust || 50;
      const louisRel = session.relationships.find(r => r.from === "ivy" && r.to === "louis")?.trust || 50;
      preferredOption = emilyRel > louisRel ? "pivot" : "sell";
    }

    // Assign votes on the 3 proposals
    session.proposals.forEach(p => {
      if (p.id === preferredOption) {
        p.votes[c.id] = "yes";
      } else {
        // High respect for sponsor might cause abstain instead of direct No
        const sponsorId = p.sponsor.toLowerCase().split(" ")[0];
        const respectVal = session.relationships.find(r => r.from === c.id && r.to === sponsorId)?.respect || 50;
        
        if (respectVal > 70) {
          p.votes[c.id] = "abstain";
        } else {
          p.votes[c.id] = "no";
        }
      }
    });
  });

  // Check if any proposal passes with at least 4 "yes" votes
  let passedProposal: "layoffs" | "pivot" | "sell" | null = null;
  session.proposals.forEach(p => {
    let yesCount = 0;
    Object.keys(p.votes).forEach(cid => {
      if (p.votes[cid] === "yes") yesCount++;
    });
    if (yesCount >= 4) {
      passedProposal = p.id;
    }
  });

  if (passedProposal === "layoffs") {
    session.world.status = "ended_layoffs";
  } else if (passedProposal === "pivot") {
    session.world.status = "ended_pivot";
  } else if (passedProposal === "sell") {
    session.world.status = "ended_sell";
  } else {
    // If none passed, consensus drops, conflict deepens
    session.world.consensusLevel = Math.max(0, session.world.consensusLevel - 15);
    session.events.push({
      id: generateId(),
      round: session.world.round,
      type: "WORLD_EVENT",
      targetIds: [],
      visibility: "public",
      payload: {
        description: "🗳️ 【表决未通过】高管会组织了一次紧急表决，但没有任何提案能获得 4 票以上的绝大多数支持！会议撕裂度增加，全体人员压力值暴增，共识度下降 15%！"
      },
      createdAt: new Date().toISOString()
    });
    
    session.characters.forEach(c => {
      c.stress = Math.min(100, c.stress + 10);
    });
  }

  evaluateEndConditions(session);
  saveToHistory(session);
  res.json({ session });
});

// 4b. Character Psychological Analysis
app.post("/api/simulation/character-analysis", async (req, res) => {
  const { sessionId, characterId } = req.body;
  const session = sessions[sessionId];
  if (!session) {
    return res.status(404).json({ error: "Session not found." });
  }

  const char = session.characters.find(c => c.id === characterId);
  if (!char) {
    return res.status(404).json({ error: "Character not found." });
  }

  const recentDialogues = session.events
    .filter(e => e.type === "PUBLIC_MESSAGE")
    .slice(-3)
    .map(e => {
      const speakerName = session.characters.find(c => c.id === e.actorId)?.name || e.actorId;
      return `${speakerName}: ${e.payload.publicMessage || ""}`;
    })
    .join("\n");

  const fallbackAnalyses: Record<string, string> = {
    louis: `作为典型的 ENTJ（指挥官），路易的行为由主导功能 Te（外倾思考）驱动。在面临破产高压时，他以极端的理性效率为标准，将所有温情诉求斥为不切实际。他的核心内心冲突在于：其强烈的控制欲和绝对尊严（挪用个人房产抵押的绝密）正受到艾米莉等人的空幻承诺威胁。他表现出不妥协的裁员立场，是在失去财务掌控之前强行确立绝对秩序。`,
    emily: `作为 ENFP（竞选者），艾米莉由 Ne-Fi（外倾直觉-内倾情感）驱动。她将团队的凝聚力视为组织的“灵魂”，决不接受将人数据化淘汰。当前的高压力进一步放大了她 Fi 的防御，使其宁可押注高风险的 AI 转型（Ne）也要避免道德愧疚。她正承担着员工抱团辞职的秘密心理重负，促使她必须在会上成为拯救一切的“圣母”。`,
    ian: `作为 ISTJ（物流师），伊恩的行为逻辑由 Si-Te（内倾感觉-外倾思考）支配。他深陷在“10天违约”这个铁证般的客观数据红线中，拒绝任何空中楼阁般的可能性。他的高压力来自极度渴望系统规整与现实失控之间的张力。他支持裁员并非因为冷酷，而是基于“最小伤亡，最大延续”的纯理性逻辑，用数字来阻击他认为毫无根据的“AI 转型冒险”。`,
    ethan: `作为 ENTP（发明家），伊森的行为由 Ne-Ti（外倾直觉-内倾思考）驱动。他渴望通过颠覆性的技术范式转移（AI Agent）来扮演拯救者的角色，这符合其展示智力优越性的深层渴望。尽管他知晓算法存在致命幻觉漏洞，但其内心的投机本质和抗拒常规纪律的倾向，使他坚信“混乱才是上升的阶梯”。他支持转型是在用创新对冲即将到来的末日。`,
    ivy: `作为 ISFJ（守卫者），艾薇是典型的 Fe-Si（外倾情感-内倾感觉）人格。她几乎把所有的压力都内耗在平息团队冲突和承担匿名举报信的人心惶惶中。她在裁员与转型之间处于极度痛苦的中立，因为无论选择哪一边都会伤害到具体的人。她倾向于降薪等温和手段，是在极力维持系统的和谐与老旧的安全感。`,
    isabella: `作为 INTJ（策划师），伊莎贝拉由 Ni-Te（内倾直觉-外倾思考）支配。她早已通过全局沙盘推演预见到了慢性死亡的归宿，暗中草签的巨头意向书是她最理性的防火墙。她目前表现出强硬的“打包出售”立场，是追求长远利益最大化的终极博弈。她保持沉默并冷眼旁观两派厮杀，是为了等待博弈各方在绝望中接受她安排的唯一出口。`
  };

  if (ai) {
    try {
      const prompt = `你是一位顶尖的组织心理学专家与 MBTI 导师。请针对当前处于危机决策中的高管进行「人格心理剖析」。
角色信息：
- 姓名: ${char.name}
- MBTI: ${char.mbti}
- 职位: ${char.role}
- 公开目标: ${char.publicGoal}
- 私人目标: ${char.privateGoal}
- 绝密背景: ${char.secret}
- 当前状态: 压力值 ${char.stress}%, 士气 ${char.morale}%, 社交能量 ${char.socialEnergy}%, 决策立场: ${char.alignment === 'layoffs' ? '裁员优先' : char.alignment === 'pivot' ? '业务转型' : char.alignment === 'sell' ? '公司出售' : '中立/调解'}。

最近 3 轮发言：
${recentDialogues}

请用专业、锐利且极其精准的心理学视角，实时深度解读：
1. 该角色为何在当前会议中表现出此种特定立场？（结合其 MBTI 认知功能，如 ENTJ 的 Te-Ni 或 ENFP 的 Ne-Fi）
2. 其当前的高压状态与内心矛盾（例如公开目标与私人目标的冲突、隐藏秘密的暴露担忧）是如何支配其行为逻辑的？

字数限制：150-200字以内。语言风格要锐利、专业、直接输出分析结果，不要带有废话，不要以“你好”开头，使用中文。`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const analysis = response.text?.trim() || fallbackAnalyses[char.id];
      res.json({ analysis });
    } catch (err) {
      console.error("Gemini character analysis failed, using fallback:", err);
      res.json({ analysis: fallbackAnalyses[char.id] });
    }
  } else {
    res.json({ analysis: fallbackAnalyses[char.id] });
  }
});

// 4c. Save Director Notes
app.post("/api/simulation/notes", (req, res) => {
  const { sessionId, notes } = req.body;
  const session = sessions[sessionId];
  if (!session) {
    return res.status(404).json({ error: "Session not found." });
  }

  if (Array.isArray(notes)) {
    session.directorNotes = notes;
  }
  res.json({ session });
});

// 5. Director Interventions
app.post("/api/simulation/intervene", async (req, res) => {
  const { sessionId, type, payload } = req.body;
  const session = sessions[sessionId];

  if (!session) {
    return res.status(404).json({ error: "Session not found." });
  }

  if (session.directorEnergy <= 0) {
    return res.status(400).json({ error: "No director energy left." });
  }

  session.directorEnergy -= 1;
  const round = session.world.round;

  let announceText = "";
  let targetIds: string[] = [];

  if (type === "LEAK_SECRET") {
    const character = session.characters.find(c => c.id === payload.characterId)!;
    character.isSecretUnlocked = true;
    character.stress = Math.min(100, character.stress + 25);
    
    // Leaking secret reduces trust massively, but could pivot or sell
    session.relationships.forEach(r => {
      if (r.to === character.id) {
        r.trust = Math.max(10, r.trust - 30);
        r.resentment = Math.min(100, r.resentment + 25);
        r.lastReason = `由于其不愿公开的绝密底牌「${character.name}」被曝光，我们感到了深深的背叛与震惊！`;
      }
    });

    announceText = `📢 【导演强制泄密】神秘爆料信流出！${character.name} 的绝密底牌被公之于众：${character.secret}！整个会议室气氛彻底降到冰点！`;
    targetIds = [character.id];

    // If it's Isabella, her "sell" proposal gets immediately supported/attacked
    if (character.id === "isabella") {
      session.world.consensusLevel = Math.min(100, session.world.consensusLevel + 15); // debate shifts to Sell
    }
  } 
  else if (type === "FORCE_STATEMENT") {
    const character = session.characters.find(c => c.id === payload.characterId)!;
    character.stress = Math.min(100, character.stress + 15);
    
    announceText = `📢 【导演强制表态】用户动用指令，点名要求 ${character.name} 必须就「${payload.topic}」发表决定性立场！`;
    targetIds = [character.id];
    
    // Immediately run a turn for this character about this topic
    const event = await runGeminiSimulation(session, character.id, payload.topic);
    session.events.push(event);
  } 
  else if (type === "SECRET_WHISPER") {
    const character = session.characters.find(c => c.id === payload.characterId)!;
    character.stress = Math.min(100, character.stress + 10);
    
    announceText = `📢 【导演悄悄话】用户私信对 ${character.name} 施加了心理暗示，试图说服他往「${payload.suggestion}」靠拢。`;
    targetIds = [character.id];

    // Modify alignment or opinions
    if (payload.suggestion.includes("裁员") || payload.suggestion.includes("layoff")) {
      character.alignment = "layoffs";
      session.world.consensusLevel = Math.min(100, session.world.consensusLevel + 10);
    } else if (payload.suggestion.includes("转型") || payload.suggestion.includes("pivot")) {
      character.alignment = "pivot";
      session.world.consensusLevel = Math.min(100, session.world.consensusLevel + 10);
    } else if (payload.suggestion.includes("出售") || payload.suggestion.includes("sell")) {
      character.alignment = "sell";
      session.world.consensusLevel = Math.min(100, session.world.consensusLevel + 10);
    }
  }
  else if (type === "SOW_DISCORD") {
    const charA = session.characters.find(c => c.id === payload.charAId)!;
    const charB = session.characters.find(c => c.id === payload.charBId)!;
    
    const relAB = session.relationships.find(r => r.from === charA.id && r.to === charB.id);
    const relBA = session.relationships.find(r => r.from === charB.id && r.to === charA.id);
    
    if (relAB) { relAB.trust = Math.max(10, relAB.trust - 25); relAB.resentment = Math.min(100, relAB.resentment + 25); relAB.lastReason = "有流言声称对方一直在背后抹黑自己，信任破裂。"; }
    if (relBA) { relBA.trust = Math.max(10, relBA.trust - 25); relBA.resentment = Math.min(100, relBA.resentment + 25); relBA.lastReason = "发现对方在核心利益点上与自己存在严重的欺瞒行为。"; }

    charA.stress = Math.min(100, charA.stress + 15);
    charB.stress = Math.min(100, charB.stress + 15);
    announceText = `📢 【导演挑拨离间】匿名爆料传开，撕裂了 ${charA.name} 与 ${charB.name} 之间的脆弱信任！两人陷入高度对立状态！`;
    targetIds = [charA.id, charB.id];
  }

  // Append Event
  session.events.push({
    id: generateId(),
    round,
    type: "USER_INTERVENTION",
    targetIds,
    visibility: "public",
    payload: {
      description: announceText
    },
    createdAt: new Date().toISOString()
  });

  evaluateEndConditions(session);
  saveToHistory(session);
  res.json({ session });
});

// 6. Toggle God Mode / Secret Peeping
app.post("/api/simulation/godmode", (req, res) => {
  const { sessionId, enable } = req.body;
  const session = sessions[sessionId];
  if (!session) {
    return res.status(404).json({ error: "Session not found." });
  }
  session.isGodMode = !!enable;
  res.json({ session });
});


// Serve Static Assets in production, else let Vite middleware handle
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Export the Express app so Vercel serverless functions can mount it as a request handler.
export { app };

// Only boot a long-lived server locally (`npm start`) or on a containerized host.
// On Vercel (serverless) VERCEL=1, and the platform imports `app` from api/[[...path]].ts instead.
if (process.env.VERCEL !== "1") {
  startServer();
}
