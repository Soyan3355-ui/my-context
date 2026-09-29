# 週次リサーチ 監視先リスト

週次リサーチ（基準書 第14章 `GOV-01`）で優先的に確認する情報源。追加・削除はPRで提案する。

## 一次情報（最優先）
| 情報源 | URL | 主に見るもの | 関連ルール |
|---|---|---|---|
| Claude Code 変更履歴 | https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md | 権限・フック・サブエージェント・スキル・Routines・Agent Teams の仕様変更 | ENF-*, ARC-05 |
| Claude Code Docs | https://code.claude.com/docs/en/ | sub-agents, hooks, permissions, sandboxing, memory, skills, agent-teams, best-practices | ENF-*, MEM-* |
| Anthropic Engineering | https://www.anthropic.com/engineering | エージェント設計・ハーネス・評価 | PRI-*, ARC-* |
| Anthropic Research | https://www.anthropic.com/research | 自律度測定、マルチエージェント、Project Vend、報酬ハッキング | AUT-*, OUT-* |
| Claude Blog | https://claude.com/blog | マルチエージェントの使いどころ | ARC-* |
| OpenAI（エージェント関連ガイド・Agents SDK） | https://openai.com/business/guides-and-resources/ | エージェント設計・ガードレール | ARC-*, ESC-* |
| Google DeepMind / Google Research | https://deepmind.google/research/ , https://research.google/blog/ | エージェントのスケーリング、委任 | ARC-02 |

## 研究
| 情報源 | 検索語の例 | 関連ルール |
|---|---|---|
| arXiv（cs.AI, cs.MA, cs.CL, cs.HC） | multi-agent LLM failure, multi-agent debate, sycophancy conformity agents, human-in-the-loop agents, agent oversight, levels of autonomy, reward hacking agents, agent evaluation | MTG-*, VER-*, AUT-* |
| NeurIPS / ICML / ICLR / ACL / CHI の採択論文 | 同上 | 同上 |
| METR | https://metr.org/blog | OUT-*, VER-* |

## 標準・セキュリティ
| 情報源 | URL | 関連ルール |
|---|---|---|
| OWASP GenAI Security Project | https://genai.owasp.org/ | ENF-*, MEM-03 |
| NIST AI RMF / 関連プロファイル | https://www.nist.gov/itl/ai-risk-management-framework | AUT-*, GOV-* |
| AWS Agentic AI Scoping Matrix | https://aws.amazon.com/ai/security/agentic-ai-scoping-matrix/ | AUT-*, REV-* |

## 実務・事業成果
| 情報源 | 検索語の例 | 関連ルール |
|---|---|---|
| HBR / McKinsey / DORA / Gartner | agentic AI ROI, workslop, agent productivity | OUT-* |
| Zenn / Qiita / note（日本語実践） | Claude Code サブエージェント 組織, Claude Code マルチエージェント 運用, Claude Code フック | ARC-*, ENF-* |
