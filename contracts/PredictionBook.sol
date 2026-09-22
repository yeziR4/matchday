// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @notice Public timestamps for Matchday prediction receipts. No funds or result oracle.
/// @dev A commitment proves the caller recorded a digest at a given time. Actual fixture
/// cutoffs and payload integrity must be checked against the exported receipt and data source.
contract PredictionBook {
    mapping(address => mapping(bytes32 => uint64)) public commitments;
    event PredictionCommitted(address indexed player, bytes32 indexed digest, uint64 recordedAt, uint64 deadline);
    error InvalidDigest();
    error DeadlinePassed();
    error AlreadyCommitted();

    function commit(bytes32 digest, uint64 deadline) external {
        if (digest == bytes32(0)) revert InvalidDigest();
        if (block.timestamp >= deadline) revert DeadlinePassed();
        if (commitments[msg.sender][digest] != 0) revert AlreadyCommitted();
        uint64 recordedAt = uint64(block.timestamp);
        commitments[msg.sender][digest] = recordedAt;
        emit PredictionCommitted(msg.sender, digest, recordedAt, deadline);
    }
}
