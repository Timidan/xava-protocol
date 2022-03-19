const hre = require("hardhat");
const { getSavedContractAddresses, saveContractAddress} = require('../utils');
const { ethers } = hre;

async function main() {
    const contracts = getSavedContractAddresses()[hre.network.name];

    const SalesFactory = await ethers.getContractFactory("SalesFactory");
    const salesFactory = await SalesFactory.deploy(contracts['Admin'], contracts['AllocationStakingProxy'], contracts['AvalaunchCollateralProxy']);
    await salesFactory.deployed();

    saveContractAddress(hre.network.name, "SalesFactory", salesFactory.address);
    console.log('Sales factory deployed to: ',salesFactory.address);
}


main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
