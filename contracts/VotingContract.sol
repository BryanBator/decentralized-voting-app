// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title VotingContract
 * @dev A simple voting contract for demonstrating blockchain concepts
 */
contract VotingContract {
    // Struct to represent a candidate
    struct Candidate {
        uint256 id;
        string name;
        uint256 voteCount;
    }
    
    // Struct to represent a voter
    struct Voter {
        bool hasVoted;
        uint256 votedCandidateId;
        bool isRegistered;
    }
    
    // Contract owner
    address public owner;
    
    // Voting state
    bool public votingOpen;
    string public votingTitle;
    
    // Storage
    mapping(uint256 => Candidate) public candidates;
    mapping(address => Voter) public voters;
    uint256 public candidateCount;
    uint256 public totalVotes;
    
    // Events
    event VoterRegistered(address indexed voter);
    event VoteCast(address indexed voter, uint256 indexed candidateId);
    event CandidateAdded(uint256 indexed candidateId, string name);
    event VotingStatusChanged(bool isOpen);
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier onlyWhenVotingOpen() {
        require(votingOpen, "Voting is not open");
        _;
    }
    
    modifier onlyRegisteredVoter() {
        require(voters[msg.sender].isRegistered, "You are not registered to vote");
        _;
    }
    
    modifier hasNotVoted() {
        require(!voters[msg.sender].hasVoted, "You have already voted");
        _;
    }
    
    /**
     * @dev Constructor sets the contract owner and initializes voting
     * @param _votingTitle Title of the voting session
     */
    constructor(string memory _votingTitle) {
        owner = msg.sender;
        votingTitle = _votingTitle;
        votingOpen = false;
        candidateCount = 0;
        totalVotes = 0;
    }
    
    /**
     * @dev Add a new candidate (only owner)
     * @param _name Name of the candidate
     */
    function addCandidate(string memory _name) public onlyOwner {
        require(bytes(_name).length > 0, "Candidate name cannot be empty");
        
        candidateCount++;
        candidates[candidateCount] = Candidate(candidateCount, _name, 0);
        
        emit CandidateAdded(candidateCount, _name);
    }
    
    /**
     * @dev Register a voter (only owner for simplicity)
     * @param _voterAddress Address of the voter to register
     */
    function registerVoter(address _voterAddress) public onlyOwner {
        require(!voters[_voterAddress].isRegistered, "Voter is already registered");
        
        voters[_voterAddress] = Voter(false, 0, true);
        
        emit VoterRegistered(_voterAddress);
    }
    
    /**
     * @dev Start or stop voting (only owner)
     * @param _isOpen True to open voting, false to close
     */
    function setVotingStatus(bool _isOpen) public onlyOwner {
        votingOpen = _isOpen;
        emit VotingStatusChanged(_isOpen);
    }
    
    /**
     * @dev Cast a vote for a candidate
     * @param _candidateId ID of the candidate to vote for
     */
    function vote(uint256 _candidateId) public 
        onlyWhenVotingOpen 
        onlyRegisteredVoter 
        hasNotVoted 
    {
        require(_candidateId > 0 && _candidateId <= candidateCount, "Invalid candidate ID");
        
        // Record the vote
        voters[msg.sender].hasVoted = true;
        voters[msg.sender].votedCandidateId = _candidateId;
        
        // Update candidate vote count
        candidates[_candidateId].voteCount++;
        totalVotes++;
        
        emit VoteCast(msg.sender, _candidateId);
    }
    
    /**
     * @dev Get candidate information
     * @param _candidateId ID of the candidate
     * @return id The candidate ID
     * @return name The candidate name
     * @return voteCount The number of votes received
     */
    function getCandidate(uint256 _candidateId) public view returns (
        uint256 id,
        string memory name,
        uint256 voteCount
    ) {
        require(_candidateId > 0 && _candidateId <= candidateCount, "Invalid candidate ID");
        
        Candidate memory candidate = candidates[_candidateId];
        return (candidate.id, candidate.name, candidate.voteCount);
    }
    
    /**
     * @dev Get all candidates
     * @return ids Array of candidate IDs
     * @return names Array of candidate names
     * @return voteCounts Array of vote counts
     */
    function getAllCandidates() public view returns (
        uint256[] memory ids,
        string[] memory names,
        uint256[] memory voteCounts
    ) {
        ids = new uint256[](candidateCount);
        names = new string[](candidateCount);
        voteCounts = new uint256[](candidateCount);
        
        for (uint256 i = 1; i <= candidateCount; i++) {
            ids[i-1] = candidates[i].id;
            names[i-1] = candidates[i].name;
            voteCounts[i-1] = candidates[i].voteCount;
        }
        
        return (ids, names, voteCounts);
    }
    
    /**
     * @dev Get voter information
     * @param _voterAddress Address of the voter
     * @return hasVoted Whether the voter has cast their vote
     * @return votedCandidateId The ID of the candidate they voted for
     * @return isRegistered Whether the voter is registered
     */
    function getVoter(address _voterAddress) public view returns (
        bool hasVoted,
        uint256 votedCandidateId,
        bool isRegistered
    ) {
        Voter memory voter = voters[_voterAddress];
        return (voter.hasVoted, voter.votedCandidateId, voter.isRegistered);
    }
    
    /**
     * @dev Get voting statistics
     * @return title The voting session title
     * @return totalVoteCount The total number of votes cast
     * @return totalCandidates The total number of candidates
     * @return isVotingOpen Whether voting is currently open
     */
    function getVotingInfo() public view returns (
        string memory title,
        uint256 totalVoteCount,
        uint256 totalCandidates,
        bool isVotingOpen
    ) {
        return (votingTitle, totalVotes, candidateCount, votingOpen);
    }
}
