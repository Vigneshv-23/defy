// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/NodeRegistry.sol";
import "../src/ModelRegistry.sol";
import "../src/InferenceManager.sol";

contract DeployAll is Script {
    function run() external {
        // Try to get private key from env, otherwise use default (for local Anvil)
        uint256 deployerPrivateKey = vm.envOr("PRIVATE_KEY", uint256(0));
        
        if (deployerPrivateKey != 0) {
            vm.startBroadcast(deployerPrivateKey);
            console.log("Deploying contracts...");
            console.log("Deployer:", vm.addr(deployerPrivateKey));
        } else {
            vm.startBroadcast();
            console.log("Deploying contracts to local network (Anvil)...");
            console.log("Using default account");
        }

        // 1. Deploy NodeRegistry (no dependencies)
        console.log("\n1. Deploying NodeRegistry...");
        NodeRegistry nodeRegistry = new NodeRegistry();
        console.log("NodeRegistry deployed at:", address(nodeRegistry));

        // 2. Deploy ModelRegistry (no dependencies)
        console.log("\n2. Deploying ModelRegistry...");
        ModelRegistry modelRegistry = new ModelRegistry();
        console.log("ModelRegistry deployed at:", address(modelRegistry));

        // 3. Deploy InferenceManager (depends on NodeRegistry and ModelRegistry)
        console.log("\n3. Deploying InferenceManager...");
        InferenceManager inferenceManager = new InferenceManager(
            address(nodeRegistry),
            address(modelRegistry)
        );
        console.log("InferenceManager deployed at:", address(inferenceManager));

        vm.stopBroadcast();

        console.log("\n=== Deployment Summary ===");
        console.log("NodeRegistry:", address(nodeRegistry));
        console.log("ModelRegistry:", address(modelRegistry));
        console.log("InferenceManager:", address(inferenceManager));
    }
}
