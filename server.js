const express = require('express')
const cors = require('cors')
const { ethers } = require('hardhat') // Use ethers from Hardhat
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 3000

const allowedIPs = process.env.ALLOWED_IPS.split(',')

app.use(cors())
app.use(express.json())
app.use((req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress

  const formattedIP = clientIP === '::1' ? '127.0.0.1' : clientIP.startsWith('::ffff:') ? clientIP.slice(7) : clientIP

  const apiKey = req.headers['authorization']?.split(' ')[1]
  if (!allowedIPs.includes(formattedIP)) {
    return res.status(403).send({ message: 'Access denied: IP ' + formattedIP + ' not allowed' })
  }

  if (apiKey !== process.env.API_KEY) {
    // console.log(apiKey);
    return res.status(403).send({ message: 'Access denied: Invalid API Key ' })
  }

  next()
});


app.get('/api/data', (req, res) => {
  res.send({
    message: 'Hello from Node.js',
    allowedIPs: allowedIPs,
    clientIP: clientIP,
    formattedIP: formattedIP
  })
})

// Connect to Ganache
const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:7545')
const privateKey = process.env.PRIVATE_KEY // Ensure this is the private key of an account in Ganache
const wallet = new ethers.Wallet(privateKey, provider)

// Replace with your deployed contract address and ABI
const contractAddressHelloWorld = '0x812224a1B49197224c98C7cF79de2374DAe6652D' // Make sure this address is correct
const abiHelloWorld = ['function getGreeting() view returns (string)', 'function setGreeting(string memory _greeting)']

// Create a contract instance
const contractHelloWorld = new ethers.Contract(contractAddressHelloWorld, abiHelloWorld, wallet)

// API endpoint to get the current greeting
app.get('/greeting', async (req, res) => {
  try {
    const greeting = await contractHelloWorld.getGreeting()
    res.json({ greeting })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// API endpoint to set a new greeting
app.post('/greeting', async (req, res) => {
  const { newGreeting } = req.body
  try {
    const tx = await contractHelloWorld.setGreeting(newGreeting)
    await tx.wait()
    res.json({ message: 'Greeting updated!', newGreeting })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Replace with your deployed contract address and ABI
const contractAddressLocalElection = '0xC14562Cb06b501dC418a0A05D1D9d2fE91ccaCDC' // Make sure this address is correct

const abiLocalElection = [
  // Candidate struct-related functions
  'function addCandidate(string memory _name) public',
  'function getResults() public view returns (string[] memory names, uint256[] memory votes)',

  // Voter struct-related functions
  // 'function hashVoterId(string memory _voterId) internal view returns (bytes32)',
  'function registerVoter(string memory _voterId) public',
  'function verifyVoterId(string memory _voterId) public view returns (bool)',
  'function vote(string memory _voterId, uint256 _candidateId) public',

  // Election control functions
  'function extendElection(uint256 additionalTime) public',
  'function endElection() public',

  // Public variables (automatically accessible)
  'function electionEndTime() public view returns (uint256)',
  'function electionEnded() public view returns (bool)',
  'function admin() public view returns (address)',
  'function salt() public view returns (bytes32)',
  'function candidatesCount() public view returns (uint256)',

  // Mapping access (for candidates and voters mappings, you need index access)
  'function candidates(uint256 candidateId) public view returns (uint256 id, string name, uint256 voteCount)',
  'function voters(bytes32 hashedVoterId) public view returns (bool active, bool hasVoted, uint256 candidateIdVoted)',
  'function candidateExists(uint256 candidateId) public view returns (bool)',

  // Events
  'event CandidateAdded(uint256 candidateId, string name)',
  'event VoterRegistered(bytes32 voterId)',
  'event VoteCast(bytes32 voterId, uint256 candidateId)',
  'event ElectionEnded(uint256 endTime)'
];



// Create a contract instance
const contractLocalElection = new ethers.Contract(contractAddressLocalElection, abiLocalElection, wallet)

app.get('/candidates', async (req, res) => {
  try {
    const candidatesCount = await contractLocalElection.candidatesCount();
    const candidates = [];
    for (let i = 1; i <= candidatesCount; i++) {
      const candidate = await contractLocalElection.candidates(i);
      candidates.push({
        id: candidate.id.toNumber(),
        name: candidate.name,
        voteCount: candidate.voteCount.toNumber(),
      });
    }
    res.json(candidates);
  } catch (error) {
    console.error('Error fetching candidates:', error);
    res.status(500).json({ error: error.message });
  }
});

// Node.js route to add a candidate
app.post('/addcandidate', async (req, res) => {
  const { name } = req.body;  

  // Check if name is provided
  if (!name || name.length === 0) {
      return res.status(400).json({ error: 'Candidate name is required' });
  }

  try {
      const tx = await contractLocalElection.addCandidate(name);
      await tx.wait();
      res.json({ message: 'Candidate added successfully!', candidateName: name });
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});


app.post('/registervoter', async (req, res) => {
  console.log("ayam");
  const { name } = req.body;
  console.log("name = " +  name);

  if (!name || name.length === 0) {
    return res.status(400).json({ error: 'voterId is required' });

  }

  try {
    console.log("bebek");

    const tx = await contractLocalElection.registerVoter(name);
    console.log("naga");

    await tx.wait();
    console.log("kumbang");

    res.json({ message: 'Voter registered successfully', name });
    console.log("banteng");

  } catch (error) {
    console.log("sapi");
    console.log(error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/vote', async (req, res) => {
  const { voterId, candidateId } = req.body;
  // const authorizationHeader = req.headers.authorization;
  // if (authorizationHeader !== `Bearer ${NODE_API_KEY}`) {
  //     return res.status(401).json({ error: 'Unauthorized' });
  // }

  try {
      // const [deployer] = await ethers.getSigners();
      const tx = await contractLocalElection.vote(voterId, candidateId);
      await tx.wait();
      res.json({ message: 'Vote cast successfully!' });
  } catch (error) {
      console.error('Error casting vote:', error);
      res.status(500).json({ error: 'Error casting vote' });
  }
});
// Start the server
app.listen(PORT, () => {

  console.log(`Server is running on http://localhost:${PORT}`)
});

// Start the server on a specific IP address
// app.listen(PORT, '192.168.1.4', () => {
//   console.log(`Server is running on http://192.168.1.4:${PORT}`)
// });