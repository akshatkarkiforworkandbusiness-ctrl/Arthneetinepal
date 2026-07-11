# Agent Orchestration Flow

This document details the multi-agent development workflow and lifecycle for the Arthneeti project.

## Workflow Handoffs

For any new feature request or non-trivial change:

1. **logic-reasoning-checker**: Reviews the idea, spec, or proposed approach before implementation begins. Finds reasoning flaws, unstated assumptions, and logic contradictions.
2. **code-writer**: Implements the changes based on the reasoning-checked plan.
3. **design-creative**: Proposes layouts, typography, CSS, and animations for UI changes, running alongside or immediately after code-writer.
4. **test-verifier**: Executes builds, lints, and test cases, tracing the acceptance criteria immediately after code-writer completes the task.
5. **context-keeper**: Automatically triggered via `task_complete` hook to record session outcome details in `.agents/memory/PROJECT_LOG.md`.
6. **self-audit**: Run periodically to sweep the repository for dead code, config drift, and security issues.
