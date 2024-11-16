const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Interacting with contract using account:", deployer.address);

    const contractAddress = "0xC52d7207dB5b940A96ba90a36367bADA36351325";

    const LocalElection = await ethers.getContractFactory("LocalElection");
    const localElection = await LocalElection.attach(contractAddress);



    // Retrieve the current stored string
    const currentData1 = await localElection.electionEnded();
    console.log("Current string: ", currentData1);


    const newData1 = "534534542";
    const tx1 = await localElection.registerVoter(newData1);
    await tx1.wait(); // Wait for the transaction to be mined
    console.log("Voter registered successfully");
}

main().then(() => process.exit(0)).catch((error) => {
    console.error(error);
    process.exitCode = 1;
});