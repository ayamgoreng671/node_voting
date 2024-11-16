const { ethers } = require('hardhat')

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log('Deploying contract with the account:', deployer.address)

  const HelloWorld = await ethers.getContractFactory('HelloWorld')
  const helloWorld = await HelloWorld.deploy()
  console.log('HelloWorld contract deployed to:', helloWorld.address)
  // console.log(helloWorld);
  return helloWorld.address
}

let ayam = main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

console.log(ayam);  