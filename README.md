# InferChain

## Overview

InferChain is a verifiable AI inference platform focused on transparency, auditability, and fair monetization of AI inference.

The system uses a hybrid design:
- AI inference runs off‑chain for speed and scalability
- Blockchain is used only for verification and payment records

This repository contains the **backend and smart contract source code**.  
The **UI was built separately** using a no‑code platform.

---

## Problem Statement

Most AI inference platforms today are centralized.

Users cannot verify whether an inference was actually executed.  
Developers have limited visibility into usage and revenue.

As AI is used in more critical applications, this lack of transparency creates trust issues.

---

## Solution

InferChain separates computation from verification.

- AI inference is executed off‑chain
- Blockchain records inference requests, payments, and execution metadata
- Sensitive data is never stored on‑chain

This makes inference verifiable without sacrificing performance.

---

## Architecture

### Frontend (UI)

- Built using Flux / ThinkRoot (no‑code platform)
- Provides:
  - Prompt input
  - Inference execution
  - Output display
- Communicates with the backend using REST APIs

The frontend source code is not included in this repository because it is managed separately on the no‑code platform.

---

### Backend

This repository includes the backend implementation.

The backend is responsible for:
- Exposing APIs for the UI
- Interacting with smart contracts
- Listening to blockchain events
- Triggering off‑chain AI inference
- Returning inference results to the UI

---

### Smart Contracts

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

### Current Status

- MVP completed
- Backend and smart contracts implemented
- UI built separately using a no‑code platform
- End‑to‑end inference flow validated

---
## Think Root
### Home Page:
<img width="1600" height="852" alt="image" src="https://github.com/user-attachments/assets/a241a452-6ed6-491a-8748-2cba6e89cac9" />

### Market Place:
<img width="1600" height="858" alt="image" src="https://github.com/user-attachments/assets/3a94d60c-3d17-4b83-a760-fb3caaa40031" />

### Creator Lab:
<img width="1600" height="857" alt="image" src="https://github.com/user-attachments/assets/e3357d6c-3b8a-4974-8a3e-91c73b7c5ebe" />

---

## Enhancements

### INCO 

INCO is planned to add:
- Confidential smart contracts
- Privacy‑preserving handling of inference metadata

INCO is partially implemented in the current version.

<img width="1600" height="826" alt="image" src="https://github.com/user-attachments/assets/19b77136-fb5b-4187-b189-3505055b25e8" />

---

### Maestro (Planned)

Maestro is planned to improve:
- Workflow orchestration
- Automation and execution reliability

Maestro is partially implemented in the current version.

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

---
<img width="2206" height="1632" alt="image" src="https://github.com/user-attachments/assets/23e105f2-28c9-4123-be39-db2b23b15bd9" />
<img width="2203" height="1623" alt="image" src="https://github.com/user-attachments/assets/62b78adc-2c12-47e8-9e0f-e31bf7b15edc" />

---

## before:
<img width="648" height="1466" alt="image" src="https://github.com/user-attachments/assets/20276c1e-2482-441f-8ed6-554be9797708" />

---

## after
<img width="2178" height="1579" alt="image" src="https://github.com/user-attachments/assets/d12e0505-1d9b-43c7-99db-da5d39656157" />
<img width="636" height="1330" alt="image" src="https://github.com/user-attachments/assets/70b9c930-9742-4129-b9ef-edb0bcff2282" />

---

## dev private key : 
ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
## dev address : 
0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

## user private key : 
59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
## user address : 
0x70997970C51812dc3A010C7d01b50e0d17dc79C8

## platform private key : 
5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a
## platform address : 
0x70997970C51812dc3A010C7d01b50e0d17dc79C8

