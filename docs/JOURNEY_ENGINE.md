# Journey Engine

The Journey Engine is the shared typed content and presentation layer for stage-based care journeys. `lib/journey-engine.ts` owns reusable journey definitions, milestones, goal status, pregnancy-week calculation, and non-clinical progress calculations. `components/mama/pregnancy-journey-home.tsx` renders the first Pregnancy Journey using existing authenticated records and repository data.

The engine deliberately reuses the current `user_journeys`, `pregnancies`, `care_tasks`, `journey_tasks`, check-ins, appointments, medications, investigations, and achievement records. It does not create a parallel store. Future journeys should add a `JourneyDefinition` and stage-specific content configuration rather than new UI architecture.

## Progress calculations

- **Journey Progress** is the current pregnancy week divided by 40, capped at 100. It is an orientation aid, not a clinical outcome.
- **Care Consistency** is completed configured goals divided by configured goals.
- **Health Knowledge** is complete when the configured learning goal is completed; it remains 0 until reviewed learning content is completed.
- **Preparedness** awards 50% for each completed preparation goal and caps naturally at 100%.

Clinical thresholds, emergency rules, fertility claims, and medical recommendations are intentionally excluded. The scenario surface is a reviewed-content placeholder until clinicians approve the content and escalation rules. Wellbeing inputs must be handled by a clinician-approved rules layer; unrestricted LLM output must not determine emergency action.
