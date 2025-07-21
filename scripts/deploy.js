const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying VotingContract...");

  // Contract deployen
  const VotingContract = await ethers.getContractFactory("VotingContract");
  const votingContract = await VotingContract.deploy("Presidential Election 2024");

  await votingContract.waitForDeployment();

  const contractAddress = await votingContract.getAddress();
  console.log("✅ VotingContract deployed to:", contractAddress);

  // Demo-Daten hinzufügen
  console.log("\n📝 Adding demo candidates...");
  
  await votingContract.addCandidate("Alice Johnson");
  console.log("✅ Added candidate: Alice Johnson");
  
  await votingContract.addCandidate("Bob Smith");
  console.log("✅ Added candidate: Bob Smith");
  
  await votingContract.addCandidate("Charlie Brown");
  console.log("✅ Added candidate: Charlie Brown");

  // Einige Test-Accounts als Voter registrieren
  console.log("\n👥 Registering demo voters...");
  
  const [owner, voter1, voter2, voter3] = await ethers.getSigners();
  
  await votingContract.registerVoter(voter1.address);
  console.log("✅ Registered voter:", voter1.address);
  
  await votingContract.registerVoter(voter2.address);
  console.log("✅ Registered voter:", voter2.address);
  
  await votingContract.registerVoter(voter3.address);
  console.log("✅ Registered voter:", voter3.address);

  // Voting öffnen
  console.log("\n🗳️ Opening voting...");
  await votingContract.setVotingStatus(true);
  console.log("✅ Voting is now open!");

  console.log("\n🎯 Contract deployed successfully!");
  console.log("📋 Contract Address:", contractAddress);
  console.log("👑 Owner Address:", owner.address);
  console.log("\n🔧 Next steps:");
  console.log("1. Copy the contract address above");
  console.log("2. Replace PLACEHOLDER_ADDRESS in frontend/src/App.tsx");
  console.log("3. Start the React app with: cd frontend && npm start");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });