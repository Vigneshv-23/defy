// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface INodeRegistry {
    function isApproved(address node) external view returns (bool);
}

interface IModelRegistry {
    function getPricePerMinute(uint256 modelId)
        external
        view
        returns (uint256);

    function getModel(uint256 modelId)
        external
        view
        returns (
            address owner,
            uint256 pricePerMinute,
            string memory ipfsCid
        );
}

contract InferenceManager {
    struct InferenceRequest {
        address user;
        uint256 modelId;
        uint256 paidAmount;
        uint256 expiresAt;
        bool fulfilled;
    }

    INodeRegistry public nodeRegistry;
    IModelRegistry public modelRegistry;
    address public commissionAccount; // Account that receives 25% commission

    uint256 public nextRequestId;
    mapping(uint256 => InferenceRequest) public requests;

    event InferenceRequested(
        uint256 indexed requestId,
        address indexed user,
        uint256 indexed modelId,
        uint256 durationMinutes,
        uint256 expiresAt
    );

    event InferenceFulfilled(
        uint256 indexed requestId,
        address indexed node
    );

    constructor(address _nodeRegistry, address _modelRegistry, address _commissionAccount) {
        nodeRegistry = INodeRegistry(_nodeRegistry);
        modelRegistry = IModelRegistry(_modelRegistry);
        commissionAccount = _commissionAccount;
        require(_commissionAccount != address(0), "Commission account cannot be zero");
    }

    function requestInference(
        uint256 modelId,
        uint256 durationMinutes
    ) external payable returns (uint256) {
        require(durationMinutes > 0, "Invalid duration");

        uint256 pricePerMinute =
            modelRegistry.getPricePerMinute(modelId);

        uint256 totalCost =
            pricePerMinute * durationMinutes;

        require(msg.value == totalCost, "Incorrect payment");

        uint256 requestId = nextRequestId++;

        requests[requestId] = InferenceRequest({
            user: msg.sender,
            modelId: modelId,
            paidAmount: msg.value,
            expiresAt: block.timestamp + (durationMinutes * 60),
            fulfilled: false
        });

        emit InferenceRequested(
            requestId,
            msg.sender,
            modelId,
            durationMinutes,
            requests[requestId].expiresAt
        );

        return requestId;
    }

    function submitResult(uint256 requestId) external {
        require(
            nodeRegistry.isApproved(msg.sender),
            "Not approved node"
        );

        InferenceRequest storage req = requests[requestId];

        require(!req.fulfilled, "Already fulfilled");
        require(
            block.timestamp <= req.expiresAt,
            "Request expired"
        );

        req.fulfilled = true;

        (address modelOwner, , ) =
            modelRegistry.getModel(req.modelId);

        // Payment split: 75% to model owner, 25% to commission account
        uint256 commissionFee = (req.paidAmount * 25) / 100; // 25% commission
        uint256 modelFee = req.paidAmount - commissionFee; // 75% to model owner

        // Send 25% commission to commission account
        (bool ok1, ) =
            payable(commissionAccount).call{value: commissionFee}("");
        require(ok1, "Commission payment failed");

        // Send 75% to model owner
        (bool ok2, ) =
            payable(modelOwner).call{value: modelFee}("");
        require(ok2, "Model payment failed");

        emit InferenceFulfilled(requestId, msg.sender);
    }
}
