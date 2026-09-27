Read AGENTS.md first and follow its instructions.

I am providing the detailed specification currently available as:

docs/specs/personalisation-profile-auth-theme-v1.md

This specification covers:
- prominent user Profile
- first-data onboarding
- demo-data isolation
- premium Login and Registration
- Dr Peace as default/featured consultant
- Light/Dark/System themes
- responsive and Design Lab requirements

IMPORTANT:

Much of this functionality may already exist.

DO NOT reimplement functionality merely because it appears in the specification.

First reconcile this specification against:
- the current repository
- ARCHITECTURE.md
- docs/IMPLEMENTATION_STATUS.md
- docs/PRODUCT_REQUIREMENTS.md
- docs/BUSINESS_RULES.md
- docs/SECURITY.md
- docs/DATABASE.md

Then:

1. Add any durable requirements from this specification that are missing from
   docs/PRODUCT_REQUIREMENTS.md.

2. Add any stable business rules that are missing from
   docs/BUSINESS_RULES.md.

3. Update docs/IMPLEMENTATION_STATUS.md only where actual code inspection
   justifies a change.

4. Create:

docs/exec-plans/active/personalisation-profile-auth-theme-v1.md

The execution plan must contain ONLY gaps between the specification and the
current implementation.

For each gap provide:
- current state
- required state
- affected files/systems
- dependencies
- acceptance criteria
- validation required

Group the remaining work into small implementation phases.

Do NOT implement anything in this task.

Do NOT create duplicate systems.

Do NOT create migrations merely because the old specification proposed them.

Do NOT alter consultation-platform-v1.md except where a direct dependency
needs a cross-reference.

At the end tell me:

A. Which requirements are already implemented
B. Which are implemented but unverified
C. Which are partially implemented
D. Which are not implemented
E. Which parts of the old specification are obsolete because the current
   architecture already solves them differently
F. The recommended first implementation phase

Update documentation metadata as required by AGENTS.md.

This is reconciliation and execution planning only.