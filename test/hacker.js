const Hacker = artifacts.require("Hacker");
const AlienCodex = artifacts.require("AlienCodex");
const { expect } = require("chai");
const { BN } = require("@openzeppelin/test-helpers");

/*
 * uncomment accounts to access the test accounts made available by the
 * Ethereum client
 * See docs: https://www.trufflesuite.com/docs/truffle/testing/writing-tests-in-javascript
 */
contract("Hacker", function ([_owner, _hacker]) {
  it("should overwrite the owner", async function () {
    const hackerContract = await Hacker.deployed();
    const alienContract = await AlienCodex.deployed();
    expect(await alienContract.owner()).to.be.equal(_owner);
    const result = await hackerContract.attack(alienContract.address, { from: _hacker });
    expect(result.receipt.status).to.be.equal(true);
    expect(await alienContract.owner()).to.be.equal(_hacker);
    expect(await alienContract.contact()).to.be.equal(false);
  });
});
