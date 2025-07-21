const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("VotingContract", function () {
  let votingContract;
  let owner;
  let voter1;
  let voter2;
  let voter3;

  // Diese Funktion läuft vor jedem Test
  beforeEach(async function () {
    // Test-Accounts holen
    [owner, voter1, voter2, voter3] = await ethers.getSigners();

    // Contract deployen
    const VotingContract = await ethers.getContractFactory("VotingContract");
    votingContract = await VotingContract.deploy("Presidential Election 2024");
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await votingContract.owner()).to.equal(owner.address);
    });

    it("Should set the right voting title", async function () {
      const votingInfo = await votingContract.getVotingInfo();
      expect(votingInfo.title).to.equal("Presidential Election 2024");
    });

    it("Should start with voting closed", async function () {
      const votingInfo = await votingContract.getVotingInfo();
      expect(votingInfo.isVotingOpen).to.equal(false);
    });

    it("Should start with zero candidates and votes", async function () {
      const votingInfo = await votingContract.getVotingInfo();
      expect(votingInfo.totalCandidates).to.equal(0);
      expect(votingInfo.totalVoteCount).to.equal(0);
    });
  });

  describe("Candidate Management", function () {
    it("Should allow owner to add candidates", async function () {
      await votingContract.addCandidate("Alice Johnson");
      await votingContract.addCandidate("Bob Smith");

      const votingInfo = await votingContract.getVotingInfo();
      expect(votingInfo.totalCandidates).to.equal(2);

      // Kandidaten einzeln prüfen
      const candidate1 = await votingContract.getCandidate(1);
      expect(candidate1.name).to.equal("Alice Johnson");
      expect(candidate1.voteCount).to.equal(0);
    });

    it("Should not allow non-owners to add candidates", async function () {
      await expect(
        votingContract.connect(voter1).addCandidate("Hacker Candidate")
      ).to.be.revertedWith("Only owner can call this function");
    });

    it("Should not allow empty candidate names", async function () {
      await expect(
        votingContract.addCandidate("")
      ).to.be.revertedWith("Candidate name cannot be empty");
    });

    it("Should get all candidates correctly", async function () {
      await votingContract.addCandidate("Alice");
      await votingContract.addCandidate("Bob");
      await votingContract.addCandidate("Charlie");

      const [ids, names, voteCounts] = await votingContract.getAllCandidates();
      
      expect(ids.length).to.equal(3);
      expect(names[0]).to.equal("Alice");
      expect(names[1]).to.equal("Bob");
      expect(names[2]).to.equal("Charlie");
      expect(voteCounts[0]).to.equal(0);
    });
  });

  describe("Voter Registration", function () {
    it("Should allow owner to register voters", async function () {
      await votingContract.registerVoter(voter1.address);
      
      const voterInfo = await votingContract.getVoter(voter1.address);
      expect(voterInfo.isRegistered).to.equal(true);
      expect(voterInfo.hasVoted).to.equal(false);
    });

    it("Should not allow non-owners to register voters", async function () {
      await expect(
        votingContract.connect(voter1).registerVoter(voter2.address)
      ).to.be.revertedWith("Only owner can call this function");
    });

    it("Should not allow duplicate voter registration", async function () {
      await votingContract.registerVoter(voter1.address);
      
      await expect(
        votingContract.registerVoter(voter1.address)
      ).to.be.revertedWith("Voter is already registered");
    });
  });

  describe("Voting Process", function () {
    beforeEach(async function () {
      // Setup für Voting Tests
      await votingContract.addCandidate("Alice");
      await votingContract.addCandidate("Bob");
      await votingContract.registerVoter(voter1.address);
      await votingContract.registerVoter(voter2.address);
    });

    it("Should allow registered voters to vote when voting is open", async function () {
      // Voting öffnen
      await votingContract.setVotingStatus(true);
      
      // Vote casten
      await votingContract.connect(voter1).vote(1);
      
      // Prüfen ob Vote registriert wurde
      const voterInfo = await votingContract.getVoter(voter1.address);
      expect(voterInfo.hasVoted).to.equal(true);
      expect(voterInfo.votedCandidateId).to.equal(1);
      
      // Prüfen ob Kandidat Vote erhalten hat
      const candidate = await votingContract.getCandidate(1);
      expect(candidate.voteCount).to.equal(1);
      
      // Prüfen ob Total Votes erhöht wurde
      const votingInfo = await votingContract.getVotingInfo();
      expect(votingInfo.totalVoteCount).to.equal(1);
    });

    it("Should not allow voting when voting is closed", async function () {
      // Voting bleibt geschlossen
      await expect(
        votingContract.connect(voter1).vote(1)
      ).to.be.revertedWith("Voting is not open");
    });

    it("Should not allow unregistered voters to vote", async function () {
      await votingContract.setVotingStatus(true);
      
      await expect(
        votingContract.connect(voter3).vote(1)
      ).to.be.revertedWith("You are not registered to vote");
    });

    it("Should not allow double voting", async function () {
      await votingContract.setVotingStatus(true);
      
      // Erster Vote
      await votingContract.connect(voter1).vote(1);
      
      // Zweiter Vote sollte fehlschlagen
      await expect(
        votingContract.connect(voter1).vote(2)
      ).to.be.revertedWith("You have already voted");
    });

    it("Should not allow voting for invalid candidates", async function () {
      await votingContract.setVotingStatus(true);
      
      await expect(
        votingContract.connect(voter1).vote(999)
      ).to.be.revertedWith("Invalid candidate ID");
      
      await expect(
        votingContract.connect(voter1).vote(0)
      ).to.be.revertedWith("Invalid candidate ID");
    });
  });

  describe("Events", function () {
    it("Should emit VoteCast event when voting", async function () {
      await votingContract.addCandidate("Alice");
      await votingContract.registerVoter(voter1.address);
      await votingContract.setVotingStatus(true);
      
      await expect(votingContract.connect(voter1).vote(1))
        .to.emit(votingContract, "VoteCast")
        .withArgs(voter1.address, 1);
    });

    it("Should emit CandidateAdded event when adding candidate", async function () {
      await expect(votingContract.addCandidate("Alice"))
        .to.emit(votingContract, "CandidateAdded")
        .withArgs(1, "Alice");
    });

    it("Should emit VoterRegistered event when registering voter", async function () {
      await expect(votingContract.registerVoter(voter1.address))
        .to.emit(votingContract, "VoterRegistered")
        .withArgs(voter1.address);
    });
  });

  describe("Voting Management", function () {
    it("Should allow owner to open and close voting", async function () {
      // Voting öffnen
      await votingContract.setVotingStatus(true);
      let votingInfo = await votingContract.getVotingInfo();
      expect(votingInfo.isVotingOpen).to.equal(true);
      
      // Voting schließen
      await votingContract.setVotingStatus(false);
      votingInfo = await votingContract.getVotingInfo();
      expect(votingInfo.isVotingOpen).to.equal(false);
    });

    it("Should not allow non-owners to change voting status", async function () {
      await expect(
        votingContract.connect(voter1).setVotingStatus(true)
      ).to.be.revertedWith("Only owner can call this function");
    });
  });

  describe("Complete Voting Scenario", function () {
    it("Should handle a complete voting process correctly", async function () {
      // Setup: Kandidaten hinzufügen
      await votingContract.addCandidate("Alice Johnson");
      await votingContract.addCandidate("Bob Smith");
      await votingContract.addCandidate("Charlie Brown");
      
      // Setup: Wähler registrieren
      await votingContract.registerVoter(voter1.address);
      await votingContract.registerVoter(voter2.address);
      await votingContract.registerVoter(voter3.address);
      
      // Voting öffnen
      await votingContract.setVotingStatus(true);
      
      // Votes casten
      await votingContract.connect(voter1).vote(1); // Alice
      await votingContract.connect(voter2).vote(1); // Alice
      await votingContract.connect(voter3).vote(2); // Bob
      
      // Voting schließen
      await votingContract.setVotingStatus(false);
      
      // Ergebnisse prüfen
      const [ids, names, voteCounts] = await votingContract.getAllCandidates();
      expect(voteCounts[0]).to.equal(2); // Alice: 2 Stimmen
      expect(voteCounts[1]).to.equal(1); // Bob: 1 Stimme
      expect(voteCounts[2]).to.equal(0); // Charlie: 0 Stimmen
      
      const votingInfo = await votingContract.getVotingInfo();
      expect(votingInfo.totalVoteCount).to.equal(3);
    });
  });
});