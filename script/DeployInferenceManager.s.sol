// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/InferenceManager.sol";

contract DeployInferenceManager is Script {
    function run() external {
        address nodeRegistry  = 0x5FbDB2315678afecb367f032d93F642f64180aa3;
        address modelRegistry = 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512;

        vm.startBroadcast();
        InferenceManager manager =
            new InferenceManager(nodeRegistry, modelRegistry);
        vm.stopBroadcast();

        console.log("InferenceManager deployed at:", address(manager));
    }
}
