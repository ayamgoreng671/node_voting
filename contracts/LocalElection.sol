// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract LocalElection {
    struct Candidate {
        uint256 id;
        string name;
        uint256 voteCount;
    }

    struct Voter {
        bool active;
        bool hasVoted;
        uint256 candidateIdVoted;
    }

    bytes32 public salt;
    address public admin;
    uint256 public electionEndTime;
    bool public electionEnded;

    mapping(uint256 => Candidate) public candidates;
    mapping(bytes32 => Voter) public voters; // Changed voter key to string instead of address
    mapping(uint256 => bool) public candidateExists;
    uint256 public candidatesCount;

    event CandidateAdded(uint256 candidateId, string name);
    event VoterRegistered(bytes32 voterId);
    event VoteCast(bytes32 voterId, uint256 candidateId);
    event ElectionEnded(uint256 endTime);

    constructor(uint256 _electionDuration, bytes32 _salt) {
        admin = msg.sender;
        electionEndTime = block.timestamp + _electionDuration;
        electionEnded = false;
        salt = _salt;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, 'Only admin can perform this action.');
        _;
    }

    modifier beforeEnd() {
        require(block.timestamp <= electionEndTime, 'Election has ended.');
        _;
    }

    modifier afterEnd() {
        require(block.timestamp > electionEndTime, 'Election is ongoing.');
        _;
    }

    function hashVoterId(string memory _voterId) internal view returns (bytes32) {
        return keccak256(abi.encodePacked(_voterId, salt));
    }

    // Add a candidate
    function addCandidate(string memory _name) public onlyAdmin beforeEnd {
        candidatesCount++;
        candidates[candidatesCount] = Candidate(candidatesCount, _name, 0);
        candidateExists[candidatesCount] = true;
        emit CandidateAdded(candidatesCount, _name);
    }

    // Register a voter by ID as a string
    function registerVoter(string memory _voterId) public onlyAdmin beforeEnd {
        bytes32 hashedId = hashVoterId(_voterId);
        require(!voters[hashedId].active, 'Voter already registered.');
        voters[hashedId] = Voter(true, false, 0);
        emit VoterRegistered(hashedId);
    }

    function verifyVoterId(string memory _voterId) public view returns (bool) {
        bytes32 hashedId = hashVoterId(_voterId);
        return voters[hashedId].active;
    }

    // Cast a vote
    function vote(string memory _voterId, uint256 _candidateId) public beforeEnd {
        bytes32 hashedId = hashVoterId(_voterId);
        require(candidateExists[_candidateId], 'Candidate does not exist.');
        require(!voters[hashedId].hasVoted, 'Already voted.');
        require(voters[hashedId].active == true, 'Voter not registered.');
        require(candidates[_candidateId].id != 0, 'Candidate does not exist.');

        voters[hashedId].hasVoted = true;
        voters[hashedId].candidateIdVoted = _candidateId;
        candidates[_candidateId].voteCount++;

        emit VoteCast(hashedId, _candidateId);
    }

    function extendElection(uint256 additionalTime) public onlyAdmin beforeEnd {
        electionEndTime += additionalTime;
    }

    // End the election
    function endElection() public onlyAdmin beforeEnd {
        require(!electionEnded, 'Election already ended.');
        electionEnded = true;
        electionEndTime = block.timestamp;
        emit ElectionEnded(block.timestamp);
    }

    // Get vote count for all candidates
    function getResults() public view afterEnd returns (string[] memory names, uint256[] memory votes) {
        require(electionEnded, 'Election not yet ended.');

        names = new string[](candidatesCount);
        votes = new uint256[](candidatesCount);

        for (uint256 i = 1; i <= candidatesCount; i++) {
            names[i - 1] = candidates[i].name;
            votes[i - 1] = candidates[i].voteCount;
        }

        return (names, votes);
    }
}
