# Multi-Agent Architecture Patterns for Business-Work Automation (as of Sept 2026)

Research notes. Access caveat: arxiv.org, cognition.ai/cognition.com, research.google and docs.langchain.com were blocked by the network proxy in this session. Claims about those sources come from search-result snippets (flagged "[snippet]") rather than full-text reads; the Anthropic posts and the OpenAI guide (via a markdown mirror) were read in full.

## Q1. What architectures do the major vendors and frameworks recommend, and what trade-offs do they state?

### Takeaway
The vendors agree more than they differ. Start with a single agent or a deterministic workflow. Move to a central orchestrator/manager with isolated workers only when the work can run in parallel, is too large for one context window, or needs clearly different tools. Peer-to-peer handoffs ("swarm"/decentralized) fit routing-style conversations. Parallel agents that each write to shared output are widely reported to break.

### Cited Findings
**Anthropic, "Building effective agents" (Dec 19, 2024)**
- Distinguishes *workflows* ("LLMs and tools are orchestrated through predefined code paths") from *agents* ("LLMs dynamically direct their own processes and tool usage"). — [Anthropic](https://www.anthropic.com/engineering/building-effective-agents)
- Six patterns: prompt chaining (fixed sequential subtasks with programmatic checkpoints), routing (classify, then send to a specialized handler), parallelization (sectioning or voting), orchestrator-workers (a central LLM splits up *unpredictable* subtasks, e.g. coding or multi-source research), evaluator-optimizer (a generator plus a critic loop, used when clear criteria exist), and autonomous agents (open-ended, many unpredictable steps). — [Anthropic](https://www.anthropic.com/engineering/building-effective-agents)
- Advice: "start simple". Frameworks add abstraction that hides prompts and makes debugging harder. Agentic systems "trade latency and cost for better task performance", so use them only when that trade clearly pays off. — [Anthropic](https://www.anthropic.com/engineering/building-effective-agents)

**Anthropic, "How we built our multi-agent research system" (Jun 13, 2025)**
- Orchestrator-worker setup: a lead agent (Claude Opus 4) plans and spawns parallel subagents (Claude Sonnet 4), each with its own context. On an internal research eval it scored **90.2% higher than single-agent Opus 4**. — [Anthropic](https://www.anthropic.com/engineering/multi-agent-research-system)
- Cost: agents use about **4x** the tokens of a chat interaction, and multi-agent systems about **15x**. Token usage alone explains **80% of performance variance** on BrowseComp; tool calls and model choice explain most of the rest. — [Anthropic](https://www.anthropic.com/engineering/multi-agent-research-system)
- Good fits: breadth-first queries, heavy parallelization, information larger than one context window, and high-value tasks that justify the cost. Poor fits: most coding tasks, domains where all agents need the same context, and tasks that need real-time coordination between agents. — [Anthropic](https://www.anthropic.com/engineering/multi-agent-research-system)
- Practices: teach the orchestrator to delegate with an explicit objective, output format, tools and task boundaries for each worker. Put effort-scaling rules in the prompt (a simple query gets 1 agent with 3–10 tool calls; a complex one gets 10+ subagents). Parallel tool calls cut research time by up to about 90%. — [Anthropic](https://www.anthropic.com/engineering/multi-agent-research-system)

**Anthropic/Claude blog, "Building multi-agent systems: when and how to use them" (Jan 23, 2026)**
- Multi-agent consistently helps in three cases: **context protection** (keeping unrelated information out of the main context), **parallelization**, and **specialization** (agents with 20+ tools often struggle). — [Claude blog](https://claude.com/blog/building-multi-agent-systems-when-and-how-to-use-them)
- Multi-agent setups "typically use 3–10x more tokens than single-agent approaches for equivalent tasks", because context is duplicated, coordination adds overhead and results must be summarized. — [Claude blog](https://claude.com/blog/building-multi-agent-systems-when-and-how-to-use-them)
- **Split by context, not by role.** Do not split work by type of task (planner / coder / tester), because every handoff loses context. Group work by what context it needs. — [Claude blog](https://claude.com/blog/building-multi-agent-systems-when-and-how-to-use-them)
- A pattern that reliably works: a **verification subagent** that tests the main agent's output without needing its full history. It needs explicit completion criteria. — [Claude blog](https://claude.com/blog/building-multi-agent-systems-when-and-how-to-use-them)

**OpenAI, "A practical guide to building agents" (2025)**
- "Maximize a single agent's capabilities first." Split only when there is (a) complex conditional logic or (b) tool overload. Tool overload depends on how much tools overlap, not how many there are: some agents handle "more than 15 well-defined, distinct tools" while others struggle with "fewer than 10 overlapping tools". — [OpenAI PDF](https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf); read via [markdown mirror](https://gist.github.com/testy-cool/86cafd426ba22e3e8c1d6d2c853506c4)
- Two multi-agent patterns. **Manager**: a central agent calls specialists as tools and keeps the user context and the final synthesis; use it when one agent should control the workflow. **Decentralized**: peers hand off control to each other; use it when no central synthesis is needed, e.g. triage. — [OpenAI guide mirror](https://gist.github.com/testy-cool/86cafd426ba22e3e8c1d6d2c853506c4)
- Guardrails and escalation to a human when agent limits are exceeded (for example, repeated failures to understand intent) and for actions that are "sensitive, irreversible, or have high stakes" such as refunds or payments. — [OpenAI guide mirror](https://gist.github.com/testy-cool/86cafd426ba22e3e8c1d6d2c853506c4)

**Microsoft, Magentic-One (Nov 2024; AutoGen, now also in Microsoft Agent Framework)**
- An Orchestrator directs a WebSurfer, a FileSurfer, a Coder and a ComputerTerminal agent. The outer loop keeps a **Task Ledger** (facts, guesses, plan). The inner loop keeps a **Progress Ledger** (self-reflection on progress, next assignment, completion check). It re-plans when progress stalls. — [Microsoft Research](https://www.microsoft.com/en-us/research/articles/magentic-one-a-generalist-multi-agent-system-for-solving-complex-tasks/); [AutoGen docs](https://microsoft.github.io/autogen/stable//user-guide/agentchat-user-guide/magentic-one.html)
- Results: about 38% task completion on GAIA, "statistically competitive" with the state of the art at the time on GAIA, AssistantBench and WebArena. — [Magentic-One paper (HTML)](https://arxiv.org/html/2411.04468v1) [snippet]; [MS Agent Framework Magentic orchestration](https://learn.microsoft.com/en-us/agent-framework/workflows/orchestrations/magentic)

**LangChain/LangGraph, "Benchmarking Multi-Agent Architectures" (Jun 2025)**
- Compared single agent, swarm (peer handoffs) and supervisor on τ-bench retail while adding more "distractor" domains (unrelated tools and instructions). The single agent **degraded sharply as distractor context grew**. Swarm did best overall. The supervisor improved by about 50% after engineering fixes: removing handoff messages from worker context and letting the supervisor forward a worker's answer verbatim instead of paraphrasing it. — [LangChain blog](https://www.langchain.com/blog/benchmarking-multi-agent-architectures) [snippet]

**CrewAI**
- A *sequential* process runs tasks in fixed order. A *hierarchical* process has a manager agent that plans, delegates and validates, without pre-assigned tasks. — [CrewAI Processes docs](https://docs.crewai.com/en/concepts/processes); [Hierarchical Process](https://docs.crewai.com/en/learn/hierarchical-process)
- Practitioner guidance (secondary sources, not official): use sequential for most workflows because it is predictable, easy to debug and cheapest. With 10+ tasks the manager's context window becomes the bottleneck. A widely cited analysis argues that CrewAI's manager-worker mode often fails in practice because the manager does not delegate as intended. — [CrewAI help center](https://help.crewai.com/ware-are-the-key-differences-between-hierarchical-and-sequential-processes-in-crewai); [Towards Data Science](https://towardsdatascience.com/why-crewais-manager-worker-architecture-fails-and-how-to-fix-it/)

**Google Research / DeepMind / MIT, "Towards a Science of Scaling Agent Systems" (Dec 2025, arXiv 2512.08296)**
- Compared single-agent (SAS) with four multi-agent topologies (Independent, Centralized, Decentralized, Hybrid) across 180 configurations. — [Google Research blog](https://research.google/blog/towards-a-science-of-scaling-agent-systems-when-and-why-agent-systems-work/) [snippet]; [arXiv PDF](https://arxiv.org/pdf/2512.08296) [snippet]
- Centralized coordination improved performance by about 80.8% on *parallelizable* tasks. Multi-agent setups *degraded sequential* tasks by up to about 70%. **Independent agents amplified errors 17.2x, while centralized coordination held this to 4.4x.** A predictive model built on coordination metrics reached cross-validated R²≈0.52. — [Google Research blog](https://research.google/blog/towards-a-science-of-scaling-agent-systems-when-and-why-agent-systems-work/) [snippet]; [emergentmind summary](https://www.emergentmind.com/papers/2512.08296)

### Inferences
- A defensible default for business automation is a deterministic workflow skeleton (chaining or routing) with agentic steps inside it. Escalate to an orchestrator-worker setup only for read-heavy, parallelizable subtasks such as research, triage or data gathering. Keep one agent, or deterministic code, responsible for the final write or action.
- "Hierarchical/manager" in CrewAI and OpenAI's "manager pattern" are the same idea as Anthropic's orchestrator-workers. "Swarm/handoff" is the same as OpenAI's decentralized pattern. Frameworks name them differently, but there are really only about four topologies: pipeline, star (central orchestrator), peer handoff, and group chat/debate.
- Blackboard or shared-state designs show up mainly as *ledgers or shared state inside a central orchestrator* (Magentic-One's Task/Progress Ledger, LangGraph shared state), not as a leaderless blackboard.

### Gaps
- Could not read Google's ADK multi-agent pattern documentation (research.google and Google docs were blocked or not reached). Google's position here rests only on the scaling paper.
- Did not verify the exact current LangGraph documentation wording (docs.langchain.com blocked). The LangChain benchmark numbers come from a search snippet.
- The Magentic-One GAIA figure (38%) comes from a search snippet of the paper. The exact version and model (GPT-4o / o1) were not verified.
- No rigorous academic evaluation of a pure blackboard architecture for business tasks was found in this pass.

## Q2. Does having agents "hold meetings" or debate actually improve output?

### Takeaway
Mostly no, at equal compute. Most of the measured gain from multi-agent debate comes from ensembling (sampling several answers and taking a majority vote), not from the discussion. Discussion often adds conformity and sycophancy that flips correct answers to wrong ones. Where "meetings" help, they involve structured, independent critique: a verifier or reviewer that does not share the author's context. Free-form consensus-seeking does not show this benefit.

### Cited Findings
- **"Debate or Vote" (Choi et al., NeurIPS 2025, arXiv 2508.17536):** splits multi-agent debate into ensembling plus communication. It finds that "majority voting alone accounts for most of the performance gains" and that voting without debate usually matches debate. In theory, debate is a **martingale**: an agent's expected belief in the correct answer does not change across rounds, so debate alone does not move the group toward the truth. — [NeurIPS 2025 paper](https://proceedings.neurips.cc/paper_files/paper/2025/file/934252acd87f254d5d4672fbde283bd2-Paper-Conference.pdf); [arXiv](https://arxiv.org/pdf/2508.17536) [snippet]
- **Huang et al., "Large Language Models Cannot Self-Correct Reasoning Yet" (ICLR 2024):** with the same number of responses, multi-agent debate is only slightly better than, or below, self-consistency (majority vote). It is better understood as a way to get "consistency" across generations than as real critique. — [arXiv 2310.01798](https://arxiv.org/pdf/2310.01798) [snippet]
- **"Talk Isn't Always Cheap" (Wynn, Satija, Hadfield, ICML 2025 workshop / arXiv 2509.05396):** debate can make results *worse* than a single agent. Models often switch from correct to incorrect answers after reading peer reasoning, agreeing instead of pushing back. A weaker agent can pull a stronger one down. Longer debates can degrade further. — [arXiv abs](https://arxiv.org/abs/2509.05396) [snippet]; [ICML page](https://icml.cc/virtual/2025/49332)
- **"Not All Flips Are Conformity" (2026, arXiv 2606.00820):** on MMLU-Pro, 37% of agent-question observations change under self-reflection alone, so about 40% of apparent "peer influence" is instability. Strict conformity is about 29% and mostly harmful (57–77% of those flips go correct→wrong). — [arXiv HTML](https://arxiv.org/html/2606.00820) [snippet]
- **"Too Polite to Disagree" (2026, arXiv 2604.02668):** sycophancy spreads between debating agents. They reinforce each other instead of engaging, which raises cost and weakens robustness. — [arXiv HTML](https://arxiv.org/html/2604.02668v1) [snippet]
- **"Stay Focused: Problem Drift in Multi-Agent Debate" (2025, arXiv 2502.19559):** documents *problem drift*, where debates wander away from the original task over rounds. — [arXiv PDF](https://arxiv.org/pdf/2502.19559) [title/snippet only]
- **"Voting or Consensus?" (ACL Findings 2025):** compares decision protocols in multi-agent debate. Which protocol works best depends on the task, so the choice of aggregation rule matters. — [ACL Anthology](https://aclanthology.org/2025.findings-acl.606/) [snippet; detailed numbers not verified]
- **Counterpoint, where "meetings" do help:** Cognition (Apr 22, 2026) reports that pairing a coding agent with a *separate review agent that shares no prior context* catches most bugs before a human sees the PR. — [Cognition blog](https://cognition.com/blog/multi-agents-working) [snippet]. Anthropic likewise reports that independent verification subagents are one of the most reliable multi-agent patterns. — [Claude blog](https://claude.com/blog/building-multi-agent-systems-when-and-how-to-use-them)

### Inferences
- For business workflows, a "meeting" of role-played agents (e.g., CEO, CFO, marketer) that discuss until they agree is unlikely to beat N independent drafts plus a vote or a judge, and it will cost more.
- If a discussion step is used, prefer: independent first answers generated before anyone sees the others; heterogeneous models or information sources; an explicit devil's-advocate or verifier with pass/fail criteria; a round limit; and aggregation by vote or a judge rather than "consensus".

### Gaps
- Found no controlled study of debate or "meetings" specifically on business-document tasks (proposals, analyses). Most evidence comes from QA and math benchmarks.
- Could not read full texts of the 2026 sycophancy and conformity papers. The percentages come from abstracts or snippets.

## Q3. What are the documented failure modes, their root causes, and which mitigations have empirical support?

### Takeaway
MAST (NeurIPS 2025 Datasets & Benchmarks) is the standard taxonomy. About 42% of failures come from specification and system design, about 37% from inter-agent misalignment, and about 21% from weak verification. Most failures are design and organization problems, not model-capability limits. The best-supported mitigations are centralized coordination, context sharing (or not splitting), a single writer, independent verification, explicit stop and effort rules, and observability.

### Cited Findings
- **MAST, "Why Do Multi-Agent LLM Systems Fail?" (Cemri et al., arXiv 2503.13657; NeurIPS 2025 D&B):** built from 150 traces with expert annotation (κ = 0.88). It defines 14 failure modes in 3 categories: **Specification/system-design issues ≈41.8%**, **Inter-agent misalignment ≈36.9%**, **Task verification ≈21.3%**. — [NeurIPS PDF](https://proceedings.neurips.cc/paper_files/paper/2025/file/b1041e52d3be19f0a9bc491657488e4a-Paper-Datasets_and_Benchmarks_Track.pdf); [arXiv](https://arxiv.org/abs/2503.13657) [snippet]
  - Frequent modes named in secondary summaries: step repetition, disobeying the task specification, reasoning-action mismatch, information withholding, ignoring another agent's input, premature termination, and no or incomplete verification. — [orq.ai summary](https://orq.ai/blog/why-do-multi-agent-llm-systems-fail) (secondary; the per-mode percentages quoted there, e.g. "step repetition 37%", were not verified against the paper and may use a different denominator)
  - The authors argue that failures reflect organizational design (like human organizations) and that simple prompt or role fixes give only limited gains. — [NeurIPS PDF](https://proceedings.neurips.cc/paper_files/paper/2025/file/b1041e52d3be19f0a9bc491657488e4a-Paper-Datasets_and_Benchmarks_Track.pdf) [not read in full; specific intervention numbers such as ChatDev improvements unverified]
- **Context loss and conflicting implicit decisions (Cognition, Jun 2025):** "Share context, and share full agent traces, not just individual messages". "Actions carry implicit decisions, and conflicting decisions carry bad results." Example: subagents building a Flappy Bird clone produced mismatched art styles and game mechanics because neither saw the other's choices. Recommendation: a single-threaded linear agent, with a compression model for long histories. — [Cognition blog](https://cognition.com/blog/dont-build-multi-agents) [snippet]; [HN discussion](https://news.ycombinator.com/item?id=45096962); [Jason Liu summary](https://jxnl.co/writing/2025/09/11/why-cognition-does-not-use-multi-agent-systems/)
- **Update (Cognition, Apr 22, 2026):** multi-agent now works for them *only* in a narrow class: "one writer", with other agents contributing only intelligence (review, codebase-context subagents that behave like tool calls). Parallel writers are still called fragile. — [Cognition blog](https://cognition.com/blog/multi-agents-working) [snippet]; [X post](https://x.com/walden_yan/status/2047054401341370639)
- **Error compounding and amplification:** independent multi-agent systems amplify errors 17.2x versus 4.4x under centralized coordination, and sequential tasks degrade by up to about 70% with multi-agent setups. — [Google Research blog](https://research.google/blog/towards-a-science-of-scaling-agent-systems-when-and-why-agent-systems-work/) [snippet]. Anthropic: long-running agents hold state over many turns, "errors compound", and non-determinism makes debugging hard. They addressed this with resumable checkpoints, full production tracing and rainbow deployments. — [Anthropic](https://www.anthropic.com/engineering/multi-agent-research-system)
- **Runaway cost and effort:** early versions of Anthropic's system spawned 50 subagents for simple queries, searched endlessly for sources that did not exist, duplicated work across subagents, and kept going after they had enough. Fixed with explicit delegation descriptions and effort-scaling rules. — [Anthropic](https://www.anthropic.com/engineering/multi-agent-research-system). Token multipliers: 15x chat ([Anthropic](https://www.anthropic.com/engineering/multi-agent-research-system)); 3–10x a single agent ([Claude blog](https://claude.com/blog/building-multi-agent-systems-when-and-how-to-use-them)).
- **Lossy relay by the supervisor ("telephone game"):** the LangChain supervisor improved about 50% once the supervisor forwarded a worker's answer directly instead of paraphrasing it, and once handoff clutter was removed. — [LangChain blog](https://www.langchain.com/blog/benchmarking-multi-agent-architectures) [snippet]
- **Groupthink and sycophancy in debate:** see Q2 ("Talk Isn't Always Cheap"; conformity at 57–77% harmful flips). — [arXiv 2509.05396](https://arxiv.org/abs/2509.05396); [arXiv 2606.00820](https://arxiv.org/html/2606.00820)
- **Goal or problem drift:** Magentic-One's Progress Ledger explicitly checks for stalls and loops and re-plans. — [Microsoft Research](https://www.microsoft.com/en-us/research/articles/magentic-one-a-generalist-multi-agent-system-for-solving-complex-tasks/). The debate literature documents problem drift. — [arXiv 2502.19559](https://arxiv.org/pdf/2502.19559) [snippet]
- **Manager bottleneck:** in CrewAI hierarchical mode with many tasks, the manager's context becomes the bottleneck. — [CrewAI help center / secondary](https://help.crewai.com/ware-are-the-key-differences-between-hierarchical-and-sequential-processes-in-crewai)

**Mitigations with some empirical support**
| Mitigation | Evidence |
|---|---|
| Centralized orchestrator instead of independent agents | Error amplification 4.4x vs 17.2x ([Google](https://research.google/blog/towards-a-science-of-scaling-agent-systems-when-and-why-agent-systems-work/)) |
| Split by context, not by role; share full traces | [Claude blog](https://claude.com/blog/building-multi-agent-systems-when-and-how-to-use-them); [Cognition](https://cognition.com/blog/dont-build-multi-agents) |
| Single writer; other agents only read or advise | [Cognition 2026](https://cognition.com/blog/multi-agents-working) |
| Independent verifier/reviewer that shares no context, with explicit pass criteria | [Claude blog](https://claude.com/blog/building-multi-agent-systems-when-and-how-to-use-them); [Cognition 2026](https://cognition.com/blog/multi-agents-working) |
| Detailed delegation specs plus effort-scaling rules | [Anthropic](https://www.anthropic.com/engineering/multi-agent-research-system) |
| Forward worker output verbatim; strip handoff clutter | +~50% supervisor ([LangChain](https://www.langchain.com/blog/benchmarking-multi-agent-architectures)) |
| Majority vote or ensembling instead of free debate | [Debate or Vote](https://proceedings.neurips.cc/paper_files/paper/2025/file/934252acd87f254d5d4672fbde283bd2-Paper-Conference.pdf) |
| Task/Progress ledgers with stall detection and re-planning | [Magentic-One](https://www.microsoft.com/en-us/research/articles/magentic-one-a-generalist-multi-agent-system-for-solving-complex-tasks/) |
| Human escalation for irreversible or high-stakes actions; guardrails | [OpenAI guide](https://gist.github.com/testy-cool/86cafd426ba22e3e8c1d6d2c853506c4) |
| Tracing, checkpoints and resumability; small evals early (~20 cases) plus LLM-judge rubrics | [Anthropic](https://www.anthropic.com/engineering/multi-agent-research-system) |

### Inferences
- In business-automation terms, the MAST split means roughly 60% of failures could be designed out through clear role specs, termination criteria, context handoff formats and verification gates, before any model upgrade.
- "Agents as a company org chart" (many role agents passing messages) combines the worst of these risks: it splits by role (losing context), adds many relay steps (lossy relays, error amplification) and invites consensus-seeking (sycophancy).

### Gaps
- Could not verify MAST per-mode percentages or its intervention case-study numbers from primary text.
- Found no quantitative cost-overrun data from real enterprise deployments, only token multipliers from vendors.

## Q4. When is a single agent with tools better than multi-agent?

### Takeaway
A single agent, or a workflow, is better when the task is **sequential or tightly coupled**, when every step needs the same context, when the output is one integrated artifact written by one hand, when the tool set is small and clearly distinct, or when the budget is constrained. Multi-agent wins when the task **splits into independent, read-heavy subtasks**, overflows one context window, or needs toolsets that clearly differ or would distract each other.

### Cited Findings
- Multi-agent degrades sequential tasks by up to about 70% and helps parallelizable ones by up to about 81%. — [Google Research blog](https://research.google/blog/towards-a-science-of-scaling-agent-systems-when-and-why-agent-systems-work/) [snippet]
- Anthropic names coding, shared-context domains and tasks needing real-time coordination as poor fits for multi-agent, and breadth-first research as a good fit. — [Anthropic](https://www.anthropic.com/engineering/multi-agent-research-system)
- OpenAI: maximize a single agent first and split only on complex branching logic or overlapping tools. — [OpenAI guide mirror](https://gist.github.com/testy-cool/86cafd426ba22e3e8c1d6d2c853506c4)
- Anthropic 2026: start with the simplest approach. Multi-agent costs 3–10x tokens. Justified cases are context protection, parallelization, and specialization when 20+ tools are involved. — [Claude blog](https://claude.com/blog/building-multi-agent-systems-when-and-how-to-use-them)
- Cognition: a single-threaded agent with context compression is more reliable for tightly coupled work, and parallel writers are fragile. — [Cognition 2025](https://cognition.com/blog/dont-build-multi-agents); [Cognition 2026](https://cognition.com/blog/multi-agents-working) [snippets]
- Counter-evidence: when a single agent is overloaded with many unrelated domains or tools, it degrades, and swarm or supervisor setups do better. — [LangChain](https://www.langchain.com/blog/benchmarking-multi-agent-architectures) [snippet]

### Inferences
Decision checklist for a business-automation designer:
1. Can a fixed workflow (chain or router) do it? If so, use code-driven orchestration.
2. If not, does one agent with at most about 10–15 distinct tools fit the context? If so, use a single agent.
3. Split only if one of these holds:
   - subtasks are independent and read-heavy (use an orchestrator plus parallel workers);
   - the domains or tools are clearly distinct (use routing or handoffs);
   - an independent check is valuable (add a verifier agent).
4. Keep one writer or decision-maker. Never let peers "agree" their way to a final output.
5. Budget for 3–15x the tokens, and add stop rules, ledgers, tracing and human approval for irreversible actions.

### Gaps
- No head-to-head study of single-agent versus multi-agent on typical back-office tasks (accounting, sales ops, document drafting) was found. Existing evidence comes from research, coding and QA benchmarks plus vendor case studies.
- Model progress (larger context windows, better long-horizon reasoning in 2026 models) may shift the break-even point. Found no 2026 study that updates the Google scaling results for newer models.
