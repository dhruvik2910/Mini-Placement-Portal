---
name: CampusPlacement OS
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#444651'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#757682'
  outline-variant: '#c5c5d3'
  surface-tint: '#4059aa'
  primary: '#00236f'
  on-primary: '#ffffff'
  primary-container: '#1e3a8a'
  on-primary-container: '#90a8ff'
  inverse-primary: '#b6c4ff'
  secondary: '#0051d5'
  on-secondary: '#ffffff'
  secondary-container: '#316bf3'
  on-secondary-container: '#fefcff'
  tertiary: '#003120'
  on-tertiary: '#ffffff'
  tertiary-container: '#004a32'
  on-tertiary-container: '#4ac08f'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b6c4ff'
  on-primary-fixed: '#00164e'
  on-primary-fixed-variant: '#264191'
  secondary-fixed: '#dbe1ff'
  secondary-fixed-dim: '#b4c5ff'
  on-secondary-fixed: '#00174b'
  on-secondary-fixed-variant: '#003ea8'
  tertiary-fixed: '#85f8c4'
  tertiary-fixed-dim: '#68dba9'
  on-tertiary-fixed: '#002114'
  on-tertiary-fixed-variant: '#005137'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 16px
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
  data-tabular:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: -0.01em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-lg: 1.5rem
  margin: 1rem
  margin-md: 1.5rem
  margin-lg: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system is engineered for the mission-critical environment of higher education Training & Placement Offices (TPO), enterprise campus recruiters, and graduating students navigating tier-1 hiring cycles. The brand personality balances collegiate governance with the crisp precision of a modern financial or enterprise operations console: authoritative, equitable, audit-ready, and motivating.

The visual style blends **Corporate / Modern** institutional discipline with utilitarian tabular ergonomics. Rather than employing distracting visual novelties, the system prioritizes legibility, unambiguous data density, deterministic feedback, and frictionless navigation across dual roles (high-velocity administrative workflows for placement coordinators vs. focused milestone/eligibility tracking for candidates).

### Target Users & Emotional Target
- **Placement Officers & Deans:** Control, clarity, confidence in compliance, and instantaneous insight across thousands of cohort records without cognitive overload.
- **Students & Applicants:** Clear progression, radical transparency around eligibility criteria, trust in verification locks, and reduced anxiety during high-stakes recruitment drives.
- **Corporate Recruiters:** Familiarity, structured candidate dossiers, and rapid shortlisting mechanisms.

## Colors

The palette establishes an institutional foundation utilizing authoritative deep blues, vibrant action-oriented royal blues, and strict semantic indicators calibrated for verification, audit tracking, and state clearance.

### Primary Palette & Structural Neutrals
- **Primary Navy (`#1E3A8A`):** Anchors main global chrome, administrative side navigation headers, primary institutional credentials, and master metric indicators.
- **Action Royal Blue (`#2563EB`):** High-intent interactive controls, primary calls to action, selected row indicators, active tab bars, and pagination highlights.
- **Neutral Stack:** Base background utilizes crisp cool canvas (`#F8FAFC`), layered over with elevated card and sheet backgrounds (`#FFFFFF`). Structural division relies on slate border tones (`#E2E8F0` for subtle borders, `#CBD5E1` for table header separators and input outlines). Body copy defaults to Slate-900 (`#0F172A`) with secondary supporting labels in Slate-500 (`#64748B`).

### Functional & Semantic Tokens
- **Verified / Eligible / Success (`#059669`):** Reserved strictly for verified CGPA thresholds, approved resumes, cleared background checks, and accepted job offers. Paired with emerald tint surfaces (`#ECFDF5`).
- **Pending / Action Required / Warning (`#D97706`):** Highlights profile lock dead-lines, pending departmental clearances, backlogs under evaluation, and assessment interview slots awaiting confirmation. Paired with amber tint surfaces (`#FFFBEB`).
- **Ineligible / Rejected / Danger (`#E11D48`):** Marks hard eligibility lockouts, disciplinary blocks, registration deadline lapses, and company rejections. Paired with rose tint surfaces (`#FFF1F2`).

## Typography

Typography pairs geometric distinction with utilitarian legibility:
- **Headlines (Plus Jakarta Sans):** Introduces approachable, structured authority to student dashboards and institutional reports. It prevents administrative software from feeling sterile while commanding respect in summary metrics and page titles.
- **Interface & Data Body (Inter):** Serves as the primary engine for high-density tables, multi-column eligibility comparisons, form controls, and candidate metadata. For numeric placements (CGPA, CTC packages, graduation years, candidate roll numbers), `font-feature-settings: "tnum" 1, "cv05" 1` must be enforced to enable strict tabular alignment.
- **Labeling:** All status badges, eligibility tags, and column headers leverage uppercase or semi-bold micro-copy (`label-sm`) with subtle tracking to maximize scan speed in large grids.

## Layout & Spacing

The layout is grounded in a fluid 12-column grid anchored by a persistent collapsible structural shell (260px desktop side navigation for TPO, top contextual navigation for students). 

### Viewport Adaptation & Breakpoints
- **Desktop (≥ 1280px):** 12 columns, 24px (`gutter-lg`) gutters, 32px (`margin-lg`) canvas padding. Tables display full column rosters with persistent right-hand candidate preview drawers.
- **Tablet / Small Desktop (768px – 1279px):** 8 columns, 16px (`gutter`) gutters, 24px (`margin-md`) canvas padding. Side navigation collapses to an icon bar; tabular sheets allow horizontal inline scroll with sticky frozen identity columns (Roll No / Name).
- **Mobile (< 768px):** 4 columns, 16px gutters, 16px (`margin`) margins. Dual-role views collapse to stacked card rosters, full-bleed action bottom sheets, and prioritized eligibility chips.

### Spacing Rhythm
Vertical cadence relies on 4px and 8px baseline steps. Compact component padding (`space-xs` and `space-sm`) maintains data density in cohort grids, while `space-md` through `space-xl` handles container separation, modal paddings, and section grouping.

## Elevation & Depth

Visual hierarchy is maintained predominantly through **tonal layering and low-contrast structural outlines**, avoiding floaty, theatrical drop shadows that compromise professional software density.

### Surface Tiers
- **Tier 0 (Base Canvas):** `#F8FAFC` (Slate-50) – Universal background for page layouts.
- **Tier 1 (Cards, Workspaces, Tables):** `#FFFFFF` – Primary structural surface, delimited by a single 1px solid `#E2E8F0` border.
- **Tier 2 (Popovers, Sticky Headers, Flyouts):** `#FFFFFF` with a crisp micro-shadow: `0 1px 3px 0 rgba(15, 23, 42, 0.08), 0 1px 2px -1px rgba(15, 23, 42, 0.08)` and border `#CBD5E1`.
- **Tier 3 (Modal Dialogs, Candidate Drawers):** `#FFFFFF` flanked by an institutional scrim (`#0F172A` at 40% opacity), structured by `0 10px 15px -3px rgba(15, 23, 42, 0.12), 0 4px 6px -4px rgba(15, 23, 42, 0.08)`.

### Demarcation Over Shadows
Visual priority is conveyed via left accent borders (e.g., a 3px vertical `#2563EB` strip on active candidate rows or `#E11D48` on rejected criteria blocks) rather than volumetric elevations.

## Shapes

The design system enforces a **Soft (`1`)** shape geometry. In a system handling thousands of verified records, rounded pill controls or aggressive organic curves degrade tabular alignment and consume excessive visual margin.

### Curvature Tokens
- **Micro & Base Controls (`rounded` / 0.25rem - 4px):** Form fields, inputs, table cell selection checkboxes, action buttons, status chips, eligibility badges, and inline code tags.
- **Containers & Surfaces (`rounded-lg` / 0.5rem - 8px):** Table envelopes, KPI metric cards, filter dropdown cards, student summary sheets, and modal frames.
- **Floating Overlays & Alerts (`rounded-xl` / 0.75rem - 12px):** Global system notifications, pinned eligibility banners, and slide-in onboarding panels.

## Components

### Buttons & Interactive Controls
- **Primary Action:** Solid `#2563EB` fill, white bold text, 4px border radius, 36px standard height (`space-sm` vertical, `space-md` horizontal padding). On hover: `#1D4ED8`. Focus state introduces a 2px offset ring in `#93C5FD`.
- **Institutional / Authority Action:** Solid `#1E3A8A` fill, white text, reserved for drive approvals, profile locking, and final offer sign-offs.
- **Secondary / Destructive Outline:** 1px `#E2E8F0` border, white background, `#0F172A` text. Destructive actions use `#E11D48` text and hover fill `#FFF1F2`.

### Status Badges & Eligibility Chips
- **Format:** 22px fixed height, 4px radius, inline-flex with centered text (`label-sm`).
- **Verified / Passed:** `#ECFDF5` background, `#059669` text, `#A7F3D0` outline. Includes checkmark glyph.
- **Under Review / Conditional:** `#FFFBEB` background, `#D97706` text, `#FDE68A` outline. Includes clock glyph.
- **Disqualified / Ineligible:** `#FFF1F2` background, `#E11D48` text, `#FECDD3` outline. Includes alert slash glyph.
- **Eligibility Breakdown Tooltip/Chip:** Compact compound chip showing requirement vs. candidate metric (e.g., `CGPA: 8.4 / 7.5 Req`).

### Data Tables & Tabular Grids
- **Header:** Sticky top, 40px height, `#F1F5F9` background, `#475569` text in uppercase `label-sm`, 1px solid `#CBD5E1` bottom border.
- **Rows:** 48px standard row height (36px compact mode), `#FFFFFF` zebra-alternating with `#F8FAFC`. Active/selected row highlighted with 50% opacity `#EFF6FF` and 3px solid `#2563EB` left accent.
- **Data Alignment:** Text columns left-aligned; numerical values, CTC packages, and dates right-aligned with monospace digits (`data-tabular`).

### Locked Profile Security Banners
- Institutional compliance notification rendered above non-editable forms when a student's verified profile is frozen by the TPO.
- Crisp banner with `#F8FAFC` background, 1px solid `#CBD5E1`, a solid `#1E3A8A` lock icon badge, and actionable secondary link to request revision from the cell administrator.

### Form Fields & Inputs
- 38px height, 1px solid `#CBD5E1` border, `#FFFFFF` background, 4px border radius.
- Read-only verified data displays in `#F1F5F9` fill with lock iconography, preventing client-side edits during live interview rounds.