---
name: autonomy-governor
description: >
  The core governance protocol for agent autonomy. This dictates how and when
  the agent can execute scripts, modify files, or trigger other skills.
---

# Autonomy Governor — Agent Execution Protocol

This skill defines the **operational rules** for agent autonomy during any
conversation. It is not invoked like a normal skill — it is a standing policy
that the agent MUST respect at all times.

---

## Operational Modes

The user may switch modes at **any point** during a conversation by declaring:

> `mode: ask` | `mode: auto` | `mode: bypass`

or equivalently:

> "passe en mode auto" / "switch to bypass" / "god mode" / "ask me first"

The agent acknowledges the switch and operates under the new rules immediately.

---

### Mode 1 — `ask` (Default)

**Principle**: Zero surprise. The agent proposes, the user disposes.

| Rule | Detail |
|------|--------|
| **Before any command** | The agent MUST outline the exact command line(s) it intends to run and wait for explicit user confirmation. |
| **Before any file write** | The agent MUST show the diff or full content and wait for approval. |
| **Before triggering a skill** | The agent MUST name the skill and summarize the expected side-effects. |
| **Read-only operations** | Viewing files, grepping, listing directories — allowed without asking. |

This is the **default** mode at conversation start unless the user specifies
otherwise.

---

### Mode 2 — `auto` (Heuristic Risk Assessment)

**Principle**: Move fast on safe ops, pause on dangerous ones.

The agent classifies every action into one of two risk tiers:

#### ✅ Tier 1 — Auto-execute (no confirmation needed)

- Read-only operations (view, grep, list, search)
- Local-only builds (`npm run dev`, `npm run build`, local compilation)
- Local file creation/modification **within the current project workspace**
- Running local test suites
- Git operations that don't push (`git add`, `git commit`, `git diff`, `git log`)

#### 🛑 Tier 2 — Halt and ask

- Any action affecting **remote nodes** (HSVR, SERVOPI, any SSH target)
- Modifying **network perimeters** (firewall rules, UFW, iptables, port forwarding)
- Touching **production files** or configs on remote machines
- `git push`, deployments, CI triggers
- Destructive operations (`rm -rf`, `DROP TABLE`, disk format, etc.)
- Installing global system packages (`apt install`, `choco install`, etc.)
- Any operation the agent is uncertain about

When auto-executing a Tier 1 action, the agent logs a one-line rationale
**before** running it (see Core Philosophy below).

---

### Mode 3 — `bypass` (God Mode)

**Principle**: Full autonomy — the agent executes all tasks to achieve the
user's stated goal without stopping for confirmation.

| Rule | Detail |
|------|--------|
| **All actions** | Executed immediately. No confirmation prompts. |
| **Scope** | Unlimited — local, remote, destructive, network, production. |
| **Logging** | Still **mandatory** (see Core Philosophy). Every action is logged with rationale before execution. |
| **Exit** | The user can revoke this mode at any time. The agent also self-downgrades to `ask` if it detects an irreversible action it has low confidence about. |

> [!CAUTION]
> Bypass mode is powerful. The agent will act on remote servers, modify
> production files, and push code without asking. Use only when you trust
> the goal is well-defined and the blast radius is acceptable.

---

## Core Philosophy — Mandatory Action Logging

**Even in Bypass or Auto mode**, the agent MUST log a brief explanation of
**why** it chose a specific action or command **before** executing it.

Format:
```
[GOVERNOR · <MODE>] <action summary>
  ↳ Reason: <one-line rationale>
```

Example:
```
[GOVERNOR · AUTO] Running `npm run build` in topology-map/
  ↳ Reason: User asked to verify the production bundle; build is local-only, Tier 1.
```

```
[GOVERNOR · BYPASS] SSH into SERVOPI → restarting nginx
  ↳ Reason: Deploy step 3/5 — new config pushed, service restart required.
```

This ensures **complete data monitoring sovereignty and logic transparency**
regardless of autonomy level. The user can always audit the decision trail.

---

## Mode Switching — Quick Reference

| User says | Mode activated |
|-----------|----------------|
| `mode: ask` / "demande-moi" / "ask me first" | `ask` |
| `mode: auto` / "mode auto" / "auto mode" | `auto` |
| `mode: bypass` / "god mode" / "full auto" / "bypass" | `bypass` |
| (conversation start, nothing said) | `ask` (default) |

The agent confirms the switch with:
```
⚙ GOVERNOR → mode switched to [MODE]. Rules now active.
```

---

## Integration Notes

- This skill takes **precedence** over all other skills. No other skill may
  override the governor's halt decision in `ask` or `auto` mode.
- The governor does not affect the agent's ability to **think**, **plan**, or
  **create artifacts** — only executable actions (commands, file writes, skill
  triggers, network calls).
- If the user's instruction conflicts with the current mode (e.g., "just do it"
  while in `ask` mode), the agent treats this as an implicit mode switch to
  `bypass` for that task only, then reverts to the previous mode.
