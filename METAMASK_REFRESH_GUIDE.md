# MetaMask Not Showing Balance Changes? Here's How to Fix It

## Current On-Chain Balances (Verified)

These are the **actual** balances on your local Anvil blockchain:

- **Account 1 (Model Owner):** `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
  - Balance: **9990.005964 ETH** ✅
  - Should have gained: **+0.0075 ETH** (75% of payment)

- **Account 2 (Commission):** `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`
  - Balance: **10000.005000 ETH** ✅
  - Should have gained: **+0.0025 ETH** (25% of payment)

- **Account 3 (Customer):** `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
  - Balance: **9999.838996 ETH**
  - Should have paid: **-0.01 ETH**

---

## Why MetaMask Might Not Show Changes

MetaMask caches balances and doesn't always auto-refresh on local networks. Here's how to fix it:

---

## Solution 1: Refresh the Network (Easiest)

1. **In MetaMask, click the network dropdown** (top left, shows "Localhost 8545")
2. **Click "Localhost 8545" again** (this forces a refresh)
3. **Check your balance** - it should update!

---

## Solution 2: Refresh the Account

1. **Click your account name/icon** (top right)
2. **Look for a circular arrow/refresh icon** next to the account name
3. **Click it** to manually refresh the balance
4. **Or switch to another account and switch back**

---

## Solution 3: Disconnect and Reconnect Network

1. **Click the network dropdown** (top left)
2. **Click "Localhost 8545"** → **"Disconnect"** (if available)
3. **Or go to Settings** → **Networks** → **Localhost 8545** → **Delete**
4. **Re-add the network:**
   - Network Name: `Localhost 8545`
   - RPC URL: `http://localhost:8545`
   - Chain ID: `31337`
   - Currency Symbol: `ETH`
5. **Switch to the network** and check balances

---

## Solution 4: Verify Network Settings

Make sure MetaMask is connected to the **correct network**:

1. **Click network dropdown** (top left)
2. **Verify it shows:** "Localhost 8545"
3. **Click the network name** → **"View Details"**
4. **Verify:**
   - RPC URL: `http://localhost:8545`
   - Chain ID: `31337`
   - Currency Symbol: `ETH`

---

## Solution 5: Check Account Address

Make sure you're viewing the **correct account**:

1. **Click account icon** (top right)
2. **Click "Account Details"**
3. **Verify the address matches:**
   - Account 1: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
   - Account 2: `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`
   - Account 3: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`

---

## Solution 6: Check Activity Tab

1. **In MetaMask, click "Activity" tab**
2. **You should see recent transactions:**
   - Contract deployment
   - `requestInference` (customer payment)
   - `submitResult` (payment distribution)
3. **If you see transactions, the network is working!**
4. **The balance just needs to refresh**

---

## Solution 7: Restart MetaMask

1. **Close MetaMask completely**
2. **Reopen MetaMask**
3. **Switch to "Localhost 8545" network**
4. **Check balances**

---

## Solution 8: Force Refresh with a Transaction

If nothing else works, send a tiny transaction to force a refresh:

```bash
# Send 0 ETH from Account 1 to Account 2 (just to trigger refresh)
cast send 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC \
  --value 0 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --rpc-url http://localhost:8545
```

This will create a transaction that MetaMask will detect, forcing it to refresh.

---

## Quick Verification Command

Run this to see current on-chain balances:

```bash
./check_metamask_balances.sh
```

Compare these with MetaMask. If they match, MetaMask is working correctly!

---

## Still Not Working?

1. **Verify Anvil is running:**
   ```bash
   curl http://localhost:8545
   ```

2. **Check if you're on the right network:**
   - MetaMask should show Chain ID: `31337`
   - Network name: `Localhost 8545`

3. **Try importing the account again:**
   - Export the account from MetaMask
   - Delete it
   - Re-import using the private key

4. **Check browser console for errors:**
   - Press F12 in your browser
   - Look for any errors related to RPC calls

---

## Expected Behavior

After running `./complete_payment_flow.sh`, you should see:

- **Account 1 (Model Owner):** Balance increases by ~0.0075 ETH
- **Account 2 (Commission):** Balance increases by ~0.0025 ETH
- **Account 3 (Customer):** Balance decreases by ~0.01 ETH

The balances are **definitely correct on-chain** - MetaMask just needs to refresh to show them!
