#!/bin/bash

echo "=========================================="
echo "MetaMask Balance Checker"
echo "=========================================="
echo ""
echo "Compare these on-chain balances with MetaMask:"
echo ""

RPC_URL="http://localhost:8545"

# Account 1 (Model Owner)
ACC1="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
BAL1=$(cast balance $ACC1 --rpc-url $RPC_URL)
BAL1_ETH=$(printf "%.6f" $(echo "scale=6; $BAL1/10^18" | bc))
echo "Account 1 (Model Owner):"
echo "  Address: $ACC1"
echo "  Balance: $BAL1_ETH ETH"
echo ""

# Account 2 (Commission)
ACC2="0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
BAL2=$(cast balance $ACC2 --rpc-url $RPC_URL)
BAL2_ETH=$(printf "%.6f" $(echo "scale=6; $BAL2/10^18" | bc))
echo "Account 2 (Commission):"
echo "  Address: $ACC2"
echo "  Balance: $BAL2_ETH ETH"
echo ""

# Account 3 (Customer)
ACC3="0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
BAL3=$(cast balance $ACC3 --rpc-url $RPC_URL)
BAL3_ETH=$(printf "%.6f" $(echo "scale=6; $BAL3/10^18" | bc))
echo "Account 3 (Customer):"
echo "  Address: $ACC3"
echo "  Balance: $BAL3_ETH ETH"
echo ""

echo "=========================================="
echo "MetaMask Troubleshooting:"
echo "=========================================="
echo ""
echo "1. Make sure MetaMask is connected to:"
echo "   Network Name: Localhost 8545"
echo "   RPC URL: http://localhost:8545"
echo "   Chain ID: 31337"
echo "   Currency Symbol: ETH"
echo ""
echo "2. In MetaMask, click the account name and select 'Account Details'"
echo "   Verify the address matches one of the addresses above"
echo ""
echo "3. To refresh balances in MetaMask:"
echo "   - Click the circular arrow icon next to the account name"
echo "   - Or switch networks and switch back"
echo "   - Or close and reopen MetaMask"
echo ""
echo "4. If balances still don't match:"
echo "   - Check that Anvil is running: curl http://localhost:8545"
echo "   - Verify you're on the correct network (Chain ID 31337)"
echo "   - Make sure you imported the correct private keys"
echo ""
echo "5. To see recent transactions:"
echo "   - In MetaMask, go to Activity tab"
echo "   - You should see transactions with the contract addresses"
echo ""
