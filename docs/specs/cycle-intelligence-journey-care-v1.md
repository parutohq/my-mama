# My MAMA — Cycle Intelligence, Journey Transitions & Care v1

> Specification status: intended product requirements; implementation is not implied.
> Last reconciled against code: 2026-09-25  
> Repository branch: `design/mymama-premium-ui`  
> Commit: `98d8246`

## Purpose

Extend the existing cycle, care, journey, education, and consultation foundations without creating parallel repositories, charts, calendars, or data models. The experience must remain mobile-first, accessible, private, and clinically bounded.

## Data language and safety

- **Recorded data** is entered by the user or imported from a legitimate source.
- **Estimated data** is calculated from recorded dates and must be labelled as estimated.
- **Typical pattern** is educational information about common cycle variation; it is never a personal hormone measurement.
- **Measured data** is a laboratory result only when legitimately recorded or imported.
- Missing data remains unknown; it must not be rendered as “none” or “normal.”
- The product must not diagnose PCOS, endometriosis, infertility, hormonal imbalance, ovarian reserve, or ovulation from dates, symptoms, or charts.
- Period and fertile-window estimates are not contraception-safe days or guarantees.
- Urgent-care guidance overrides routine education, commerce, and consultation prompts.

## Cycle intelligence

Provide an educational “Typical hormone pattern” experience for estrogen, progesterone, LH, and FSH. A current cycle-day marker may be shown only as a marker over the educational illustration. Insufficient or irregular history must reduce precision or withhold estimates. The UI must never say that My MAMA knows the user’s actual hormone levels without measured data.

## Menstrual calendar

Build on existing records to provide month view → day → day details. Show only supported recorded fields such as period days, spotting, flow, cramps/pain, mood, headache, bloating, breast symptoms, discharge, medicines/supplements, notes, appointments, and care tasks. Calculated next-period or fertile-window overlays must be visibly estimated. A future Trends view must reuse the existing chart primitive.

## Journey transitions and experience

Users can change the active supported journey without deleting longitudinal history. Existing journeys include Growing Up, My Cycle, Planning Ahead, Trying for a Baby, Pregnancy, After Birth, and Midlife, subject to the current schema. Coexisting journeys must not be invented where the model supports only one current journey.

Journey context should meaningfully shape Home, Track, Learn, Prepare, and Care while using truthful minimal states where functionality is absent. Pregnancy is never assumed as a destination. Sensitive transitions suppress inappropriate celebration, streaks, and notifications.

## Food for Your Journey

Plan a clinically reviewed educational nutrition experience with culturally relevant Nigerian/African-friendly examples and optional future preferences. Avoid unsupported claims such as “balances hormones,” therapeutic diets, and individualized medical nutrition prescriptions.

## MAMA Products

Plan a future commerce/catalogue abstraction for non-prescription menstrual, pregnancy, postpartum, baby-care, and personal-care products. Clinical guidance must remain separate from merchandising, and commercial incentives must not influence recommendations. No product catalogue or commerce implementation is established by this specification.

## Consultation entry points

Use the generic capability “Consult an Obstetrician & Gynaecologist.” Dr Peace remains the default/featured launch consultant when a real provider, service, and availability are provisioned. Contextual prompts may say “Discuss this with Dr Peace” or “Prepare for a consultation,” but must not diagnose. Paid consultation architecture remains governed by `docs/exec-plans/active/consultation-platform-v1.md`.

## Non-functional requirements

Support light, dark, and system themes; mobile-first responsive layouts; keyboard and screen-reader access; RLS-protected records; demo/account isolation; and safe Preview verification using synthetic accounts because Preview and Production share Supabase.

