// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/InferenceManager.sol";

contract DeployInferenceManager is Script {
    function run() external {
        // ✅ NodeRegistry (unchanged)
        address nodeRegistry = 0x5FbDB2315678afecb367f032d93F642f64180aa3;

        // ✅ NEW ModelRegistry (just deployed)
        address modelRegistry = 0x0165878A594ca255338adfa4d48449f69242Eb8F;

        vm.startBroadcast();
        new InferenceManager(nodeRegistry, modelRegistry);
        vm.stopBroadcast();
    }
}
