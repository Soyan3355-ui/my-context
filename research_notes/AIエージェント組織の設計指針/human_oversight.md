# Human Oversight of AI Agents: Balancing Autonomy and Control (as of Sept 2026)

Research notes (sources are 2024–2026 unless noted). Note on access: arxiv.org, techcrunch.com, imda.gov.sg and warontherocks.com were blocked by the fetch proxy, so claims from those sources rely on search-result abstracts and snippets, not full-text reads. Those items are marked [snippet].

## Q1. What autonomy-level frameworks exist?

### Takeaway
Several frameworks now treat autonomy as a deliberate design setting rather than something that simply follows capability. The most widely cited are Feng/McDonald/Zhang's 5 user-role levels (Knight Institute, 2025) and AWS's 4 "scopes" of agency. They all run along the same line: a human does the work, then a human approves each action, then a human approves by exception, then a human only watches with a stop button. Anthropic's product permission modes (default, auto, skip-permissions) are a real-world version of the same idea.

### Cited Findings
- **Knight First Amendment Institute / UW, "Levels of Autonomy for AI Agents" (Feng, McDonald, Zhang, June 2025).** Five levels, each defined by the user's role:
  - L1 Operator: the user makes all decisions.
  - L2 Collaborator: the user and agent share planning and execution, with fluid hand-offs.
  - L3 Consultant: the agent leads and consults the user for expertise and preferences.
  - L4 Approver: the agent works independently and asks for approval in high-risk or pre-defined cases.
  - L5 Observer: the agent is fully autonomous, and the user can only monitor or hit an emergency stop.
  - — [Knight Institute](https://knightcolumbia.org/content/levels-of-autonomy-for-ai-agents-1); [arXiv 2506.12469](https://arxiv.org/abs/2506.12469)
- The same paper argues that "an agent's level of autonomy can be treated as a deliberate design decision, separate from its capability and operational environment." It also proposes "autonomy certificates" to govern agent behavior [snippet]. — [arXiv 2506.12469](https://arxiv.org/abs/2506.12469)
- **AWS Agentic AI Security Scoping Matrix (late 2025).** Four scopes:
  - Scope 1, No Agency: read-only, recommends only.
  - Scope 2, Prescribed Agency: can change the environment, but every change needs mandatory human approval.
  - Scope 3, Supervised Agency: human-initiated, then executes autonomously within bounded parameters with no further per-action approval.
  - Scope 4, Full Agency: self-initiates based on external events.
  - The matrix separates *agency* (which actions and systems an agent can reach) from *autonomy* (how far it acts without a human stepping in). — [AWS](https://aws.amazon.com/ai/security/agentic-ai-scoping-matrix/); [CSA extension](https://cloudsecurityalliance.org/blog/2025/12/16/enhancing-the-agentic-ai-security-scoping-matrix-a-multi-dimensional-approach)
- AWS recommends progressive autonomy: start at Scope 1 or 2, then advance as confidence and security capabilities mature, with governance around each step up. — [AWS scoping matrix](https://aws.amazon.com/ai/security/agentic-ai-scoping-matrix/) (as summarized in search results)
- **Anthropic Claude Code permission modes.** There are three modes:
  - Default: every action needs approval.
  - Auto mode: a classifier reviews each tool call and blocks "mass deleting files, sensitive data exfiltration, or malicious code execution."
  - `--dangerously-skip-permissions`: no restrictions.
  - Auto mode "reduces risk compared to --dangerously-skip-permissions but doesn't eliminate it entirely." — [Claude blog: Auto mode](https://claude.com/blog/auto-mode)
- Auto mode became the default for Pro, Max and Team plans from Aug 14, 2026. Anthropic claimed it is "as safe or safer than an average user clicking through prompts." — [claude.com blog](https://claude.com/blog/auto-mode-default-in-claude-code); [The Register](https://www.theregister.com/ai-and-ml/2026/08/10/claude-code-puts-auto-mode-in-the-drivers-seat/5285326); [9to5Mac](https://9to5mac.com/2026/08/14/psa-claude-code-enabling-auto-mode-as-default-next-week-anthropic-says/)
- **OpenAI, "Practices for Governing Agentic AI Systems" (Dec 2023; older, but still the reference point).** Seven practices: evaluate task suitability, constrain the action space (require human approval for significant actions), set default behaviors, ensure legibility of agent activity, use automatic monitoring, ensure attributability, and keep agents interruptible. — [OpenAI](https://openai.com/index/practices-for-governing-agentic-ai-systems/)
- **Anthropic, "Our framework for developing safe and trustworthy agents" (2025).** Five principles: control, transparency, alignment, privacy, security. Humans "should retain control over how their goals are pursued, particularly before high-stakes decisions are made." Claude Code is read-only by default and asks before code changes. — [Anthropic](https://www.anthropic.com/news/our-framework-for-developing-safe-and-trustworthy-agents)
- **Singapore IMDA, Model AI Governance Framework for Agentic AI (2026).** Exists as a government framework on agent risk and human accountability. Full text could not be fetched. — [IMDA PDF](https://www.imda.gov.sg/-/media/imda/files/about/emerging-tech-and-research/artificial-intelligence/mgf-for-agentic-ai.pdf)
- **EU AI Act Art. 14 (for high-risk systems).** Humans must be able to:
  - understand the system's capacities and limits;
  - remain aware of automation bias;
  - interpret outputs correctly;
  - override or reverse outputs;
  - interrupt via "a 'stop' button or a similar procedure" that halts the system in a safe state.
  - — [artificialintelligenceact.eu Art. 14](https://artificialintelligenceact.eu/article/14/)

### Inferences
- The frameworks line up roughly as: Knight L1–2 ≈ AWS Scope 1; Knight L3–4 ≈ AWS Scope 2–3 and Claude Code "default"/"auto"; Knight L5 ≈ AWS Scope 4 and skip-permissions.
- The SAE driving-automation analogy (L0–L5) is often invoked, but the Knight paper deliberately defines levels by the *human's role*, not by capability. That makes it more useful for designing an organization than for describing what a model can do.
- For an agent organization, each agent or role can be given an explicit level per *action class*, not one level for the whole agent.

### Gaps
- I did not find a formal SAE-style standard for AI agents from a standards body (ISO/SAE). The NIST initiative, as described in secondary sources, is still at the concept-paper stage.
- I could not read the IMDA framework text directly because the fetch was blocked.

## Q2. Which decisions need human approval vs. delegation? Risk classification

### Takeaway
The consensus is to gate by consequence rather than by action count. Four dimensions recur across sources:
- **Reversibility:** can the action be undone?
- **Reach:** does it act outside the sandbox, or is it externally visible (for example, sending email)?
- **Destructiveness or blast radius:** for example, mass deletes.
- **Data sensitivity:** for example, exfiltration or credential use.

Real-world data shows that truly irreversible actions are a small share of all actions, so tightly gating them costs little.

### Cited Findings
- The Claude Code auto-mode classifier targets actions that are "irreversible, destructive, or aimed outside your environment." — [The Register](https://www.theregister.com/ai-and-ml/2026/08/10/claude-code-puts-auto-mode-in-the-drivers-seat/5285326); [Claude blog](https://claude.com/blog/auto-mode)
- **Anthropic API tool-call data (Feb 2026):**
  - 80% of tool calls "appear to have at least one kind of safeguard."
  - 73% "appear to have a human in the loop in some way."
  - Only 0.8% "appear to be irreversible (such as sending an email to a customer)."
  - Software engineering is about 50% of tool calls.
  - — [Anthropic, Measuring AI agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy)
- **Classifier error trade-off:**
  - About 0.4% of benign commands are blocked (false positives).
  - About 17% of "overeager" risky actions get through (false negatives).
  - The classifier is framed as one layer of defense-in-depth inside a sandbox, not a replacement for one.
  - — [The Register](https://www.theregister.com/ai-and-ml/2026/08/10/claude-code-puts-auto-mode-in-the-drivers-seat/5285326) and search summaries of Anthropic's engineering post
- Anthropic reports that the classifier prevented an off-network data leak, a destructive mass operation, and an overly broad privilege escalation internally. — [The Register](https://www.theregister.com/ai-and-ml/2026/08/10/claude-code-puts-auto-mode-in-the-drivers-seat/5285326)
- The OpenAI practices paper recommends constraining the action space and requiring human approval for significant or irreversible actions, while logging lower-stakes ones. — [OpenAI](https://openai.com/index/practices-for-governing-agentic-ai-systems/)
- **Industry guidance on risk tiers:**
  - Auto-approve low-risk reversible work inside policy.
  - Block clearly dangerous actions outright.
  - Send only ambiguous, high-impact actions to humans.
  - — [tianpan.co, Approval Fatigue (2026)](https://tianpan.co/blog/2026/06/25/approval-fatigue-how-human-in-the-loop-gates-decay-into-rubber-stamps) (practitioner blog; lower authority)
- **Least-privilege identity for agents.** Each agent deployment should have distinct credentials, scoped to the minimum needed, time-limited, and revocable independently of any human account. This is CSA's interpretation of the NIST CAISI AI Agent Standards Initiative, announced Feb 17, 2026. — [CSA research note](https://labs.cloudsecurityalliance.org/research/csa-research-note-nist-ai-agent-standards-initiative-complia/) (secondary to NIST)
- **DeepMind "Intelligent AI Delegation" (Tomašev, Franklin, Osindero, Feb 2026).** Delegation is framed as more than splitting up tasks. It also covers transfer of authority, responsibility and accountability, clear role boundaries, clarity of intent, and trust mechanisms [snippet]. — [arXiv 2602.11865](https://arxiv.org/abs/2602.11865); [TechInformed](https://techinformed.com/google-deepmind-proposes-intelligent-delegation-for-enterprise-ai-agents/)

### Inferences
- A practical approval matrix could look like this:
  - **Auto:** read-only work, and reversible work inside the sandbox.
  - **Classifier or policy check:** writes to shared resources.
  - **Human pre-approval:** irreversible actions, external communication (customers or the public), spending money, credentials or permission changes, and deleting production data.
  - **Forbidden:** outside the mandate.
- Because only about 1% of actions are irreversible, a "human approves the irreversible" gate is cheap, while "human approves everything" is expensive and ineffective (see Q3).

### Gaps
- I found no validated quantitative scoring rubric (for example, cost thresholds in dollars) from a primary authority. Thresholds appear to be organization-specific.
- I did not read the full DeepMind paper (arXiv blocked), so its specific task-attribute taxonomy (criticality, verifiability, and so on) is not confirmed here.

## Q3. Checkpoint placement and evidence on approval fatigue / rubber-stamping

### Takeaway
Per-action approval measurably decays into rubber-stamping. The evidence:
- Claude Code users approve 93–97% of prompts.
- In a controlled test, humans caught only 13.6% of dangerous commands.
- Reviewers of AI agents' code approve more, and comment less, over time.

The better design moves human attention to fewer, higher-leverage points: plan or intent approval, irreversible actions, and monitoring with interrupt. Anthropic explicitly warns against mandating "approve every action."

### Cited Findings
- Anthropic: "Oversight requirements that prescribe specific interaction patterns, such as requiring humans to approve every action, will create friction without necessarily producing safety benefits." — [Anthropic, Measuring agent autonomy](https://www.anthropic.com/research/measuring-agent-autonomy)
- **How experienced users change their oversight** (from the same Anthropic study):
  - New users (<50 sessions) use full auto-approve in about 20% of sessions; experienced users (750+ sessions) in over 40%.
  - Interruption rises from 5% of turns (around 10 sessions) to about 9% for experienced users.
  - Anthropic reads this as a shift from action-by-action approval to active monitoring.
  - — [Anthropic](https://www.anthropic.com/research/measuring-agent-autonomy)
- **Share of permission prompts approved in Claude Code.** Sources report two figures, and I could not confirm the primary one:
  - 93% — [The Register](https://www.theregister.com/ai-and-ml/2026/08/10/claude-code-puts-auto-mode-in-the-drivers-seat/5285326) / [Help Net Security](https://www.helpnetsecurity.com/2026/08/10/anthropic-claude-code-auto-mode/)
  - 97% — other coverage of the Aug 2026 announcement.
- **Controlled experiment (1,053 paid professional testers):** human review caught 13.6% of dangerous commands, versus 89% for auto mode. — [The Register](https://www.theregister.com/ai-and-ml/2026/08/10/claude-code-puts-auto-mode-in-the-drivers-seat/5285326); [Help Net Security](https://www.helpnetsecurity.com/2026/08/10/anthropic-claude-code-auto-mode/)
- **"Habituation at the Gate" (arXiv 2606.22721, KDD 2026 SE 3.0 workshop)** [snippet]:
  - 400 repeat reviewers wrote 11,429 reviews of AI-agent code over 7 months.
  - The approval rate rose from 30.1% to 36.8% overall, and by +14.5 pp within reviewers from their 1st to 10th experience decile.
  - Inline comments fell 22%, while review latency rose 3.5×.
  - The authors say this is "most consistent with reflexive habituation under growing workload rather than rational trust calibration."
  - — [arXiv 2606.22721](https://arxiv.org/abs/2606.22721)
- Practitioner framing: rubber-stamping is "worse than no gate at all" because it looks like oversight without being oversight. Past some volume, reviewers switch from "is this correct?" to "does this look like the last forty that were fine?" — [tianpan.co](https://tianpan.co/blog/2026/04/15/human-in-the-loop-rubber-stamp); [TechTarget](https://www.techtarget.com/it-strategy/news/366649960/The-human-in-the-loop-is-falling-asleep)
- EU AI Act Art. 14(4)(b) explicitly requires overseers to "remain aware of" automation bias. Legal scholarship questions whether oversight is effective given human cognitive limits. — [Art. 14](https://artificialintelligenceact.eu/article/14/); [arXiv 2502.10036, Automation Bias in the AI Act](https://arxiv.org/pdf/2502.10036)
- Anthropic recommends investing in "tools that give users trustworthy visibility into what agents are doing, along with simple intervention mechanisms," and post-deployment monitoring, because many behaviors "cannot be observed through pre-deployment testing alone." — [Anthropic](https://www.anthropic.com/research/measuring-agent-autonomy)
- Claude Code's default is read-only, and it asks before code changes, so the checkpoint sits at the moment the environment would be modified. — [Anthropic framework](https://www.anthropic.com/news/our-framework-for-developing-safe-and-trustworthy-agents)

### Inferences
- **Recommended checkpoint stack:**
  1. Intent and plan approval up front, where one human decision covers many actions.
  2. Automated policy and classifier gates for routine actions.
  3. Hard human gates only for irreversible or external actions.
  4. Milestone reviews on outputs, not steps.
  5. Random sampling audits after the fact, to detect drift and keep reviewers calibrated.
  6. An always-available stop or interrupt.
- **Metrics that signal gate decay** (from the habituation study): approval rate trending up, comment or edit rate down, and queue latency up. Rotating reviewers, capping volume, and seeding known-bad items are plausible countermeasures.

### Gaps
- I found no peer-reviewed study giving the optimal sampling rate for audits of agent actions.
- Claims that "plan approval" beats per-step approval are mostly practitioner opinion; I found no controlled experiment.

## Q4. Escalation design: when should an agent stop and ask?

### Takeaway
Escalation should be triggered by:
- (a) ambiguity or uncertainty about intent;
- (b) needing something the agent lacks, such as credentials or access;
- (c) hitting a policy block repeatedly;
- (d) predefined interrupt thresholds such as budget, time or risk.

On complex tasks, agents now stop themselves more often than humans interrupt them. Research is moving toward deciding when to ask based on the *value* of the information a question would bring.

### Cited Findings
- **Agent-initiated stops in Claude Code:**
  - On the most complex tasks, Claude Code asks for clarification "more than twice as often" as on minimal ones.
  - Agent-initiated stops happen more often than humans interrupt.
  - Top reasons: proposing a choice of approach (35%), gathering diagnostic data (21%), requesting credentials (12%).
  - — [Anthropic, Measuring agent autonomy](https://www.anthropic.com/research/measuring-agent-autonomy)
- Anthropic: "Training models to recognize their own uncertainty and surface issues to humans proactively is an important safety property." Claude is trained to ask clarifying questions when a task is ambiguous. — [Anthropic measuring autonomy](https://www.anthropic.com/research/measuring-agent-autonomy); [Anthropic framework](https://www.anthropic.com/news/our-framework-for-developing-safe-and-trustworthy-agents)
- **Circuit breaker in auto mode.** If Claude keeps attempting blocked actions, it falls back to asking the user. Press reports the rule as 3 consecutive blocks or 20 blocks per session. — [Claude blog](https://claude.com/blog/auto-mode); [The Register](https://www.theregister.com/ai-and-ml/2026/08/10/claude-code-puts-auto-mode-in-the-drivers-seat/5285326)
- **Structured Uncertainty guided Clarification (SAGE-Agent, ACL Findings 2026)** [snippet]:
  - Scores candidate clarifying questions by cost-penalized Expected Value of Perfect Information (EVPI).
  - On ClarifyBench, it improves coverage on ambiguous tasks by 7–39% while asking 1.5–2.7× fewer questions.
  - Uncertainty-guided training raises When2Call accuracy from 36.5% to 65.2% (3B model).
  - — [ACL Anthology](https://aclanthology.org/2026.findings-acl.2028/); [arXiv 2511.08798](https://arxiv.org/html/2511.08798v2)
- **Interrupt conditions.** Effective oversight needs "predefined thresholds at which agent execution is paused and human review is required," together with real-time monitoring. Every deployment needs an identified accountable human and mandatory human override. — [CSA note on NIST initiative](https://labs.cloudsecurityalliance.org/research/csa-research-note-nist-ai-agent-standards-initiative-complia/) (secondary)
- Interruptibility, meaning reliable shutdown, is described as "the ultimate way in which humans can remain in control." — [OpenAI practices](https://openai.com/index/practices-for-governing-agentic-ai-systems/)

### Inferences
- **Escalation rules for an agent organization:**
  - Ask when the ambiguity would change the outcome, which is the EVPI idea.
  - Ask when an action falls outside the delegated scope.
  - Ask after N policy blocks or failed attempts.
  - Ask when the budget, time or token cap is exceeded.
  - Ask before the first action of any irreversible or external kind.
  - Otherwise, proceed and report. Agents should bundle their questions rather than drip them one at a time, to reduce human load.

### Gaps
- I found no authoritative, numeric confidence-threshold standard (for example, "escalate if p<0.8"). LLM self-confidence calibration remains an open research area ([Uncertainty Quantification in LLM Agents, arXiv 2602.05073](https://arxiv.org/pdf/2602.05073)).
- I found no primary source for recommended budget or time-limit values.

## Q5. Progressively expanding autonomy (trust ramps, track records, evals)

### Takeaway
Trust ramps happen naturally: users move from about 20% to over 40% auto-approve with experience. Vendors (AWS) recommend stepping through autonomy scopes deliberately. The risk is that the ramp is driven by habituation rather than evidence, so track-record metrics and post-deployment monitoring should drive promotion.

### Cited Findings
- **Autonomy grows with use (Anthropic, Feb 2026):**
  - The longest (99.9th percentile) Claude Code turns roughly doubled, from under 25 to over 45 minutes, between late Sept 2025 and early Jan 2026.
  - The increase was smooth across model releases, suggesting models can handle more autonomy than they are given in practice.
  - Median turn length is about 45 seconds.
  - — [Anthropic](https://www.anthropic.com/research/measuring-agent-autonomy)
- **Track-record metric example:** internal success on hard tasks doubled from August to December 2025, while human interventions fell from 5.4 to 3.3 per session. — [Anthropic](https://www.anthropic.com/research/measuring-agent-autonomy)
- **Trust ramp by experience:** auto-approve goes from about 20% (<50 sessions) to over 40% (750+ sessions). — [Anthropic](https://www.anthropic.com/research/measuring-agent-autonomy)
- AWS progressive-autonomy guidance: move Scope 1→2→3→4 as confidence and controls mature. — [AWS](https://aws.amazon.com/ai/security/agentic-ai-scoping-matrix/)
- **Caution:** rising approval can reflect habituation rather than calibrated trust (+14.5 pp approval alongside −22% comments). — [arXiv 2606.22721](https://arxiv.org/abs/2606.22721)
- DeepMind's Intelligent Delegation framework includes "mechanisms for establishing trust" between delegator and delegatee as a core component [snippet]. — [arXiv 2602.11865](https://arxiv.org/abs/2602.11865)

### Inferences
- **Suggested trust-ramp metrics per agent and per action class:**
  - task success rate on audited samples;
  - human intervention or correction rate per session;
  - rate of escalations that were warranted vs. unnecessary;
  - classifier block rate;
  - incidents or rollbacks;
  - reviewer edit and comment rate (to catch rubber-stamping).
- Promote an action class to the next level after N clean samples. Demote automatically on an incident. This mirrors how Anthropic's measured intervention rate fell as success rose.

### Gaps
- I found no primary-source standard for promotion criteria (the size of N, statistical confidence). Organizations must set their own.

## Q6. Human-organization analogies

### Takeaway
Mission command (intent plus constraints, decentralized execution) and Appelo's 7 delegation levels map directly onto agent design: give intent and boundaries rather than step-by-step orders, and set the delegation level per decision type. DeepMind explicitly draws on organizational theory for AI delegation.

### Cited Findings
- **Mission command.** Leaders say *what* to achieve, not *how*. The hallmark is decentralized execution through delegated authority so that subordinates can act on the commander's intent when higher command is absent. — [USAF AFDP 1-1 Mission Command (Aug 2023)](https://www.doctrine.af.mil/Portals/61/documents/AFDP_1-1/AFDP%201-1%20Mission%20Command.pdf)
- Applied to AI: "Stop Using AI. Start Commanding It" argues for centralized planning, decentralized execution and clear commander's intent when working with AI agents [snippet]. — [War on the Rocks](https://warontherocks.com/stop-using-ai-start-commanding-it/)
- **Appelo / Management 3.0, 7 delegation levels:** Tell, Sell, Consult, Agree, Advise, Inquire, Delegate. They run from "boss decides" to "team decides alone," and the right level depends on context, risk and maturity. — [t2informatik](https://t2informatik.de/en/smartpedia/delegation-poker/); [transformationstools.de](https://transformationstools.de/en/blog/delegation-poker-guide-and-practice/)
- DeepMind's Intelligent AI Delegation integrates "insights from human organizational theory." It covers authority, responsibility, accountability, role boundaries and intent clarity [snippet]. — [arXiv 2602.11865](https://arxiv.org/abs/2602.11865)
- Accountability: every agent deployment needs an identified accountable human, which functions as an "A" in RACI terms. — [CSA note on NIST](https://labs.cloudsecurityalliance.org/research/csa-research-note-nist-ai-agent-standards-initiative-complia/)

### Inferences
- **Appelo's levels mapped to the Knight levels:**
  - Tell/Sell ≈ Operator.
  - Consult/Agree ≈ Collaborator/Consultant.
  - Advise/Inquire ≈ Approver, where the agent acts and informs or is asked afterward. Inquire ("delegate decides, the manager asks afterward") is essentially management by exception.
  - Delegate ≈ Observer.
- **Commander's intent → agent brief.** An agent brief should state:
  - the purpose;
  - the desired end state;
  - constraints (must do) and restraints (must not);
  - reporting requirements (when to report back or escalate).
- **Management by exception:** the human sees only exceptions (blocks, escalations, threshold breaches, sampled audits), not routine success. This matches Anthropic's observed shift toward "monitor and interrupt."
- **RACI for agent orgs:** the agent is R for execution; a named human is A; specialist or reviewer agents are C; humans are I through digest reports.

### Gaps
- I found no empirical study that tests mission-command or Appelo delegation specifically with LLM agents. These mappings are analogies.
- I found no primary 2024–2026 source applying RACI formally to multi-agent systems.
