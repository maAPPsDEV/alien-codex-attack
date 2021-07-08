const AlienCodex = artifacts.require("AlienCodex");

module.exports = function (_deployer) {
  // Use deployer to state migration tasks.
  _deployer.deploy(AlienCodex);
};
