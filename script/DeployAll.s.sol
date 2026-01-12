// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/NodeRegistry.sol";
import "../src/ModelRegistry.sol";
import "../src/InferenceManager.sol";

contract DeployAll is Script {
    function run() external {
        // Use the private key passed via --private-key flag
        // The deployer account will become the NodeRegistry admin
        vm.startBroadcast();
        console.log("Deploying contracts to local network (Anvil)...");
        console.log("Deployer will become NodeRegistry admin");

        // 1. Deploy NodeRegistry (no dependencies)
        console.log("\n1. Deploying NodeRegistry...");
        NodeRegistry nodeRegistry = new NodeRegistry();
        console.log("NodeRegistry deployed at:", address(nodeRegistry));

        // 2. Deploy ModelRegistry (no dependencies)
        console.log("\n2. Deploying ModelRegistry...");
        ModelRegistry modelRegistry = new ModelRegistry();
        console.log("ModelRegistry deployed at:", address(modelRegistry));

        // 3. Deploy InferenceManager (depends on NodeRegistry and ModelRegistry)
        // Commission account: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC (Account 2)
        console.log("\n3. Deploying InferenceManager...");
        address commissionAccount = 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC;
        console.log("Commission Account (25%):", commissionAccount);
        InferenceManager inferenceManager = new InferenceManager(
            address(nodeRegistry),
            address(modelRegistry),
            commissionAccount
        );
        console.log("InferenceManager deployed at:", address(inferenceManager));

        vm.stopBroadcast();

        console.log("\n=== Deployment Summary ===");
        console.log("NodeRegistry:", address(nodeRegistry));
        console.log("ModelRegistry:", address(modelRegistry));
        console.log("InferenceManager:", address(inferenceManager));
    }
}
