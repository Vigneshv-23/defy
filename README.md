# InferChain

## Overview

InferChain is a verifiable AI inference platform designed to improve transparency and trust in AI inference workflows.

The project follows a hybrid architecture:
- AI inference runs off‑chain for performance and scalability
- Blockchain is used only for verification and payment records

This repository contains the backend and smart contract source code.  
The user interface (UI) was built separately using a no‑code platform.

---

## Problem Statement

Most AI inference systems today are centralized.

Users cannot verify whether an inference was actually executed or if the results are reliable.  
Developers lack clear visibility into usage and monetization.

As AI adoption increases in critical and large‑scale applications, this lack of transparency creates trust issues.

---

## Solution

InferChain separates computation from verification.

- AI models run off‑chain to remain fast and cost‑efficient
- Blockchain records inference requests, payments, and execution metadata
- Sensitive data is never stored on‑chain

This design provides auditability without compromising performance.

---

## Architecture


Blockchain is used for verification, not for running AI models.

---

## Frontend (UI)

- Built using Flux / ThinkRoot (no‑code platform)
- Provides:
  - Prompt input
  - Inference execution
  - Output display
- Communicates with the backend using REST APIs

The frontend source code is not included in this repository because it is managed separately on the no‑code platform.

---

## Backend

This repository includes the backend implementation.

The backend is responsible for:
- Exposing APIs for the UI
- Interacting with smart contracts
- Listening to blockchain events
- Triggering off‑chain AI inference
- Returning inference results to the UI

---

## Smart Contracts

Smart contracts handle:
- Inference request registration
- Payment confirmation
- Event emission for verification
- Model and developer metadata

Data not stored on‑chain:
- User prompts
- AI outputs
- Model weights
- Large or sensitive data

---

## Current Status

- MVP completed
- Backend and smart contracts implemented
- UI built separately using a no‑code platform
- End‑to‑end inference flow validated

---

## Planned Enhancements

### INCO (Planned)

INCO is planned to add:
- Confidential smart contracts
- Privacy‑preserving handling of inference metadata

INCO is not implemented in the current version.

---

### Maestro (Planned)

Maestro is planned to improve:
- Workflow orchestration
- Automation and execution reliability

Maestro is not implemented in the current version.

---

## Project Scope

The current focus is:
- Architecture validation
- Verifiable AI inference feasibility
- Clear separation between computation and verification

Future work will focus on privacy, orchestration, and scaling.

---

## Team

Team Name: Great Mates  
Project Name: InferChain

---

## Summary

InferChain demonstrates a practical approach to verifiable AI inference using a hybrid architecture.  
The UI and the core system were built separately, following a clear separation of concerns.
