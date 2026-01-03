// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ModelRegistry {
    struct Model {
        address owner;
        string ipfsCid;
        uint256 price;
    }

    uint256 public nextModelId;
    mapping(uint256 => Model) public models;

    event ModelRegistered(
        uint256 indexed modelId,
        address indexed owner,
        string ipfsCid,
        uint256 price
    );

    event ModelPriceUpdated(
        uint256 indexed modelId,
        uint256 newPrice
    );

    function registerModel(
        string calldata ipfsCid,
        uint256 price
    ) external returns (uint256) {
        require(price > 0, "Price must be > 0");

        uint256 modelId = nextModelId++;

        models[modelId] = Model({
            owner: msg.sender,
            ipfsCid: ipfsCid,
            price: price
        });

        emit ModelRegistered(modelId, msg.sender, ipfsCid, price);

        return modelId;
    }

    function updatePrice(uint256 modelId, uint256 newPrice) external {
        Model storage model = models[modelId];

        require(msg.sender == model.owner, "Not model owner");
        require(newPrice > 0, "Invalid price");

        model.price = newPrice;

        emit ModelPriceUpdated(modelId, newPrice);
    }

    function getModel(uint256 modelId)
        external
        view
        returns (
            address owner,
            uint256 price,
            string memory ipfsCid
        )
    {
        Model storage model = models[modelId];
        return (model.owner, model.price, model.ipfsCid);
    }
}
