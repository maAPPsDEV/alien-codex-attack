# Solidity Game - Alien Codex

_Inspired by OpenZeppelin's [Ethernaut](https://ethernaut.openzeppelin.com), Alien Codex Level_

⚠️Do not try on mainnet!

## Task

You've uncovered an Alien contract. Claim ownership to complete the game.

_Hint:_

1. Understanding how array storage works
2. Understanding [ABI specifications](https://solidity.readthedocs.io/en/v0.4.21/abi-spec.html)
3. Using a very `underhanded` approach

## What will you learn?

1. Array
2. Layout of dynamic arrays in Storage

### Different definition of `length` member of Array in different Solidity versions

- v0.8.0

  > Arrays have a `length` member that contains their number of elements. The length of memory arrays is fixed (but dynamic, i.e. it can depend on runtime parameters) once they are created.

  _**NOTE:** It is read-only, thus, it cannot be used to resize dynamic arrays._

- v0.5.17

  > Arrays have a `length` member that contains their number of elements. The length of memory arrays is fixed (but dynamic, i.e. it can depend on runtime parameters) once they are created. For dynamically-sized arrays (only available for storage), this member can be assigned to resize the array. Accessing elements outside the current length does not automatically resize the array and instead causes a failing assertion. Increasing the length adds new zero-initialised elements to the array. Reducing the length performs an implicit delete on each of the removed elements. If you try to resize a non-dynamic array that isn’t in storage, you receive a `Value must be an lvalue` error.
  >
  > If you use `.length--` on an empty array, it causes an underflow and thus sets the length to `2**256-1`.

  _**NOTE:** There is the catch to solve the game. And remember that game is complied v0.5._ 😁

### Layout of dynamic arrays in storage

> Due to their unpredictable size, mappings and dynamically-sized array types cannot be stored “in between” the state variables preceding and following them. Instead, they are considered to occupy only 32 bytes with regards to the [rules above](https://docs.soliditylang.org/en/v0.8.6/internals/layout_in_storage.html#storage-inplace-encoding) and the elements they contain are stored starting at a **different storage slot** that is computed using a Keccak-256 hash.

Assume the storage location of the array ends up being a slot `p` after applying the storage layout rules. For dynamic arrays, this slot stores the number of elements in the array (byte arrays and strings are an exception).

Array data is located starting at `keccak256(p)` and it is laid out in the same way as statically-sized array data would: One element after the other, potentially sharing storage slots if the elements are not longer than 16 bytes.

## What is the most difficult challenge?

### Increase Array's Length

Recall 1 - **EVM storage size is exactly `2²⁵⁶` slots of 32 bytes.**

Recall 2 - **Method `retract` doesn't have a check for int underflow.**

By calling it, we would change codex length from 0 to `2²⁵⁶`.
Essentially by setting the length of codex to maximum, we gain the ability to modify any slot of entire EVM storage except only one.

ℹ️ _This game doesn't work with compiler v0.6.0 or higher. Because since that, `.length` is read-only, thus it would take more than a year to increase the array length to `2²⁵⁶-1` or no enough money to do._

### Overwriting Owner

It seems that there is no way to modify `owner` variable since no code assigning it exists. But keep in mind that all state variable located on the same storage **continuum** and can fall victims of writing errors.

`revise` function can set any storage slot to any value we provide. Exactly what we need. Unfortunately, it would fail, if we would call it with index >= length.

So, we have to figure out the location of `owner` variable on storage as well as offset index to modify it with `revise` method.

`owner` variable is located at `0` slot of contract's storage. Codex array length is located at `1` slot of storage. That is because of EVM optimize storage and address type takes 20 bytes, bool take 1 byte, so they both fit in one 32 bytes slot.
The slot where `codex[0]` is laid at is `keccak256(bytes32(1))`, where `1` is the slot of `codex.length`. Additionally, the slot of `codex[1]` is `keccak256(bytes32(1)) + 1`.
In the sense, we can get `x` in where the slot of `codex[x]` is `0` which is the slot of `owner` variable, because storage is **continuum**.

Let's assume that the maximun slots of storage are `10` and `keccak256(bytes32(1))` is `7`.

| slot | variables               | codex       |
| ---- | ----------------------- | ----------- |
| 0    | owner                   | codex[3]    |
| 1    | codex.length (==9)      | codex[4]    |
| 2    |                         | codex[5]    |
| 3    |                         | codex[6]    |
| 4    |                         | codex[7]    |
| 5    |                         | codex[8]    |
| 6    |                         | unreachable |
| 7    | `keccak256(bytes32(1))` | codex[0]    |
| 8    |                         | codex[1]    |
| 9    |                         | codex[2]    |

Now we can get an equation - `x = 10 - 7`.

So, for real storage, the equation will be `x = 2²⁵⁶ - keccak256(bytes32(p))`, and `codex[x]` will point the slot where `owner` exists. Easy yeah? 🤪

In practice, you should get the index with the Solidity expression like: `2**256 - 1 - uint256(keccak256(bytes32(p))) + 1` instead of `2**256 - uint256(keccak256(bytes32(p)))`, because of compile error for the larger number operand than MAX_UINT256.
Or `2 ** 256 - 1 - uint256(keccak256(abi.encode(1))) + 1` for Solc v0.5 or higher

## Source Code

⚠️This contract contains a bug or risk. Do not use on mainnet!

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.5.0;

contract AlienCodex {
  address public owner;
  bool public contact;
  bytes32[] public codex;

  constructor() public {
    owner = msg.sender;
  }

  modifier contacted() {
    assert(contact);
    _;
  }

  function make_contact() public {
    contact = true;
  }

  function record(bytes32 _content) public contacted {
    codex.push(_content);
  }

  function retract() public contacted {
    codex.length--;
  }

  function revise(uint256 i, bytes32 _content) public contacted {
    codex[i] = _content;
  }
}

```

## Configuration

### Install Truffle cli

_Skip if you have already installed._

```
npm install -g truffle
```

### Install Dependencies

```
yarn install
```

## Test and Attack!💥

### Run Tests

```
truffle develop
test
```

You should take ownership of the target contract successfully.

```
truffle(develop)> test
Using network 'develop'.


Compiling your contracts...
===========================
> Everything is up to date, there is nothing to compile.



  Contract: Hacker
    √ should overwrite the owner (591ms)


  1 passing (634ms)

```
