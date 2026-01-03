// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title NodeRegistry
 * @author InferChain
 * @notice Manages approved inference nodes
 */
contract NodeRegistry {
    /// @notice Admin address (deployer)
    address public admin;

    /// @notice Mapping of approved inference nodes
    mapping(address => bool) public approvedNodes;

    /// @notice Emitted when a node is approved
    event NodeAdded(address indexed node);

    /// @notice Emitted when a node is removed
    event NodeRemoved(address indexed node);

    /// @notice Set deployer as admin
    constructor() {
        admin = msg.sender;
    }

    /// @notice Restricts function to admin only
    modifier onlyAdmin() {
    _onlyAdmin();
    _;
}

function _onlyAdmin() internal view {
    require(msg.sender == admin, "NodeRegistry: not admin");
}


    /// @notice Approve an inference node
    function addNode(address node) external onlyAdmin {
        require(node != address(0), "NodeRegistry: zero address");
        approvedNodes[node] = true;
        emit NodeAdded(node);
    }

    /// @notice Remove an inference node
    function removeNode(address node) external onlyAdmin {
        approvedNodes[node] = false;
        emit NodeRemoved(node);
    }

    /// @notice Check if a node is approved
    function isApproved(address node) external view returns (bool) {
        return approvedNodes[node];
    }
}
