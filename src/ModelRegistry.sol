// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ModelRegistry {
    struct Model {
        address owner;
        string ipfsCid;
        uint256 pricePerMinute; // wei per minute
    }

    uint256 public nextModelId;
    mapping(uint256 => Model) public models;

    event ModelRegistered(
        uint256 indexed modelId,
        address indexed owner,
        string ipfsCid,
        uint256 pricePerMinute
    );

    event ModelPriceUpdated(
        uint256 indexed modelId,
        uint256 newPricePerMinute
    );

    function registerModel(
        string calldata ipfsCid,
        uint256 pricePerMinute
    ) external returns (uint256) {
        require(pricePerMinute > 0, "Price must be > 0");

        uint256 modelId = nextModelId++;

        models[modelId] = Model({
            owner: msg.sender,
            ipfsCid: ipfsCid,
            pricePerMinute: pricePerMinute
        });

        emit ModelRegistered(
            modelId,
            msg.sender,
            ipfsCid,
            pricePerMinute
        );

        return modelId;
    }

    function updatePrice(
        uint256 modelId,
        uint256 newPricePerMinute
    ) external {
        Model storage model = models[modelId];

        require(msg.sender == model.owner, "Not model owner");
        require(newPricePerMinute > 0, "Invalid price");

        model.pricePerMinute = newPricePerMinute;

        emit ModelPriceUpdated(modelId, newPricePerMinute);
    }

    function getModel(uint256 modelId)
        external
        view
        returns (
            address owner,
            uint256 pricePerMinute,
            string memory ipfsCid
        )
    {
        Model storage model = models[modelId];
        return (model.owner, model.pricePerMinute, model.ipfsCid);
    }

    function getPricePerMinute(uint256 modelId)
        external
        view
        returns (uint256)
    {
        return models[modelId].pricePerMinute;
    }
}
