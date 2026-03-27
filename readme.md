# Project Lazarus

Problem Statement #3: Medical Forensic Recovery

Reconstruct a damaged hospital data system after ransomware, recover clinical truth from corrupted telemetry, and convert that data into actionable triage operations in real time.

## TL;DR for Judges

Project Lazarus is not just a dashboard.
It is a full recovery-to-response pipeline:

1. Forensic reconstruction of identity and medication data.
2. Live patient risk prioritization.
3. Explainable intervention simulation.
4. Command-and-control workflow with SLA tracking.
5. Tamper-evident incident documentation.

If your scoring values technical depth, product clarity, and real-world readiness, this repo is built for exactly that.

## Why This Repo Should Advance

### 1) Deep problem alignment

The solution is purpose-built for post-ransomware hospital recovery:

- identity collision recovery (`ghost_id` + `parity_group`)
- medication cipher decryption
- telemetry decoding (hex BPM)
- missing oxygen interpolation

### 2) Decision support, not just visualization

The triage system goes beyond charts and tables:

- Rapid Response Queue auto-ranks critical patients by modeled risk.
- AI Intervention Simulator estimates short-horizon effect of interventions.
- Pulse Intelligence explains why risk moved between live frames.
- Crisis Replay allows frame-by-frame forensic playback.

### 3) Operational command workflow

- Live Command Center assigns responders and tracks intervention phases.
- SLA countdown enforces urgency discipline.
- Voice Escalation mode gives urgent callouts for high-risk patients.

### 4) Forensic trust and governance

- Incident Command Export generates actionable, shareable briefs.
- Forensic Integrity Seal creates a cryptographic verification token (SHA-256), enabling tamper-evident chain-of-custody records.

## Core Features

### Medical Forensic Reconstruction

- Patient identity reconstruction from colliding IDs.
- Age-based Caesar decryption for medication names.
- Hex-to-decimal telemetry decoding.
- Linear interpolation for missing SpO2.

### Real-Time Triage Intelligence

- Live triage feed with severity filters.
- Auto-prioritized rapid response queue.
- Explainable risk deltas (BPM, SpO2, risk movement).
- Micro-replay of recent frames per patient.

### Intervention and Command Layer

- What-if simulation controls (oxygen, rate control, fluid support).
- Stabilization probability + ETA estimation.
- Team assignment panel + intervention phase timeline.
- SLA pressure visualization for critical incidents.

### Incident Reporting and Integrity

- Copy / Download / Print incident brief.
- Executive Summary card for non-technical stakeholders.
- Cryptographic integrity token for forensic verification.

## Architecture

```text
Hackathon-Hero/
├── artifacts/
│   ├── api-server/         # Express API (forensic logic + live triage data)
│   └── lazarus/            # React command dashboard
├── lib/
│   ├── api-spec/           # OpenAPI source of truth
│   ├── api-client-react/   # Generated client hooks
│   ├── api-zod/            # Generated validation models
│   └── db/                 # Shared schema layer
└── scripts/
```

## Technology

- Monorepo: pnpm workspaces
- Frontend: React, Vite, Tailwind, Framer Motion
- Backend: Express 5, esbuild
- Type safety: TypeScript + Zod
- API contracts: OpenAPI + Orval-generated client

## Data and Logic Notes

Dataset source:
https://github.com/Iste-Nith/Datasets/tree/main/Lazarus

Reconstruction rules used:

- Patient pairing by `ghost_id` and `parity_group`
- Medication decode shift = `patient_age mod 26`
- BPM decode from hex strings
- SpO2 interpolation for missing values

## API Surface

All endpoints are served under `/api`:

- GET `/patients`
- GET `/patients/:id`
- GET `/telemetry`
- GET `/telemetry/live`
- GET `/telemetry/alerts`
- GET `/prescriptions`
- GET `/analytics/summary`
- GET `/analytics/anomalies`
- GET `/audit-trail`
- GET `/healthz`

## Quick Start

From repository root:

```bash
pnpm install --ignore-scripts
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/api-server run start
pnpm --filter @workspace/lazarus run dev
```

Default local endpoints:

- Frontend: http://localhost:5173
- API: http://localhost:8080
- Health: http://localhost:8080/api/healthz

## 2-Minute Judge Walkthrough

1. Open `/alerts` and show auto-ranked Rapid Response Queue.
2. Select top patient and run intervention what-if simulation.
3. Show explainable risk delta and micro-replay trend.
4. Open Live Command Center with SLA timeline and team assignment.
5. Trigger Voice Escalation for urgency realism.
6. Generate Incident Brief and copy forensic integrity token.
7. End with Executive Summary for decision-ready communication.

## Evaluation-Ready Signals in This Repo

- Strong domain-specific logic, not generic dashboard scaffolding.
- End-to-end traceability from recovered data to operational action.
- Explainability and auditability included by default.
- Cleanly separated contracts, API, and frontend layers.

## Build and Validation

```bash
pnpm run typecheck
pnpm run build
```

## Platform Note (Windows)

On PowerShell, root preinstall is shell-based, so use:

```bash
pnpm install --ignore-scripts
```

Also ensure port `5173` is not already occupied by another local app.
