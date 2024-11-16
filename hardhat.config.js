require("@nomiclabs/hardhat-ethers");

module.exports = {
    solidity: "0.8.27",
    networks: {
        ganache: {
            url: "http://127.0.0.1:7545", // or 8545 if using Ganache CLI
            accounts: [
                "0x252d6fe6014778e470924fbc531da786501ba05d6d54baa27ce52fb58e6377b1" // The private key of an account on Ganache
            ]
        }
    }
};