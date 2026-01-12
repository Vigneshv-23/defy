// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/InferenceManager.sol";

contract DeployInferenceManager is Script {
    function run() external {
        // Get addresses from environment or use defaults for local deployment
        address nodeRegistry = vm.envOr("NODE_REGISTRY_ADDRESS", address(0x5FbDB2315678afecb367f032d93F642f64180aa3));
        address modelRegistry = vm.envOr("MODEL_REGISTRY_ADDRESS", address(0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512));

        require(nodeRegistry != address(0), "NodeRegistry address cannot be zero");
        require(modelRegistry != address(0), "ModelRegistry address cannot be zero");

        uint256 deployerPrivateKey = vm.envOr("PRIVATE_KEY", uint256(0));
        
        if (deployerPrivateKey != 0) {
            vm.startBroadcast(deployerPrivateKey);
        } else {
            vm.startBroadcast();
        }

        InferenceManager manager =
            new InferenceManager(nodeRegistry, modelRegistry);
        vm.stopBroadcast();

        console.log("InferenceManager deployed at:", address(manager));
        console.log("Using NodeRegistry:", nodeRegistry);
        console.log("Using ModelRegistry:", modelRegistry);
    }
}
