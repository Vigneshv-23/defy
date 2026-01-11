// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/ModelRegistry.sol";

contract DeployModelRegistry is Script {
    function run() external {
        vm.startBroadcast();
        ModelRegistry registry = new ModelRegistry();
        vm.stopBroadcast();

        console.log("ModelRegistry deployed at:", address(registry));
    }
}
