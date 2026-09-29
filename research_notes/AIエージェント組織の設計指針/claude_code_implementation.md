# Claude Code / Claude Agent SDK: Implementation Mechanisms for an "Organization" of AI Agents (state as of Sept 2026)

Research date: 2026-09-29. All primary sources are the live Claude Code docs (code.claude.com/docs, which the old anthropic.com "Claude Code best practices" post now 308-redirects to) and Anthropic engineering/blog posts. Many features carry version gates (e.g. "v2.1.2xx+"); Claude Code ships very frequently, so treat any version number as a lower bound and re-check `/doctor` / `claude --version`. Items flagged **[experimental]** or **[research preview]** may change.

---

## 1. Subagents (`.claude/agents/*.md`): format, frontmatter, delegation, isolation, best practices

### Takeaway
A subagent is a Markdown file with YAML frontmatter (`name`, `description` required) whose body becomes the subagent's system prompt; it runs in its own context window and returns only a summary, which makes it the basic "specialist employee" unit. Frontmatter now covers tools, model, permission mode, preloaded skills, scoped MCP servers, hooks, persistent memory, worktree isolation, max turns and effort.

### Cited Findings
**Locations and precedence**
- Precedence (highest first): managed settings `.claude/agents/` → `--agents` CLI flag (session only) → project `.claude/agents/` (check into VCS) → user `~/.claude/agents/` → plugin `agents/` directory. On a name clash, the higher-priority one wins. — [Subagents docs](https://code.claude.com/docs/en/sub-agents); consistent with "managed > CLI flag > project > user > plugin for subagents" in [Extend Claude Code](https://code.claude.com/docs/en/features-overview)

**File format (verbatim example)**
```markdown
---
name: code-reviewer
description: Reviews code for quality and best practices
tools: Read, Glob, Grep
model: sonnet
---

You are a code reviewer. When invoked, analyze the code and provide
specific, actionable feedback on quality, security, and best practices.
```
— [Subagents docs](https://code.claude.com/docs/en/sub-agents)

**Frontmatter fields (exact names)** — [Subagents docs](https://code.claude.com/docs/en/sub-agents)
- `name` (required): unique ID; no `:` and no leading `-`. Also used as `agent_type` in hooks.
- `description` (required): when Claude should delegate. Keep it short: all subagent descriptions together count toward a 15,000-token limit.
- `tools`: comma-separated or YAML list. If you leave it out, the subagent inherits every tool. Supports `Agent(worker, researcher)` to restrict which subagents it may spawn.
- `disallowedTools`: denylist in the same format. `mcp__<server>` / `mcp__<server>__*` removes a whole MCP server; `mcp__*` removes all MCP tools.
- `model`: `sonnet`, `opus`, `haiku`, `fable`, a full ID such as `claude-opus-5-5`, or `inherit`.
- `permissionMode`: `default`, `acceptEdits`, `auto`, `dontAsk`, `bypassPermissions`, `plan`, or `manual` (alias of default).
- `maxTurns`: maximum agentic turns. Output is marked partial when the cap is hit.
- `skills`: skills to preload into context at startup.
- `mcpServers`: MCP servers (references or inline definitions) scoped to this subagent.
- `hooks`: lifecycle hooks (`PreToolUse`, `PostToolUse`, `Stop`). Requires workspace trust.
- `memory`: `user` | `project` | `local`, for persistent agent memory.
- `background`: `true` keeps the subagent in the background.
- `omitClaudeMd`: `true` skips user/project/local CLAUDE.md. Managed policy files still load.
- `effort`: `low` | `medium` | `high` | `xhigh` | `max`.
- `isolation`: `worktree`, to run in a temporary git worktree.
- `color`: `red`, `blue`, `green`, `yellow`, `purple`, `orange`, `pink`, `cyan`.
- `initialPrompt`: auto-submitted first turn when the agent runs as the main session via `--agent`.
- `experimental.cacheTtl`: `5m` | `1h`.
- Files are silently skipped when: there is no `name`, the opening `---` is not on line 1, `name` has `:` or a leading `-`, there is a `name` but no `description`, or the YAML is bad. Validate with `claude plugin validate .claude/agents` (v2.1.233+). — [Subagents docs](https://code.claude.com/docs/en/sub-agents)

**Built-in subagents**
- `Explore`: read-only (Write/Edit denied), for search and discovery. Skips CLAUDE.md and git status.
- `Plan`: read-only research used in plan mode. Skips CLAUDE.md and git status.
- `general-purpose`: all tools. Uses `CLAUDE_CODE_SUBAGENT_MODEL` if set, otherwise the main model.
- Turn off Explore and Plan with `CLAUDE_CODE_DISABLE_EXPLORE_PLAN_AGENTS=1`.
- Source: [Subagents docs](https://code.claude.com/docs/en/sub-agents)

**Delegation / invocation**
- Automatic: Claude delegates by matching the task against `description`. Including "use proactively" in the description encourages automatic delegation. — [Subagents docs](https://code.claude.com/docs/en/sub-agents)
- Explicit: natural language ("Have the code-reviewer subagent look at my recent changes"), an @-mention (`@"code-reviewer (agent)"` or `@agent-code-reviewer`), or the whole session as the agent via `claude --agent code-reviewer` or `{"agent": "code-reviewer"}` in settings. — [Subagents docs](https://code.claude.com/docs/en/sub-agents)
- Ad-hoc definitions via CLI JSON: `claude --agents '{"code-reviewer": {"description": "...", "prompt": "...", "tools": ["Read","Grep"], "model": "sonnet"}}'`. Also `claude -p --agents ./agents.json "..."` (v2.1.281+). — [Subagents docs](https://code.claude.com/docs/en/sub-agents)

**Context isolation and what loads**
- A non-fork subagent receives:
  - its own system prompt (not the Claude Code system prompt)
  - the delegation task message
  - CLAUDE.md, unless it is Explore/Plan or sets `omitClaudeMd`
  - a git status snapshot
  - preloaded skills
  - a sibling roster for messaging (v2.1.206+)
- The main conversation's auto memory is *not* loaded into subagents; forks are the exception.
- Sources: [Subagents docs](https://code.claude.com/docs/en/sub-agents), [Memory docs](https://code.claude.com/docs/en/memory)
- Forks (`/subtask ...`) inherit the full conversation. Only the final result returns. Forks are on by default in interactive sessions and off in `-p`/SDK. — [Subagents docs](https://code.claude.com/docs/en/sub-agents)
- Nesting: subagents can spawn subagents up to 3 layers deep by default (`CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`; set `1` to disable nesting). Default concurrency limit is 20 (`CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS`). — [Subagents docs](https://code.claude.com/docs/en/sub-agents)
- Tools always removed from subagents: `AskUserQuestion`, `EnterPlanMode`, `ExitPlanMode` (unless `permissionMode: plan`), `ScheduleWakeup`, and others. Background subagents keep only a reduced tool set (Read, Grep, Glob, Bash, Edit, Write, WebFetch, WebSearch, TodoWrite, Skill, SendMessage, … plus MCP tools). — [Subagents docs](https://code.claude.com/docs/en/sub-agents)
- Resuming: subagents keep their full history and can be continued via `SendMessage` by agent ID or name. — [Subagents docs](https://code.claude.com/docs/en/sub-agents)
- Model resolution order:
  1. per-invocation `model`
  2. frontmatter `model`
  3. `CLAUDE_CODE_SUBAGENT_MODEL`
  4. the main model
  - `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1` forces the env model on every subagent (v2.1.257+).
  - Source: [Subagents docs](https://code.claude.com/docs/en/sub-agents)

**Persistent per-agent memory**
- `memory: user` → `~/.claude/agent-memory/<name>/`
- `memory: project` → `.claude/agent-memory/<name>/`
- `memory: local` → `.claude/agent-memory-local/<name>/`
- The first 200 lines or 25KB of the agent's `MEMORY.md` load automatically.
- Source: [Subagents docs](https://code.claude.com/docs/en/sub-agents)

**Governance**
- Disable specific agents with `"permissions": {"deny": ["Agent(Explore)", "Agent(my-custom-agent)"]}` or `--disallowedTools "Agent(Explore)"`. — [Permissions docs](https://code.claude.com/docs/en/permissions)
- Permission rules can also match Agent input parameters: `Agent(model:opus)`, `Agent(isolation:worktree)`. — [Permissions docs](https://code.claude.com/docs/en/permissions)

**Best practices (official)**
- Keep descriptions brief.
- Add "use proactively" where you want automatic delegation.
- Check project agents into VCS.
- Isolate verbose operations (tests, logs).
- Chain subagents for multi-step workflows.
- Restrict tools.
- Enable `memory: project` for learnings.
- Use cheaper models (Haiku) for read-only agents.
- Source: [Subagents docs](https://code.claude.com/docs/en/sub-agents)
- "Use subagents for investigation … They explore in a separate context, keeping your main conversation clean." Also "Add an adversarial review step": a reviewer subagent in fresh context "sees only the diff and the criteria you give it". Warn the reviewer to "flag only gaps that affect correctness or the stated requirements" to avoid over-engineering. — [Best practices](https://code.claude.com/docs/en/best-practices)
- Example security-reviewer agent from the official best practices:
```markdown
---
name: security-reviewer
description: Reviews code for security vulnerabilities
tools: Read, Grep, Glob, Bash
model: opus
---
You are a senior security engineer. Review code for:
- Injection vulnerabilities (SQL, XSS, command injection)
- Authentication and authorization flaws
- Secrets or credentials in code
- Insecure data handling

Provide specific line references and suggested fixes.
```
— [Best practices](https://code.claude.com/docs/en/best-practices)
- Agent SDK framing: subagents provide "parallelization" and "context isolation," with each returning only relevant information to the orchestrator. — [Building agents with the Claude Agent SDK (Sept 29, 2025)](https://claude.com/blog/building-agents-with-the-claude-agent-sdk)

### Inferences
- Structure an agent "org chart" in `.claude/agents/`, with one file per role. Enforce the chain of command with `tools: Agent(worker, researcher)` on coordinator agents, tighten each role with `tools`/`disallowedTools`/`permissionMode`, and give roles that accumulate expertise their own memory (`memory: project`).
- The 15k-token budget for all descriptions puts a practical ceiling on the number of roles. Write crisp, trigger-oriented descriptions rather than long bios.

### Gaps
- The docs page gives no single recommended template for writing subagent system prompts beyond the examples. The WebFetch summary did not show whether subagent `description` supports an `<example>` block convention (older community practice). Not verified.
- Some field lists came through a summarizing fetch. Exact wording of rarely used fields (`experimental`, `initialPrompt`) should be re-checked on the page.

---

## 2. CLAUDE.md hierarchy, rules, and memory

### Takeaway
CLAUDE.md files are *advisory context* (delivered as a user message after the system prompt), loaded additively from managed → user → project → local and from ancestor directories. Nested subdirectory files load lazily. Keep each file under ~200 lines, push detail into `.claude/rules/` (path-scoped) or skills, and use hooks or permissions for anything that must be enforced. Auto memory (`MEMORY.md`) is a separate, Claude-written memory.

### Cited Findings
**Locations (load order, broadest first)**
- Managed policy: macOS `/Library/Application Support/ClaudeCode/CLAUDE.md`, Linux/WSL `/etc/claude-code/CLAUDE.md`, Windows `C:\Program Files\ClaudeCode\CLAUDE.md`. Cannot be excluded.
- User: `~/.claude/CLAUDE.md`.
- Project: `./CLAUDE.md` or `./.claude/CLAUDE.md`.
- Local: `./CLAUDE.local.md` (add it to `.gitignore`).
- Source: [Memory docs](https://code.claude.com/docs/en/memory)
- Files in the cwd and every ancestor load at launch and are concatenated, not overridden, from the root down. Within a directory, `CLAUDE.local.md` comes after `CLAUDE.md`. Subdirectory CLAUDE.md files load on demand when Claude reads files there. — [Memory docs](https://code.claude.com/docs/en/memory)
- Managed content can also be inlined via the `claudeMd` key in `managed-settings.json`. — [Memory docs](https://code.claude.com/docs/en/memory)
- `AGENTS.md` is read natively (v2.1.277+) when no CLAUDE.md or CLAUDE.local.md exists. Change this with the "Project instructions" setting (`claude-md-or-agents-md` default, `claude-md-and-agents-md`, `claude-md`, `managed-only`). — [Memory docs](https://code.claude.com/docs/en/memory)

**Imports and rules**
- `@path/to/import` syntax. Relative paths resolve from the importing file. Max depth is four hops. Imports inside code spans or blocks are ignored. Block-level HTML comments are stripped before injection. — [Memory docs](https://code.claude.com/docs/en/memory)
- `.claude/rules/*.md` (recursive) load at launch like `.claude/CLAUDE.md`. With `paths:` frontmatter they load only when Claude reads matching files:
```markdown
---
paths:
  - "src/api/**/*.ts"
---
# API Development Rules
- All API endpoints must include input validation
```
  `paths` is the only frontmatter field rules read. User-level rules live in `~/.claude/rules/`. — [Memory docs](https://code.claude.com/docs/en/memory)
- `claudeMdExcludes` (glob array) skips other teams' CLAUDE.md files in monorepos. — [Memory docs](https://code.claude.com/docs/en/memory)

**What to put in CLAUDE.md**
- Add to CLAUDE.md when "Claude makes the same mistake a second time", when code review catches something Claude should have known, when you retype the same correction, or when a new teammate would need the context. Multi-step procedures belong in a skill or path-scoped rule. — [Memory docs](https://code.claude.com/docs/en/memory)
- "target under 200 lines per CLAUDE.md file". Be specific and verifiable ("Use 2-space indentation", "Run `npm test` before committing"). Avoid contradictions. — [Memory docs](https://code.claude.com/docs/en/memory)
- Include: Bash commands Claude can't guess, style rules that differ from defaults, testing instructions, repo etiquette, architectural decisions, env quirks, gotchas. Exclude: anything derivable from code, standard conventions, detailed API docs, frequently changing info, tutorials, file-by-file descriptions, "write clean code". Test each line with "Would removing this cause Claude to make mistakes?" Use "IMPORTANT" emphasis sparingly. — [Best practices](https://code.claude.com/docs/en/best-practices)
- Not enforcement: "CLAUDE.md content is delivered as a user message after the system prompt … there's no guarantee of strict compliance". Use hooks for must-run actions and `--append-system-prompt` for system-level instructions. — [Memory docs](https://code.claude.com/docs/en/memory)
- Behavioral guidance goes in managed CLAUDE.md. Technical enforcement goes in managed settings (`permissions.deny`, `sandbox.enabled`). — [Memory docs](https://code.claude.com/docs/en/memory)
- Tooling:
  - `/init` generates a starting CLAUDE.md. `CLAUDE_CODE_NEW_INIT=1` gives an interactive flow that can also scaffold skills and hooks.
  - `/memory` edits memory files.
  - `/context` verifies which files loaded.
  - `/doctor prompt-audit` (v2.1.283+) audits CLAUDE.md, rules, skills and agents for stale or conflicting instructions.
  - Source: [Memory docs](https://code.claude.com/docs/en/memory)
- The project-root CLAUDE.md is re-injected after `/compact`. Nested files and path rules reload on demand. — [Memory docs](https://code.claude.com/docs/en/memory)

**Auto memory**
- On by default. Stored at `~/.claude/projects/<project>/memory/` with a `MEMORY.md` index plus topic files.
- Memory types: `user`, `feedback`, `project`, `reference`.
- The first 200 lines or 25KB of `MEMORY.md` load every session.
- Machine-local.
- Toggle with `autoMemoryEnabled` or `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1`. Relocate with `autoMemoryDirectory`.
- Source: [Memory docs](https://code.claude.com/docs/en/memory)

### Inferences
- For an agent organization, CLAUDE.md is the "company handbook". Keep it short and universal, and put role-specific norms in each subagent's body or preloaded skills (`skills:`). Remember that `omitClaudeMd` and the Explore/Plan agents skip it.

### Gaps
- No official numeric guidance on the combined size of all CLAUDE.md files, beyond the 200-line per-file target, a startup warning, and a 4 MiB hard skip.

---

## 3. Skills (`SKILL.md`): structure, and when to use them vs subagents

### Takeaway
A skill is a folder containing `SKILL.md` (YAML frontmatter plus instructions), optionally with bundled scripts and reference files, loaded by progressive disclosure: only the description is always in context, the body loads when used, and files load on demand. Custom slash commands have been merged into skills. Use skills for reusable knowledge and procedures, and subagents for context isolation. The two combine through `context: fork` and the subagent `skills:` field.

### Cited Findings
- Custom commands have been merged into skills: "A file at `.claude/commands/deploy.md` and a skill at `.claude/skills/deploy/SKILL.md` both create `/deploy` and work the same way." — [Skills docs](https://code.claude.com/docs/en/skills)
- Skills follow the [Agent Skills](https://agentskills.io) open standard, and Claude Code adds extensions. — [Skills docs](https://code.claude.com/docs/en/skills). The standard was published Oct 16, 2025 and updated Dec 18, 2025 as an open standard. — [Equipping agents for the real world with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)
- Locations:
  - Enterprise (managed settings dir)
  - Personal `~/.claude/skills/<name>/SKILL.md`
  - Project `.claude/skills/<name>/SKILL.md`
  - Nested `<subdir>/.claude/skills/`
  - `--add-dir`
  - Plugin `<plugin>/skills/<name>/SKILL.md` (namespaced `/plugin:skill`)
  - claude.ai-synced (`~/.claude/skills/synced/`)
  - Source: [Skills docs](https://code.claude.com/docs/en/skills)
- Frontmatter fields (exact):
  - `name` (defaults to the directory name)
  - `description` (recommended). Combined `description` + `when_to_use` is truncated at 1,536 characters.
  - `when_to_use`
  - `argument-hint`
  - `arguments`
  - `disable-model-invocation` (true = only the user can invoke; the description is also removed from context)
  - `user-invocable` (false = hidden from the `/` menu)
  - `allowed-tools` (pre-approved during the invoking turn)
  - `disallowed-tools`
  - `model`
  - `effort`
  - `context` (`fork`)
  - `agent` (subagent type used with fork: `Explore`, `Plan`, `general-purpose`, or a custom agent)
  - `background`
  - `hooks`
  - `paths`
  - `shell`
  - `metadata`, `license`, `compatibility`
  - Source: [Skills docs](https://code.claude.com/docs/en/skills)
- Substitutions: `$ARGUMENTS`, `$ARGUMENTS[N]`/`$N`, named `$name`, `${CLAUDE_SESSION_ID}`, `${CLAUDE_SKILL_DIR}`, `${CLAUDE_PROJECT_DIR}`, `${CLAUDE_PLUGIN_ROOT}`. Dynamic context injection: `` !`git diff HEAD` `` inline or a ```` ```! ```` fenced block runs before Claude sees the content. Disable it with `"disableSkillShellExecution": true`. — [Skills docs](https://code.claude.com/docs/en/skills)
- Example (official):
```yaml
---
name: pr-summary
description: Summarize changes in a pull request
context: fork
agent: Explore
allowed-tools: Bash(gh *)
---
## Pull request context
- PR diff: !`gh pr diff`
- PR comments: !`gh pr view --comments`
## Your task
Summarize this pull request...
```
— [Skills docs](https://code.claude.com/docs/en/skills)
- Side-effect workflow example: a `fix-issue` skill with `disable-model-invocation: true` and "Analyze and fix the GitHub issue: $ARGUMENTS." Invoked as `/fix-issue 1234`. "Use `disable-model-invocation: true` for workflows with side effects that you want to trigger manually." — [Best practices](https://code.claude.com/docs/en/best-practices)
- `context: fork` runs the skill in a new subagent that "doesn't see your conversation history", in the background by default (`background: false` blocks). It "only makes sense for skills with explicit instructions". — [Skills docs](https://code.claude.com/docs/en/skills)
- After compaction, invoked skills are re-attached (first 5,000 tokens each, 25,000-token combined budget). — [Skills docs](https://code.claude.com/docs/en/skills)
- Restrict skills with permission rules `Skill(name)` / `Skill(name *)`. Visibility is controlled by `skillOverrides` (`"on"`, `"name-only"`, `"user-invocable-only"`, `"off"`). — [Skills docs](https://code.claude.com/docs/en/skills)
- Progressive disclosure has three levels:
  1. frontmatter `name`/`description` "pre-loaded into the system prompt"
  2. the `SKILL.md` body when relevant
  3. bundled files (e.g. `forms.md`) only when needed
  - Bundled scripts act as deterministic tools: "sorting a list via token generation is far more expensive than simply running a sorting algorithm". Install skills only from trusted sources.
  - Source: [Agent Skills engineering post](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)
- Skills vs subagents:

  | | Skill | Subagent |
  |---|---|---|
  | What it is | "Reusable instructions, knowledge, or workflows" | "Isolated worker with its own context" |
  | Context | "Adds to your main window" | "Uses a separate window" |

  "They can combine. A subagent can preload specific skills (`skills:` field). A skill can run in isolated context using `context: fork`." — [Extend Claude Code](https://code.claude.com/docs/en/features-overview)
- Triggers for adoption:
  - "You keep typing the same prompt to start a task" → user-invocable skill
  - "paste the same playbook … for the third time" → skill
  - "A side task floods your conversation" → subagent
  - "want something to happen every time" → hook
  - "A second repository needs the same setup" → plugin
  - Source: [Extend Claude Code](https://code.claude.com/docs/en/features-overview)
- In subagents, skills listed in `skills:` are fully preloaded at launch rather than loaded on demand. — [Extend Claude Code](https://code.claude.com/docs/en/features-overview)

### Inferences
- In an agent organization, skills are the "SOPs/playbooks" and subagents are the "staff". A role (subagent) should preload the SOPs (skills) it always needs. Operator-triggered, side-effecting procedures (deploy, publish, send email) should be `disable-model-invocation: true`.

### Gaps
- The docs give no hard limit on the number of skills. The listing budget is described via per-skill 1,536-char truncation. The full-page text also mentions `skillOverrides` for scale, but I did not find an explicit total character budget in the portion I read.

---

## 4. Hooks: guardrails and quality gates

### Takeaway
Hooks are deterministic handlers configured under `"hooks"` in settings.json (or in skill/agent frontmatter, or plugin `hooks/hooks.json`). The handler can be `command`, `http`, `mcp_tool`, `prompt` or `agent`. `PreToolUse` (block, allow or rewrite tool calls), `Stop`/`SubagentStop` (refuse to stop until checks pass), `TaskCompleted`/`TeammateIdle` (team quality gates) and `PostToolUse` (lint/format feedback) are the main levers. Exit code 2 blocks.

### Cited Findings
- Event names:
  - Session: `SessionStart`, `Setup`, `SessionEnd`
  - Turn: `UserPromptSubmit`, `UserPromptExpansion`, `Stop`, `StopFailure`
  - Tool loop: `PreToolUse`, `PermissionRequest`, `PermissionDenied`, `PostToolUse`, `PostToolUseFailure`, `PostToolBatch`, `SubagentStart`, `SubagentStop`, `TaskCreated`, `TaskCompleted`
  - Async: `WorktreeCreate`, `WorktreeRemove`, `Notification`, `ConfigChange`, `InstructionsLoaded`, `CwdChanged`, `DirectoryAdded`, `FileChanged`, `PreCompact`, `PostCompact`, `PreModelSwitch`, `PostModelSwitch`, `TeammateIdle`, `Elicitation`, `ElicitationResult`, `MessageDisplay`
  - Source: [Hooks reference](https://code.claude.com/docs/en/hooks)
- Structure:
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "if": "Bash(rm *)",
            "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/block-rm.sh",
            "timeout": 30,
            "statusMessage": "Checking command safety..."
          }
        ]
      }
    ],
    "PostToolUse": [
      { "matcher": "Edit|Write", "hooks": [ { "type": "http", "url": "http://localhost:8080/hooks/post-tool" } ] }
    ]
  },
  "disableAllHooks": false
}
```
— [Hooks reference](https://code.claude.com/docs/en/hooks)
- Hook types:
  - `command`: JSON on stdin; fields `command`, `args`, `async`, `asyncRewake`, `shell`
  - `http`: POST; fields `url`, `headers`, `allowedEnvVars`
  - `mcp_tool`: fields `server`, `tool`, `input`
  - `prompt`: single-turn LLM evaluation; fields `prompt`, `model`
  - `agent`: subagent with tools; fields `prompt`, `model`
  - Source: [Hooks reference](https://code.claude.com/docs/en/hooks)
- Matchers: exact names (`Bash`, `Edit|Write`) or regex (`mcp__.*__write.*`). `SessionStart` matches `startup|resume|clear|compact|fork`. `SubagentStart`/`SubagentStop` match on agent type. — [Hooks reference](https://code.claude.com/docs/en/hooks)
- Exit codes: `0` means success (stdout JSON is parsed). `2` is a blocking error with stderr fed back: "even a JSON `permissionDecision` of "allow" can't override it". Any other code is a non-blocking error. — [Hooks reference](https://code.claude.com/docs/en/hooks)
- JSON output:
  - Universal: `continue`, `stopReason`, `systemMessage`, `suppressOutput`.
  - PreToolUse: `hookSpecificOutput.permissionDecision` = `allow|deny|ask|defer`, plus `permissionDecisionReason`, `updatedInput`, `additionalContext`.
  - Top-level `"decision": "block", "reason": ...` for `UserPromptSubmit`, `Stop`, `PostToolUse` and similar.
  - PostToolUse can return `updatedToolOutput`.
  - SessionStart can return `additionalContext`, `initialUserMessage`, `watchPaths`.
  - Source: [Hooks reference](https://code.claude.com/docs/en/hooks)
- Settings locations: `~/.claude/settings.json` (user), `.claude/settings.json` (project, committed), `.claude/settings.local.json` (gitignored), managed policy, plugin `hooks/hooks.json`, skill/agent frontmatter. Hooks from multiple sources merge, and settings hooks "also run inside subagents". Project hooks run only after workspace trust. — [Hooks reference](https://code.claude.com/docs/en/hooks)
- Subagent lifecycle hooks: `SubagentStart` with `"matcher": "db-agent"`, and `SubagentStop` for cleanup. — [Subagents docs](https://code.claude.com/docs/en/sub-agents)
- Team gates: `TeammateIdle` ("Exit with code 2 to send feedback and keep the teammate working"), `TaskCreated`, `TaskCompleted` ("Exit with code 2 to prevent completion and send feedback"). — [Agent teams docs](https://code.claude.com/docs/en/agent-teams)
- Hooks vs permissions: "Hook decisions don't bypass permission rules". Deny and ask rules still apply even if a hook returns "allow". An exit-2 hook blocks before rules are evaluated. The recommended pattern is to allow `Bash` broadly and use a PreToolUse hook to reject specific commands. — [Permissions docs](https://code.claude.com/docs/en/permissions)
- Stop hook as a deterministic verification gate: "a Stop hook runs your check as a script and blocks the turn from ending until it passes" (there is a cap on consecutive blocks). — [Best practices](https://code.claude.com/docs/en/best-practices)
- "Put guardrails in hooks. An instruction like 'never edit `.env`' in CLAUDE.md or a skill is a request, not a guarantee. A `PreToolUse` hook that blocks the edit is enforcement." — [Extend Claude Code](https://code.claude.com/docs/en/features-overview)

### Inferences
- For an agent org, map the controls like this:
  - "compliance" → PreToolUse deny hooks + permission deny rules
  - "QA sign-off" → Stop/SubagentStop/TaskCompleted hooks running tests
  - "audit log" → async `http` or `command` hooks on PostToolUse
  - "notify manager" → `Notification` or `Stop` hooks posting to Slack via an `http` or `mcp_tool` hook

### Gaps
- The exact cap on consecutive Stop-hook blocks and the `stop_hook_active` input field semantics were not captured in my fetch. See the "Stop input" section of the hooks page.

---

## 5. Permissions and permission modes (oversight controls)

### Takeaway
Permission rules (`allow`/`ask`/`deny` in settings.json; evaluated deny → ask → allow) and modes (`default`/manual, `acceptEdits`, `plan`, `auto`, `dontAsk`, `bypassPermissions`) are client-enforced. Managed settings sit above everything. As of v2.1.283, auto mode (classifier-reviewed) is the built-in default for interactive sessions, and `-p` defaults to Manual.

### Cited Findings
- Modes (exact):
  - `default`: prompts on first use; labeled Manual; alias `manual`
  - `acceptEdits`: auto-accepts edits and `mkdir`/`touch`/`mv`/`cp` in the working dirs
  - `plan`: reads and runs read-only commands but "doesn't edit your source files"
  - `auto`: "Auto-approves tool calls with background safety checks"
  - `dontAsk`: auto-denies anything that would prompt; allowlisted tools still run
  - `bypassPermissions`: skips prompts, "Only use this mode in isolated environments like containers or VMs"
  - Source: [Permissions docs](https://code.claude.com/docs/en/permissions)
- Set the starting mode with `defaultMode` in settings, `--permission-mode <mode>`, or Shift+Tab (cycle to `⏸ plan mode on`). Block risky modes with `permissions.disableBypassPermissionsMode` / `permissions.disableAutoMode` = `"disable"`. — [Permissions docs](https://code.claude.com/docs/en/permissions); [Best practices](https://code.claude.com/docs/en/best-practices)
- "With Claude Code v2.1.283 or later, auto mode is the built-in starting permission mode for interactive terminal and VS Code sessions: a separate classifier model reviews most actions … blocks only what looks risky, such as scope escalation, unknown infrastructure, or hostile-content-driven actions." — [Best practices](https://code.claude.com/docs/en/best-practices). **Flag:** this is a recent change. Older guides assume Manual as the default.
- Rule evaluation: "Rules are evaluated in order: deny, then ask, then allow. The first match in that order determines the outcome". A broad deny can't be carved out by a narrower allow. A bare tool name in deny (`Bash`) removes the tool from context entirely. — [Permissions docs](https://code.claude.com/docs/en/permissions)
- Rule syntax examples:
  - `Bash(npm run build)` (exact)
  - `Bash(npm run *)` (prefix; the space before `*` matters)
  - `Read(./.env)`
  - `Edit(/src/**/*.ts)`
  - `Read(//abs/path/**)`
  - `WebFetch(domain:example.com)`
  - `mcp__puppeteer`, `mcp__puppeteer__*`, `mcp__puppeteer__puppeteer_navigate`
  - `Agent(Explore)`
  - `Skill(name)`
  - `Cd(~/code/**)`
  - Source: [Permissions docs](https://code.claude.com/docs/en/permissions)
- Precedence: managed settings are highest and cannot be overridden by CLI args. "If a tool is denied at any level, no other level can allow it." `allowManagedPermissionRulesOnly` makes managed the sole source of rules. Project `permissions.allow` applies only after the workspace trust dialog. — [Permissions docs](https://code.claude.com/docs/en/permissions)
- Sandboxing complements permissions with OS-level filesystem and network isolation for Bash/PowerShell/Monitor. With `autoAllowBashIfSandboxed` (default true), sandboxed commands skip the bare-Bash prompt. — [Permissions docs](https://code.claude.com/docs/en/permissions)
- "Permission rules are enforced by Claude Code, not by the model." — [Permissions docs](https://code.claude.com/docs/en/permissions)
- Agent teams: teammates start with the lead's mode (except `dontAsk`), and teammate permission prompts surface in the lead session. Messages between agents are marked as coming from another Claude session, so "A teammate can't approve a permission prompt or supply consent on your behalf". — [Agent teams docs](https://code.claude.com/docs/en/agent-teams)
- Unattended runs: `--permission-prompts none` (v2.1.259+) denies anything that would prompt and tells Claude not to retry. — [Headless docs](https://code.claude.com/docs/en/headless)

### Inferences
- A layered oversight design for an agent org:
  1. managed/project `deny` for irreversible actions (e.g. `Bash(git push *)`, production credentials)
  2. `ask` for high-stakes MCP writes (e.g. `mcp__slack__*send*`)
  3. `plan` mode or plan-approval for architectural work
  4. `auto` or `dontAsk` + allowlist for unattended workers
  5. sandbox for defense in depth

### Gaps
- I did not fetch the separate [permission-modes](https://code.claude.com/docs/en/permission-modes) page. Details of the auto-mode classifier's fallback thresholds and the "actions no mode auto-approves" list are not captured here.

---

## 6. Slash commands, headless mode, GitHub Actions, scheduling, agent teams, MCP

### Takeaway
Claude Code gives you every rung of the automation ladder:
- skills as slash commands
- `claude -p` / the Agent SDK for scripted and CI runs
- `anthropics/claude-code-action@v1` for GitHub
- three scheduling tiers: `/loop` in-session, Desktop tasks, cloud Routines
- experimental agent teams for peer-to-peer multi-session coordination
- MCP servers and claude.ai connectors for Slack, Notion, Gmail, Calendar and similar

### Cited Findings
**Slash commands**
- `.claude/commands/*.md` still works but is now "the older format". Skills are preferred. — [Skills docs](https://code.claude.com/docs/en/skills)
- In `-p` mode, user-invoked skills work ("Include `/skill-name` in the prompt string"). — [Headless docs](https://code.claude.com/docs/en/headless)
- Bundled skills include `/code-review`, `/batch` (splits a change across 5–30 subagents, each in its own worktree), `/debug`, `/run`, `/verify`, `/loop`. — [Best practices](https://code.claude.com/docs/en/best-practices); [Skills docs](https://code.claude.com/docs/en/skills)

**Headless / Agent SDK**
- "The Agent SDK gives you the same tools, agent loop, and context management that power Claude Code. It's available as a CLI for scripts and CI/CD, or as Python and TypeScript packages". Example: `claude -p "Find and fix the bug in auth.py" --allowedTools "Read,Edit,Bash"`. — [Headless docs](https://code.claude.com/docs/en/headless)
- Flags:
  - `--output-format text|json|stream-json` (json includes `result`, `session_id`, `total_cost_usd`)
  - `--json-schema '<schema>'` → `structured_output`
  - `--continue`, `--resume <session_id>`
  - `--append-system-prompt`, `--system-prompt`
  - `--permission-mode`, `--allowedTools`
  - `--bare`: skips hooks, skills, CLAUDE.md, MCP and memory; "recommended mode for scripted and SDK calls, and will become the default for `-p` in a future release". **Flag:** this default is changing.
  - `--mcp-config`, `--agents`, `--settings`
  - Source: [Headless docs](https://code.claude.com/docs/en/headless)
- Security note: without `--bare`, `-p` runs project hooks and `.mcp.json` servers "even in a folder you've never trusted". — [Headless docs](https://code.claude.com/docs/en/headless)
- Fan-out pattern: `for file in $(cat files.txt); do claude -p "Migrate $file ... Return OK or FAIL." --allowedTools "Edit,Bash(git commit *)"; done`. — [Best practices](https://code.claude.com/docs/en/best-practices)
- The SDK was renamed from "Claude Code SDK" to "Claude Agent SDK" to reflect non-coding agents ("finance agents," "personal assistant agents," "customer support agents"). Core loop: "gather context -> take action -> verify work -> repeat". Verification methods: rules-based feedback, visual feedback, "LLM as judge". Prefer agentic search (grep, etc.) before semantic search. — [Building agents with the Claude Agent SDK, Sept 29, 2025](https://claude.com/blog/building-agents-with-the-claude-agent-sdk)

**GitHub Actions**
- Setup: `/install-github-app`, or manually install the Claude GitHub App and add an `ANTHROPIC_API_KEY` or `CLAUDE_CODE_OAUTH_TOKEN` secret (the latter from `claude setup-token`). Uses `anthropics/claude-code-action@v1`. — [GitHub Actions docs](https://code.claude.com/docs/en/github-actions)
- Modes: interactive (no `prompt`; responds to `@claude`) vs automation (a `prompt` input, which can be a skill such as `/skill-name`). Inputs: `prompt`, `claude_args`, `anthropic_api_key`, `claude_code_oauth_token`, `github_token`, `plugin_marketplaces`, `plugins`, `settings`, `trigger_phrase`, `use_bedrock`/`use_vertex`/`use_foundry`. — [GitHub Actions docs](https://code.claude.com/docs/en/github-actions)
- Scheduled example:
```yaml
on:
  schedule:
    - cron: "0 9 * * *"
jobs:
  report:
    runs-on: ubuntu-latest
    permissions: { contents: read, issues: read, id-token: write }
    steps:
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: "Generate a summary of yesterday's commits and open issues"
          claude_args: |
            --model claude-opus-5-5
            --allowedTools "mcp__github__list_commits,mcp__github__list_issues"
```
  — [GitHub Actions docs](https://code.claude.com/docs/en/github-actions)
- Guardrails:
  - Only users with write access trigger runs.
  - Bot actors are rejected unless listed in `allowed_bots` (prevents loops).
  - Cap cost with `--max-turns` and workflow timeouts.
  - Migrating from `@beta`: `direct_prompt` → `prompt`, and CLI options move into `claude_args`. **Flag:** older blog posts use the `@beta` syntax.
  - Source: [GitHub Actions docs](https://code.claude.com/docs/en/github-actions)

**Scheduled / recurring runs**
- Three tiers:

  | | Cloud Routines | Desktop scheduled tasks | `/loop` |
  |---|---|---|---|
  | Runs on | Anthropic cloud | Your machine | Your machine |
  | Machine must be on | No | Yes | Yes |
  | Session must be open | No | No | Yes |
  | Minimum interval | 1 hour | 1 minute | 1 minute |

  — [Scheduled tasks docs](https://code.claude.com/docs/en/scheduled-tasks)
- `/loop`:
  - `/loop 5m <prompt>` runs on a fixed interval; with no interval, Claude self-paces.
  - A bare `/loop` runs a maintenance prompt, or `.claude/loop.md` / `~/.claude/loop.md` if present.
  - Underlying tools: `CronCreate`/`CronList`/`CronDelete`. Maximum 50 tasks per session.
  - Recurring tasks expire after 7 days.
  - Jitter is up to 30 min. Avoid `:00`/`:30` if timing matters.
  - Disable with `CLAUDE_CODE_DISABLE_CRON=1`.
  - Source: [Scheduled tasks docs](https://code.claude.com/docs/en/scheduled-tasks)
- Routines **[research preview]**:
  - "a saved Claude Code configuration: a prompt, one or more repositories, and a set of connectors".
  - Triggers: Scheduled / API (`POST .../routines/<id>/fire` with bearer token and `anthropic-beta: experimental-cc-routine-2026-04-01`) / GitHub (pull_request, release).
  - Create via claude.ai/code/routines or `/schedule` (alias `/routines`).
  - Runs autonomously with no permission-mode picker.
  - Pushes go to `claude/`-prefixed branches. Protected branches are rejected.
  - Minimum interval is 1 hour. There is a daily run cap.
  - Fire `text` arrives wrapped in `<routine-fire-payload>` as untrusted data.
  - Routines belong to the individual account, and actions appear as you.
  - Source: [Routines docs](https://code.claude.com/docs/en/routines)

**Agent teams [experimental]**
- Enable with `"env": {"CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"}`. "Agent teams are experimental and disabled by default". Interactive only: in `-p` and the Agent SDK, teammates are not spawned. — [Agent teams docs](https://code.claude.com/docs/en/agent-teams)
- Architecture:
  - Team lead (main session)
  - Teammates (separate Claude Code instances)
  - Shared task list (pending / in progress / completed, with dependencies; file-locked claiming)
  - Mailbox at `~/.claude/teams/{team-name}/inboxes/{agent-name}.json`
  - Team config at `~/.claude/teams/{team-name}/config.json` (runtime state; do not hand-edit)
  - Tasks at `~/.claude/tasks/{team-name}/`
  - Source: [Agent teams docs](https://code.claude.com/docs/en/agent-teams)
- Subagents vs teams: subagents "Return a result to the caller" at lower token cost. Teammates "message each other directly" and "Self-coordinat[e]", at higher cost since "each teammate is a separate Claude instance". — [Agent teams docs](https://code.claude.com/docs/en/agent-teams)
- Reuse roles: "Spawn a teammate using the security-reviewer agent type…". The definition's `tools` and `model` apply. The body is appended (in-process mode) or replaces the system prompt (split-pane mode). `skills` is not applied. — [Agent teams docs](https://code.claude.com/docs/en/agent-teams)
- Display: `teammateMode` `"in-process"` (default) / `"auto"` / `"tmux"` / `"iterm2"`. — [Agent teams docs](https://code.claude.com/docs/en/agent-teams)
- Best practices:
  - Give spawn prompts full context, because teammates don't inherit the lead's history.
  - "Start with 3-5 teammates". "5-6 tasks per teammate".
  - Avoid two teammates editing the same file.
  - Start with research and review tasks.
  - Monitor and steer.
  - Use plan mode so teammates plan before implementing (plans are auto-approved by the lead).
  - Source: [Agent teams docs](https://code.claude.com/docs/en/agent-teams)
- Limitations:
  - No resume for in-process teammates.
  - Task status can lag.
  - One team per session.
  - No nested teams.
  - The lead is fixed.
  - Per-teammate permission modes can't be set at spawn.
  - Source: [Agent teams docs](https://code.claude.com/docs/en/agent-teams)
- Lighter alternatives: cross-session messaging, git worktrees, `claude agents` agent view (research preview), and dynamic workflows (scripts that run many subagents). — [Best practices](https://code.claude.com/docs/en/best-practices); [Extend Claude Code](https://code.claude.com/docs/en/features-overview)

**MCP servers (Slack/Notion/Gmail/Calendar etc.)**
- `claude mcp add --transport http <name> <url>` / `--transport stdio <name> -- <cmd>`. Scopes: `--scope local` (default, `~/.claude.json`), `project` (`.mcp.json`, committed), `user`. Example: `claude mcp add --transport http notion https://mcp.notion.com/mcp`, then `/mcp` for OAuth. — [MCP docs](https://code.claude.com/docs/en/mcp)
- `.mcp.json` format:
```json
{ "mcpServers": { "database-tools": { "type": "http", "url": "https://mcp.example.com",
  "headers": { "Authorization": "Bearer ${API_KEY}" } } } }
```
  Supports `${VAR}` / `${VAR:-default}`. — [MCP docs](https://code.claude.com/docs/en/mcp)
- claude.ai connectors (e.g. Slack, Gmail) are automatically available when logged in. Block them via `"deniedMcpServers": ["claude.ai Slack", "claude.ai Gmail"]` or `disableClaudeAiConnectors`. Connector tools appear as `mcp__claude_ai_<server>__<tool>`. — [MCP docs](https://code.claude.com/docs/en/mcp); [Permissions docs](https://code.claude.com/docs/en/permissions)
- Org control: `managed-mcp.json` with `allowedMcpServers`/`deniedMcpServers`. Tool search is on by default (schemas are deferred). `MAX_MCP_OUTPUT_TOKENS` defaults to 25,000. — [MCP docs](https://code.claude.com/docs/en/mcp)
- Routines use claude.ai connectors, not locally added `claude mcp add` servers. Add those at claude.ai/customize/connectors or commit `.mcp.json`. — [Routines docs](https://code.claude.com/docs/en/routines)
- Best practice: CLI tools (`gh`, `aws`, …) are "the most context-efficient way to interact with external services". MCP + a skill documenting how to use it well is the recommended pairing. — [Best practices](https://code.claude.com/docs/en/best-practices); [Extend Claude Code](https://code.claude.com/docs/en/features-overview)

### Inferences
- A pragmatic "AI org" stack for a solo operator in 2026:
  - subagents as roles, skills as SOPs, hooks as QA/compliance
  - connectors for Slack/Gmail/Calendar/Notion
  - Routines for daily or weekly recurring jobs (no laptop required)
  - GitHub Actions for repo-event workflows
  - Agent teams only for exploratory or parallel research, given their experimental status and cost

### Gaps
- The MCP scope-precedence list from my (summarized) fetch lists managed MCP last yet calls it "highest precedence". The features-overview page says "MCP servers override by name: local > project > user". Treat managed as an allow/deny policy layer rather than a name-override layer. Re-verify on the MCP page.
- I did not fetch the pages for Desktop scheduled tasks, cross-session messaging, dynamic workflows (`/docs/en/workflows`), or `/goal`. Those are only referenced here via other pages.

---

## 7. Anthropic's published best practices: agentic coding and long-running agents

### Takeaway
The core principles:
- Manage context as the scarcest resource.
- Always give the agent a verifiable check.
- Separate explore → plan → implement → commit.
- Use subagents or fresh sessions for independent review.
- For multi-context-window work, use an initializer + incremental worker harness with external state files (progress log, JSON feature list, init script, git).

### Cited Findings
- "Most best practices are based on one constraint: Claude's context window fills up fast, and performance degrades as it fills." — [Best practices](https://code.claude.com/docs/en/best-practices)
- "Give Claude a check it can run: tests, a build, a screenshot to compare. It's the difference between a session you watch and one you walk away from." Escalation ladder for gating: in-prompt → `/goal` condition (separate evaluator re-checks every turn) → Stop hook → verification subagent / dynamic workflow. "Have Claude show evidence rather than asserting success". — [Best practices](https://code.claude.com/docs/en/best-practices)
- Four phases, Explore → Plan → Implement → Commit, using plan mode (`claude --permission-mode plan`, Ctrl+G to edit the plan). Skip planning "If you could describe the diff in one sentence". — [Best practices](https://code.claude.com/docs/en/best-practices)
- Interview pattern: "Interview me in detail using the AskUserQuestion tool … then write a complete spec to SPEC.md", then start a fresh session to execute. — [Best practices](https://code.claude.com/docs/en/best-practices)
- Context hygiene:
  - `/clear` between tasks. After two failed corrections, `/clear` and re-prompt.
  - `/compact <instructions>`.
  - `/rewind` checkpoints.
  - `/btw` for side questions.
  - Name sessions with `/rename`.
  - Source: [Best practices](https://code.claude.com/docs/en/best-practices)
- Multi-session quality: the Writer/Reviewer pattern ("A fresh context improves code review since Claude won't be biased toward code it just wrote"), and a test-writer vs implementer split. — [Best practices](https://code.claude.com/docs/en/best-practices)
- Failure patterns:
  - the kitchen sink session
  - correcting over and over
  - the over-specified CLAUDE.md
  - the trust-then-verify gap ("If you can't verify it, don't ship it")
  - the infinite exploration
  - Source: [Best practices](https://code.claude.com/docs/en/best-practices)
- **Long-running harness (Nov 26, 2025):**
  - The problem: "each new session begins with no memory of what came before". Agents either try to one-shot the whole project and run out of context, or declare victory prematurely.
  - The solution is two agent roles:
    - An **Initializer Agent** runs in the first session only and sets up scaffolding.
    - A **Coding Agent** runs in every later session and makes incremental progress.
  - Artifacts:
    - `claude-progress.txt`: progress log
    - `feature_list.json`: all features initially marked failing
    - `init.sh`: starts the dev server
    - descriptive git commits
  - Rules:
    - Work on "only one feature at a time".
    - Mark "passes: true" only after thorough testing.
    - Start each session by reading the progress files and running verification tests.
    - Use Puppeteer MCP for end-to-end browser tests.
  - Failure-mode table:

    | Failure mode | Initializer fix | Coding-agent fix |
    |---|---|---|
    | Premature victory | feature list | single feature + test before marking |
    | Buggy environment | git + progress notes | verify before new work, commit progress |
    | Incomplete marking | feature list | self-verify |
    | App-running complexity | init.sh | read init.sh at session start |

  - Source: [Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
- Agent SDK principles: the agent loop is "gather context -> take action -> verify work -> repeat". Compaction "automatically summarizes previous messages when the context limit approaches". Use subagents for parallelization and context isolation. Verification comes from rules, visual feedback, and LLM-as-judge. — [Building agents with the Claude Agent SDK](https://claude.com/blog/building-agents-with-the-claude-agent-sdk)
- The anthropic.com "Claude Code best practices" engineering post (originally April 2025) now permanently redirects (308) to the maintained docs page code.claude.com/docs/en/best-practices. Cite the docs page as current. — observed redirect from [anthropic.com/engineering/claude-code-best-practices](https://www.anthropic.com/engineering/claude-code-best-practices)

### Inferences
- Pattern for a durable AI organization:
  1. Give every recurring or long job an external state file ("progress log" + JSON task list with pass/fail) that each fresh run reads first.
  2. Gate "done" with a hook or evaluator, not the worker's self-report.
  3. Separate the "setup/initializer" role from the "incremental worker" role.
  4. Have a reviewer role in fresh context.
- This maps directly onto:
  - `.claude/agents/` (roles)
  - Stop/TaskCompleted hooks (gates)
  - `memory: project` or repo files (state)
  - Routines or `/loop` (cadence)

### Gaps
- The long-running-harness summary came via a condensed fetch. Exact prompt wording (e.g. the "It is unacceptable to remove or edit tests" style instruction) and the Nov 2025 companion posts on context engineering were not captured. Re-check the original if verbatim prompts are needed.
- I did not find a 2026 Anthropic engineering post that supersedes the Nov 2025 harness article. The docs' `/goal` and dynamic workflows features appear to productize parts of it, but I did not verify that link.
