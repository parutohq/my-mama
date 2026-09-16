# My MAMA premium UI audit

## Keep

- The Next.js App Router and Supabase-backed record architecture.
- The existing private record flows for check-ins, periods, appointments, tasks, questions, export and deletion.
- The journey-aware Home composition for cycle, pregnancy and postpartum states.
- The fixed, safe-area-aware mobile navigation and accessible shadcn primitives.
- The clinical guardrails: user-entered data is never presented as diagnosis, risk scoring or fertility prediction.

## Refine

- **Tokens:** Colours, editorial type, spacing, elevation, radii and motion now use semantic My MAMA tokens in `app/globals.css`.
- **Hierarchy:** Home, Journey, Journal, Care, Learn, Summary, Ask MAMA and Profile use an editorial hero plus fewer, clearer action surfaces.
- **Mobile:** The Home hero changes composition at tablet widths; mobile navigation retains 44px touch targets and a distinct Ask MAMA destination.
- **Accessibility:** Visible focus, skip navigation, reduced motion, chart descriptions and loading semantics are in place.
- **States:** Loading now resembles the Home layout and avoids abrupt layout shift. Error states retain a clear retry action.

## Replace gradually

- Older screen-specific colour literals should migrate to the semantic token layer as each surface is touched.
- Legacy equal-weight dashboard card grids should yield to a primary hero, focused action surfaces and whitespace-led grouping.
- Generic empty states should continue to receive journey-aware language while remaining free of fabricated health data.

## Consolidate

- `HomeVisualPrototype` is the reference component for the three journey-aware Home states.
- `InsightCard` remains the reusable chart/observation surface; charts must identify recorded versus estimated data.
- `MamaNavigation` and `MobileBottomNavigation` are the single navigation sources.
- The preview-only Design Lab lives at `/design-preview` on local and Vercel Preview deployments only. It has no access to user records and is unavailable in Production.

## Deliberate boundaries

- Ask MAMA is currently a private care-preparation shell that saves questions; it does not imply an AI diagnosis or clinician messaging service.
- Consultation, sharing and clinician workflows remain governed by the existing Supabase RLS model and should only be expanded with verified providers and RLS tests.
- Strong red and orange remain reserved for destructive and safety states, never decorative UI.
