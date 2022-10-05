const { ethers } = require("hardhat");
const hre = require("hardhat");

async function deployTokensAndStake() {
 const ANR = "http://localhost:9654/ext/bc/C/rpc";
 //const local="http://127.0.0.1:8545"
 //prefunded on ANR
 const accounts = [
  "0x56289e99c94b6912bfc12adc093c9b51124f0dc54ac7a766b2bc5ccf558d8027",
  "0x7b4198529994b0dc604278c99d153cfd069d594753d471171a1d102a10438e07",
  "0x15614556be13730e9e8d6eacc1603143e7b96987429df8726384c2ec4502ef6e",
 ];
 const provider = new ethers.providers.JsonRpcProvider(ANR);
 const signer1 = new ethers.Wallet(accounts[0], provider);
 const signer2 = new ethers.Wallet(accounts[1], provider);
 const signer3 = new ethers.Wallet(accounts[2], provider);

 const tokenName = "Xavatoken";
 const symbol = "XAVA";
 const totalSupply = ethers.utils.parseEther("10000000");
 const decimals = 18;
 const REWARDS_PER_SECOND = ethers.utils.parseUnits("0.1");
 const DEPOSIT_FEE_PERCENT = 5;
 const DEPOSIT_FEE_PRECISION = 100;
 let tx;
 //deploy xava
 const Xava = await hre.ethers.getContractFactory("XavaToken", signer1);
 const xava = await Xava.deploy(tokenName, symbol, totalSupply, decimals);
 //account1 gets the tokens
 await xava.deployed();
 console.log("XavaToken deployed to: ", xava.address);

 //send token to env acct
 tx = await xava.transfer(await getEnvAcct(), ethers.utils.parseEther("10000"));
 await tx.wait();
 console.log(getEnvAcct(), "funded with 10000 xava tokens");

 //deploy AdminFactory
 const AdminFactory = await ethers.getContractFactory("Admin", signer1);
 Admin = await AdminFactory.deploy([
  signer1.address,
  signer2.address,
  signer3.address,
 ]);

 const CollateralFactory = await ethers.getContractFactory(
  "AvalaunchCollateral",
  signer1
 );
 const Collateral = await CollateralFactory.deploy();
 await Collateral.deployed();

 tx = await Collateral.initialize(signer1.address, Admin.address, 43112);
 await tx.wait();

 //deploy salesfactory
 const SalesFactoryFactory = await ethers.getContractFactory(
  "SalesFactory",
  signer1
 );
 const SalesFactory = await SalesFactoryFactory.deploy(
  Admin.address,
  ethers.constants.AddressZero,
  Collateral.address
 );

 //deploy allocation staking factory
 const AllocationStakingRewardsFactory = await ethers.getContractFactory(
  "AllocationStaking",
  signer1
 );
 const blockTimestamp = await getCurrentBlockTimestamp();
 startTimestamp = blockTimestamp + 1;
 const AllocationStaking = await AllocationStakingRewardsFactory.deploy();
 console.log("AllocationStaking deployed to", AllocationStaking.address);
 tx = await AllocationStaking.initialize(
  xava.address,
  REWARDS_PER_SECOND,
  startTimestamp,
  SalesFactory.address,
  DEPOSIT_FEE_PERCENT,
  DEPOSIT_FEE_PRECISION
 );
 await tx.wait();
 tx = await AllocationStaking.add(1, xava.address, false);
 await tx.wait();
 tx = await SalesFactory.setAllocationStaking(AllocationStaking.address);
 await tx.wait();
 tx = await xava.approve(AllocationStaking.address, "50000000");
 await tx.wait();
 tx = await AllocationStaking.deposit(0, "50000000");
 await tx.wait();
}

async function getAccts() {
 let accts = [];
 const signers = await ethers.getSigners();
 for (let i = 0; i < signers.length; i++) {
  accts.push(signers[i].address);
 }
 return accts;
}

function getEnvAcct() {
 return process.env.WALLET_ADDRESS;
}

async function getCurrentBlockTimestamp() {
 return (await ethers.provider.getBlock("latest")).timestamp;
}

// async function disburseTokens(token) {
//  token.transfer();
// }
deployTokensAndStake()
 .then(() => process.exit(0))
 .catch((error) => {
  console.error(error);
  process.exit(1);
 });
