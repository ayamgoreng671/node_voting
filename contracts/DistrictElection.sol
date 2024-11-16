// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DistrictElection {
    struct Candidate {
        uint256 id;
        string name;
        uint256 voteCount;
        uint256 districtId;
        bool active;
    }

    struct Voter {
        bool active;
        bool hasVoted;
        uint256 candidateIdVoted;
        uint256 districtId;
    }

    struct District {
        uint256 level; // 1 or 2 level
        uint256 candidateCount; // Tracks the number of candidates in the district
    }

    bytes32 public salt;
    address public admin;
    uint256 public electionEndTime;
    bool public electionEnded;

    mapping(uint256 => Candidate) public candidates;
    mapping(bytes32 => Voter) public voters;
    mapping(uint256 => bool) public candidateExists;
    mapping(uint256 => District) public districts; // District information
    uint256 public candidatesCount;

    event CandidateAdded(uint256 candidateId, string name, uint256 districtId);
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

    // Add a district with a specific level (1 or 2)
    function addDistrict(uint256 _districtId, uint256 _level) public onlyAdmin {
        require(_level == 1 || _level == 2, 'District level must be 1 or 2.');
        districts[_districtId] = District(_level, 0);
    }

    // Add a candidate to a district
    function addCandidate(string memory _name, uint256 _districtId) public onlyAdmin beforeEnd {
        require(districts[_districtId].level != 0, 'District does not exist.');
        
        candidatesCount++;
        uint256 candidateId = candidatesCount;
        candidates[candidateId] = Candidate(candidateId, _name, 0, _districtId, true);
        candidateExists[candidateId] = true;
        districts[_districtId].candidateCount++;

        // Check if an "Empty Box" should be added based on district level
        // if (districts[_districtId].candidateCount == 1) {
        //     // Add Empty Box when it's the first candidate
        //     uint256 emptyBoxId = candidatesCount + 1;
        //     candidates[emptyBoxId] = Candidate(emptyBoxId, "Empty Box", 0, _districtId, false);
        //     candidateExists[emptyBoxId] = true;
        //     districts[_districtId].candidateCount++;
        //     emit CandidateAdded(emptyBoxId, "Empty Box", _districtId);
        // }

        // Determine if "Empty Box" should be active based on the district level
        if (districts[_districtId].level == 1) {
            // Level 1 districts need 3 candidates for Empty Box to be removed
            if (districts[_districtId].candidateCount >= 3) {
                // Deactivate Empty Box if level 1 district has 3 or more candidates
                for (uint256 i = 1; i <= candidatesCount; i++) {
                    if (candidates[i].districtId == _districtId && keccak256(bytes(candidates[i].name)) == keccak256(bytes("Empty Box"))) {
                        candidates[i].active = false; // Mark Empty Box as inactive
                    }
                }
            }
        } else if (districts[_districtId].level == 2) {
            // Level 2 districts need 2 candidates for Empty Box to be removed
            if (districts[_districtId].candidateCount >= 2) {
                // Deactivate Empty Box if level 2 district has 2 or more candidates
                for (uint256 i = 1; i <= candidatesCount; i++) {
                    if (candidates[i].districtId == _districtId && keccak256(bytes(candidates[i].name)) == keccak256(bytes("Empty Box"))) {
                        candidates[i].active = false; // Mark Empty Box as inactive
                    }
                }
            }
        }

        emit CandidateAdded(candidateId, _name, _districtId);
    }

    // Register a voter by ID as a string
    function registerVoter(string memory _voterId, uint256 _districtId) public onlyAdmin beforeEnd {
        bytes32 hashedId = hashVoterId(_voterId);
        require(!voters[hashedId].active, 'Voter already registered.');
        require(districts[_districtId].level != 0, 'District does not exist.');
        voters[hashedId] = Voter(true, false, 0, _districtId);
        emit VoterRegistered(hashedId);
    }

    // Cast a vote
    function vote(string memory _voterId, uint256 _candidateId) public beforeEnd {
        bytes32 hashedId = hashVoterId(_voterId);
        require(candidateExists[_candidateId], 'Candidate does not exist.');
        require(!voters[hashedId].hasVoted, 'Already voted.');
        require(voters[hashedId].active == true, 'Voter not registered.');
        require(candidates[_candidateId].id != 0, 'Candidate does not exist.');
        require(candidates[_candidateId].active == true, 'Candidate is inactive.');

        // Ensure the voter is voting for a candidate in the same district
        uint256 districtId = voters[hashedId].districtId;
        require(voters[hashedId].districtId == candidates[_candidateId].districtId, 'Voter and candidate are in different districts.');

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
