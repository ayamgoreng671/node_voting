const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contract with the account:", deployer.address);

    const salt = ethers.utils.arrayify("0xd395ede5297e201c4e3786afff598277dd47e2548f4df4dc65745f9672af5eb2");
    const LocalElection = await ethers.getContractFactory("DistrictElection");
    const localElection = await LocalElection.deploy(10000,salt);
    console.log("DistrictElection contract deployed to:", localElection.address);
    // console.log(helloWorld);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });