const { ethers } = require('hardhat');

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying contract with the account:', deployer.address);

  const HelloWorld = await ethers.getContractFactory('HelloWorld');
  const helloWorld = await HelloWorld.deploy();
  await helloWorld.deployed(); // Ensure deployment is complete.

  console.log('HelloWorld contract deployed to:', helloWorld.address);
  return helloWorld.address; // Return the contract address.
}

let deployedAddress; // Declare a variable to store the address.

main()
  .then((address) => {
    deployedAddress = address; // Assign the returned address to the variable.
    console.log('Assigned Contract Address:', deployedAddress); // Log the variable.
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
// console.log(ayam);