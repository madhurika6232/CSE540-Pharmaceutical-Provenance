import { network } from "hardhat";

async function main() {
  console.log("Connecting to Polygon Amoy...");

  const connection = await network.getOrCreate({
    network: "amoy",
  });

  const { ethers } = connection;

  const [deployer] = await ethers.getSigners();

  console.log("Deploying from:", deployer.address);

  const balance = await ethers.provider.getBalance(
    deployer.address
  );

  console.log(
    "Deployer balance:",
    ethers.formatEther(balance),
    "POL"
  );

  console.log("Deploying PharmaceuticalProvenance...");

  const contract = await ethers.deployContract(
    "PharmaceuticalProvenance"
  );

  const deploymentTransaction =
    contract.deploymentTransaction();

  console.log(
    "Deployment transaction:",
    deploymentTransaction?.hash
  );

  console.log(
    "Waiting for deployment confirmation..."
  );

  await contract.waitForDeployment();

  const contractAddress =
    await contract.getAddress();

  console.log("");
  console.log("---------------------------------------");
  console.log("Deployment successful!");
  console.log("Contract address:", contractAddress);
  console.log("Network: Polygon Amoy");
  console.log("Chain ID: 80002");
  console.log("---------------------------------------");
}

main().catch((error) => {
  console.error("Deployment failed:");
  console.error(error);
  process.exitCode = 1;
});