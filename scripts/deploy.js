// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const {ethers} = require("hardhat");
const path = require("path");
const fs = require("fs");

async function main() {

  // This is just a convenience check
  if (network.name === "hardhat") {
    console.warn(
        "You are trying to deploy a contract to the Hardhat Network, which" +
        "gets automatically created and destroyed every time. Use the Hardhat" +
        " option '--network localhost'"
    );
  }

  // ethers is available in the global scope
  const [deployer] = await ethers.getSigners();
  console.log(
      "Deploying the contracts with the account:",
      await deployer.getAddress()
  );

  console.log("Account balance:", (await deployer.getBalance()).toString());

  const CampaignFactory = await ethers.getContractFactory("CampaignFactory");

  const campaignFactory = await CampaignFactory.deploy();
  await campaignFactory.deployed();


  console.log(
      ` CampaignFactory is deployed to ${campaignFactory.address}`
  );


  saveFrontendFiles(campaignFactory);
}


function saveFrontendFiles(campaignFactory) {
  const contractsDir = path.join(__dirname, "..", "frontend", "contracts");

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  fs.writeFileSync(
      path.join(contractsDir, "contract-address.json"),
      JSON.stringify({ CampaignFactory: campaignFactory.address }, undefined, 2)
  );

  const CampaignArtifact = artifacts.readArtifactSync("CampaignFactory");

  fs.writeFileSync(
      path.join(contractsDir, "CampaignFactory.json"),
      JSON.stringify(CampaignArtifact, null, 2)
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
