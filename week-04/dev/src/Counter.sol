// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

contract Counter {
    uint256 private count;

    function getCount() external view returns (uint256) {
        return count;
    }

    function increment() external {
        count += 1;
    }

    function decrement() external {
        require(count > 0, "Counter: underflow");
        count -= 1;
    }
}
