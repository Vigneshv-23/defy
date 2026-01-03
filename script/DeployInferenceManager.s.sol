// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/InferenceManager.sol";

contract DeployInferenceManager is Script {
    function run() external {
        // ✅ latest deployed addresses
        address nodeRegistry  = 0x5FbDB2315678afecb367f032d93F642f64180aa3;
        address modelRegistry = 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0;

        vm.startBroadcast();
        new InferenceManager(nodeRegistry, modelRegistry);
        vm.stopBroadcast();
    }
}
