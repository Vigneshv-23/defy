# Payment Flow Documentation

## Overview

When a customer requests an inference, the payment flow works as follows:

1. **Customer pays** → ETH is sent with `requestInference()` call
2. **Contract receives ETH** → Funds are held in the `InferenceManager` contract
3. **Customer balance reduces** → ETH is deducted from customer's wallet
4. **On fulfillment** → Contract splits payment 50/50 between node and model owner

---

## Payment Flow Steps

### Step 1: Customer Requests Inference

```solidity
function requestInference(
    uint256 modelId,
    uint256 durationMinutes
) external payable returns (uint256)
```

**What happens:**
- Customer sends ETH with the transaction (`msg.value`)
- Contract validates: `msg.value == totalCost` (pricePerMinute × durationMinutes)
- ETH is **automatically deposited** into the `InferenceManager` contract
- Customer's balance is **reduced** by the payment amount
- Request is stored with `paidAmount = msg.value`
- `InferenceRequested` event is emitted

**Example:**
- Model price: 0.001 ETH per minute
- Duration: 10 minutes
- Customer pays: 0.01 ETH
- Customer balance: 10.0 ETH → 9.99 ETH
- Contract balance: 0 ETH → 0.01 ETH

---

### Step 2: Contract Holds Funds (Escrow)

The `InferenceManager` contract holds the ETH until fulfillment:
- Funds are stored in the contract's balance
- No withdrawal is possible until `submitResult()` is called
- If request expires without fulfillment, funds remain locked (⚠️ **Potential Issue**)

---

### Step 3: Node Submits Result

```solidity
function submitResult(uint256 requestId) external
```

**What happens:**
- Only approved nodes can call this function
- Contract splits `paidAmount` 50/50:
  - `nodeFee = paidAmount / 2` → Sent to node (msg.sender)
  - `modelFee = paidAmount - nodeFee` → Sent to model owner
- Request marked as `fulfilled = true`
- `InferenceFulfilled` event is emitted

**Example (continuing from above):**
- Contract balance: 0.01 ETH
- Node receives: 0.005 ETH (50%)
- Model owner receives: 0.005 ETH (50%)
- Contract balance: 0 ETH (all funds distributed)

---

## Current Contract Balance

The `InferenceManager` contract currently has **0 ETH** (no pending requests).

---

## Code Analysis

### InferenceManager.sol

```solidity
// Customer pays when calling requestInference
function requestInference(...) external payable {
    require(msg.value == totalCost, "Incorrect payment");
    // msg.value is automatically deposited to contract
    requests[requestId] = InferenceRequest({
        paidAmount: msg.value,  // Stored for later distribution
        ...
    });
}

// Funds are distributed when result is submitted
function submitResult(uint256 requestId) external {
    uint256 nodeFee = req.paidAmount / 2;
    uint256 modelFee = req.paidAmount - nodeFee;
    
    payable(msg.sender).call{value: nodeFee}("");  // Send to node
    payable(modelOwner).call{value: modelFee}(""); // Send to model owner
}
```

---

## Testing the Payment Flow

### 1. Register a Model (ModelOwner)

First, register a model with a price:

```bash
# Connect to ModelRegistry
cast send 0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9 \
  "registerModel(string,uint256)" \
  "QmYourIPFSCID" \
  1000000000000000 \  # 0.001 ETH per minute (in wei)
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --rpc-url http://localhost:8545
```

### 2. Customer Requests Inference

```bash
# Customer (Account 1) requests inference for 10 minutes
# Total cost: 0.001 ETH/min × 10 min = 0.01 ETH = 10000000000000000 wei

cast send 0x5FC8d32690cc91D4c39d9d3abcBD16989F875707 \
  "requestInference(uint256,uint256)" \
  0 \  # modelId
  10 \ # durationMinutes
  --value 10000000000000000 \  # 0.01 ETH
  --private-key 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d \
  --rpc-url http://localhost:8545
```

**Expected Result:**
- Customer balance: 10.0 ETH → 9.99 ETH
- Contract balance: 0 ETH → 0.01 ETH

### 3. Check Balances

```bash
# Check customer balance
cast balance 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 --rpc-url http://localhost:8545

# Check contract balance
cast balance 0x5FC8d32690cc91D4c39d9d3abcBD16989F875707 --rpc-url http://localhost:8545
```

---

## Potential Issues

### ⚠️ Issue 1: No Refund Mechanism

If an inference request is not fulfilled before `expiresAt`, the funds remain locked in the contract with no way to retrieve them.

**Suggestion:** Add a `cancelRequest()` or `refund()` function that allows customers to claim refunds for expired requests.

### ⚠️ Issue 2: No Partial Fulfillment

If a request expires, there's no mechanism to handle partial fulfillment or refunds.

---

## Summary

✅ **Working correctly:**
- Customer balance reduces when paying
- ETH is deposited to contract
- Funds are held until fulfillment
- Payment is split 50/50 on fulfillment

⚠️ **Needs improvement:**
- No refund mechanism for expired requests
- No way to cancel requests
- Funds could get locked permanently

---

## Balance Tracking

You can track balances at any time:

```bash
# Check customer balance
cast balance <customer_address> --rpc-url http://localhost:8545

# Check contract balance
cast balance 0x5FC8d32690cc91D4c39d9d3abcBD16989F875707 --rpc-url http://localhost:8545

# Check node balance
cast balance <node_address> --rpc-url http://localhost:8545

# Check model owner balance
cast balance <model_owner_address> --rpc-url http://localhost:8545
```
