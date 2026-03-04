// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Script} from "forge-std/Script.sol";
import {Counter} from "week-04/dev/src/Counter.sol";

contract DeployCounterScript is Script {
    function run() external returns (Counter deployed) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);
        deployed = new Counter();
        vm.stopBroadcast();
    }
}
