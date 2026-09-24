# Execution plans

An execution plan is a durable, reviewable plan for a substantial feature or cross-cutting change. It records current repository evidence, intended work, dependencies, acceptance criteria, validation, risks, and the evidence required to call the work complete.

Create an active plan at `docs/exec-plans/active/<feature>.md` when work crosses multiple layers, changes a data/security boundary, introduces an external service, or cannot be safely reviewed as one small change. Keep it active while any acceptance criterion is open.

Required sections are status/metadata, current evidence and gaps, dependencies and decisions, phased objectives, acceptance criteria, validation, risks, and blockers. Do not move a plan to `completed/` merely because code was written or deployed. Move it only after every criterion and relevant validation has evidence, recording the final branch/commit and known limitations.

Update plan status and metadata whenever repository inspection materially changes the evidence. The plan must agree with [IMPLEMENTATION_STATUS.md](../IMPLEMENTATION_STATUS.md) after meaningful work.
