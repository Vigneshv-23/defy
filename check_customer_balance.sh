#!/bin/bash

# Customer Account Balance Checker
# Shows the balance of the customer account in ETH

CUSTOMER_ADDRESS="0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
RPC_URL="http://localhost:8545"

echo "=== Customer Account Balance ==="
cast balance "$CUSTOMER_ADDRESS" --rpc-url "$RPC_URL" | awk '{printf "%.6f ETH\n", $1/1e18}'
