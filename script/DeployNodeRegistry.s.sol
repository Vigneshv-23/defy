// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/NodeRegistry.sol";

contract DeployNodeRegistry is Script {
    function run() external {
        vm.startBroadcast();
        NodeRegistry registry = new NodeRegistry();
        vm.stopBroadcast();

        console.log("NodeRegistry deployed at:", address(registry));
    }
}
