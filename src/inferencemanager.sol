// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface INodeRegistry {
    function isApproved(address node) external view returns (bool);
}

interface IModelRegistry {
    function getModel(uint256 modelId)
        external
        view
        returns (
            address owner,
            uint256 price,
            string memory ipfsCID
        );
}

contract InferenceManager {
    struct InferenceRequest {
        address user;
        uint256 modelId;
        uint256 paidAmount;
        bool fulfilled;
    }

    INodeRegistry public nodeRegistry;
    IModelRegistry public modelRegistry;

    uint256 public nextRequestId;
    mapping(uint256 => InferenceRequest) public requests;

    event InferenceRequested(
        uint256 indexed requestId,
        address indexed user,
        uint256 indexed modelId
    );

    event InferenceFulfilled(
        uint256 indexed requestId,
        address indexed node
    );

    constructor(address _nodeRegistry, address _modelRegistry) {
        nodeRegistry = INodeRegistry(_nodeRegistry);
        modelRegistry = IModelRegistry(_modelRegistry);
    }

    function requestInference(uint256 modelId) external payable {
        (address owner, uint256 price, ) =
            modelRegistry.getModel(modelId);

        require(msg.value == price, "Incorrect payment");

        uint256 requestId = nextRequestId++;

        requests[requestId] = InferenceRequest({
            user: msg.sender,
            modelId: modelId,
            paidAmount: msg.value,
            fulfilled: false
        });

        emit InferenceRequested(requestId, msg.sender, modelId);
    }

    function submitResult(uint256 requestId) external {
        require(
            nodeRegistry.isApproved(msg.sender),
            "Not approved node"
        );

        InferenceRequest storage req = requests[requestId];
        require(!req.fulfilled, "Already fulfilled");

        req.fulfilled = true;

        (address modelOwner, , ) =
            modelRegistry.getModel(req.modelId);

        uint256 nodeFee = req.paidAmount / 2;
        uint256 modelFee = req.paidAmount - nodeFee;

        payable(msg.sender).transfer(nodeFee);
        payable(modelOwner).transfer(modelFee);

        emit InferenceFulfilled(requestId, msg.sender);
    }
}

