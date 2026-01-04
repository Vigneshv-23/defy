// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/InferenceManager.sol";

contract DeployInferenceManager is Script {
    function run() external {
        address nodeRegistry  = 0x5FC8d32690cc91D4c39d9d3abcBD16989F875707;
        address modelRegistry = 0x0165878A594ca255338adfa4d48449f69242Eb8F;

        vm.startBroadcast();
        new InferenceManager(nodeRegistry, modelRegistry);
        vm.stopBroadcast();
    }
}
