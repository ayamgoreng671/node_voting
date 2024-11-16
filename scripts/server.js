const express = require('express')
const cors = require('cors')
const mysql = require('mysql2/promise')
const { ethers } = require('hardhat') // Use ethers from Hardhat
require('dotenv').config()

const configDatabase = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'blocklegamcok'
}
async function connectToDatabase() {
  try {
    const connection = await mysql.createConnection(configDatabase)
    console.log('Connected to MySQL')
    return connection
  } catch (err) {
    console.error('Error connecting to MySQL:', err.stack)
  }
}

async function fetchDataElection(id) {
  const connection = await connectToDatabase()
  const [rows] = await connection.execute('SELECT election_contract_address FROM elections where id = ' + id)

  // Iterate through rows and extract string data
  let ayam = []
  rows.forEach((row) => {
    // console.log('Row data:', row);

    // Assuming the table has a column named "columnName"
    // console.log('String data:', row.election_contract_address);
    ayam.push(row.election_contract_address) // Replace columnName with your actual column name
  })
  console.log('ayam = ' + ayam)

  return ayam

  connection.end() // close connection after query
}

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
]
const abiDistrictElection = [
  // District management
  'function addDistrict(uint256 _districtId, uint256 _level) public',

  // Candidate management
  'function addCandidate(string memory _name, uint256 _districtId) public',
  'function candidates(uint256 candidateId) public view returns (uint256 id, string memory name, uint256 voteCount, uint256 districtId, bool active)',

  // Voter management
  'function registerVoter(string memory _voterId, uint256 _districtId) public',
  'function voters(bytes32 hashedVoterId) public view returns (bool active, bool hasVoted, uint256 candidateIdVoted, uint256 districtId)',

  // Voting
  'function vote(string memory _voterId, uint256 _candidateId) public',

  // Election control functions
  'function extendElection(uint256 additionalTime) public',
  'function endElection() public',

  // Public variables
  'function electionEndTime() public view returns (uint256)',
  'function electionEnded() public view returns (bool)',
  'function admin() public view returns (address)',
  'function salt() public view returns (bytes32)',
  'function candidatesCount() public view returns (uint256)',
  'function districts(uint256 _districtId) public view returns (uint256 level, uint256 candidateCount)',

  // Events
  'event CandidateAdded(uint256 candidateId, string name, uint256 districtId)',
  'event VoterRegistered(bytes32 voterId)',
  'event VoteCast(bytes32 voterId, uint256 candidateId)',
  'event ElectionEnded(uint256 endTime)'
]

// fetchData();

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
})

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

// ACTUAL

app.post('/deploy', async (req, res) => {
  const { initial_value, salt, category_id } = req.body

  // Validate input
  if (!initial_value || !salt) {
    return res.status(400).json({ error: 'Missing initial_value or salt in request body' })
  }

  try {
    const parsedSalt = ethers.utils.arrayify(salt) // Convert salt to bytes

    let contract
    let contractFactory

    if (category_id == 1) {
      // Deploy LocalElection contract
      contractFactory = await ethers.getContractFactory('LocalElection', wallet)
      contract = await contractFactory.deploy(initial_value, parsedSalt)
      await contract.deployed()
      res.json({
        message: 'Contract deployed successfully!',
        contractAddress: contract.address
      })
    } else if (category_id == 2) {
      // Deploy DistrictElection contract
      contractFactory = await ethers.getContractFactory('DistrictElection', wallet)
      contract = await contractFactory.deploy(initial_value, parsedSalt)
      await contract.deployed()

      const ayam = [
        [1, 1],
        [2, 1],
        [3, 1],
        [4, 1],
        [5, 1],
        [6, 1],
        [7, 1],
        [8, 2],
        [9, 2],
        [10, 2],
        [11, 2],
        [12, 2],
        [13, 2],
        [14, 2],
        [15, 2]
      ]

      const contractLocalElectionLocal = new ethers.Contract(contract.address, abiDistrictElection, wallet)

      // Use a for...of loop instead of forEach for async handling
      for (const element of ayam) {
        try {
          const tx = await contractLocalElectionLocal.addDistrict(element[0], element[1])
          await tx.wait() // Wait for the transaction to be mined
          console.log(`District added: ${element[0]}, Level: ${element[1]}`)
        } catch (error) {
          console.error(`Failed to add district ${element[0]}:`, error)
        }
      }
      bebek = []
      for (const element of ayam) {
        try {
          const tx = await contractLocalElectionLocal.addCandidate('Empty Box', element[0])
          await tx.wait() // Wait for the transaction to be mined
          console.log(`Candidate added: Empty Box, District: ${element[0]}`)
          const candidatesCount = await contractLocalElectionLocal.candidatesCount()
          console.log('harimau')
          const candidate = await contractLocalElectionLocal.candidates(candidatesCount)
          console.log('naga')

          bebek.push(candidate.id.toNumber())
        } catch (error) {
          console.error(`Failed to add district ${element[0]}:`, error)
        }
      }

      res.json({ message: 'Candidate added successfully!', contractAddress: contract.address, candidateIds: bebek })
    } else {
      return res.status(400).json({ error: 'Invalid category_id' })
    }
  } catch (error) {
    console.error('Error during contract deployment:', error)
    res.status(500).json({ error: error.message })
  }
})

const contractAddressLocalElection = '0xC14562Cb06b501dC418a0A05D1D9d2fE91ccaCDC' // Make sure this address is correct

// Create a contract instance
const contractLocalElection = new ethers.Contract(contractAddressLocalElection, abiLocalElection, wallet)

app.get('/candidates', async (req, res) => {
  try {
    const candidatesCount = await contractLocalElection.candidatesCount()
    const candidates = []
    for (let i = 1; i <= candidatesCount; i++) {
      const candidate = await contractLocalElection.candidates(i)
      candidates.push({
        id: candidate.id.toNumber(),
        name: candidate.name,
        voteCount: candidate.voteCount.toNumber()
      })
    }
    res.json(candidates)
  } catch (error) {
    console.error('Error fetching candidates:', error)
    res.status(500).json({ error: error.message })
  }
})

// Node.js route to add a candidate
app.post('/addcandidate', async (req, res) => {
  const { name, election_id, category_id, district } = req.body

  // Check if name is provided
  if (!name || name.length === 0) {
    return res.status(400).json({ error: 'Candidate name is required' })
  }

  if (category_id == 1) {
    try {
      console.log('duar')

      const contractAddressLocalElectionLocal = await fetchDataElection(election_id)
      console.log('mbeledos')
      console.log(contractAddressLocalElectionLocal)

      const contractLocalElectionLocal = new ethers.Contract(contractAddressLocalElectionLocal[0], abiLocalElection, wallet)
      console.log('ayam')
      console.log(name)
      console.log(contractAddressLocalElectionLocal)
      const tx = await contractLocalElectionLocal.addCandidate(name)
      console.log('bebek')

      await tx.wait()
      console.log('kuda')
      const candidatesCount = await contractLocalElectionLocal.candidatesCount()
      console.log('harimau')
      const candidate = await contractLocalElectionLocal.candidates(candidatesCount)
      console.log('naga')

      res.json({ message: 'Candidate added successfully!', candidateName: name, candidateId: candidate.id.toNumber() })
    } catch (error) {
      const contractAddressLocalElectionLocal = await fetchDataElection(election_id)

      res.status(500).json({ error: error.message })
    }
  } else if (category_id == 2) {
    try {
      console.log('duar')

      const contractAddressLocalElectionLocal = await fetchDataElection(election_id)
      console.log('mbeledos')
      console.log(contractAddressLocalElectionLocal)

      const contractLocalElectionLocal = new ethers.Contract(contractAddressLocalElectionLocal[0], abiDistrictElection, wallet)
      console.log('ayam')
      console.log('name = ' + name)
      console.log('district = ' + district)
      console.log(contractAddressLocalElectionLocal)
      const tx = await contractLocalElectionLocal.addCandidate(name, district)
      console.log('bebek')

      await tx.wait()
      console.log('kuda')
      const candidatesCount = await contractLocalElectionLocal.candidatesCount()
      console.log('harimau')
      const candidate = await contractLocalElectionLocal.candidates(candidatesCount)
      console.log('naga')

      res.json({ message: 'Candidate added successfully!', candidateName: name, candidateId: candidate.id.toNumber() })
    } catch (error) {
      const contractAddressLocalElectionLocal = await fetchDataElection(election_id)

      res.status(500).json({ error: error.message })
    }
  }
})

app.post('/registervoter', async (req, res) => {
  console.log('ayam')
  const { name, election_id, category_id, district } = req.body
  console.log('name = ' + name)
  console.log('election_id = ' + election_id)
  console.log('category_id = ' + category_id)
  console.log('district = ' + district)

  if (!name || name.length === 0) {
    return res.status(400).json({ error: 'voterId is required' })
  }

  if (category_id == 1) {
    try {
      const contractAddressLocalElectionLocal = await fetchDataElection(election_id)
      console.log('mbeledos')
      console.log(contractAddressLocalElectionLocal)

      const contractLocalElectionLocal = new ethers.Contract(contractAddressLocalElectionLocal[0], abiLocalElection, wallet)
      console.log('ayam')
      console.log(name)
      console.log(contractAddressLocalElectionLocal)

      const tx = await contractLocalElectionLocal.registerVoter(name)
      console.log('naga')

      await tx.wait()
      console.log('kumbang')

      res.json({ message: 'Voter registered successfully', name })
      console.log('banteng')
    } catch (error) {
      console.log('sapi')
      console.log(error.message)
      res.status(500).json({ error: error.message })
    }
  } else if (category_id == 2) {
    try {
      const contractAddressLocalElectionLocal = await fetchDataElection(election_id)
      console.log('mbeledos')
      console.log(contractAddressLocalElectionLocal)

      const contractLocalElectionLocal = new ethers.Contract(contractAddressLocalElectionLocal[0], abiDistrictElection, wallet)
      console.log('ayam')
      console.log(name)
      console.log(contractAddressLocalElectionLocal)

      const tx = await contractLocalElectionLocal.registerVoter(name, district)
      console.log('naga')

      await tx.wait()
      console.log('kumbang')

      res.json({ message: 'Voter registered successfully', name })
      console.log('banteng')
    } catch (error) {
      console.log('sapi')
      console.log(error.message)
      res.status(500).json({ error: error.message })
    }
  }
})

app.post('/vote', async (req, res) => {
  const { voterId, candidateId, election_id } = req.body
  const contractAddressLocalElectionLocal = await fetchDataElection(election_id)
  console.log('mbeledos')
  console.log('voter id = ' + voterId)
  console.log('candidate id = ' + candidateId)
  console.log(contractAddressLocalElectionLocal)

  const contractLocalElectionLocal = new ethers.Contract(contractAddressLocalElectionLocal[0], abiLocalElection, wallet)
  console.log('ayam')

  try {
    // const [deployer] = await ethers.getSigners();
    console.log('bebek')

    const tx = await contractLocalElectionLocal.vote(voterId, candidateId)
    console.log('kuda')

    await tx.wait()
    res.json({ message: 'Vote cast successfully!' })
  } catch (error) {
    console.error('Error casting vote:', error)
    res.status(500).json({ error: 'Error casting vote' })
  }
})
// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})

// Start the server on a specific IP address
// app.listen(PORT, '192.168.1.4', () => {
//   console.log(`Server is running on http://192.168.1.4:${PORT}`)
// });
