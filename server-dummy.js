const express = require('express')
const cors = require('cors')

const app = express()
const PORT = 3000

const allowedIPs = ["127.0.0.1","192.168.1.10"];

app.use(cors())
app.use(express.json())



app.get('/api/data', (req, res) => {
  const clientIP = req.ip || req.connection.remoteAddress

  const formattedIP = clientIP === '::1' ? '127.0.0.1' : clientIP.startsWith('::ffff:') ? clientIP.slice(7) : clientIP
  res.send({
    "message": 'Hello from Node.js',
    "allowedIPs": allowedIPs,
   "clientIP": clientIP,
    "formattedIP": formattedIP,
  })
})


// Start the server
app.listen(PORT, () => {

  console.log(`Server is running on http://localhost:${PORT}`)
});
