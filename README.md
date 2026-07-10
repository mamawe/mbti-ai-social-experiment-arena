<div align="center">

# ⚡ MBTI AI 社会实验沙盘 · AI Social Experiment Arena

**当 6 个真实人格的高管被关进只剩 30 天现金的会议室，会发生什么？**

一个由 **MBTI 认知科学** 驱动、真人级 AI 对话 + 确定性回退引擎的社会学 / 组织行为学沙盘。
你是 **导演**，也是 **上帝** —— 旁观、干预、改写每一个人的命运。

</div>

---

## ✨ 核心亮点（为什么它「性感」）

### 1. 🧠 真·MBTI 认知科学引擎，不是贴标签
每个角色按 **8 大认知功能**（Te / Ne / Se / Fe / Fi / Si / Ni / Ti）建模，分主导 / 辅助 / 第三 / 劣势四层。
最性感的一点是 —— **认知功能雷达图会随「压力」实时畸变**：
- 高压触发 *劣势功能失控（Grip）*，劣势功能非理性飙升；
- 主导功能隧道思维过载、辅助功能塌陷；
- 雷达形状当场扭曲，决策灵活度被可视化。

这不是装饰，是行为演算本身的可视化。

### 2. 🎭 6 个有秘密、有底牌、会内讧的高管
| 角色 | MBTI | 公开立场 | 绝密底牌（上帝模式可见） |
|------|------|----------|--------------------------|
| 👑 Louis 路易 | ENTJ | 铁腕裁员止血 | 已私下抵押个人房产，只够撑两周 |
| 🎨 Emily 艾米莉 | ENFP | 全员 AI 转型突围 | 核心设计师扬言：强裁就集体辞职 |
| 📊 Ian 伊恩 | ISTJ | 严审账目、拒绝冒险 | 真实数据：本周不裁，第 10 天触发银行违约 |
| ⚡ Ethan 伊森 | ENTP | 用颠覆性 AI 自救 | 原型机有致命算法幻觉，随时崩盘 |
| 🌿 Ivy 艾薇 | ISFJ | 温和调解、保住每个人 | 已出现匿名举报信，指责路易暴政 |
| 🔮 Isabella 伊莎贝拉 | INTJ | 理性打包出售 | 已草签 500 万美金收购意向书，条件是零骨干流失 |

每个人 **公开目标 ≠ 私密目标**，立场在对话中摇摆。**上帝模式（God Mode）** 可揭开所有人的内心独白与绝密底牌。

### 3. 🤖 双引擎：Gemini 真人对话 × 零依赖规则回退
- 配置 `GEMINI_API_KEY` → 走 Gemini 大模型，生成符合角色 MBTI 指纹的实时对话，并产出 **心理学级人格剖析**；
- 未配置密钥 → 自动降级到 **确定性规则引擎**，照样能玩、离线可跑；
- 两条路径共享同一套状态机与世界指标，切换无感。

### 4. 🕸️ 关系动力学图谱（D3 力导向）
信任 / 尊重 / 怨恨 **三维关系网** 实时演化，叠加 **MBTI 相容性矩阵**（ENTJ × ISFJ = 极高裂痕 85 分，ENTJ × INTJ = 极低 20 分）。一句话挑拨离间，整张网当场变色。

### 5. 🎬 导演干预系统 + 自动化规则引擎
**4 种上帝之手**（消耗 3 点导演能量）：
- `LEAK_SECRET` 强制泄密 —— 撕开某人的底牌，信任雪崩
- `FORCE_STATEMENT` 强制表态 —— 点名逼某人就某议题表态
- `SECRET_WHISPER` 心理暗示 —— 暗中把某人推向裁员 / 转型 / 出售
- `SOW_DISCORD` 挑拨离间 —— 撕裂两人脆弱的信任

更狠的是 **自动化规则引擎**：设定「当伊森压力 > 80 自动泄密」，导演能量耗尽前，系统替你操控剧情。

### 6. 📈 多结局叙事 × 实时演化趋势
- **7 种结局**：裁员 / 转型 / 出售 / 士气崩溃 / 现金枯竭 / 僵局 + 原始危机开局
- 现金倒计时、团队士气、共识度 **三条曲线实时演化**（D3 折线图）
- **一键导出 JSON 复盘报告**（含完整事件时间线、关系终态、结局判定）

---

## 🛠 技术栈

| 层 | 技术 |
|----|------|
| 前端 | React 19 + TypeScript + Vite 6 |
| 样式 | Tailwind CSS v4（`@theme` 自定义字体与色板）+ 动效 `motion` + 图标 `lucide-react` |
| 可视化 | D3.js 7（关系力导向图 / 演化趋势图）+ 自绘 SVG 认知雷达 |
| 后端 | Express + Vite 中间件（同端口 3000 开发 / 构建后静态托管） |
| AI | Google Gemini（`@google/genai`），结构化 JSON 输出 + 回退规则引擎 |

---

## 🚀 快速开始

```bash
npm install
# 可选：配置 Gemini 密钥以启用真实大模型对话
# 复制 .env.example 为 .env.local 并填入 GEMINI_API_KEY
cp .env.example .env.local
# 编辑 .env.local: GEMINI_API_KEY="你的密钥"
npm run dev      # 启动 Express + Vite，访问 http://localhost:3000
```

> 不配密钥也能完整运行：引擎会自动回退到规则模式（界面右上角 `apiMode` 会标明 `false`）。

```bash
npm run build    # 产出 dist/ 与打包后的 server.cjs
npm start        # 生产模式启动
```

---

## 📁 项目结构

```
mbti-ai-social-experiment-arena/
├── server.ts                      # Express 后端：会话、模拟、干预、心理剖析、导出
├── src/
│   ├── App.tsx                    # 主界面：三栏布局 + 角色选择 + 提案 + 导演控制台
│   ├── types.ts                   # 全局类型（Character / Relationship / WorldState / Event…）
│   ├── main.tsx
│   ├── index.css                  # Tailwind v4 主题 + 滚动条与流光动画
│   └── components/
│       ├── CognitiveRadarChart.tsx   # 8 认知功能雷达（压力动态畸变）
│       ├── RelationshipGraph.tsx      # D3 关系力导向图 + MBTI 相容性矩阵
│       ├── EvolutionTrendChart.tsx    # 现金 / 士气 / 共识 演化折线图
│       └── CharacterHistoryModal.tsx  # 角色档案与历史心理剖析弹窗
├── index.html
├── vite.config.ts
├── package.json
└── .env.example
```

---

## 🔌 API 速览

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/simulation/start` | 创建新会话，返回 `session` 与 `apiMode` |
| `POST` | `/api/simulation/step` | 推进一步（角色发言 + 回合推进 + 随机导演事件），可带 `customTopic` |
| `POST` | `/api/simulation/vote` | 强制表决，按立场 + 关系权重计票，触发结局 |
| `POST` | `/api/simulation/intervene` | 导演干预（4 类，消耗导演能量） |
| `POST` | `/api/simulation/character-analysis` | MBTI 认知功能心理剖析（Gemini / 回退文案） |
| `POST` | `/api/simulation/godmode` | 切换上帝模式（揭示内心独白与底牌） |
| `POST` | `/api/simulation/notes` | 保存导演笔记 |

---

## 🎮 游戏机制（速读）

- **世界指标**：现金可支撑天数（初始 30）、团队士气（80%）、共识度（20%）、回合（上限 12）
- **导演事件**：第 4 / 7 / 10 轮触发突发危机（核心骨干离职 / 竞品发布会 / 终极倒计时）
- **结局判定**：共识 ≥ 85% 按最高票提案收尾；士气 ≤ 15% 或现金 ≤ 1 天则崩溃；超回合则僵局
- **导演能量**：3 点，每次手动干预消耗 1 点；自动化规则引擎可代为消耗

---

## ⚠️ 已知限制

- 会话保存在内存（`sessions` 对象），重启即清空，未接数据库。
- 规则引擎的发言为确定性脚本，仅 Gemini 模式具备真正即兴对话。
- `server.ts` 主模拟调用 `gemini-3.5-flash`、心理剖析调用 `gemini-2.5-flash`，模型名若与你账号可用模型不一致会自动回退规则引擎（不影响运行）。
- 部分自定义色（如 `slate-850`）在 Tailwind v4 默认色板中需自行定义，缺失时不影响功能、仅样式微调。

---

<div align="center">

**Depth > breadth. 一个 skill 解决一个问题。**

</div>
