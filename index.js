import express from 'express'
import express_ws from 'express-ws'
import { v4 as uuidv4 } from "uuid";
import { configStuff } from './functions.js'
import path from 'path'
import crypto from 'crypto'

// Fuck ES6
import { fileURLToPath } from 'url';
import { Session } from 'inspector/promises';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

configStuff.setPath('config.json')
configStuff.watch()
configStuff.read()
let config = configStuff.get()
setInterval(() => { config = configStuff.get() }, 1000)

const app = express()
express_ws(app)
app.use(express.json())

let sessions = new Map() // { msptu: Number, pitch: Number, pitchSeed: String, groupName: String, id: String }
let groups = new Map() // { name: String, sessions: [ sesison ]}

app.get('/', (req, res) => {
    config.allowGUI ? res.sendFile(path.join(__dirname, 'index.html')) : res.status(403).json({ message: "GUI was disabled in the server config." })
})

app.get('/api/version', (req, res) => {
    res.status(200).json({ version: 1, channel: "release" })
})

app.post('/api/makeSession', (req, res) => {
    const id = uuidv4().replaceAll('-', '')
    try {
        const freq = String(req.body.freq)
        const pitchSeed = String(req.body.pitchSeed)
        let msptu = Number(req.body.msptu)

        // Prevent shitfuckery
        if (isNaN(msptu)) msptu = config.defaults.msptu
        if (msptu < config.caps.msptu[0]) {
            msptu = config.caps.msptu[0];
        } else if (msptu > config.caps.msptu[1]) {
            msptu = config.caps.msptu[1];
        }

        const hash = crypto.createHash('sha256').update(pitchSeed).digest('hex')
        const hashNumber = BigInt('0x' + hash)

        const pitch = config.caps.pitch[0] + (Number(hashNumber % BigInt(1e18)) / 1e18) * (config.caps.pitch[1] * config.caps.pitch[0])

        sessions.set(id, { msptu, pitch, pitchSeed, freq, id })
        res.status(200).json({ session: sessions.get(id) })
        console.log('[Main] Made session;', sessions.get(id))
    } catch (e) {
        res.status(500).json({ error: e.message, message: 'Internal server error'})
    }
})

app.ws('/api/radio/:id', (ws, req) => {
    const id = req.params.id
    console.log('[Main] Session activated >w<;', id)
    const session = sessions.get(id)
    if (!session) {
        console.log('[Main] ...nevermind -w-;', id, 'ERR:InvalidSession')
        ws.send(JSON.stringify({ message: "InvalidSession", error: "InvalidSession", status: 'close'}))
        ws.close()
    }

    // there should an arg-related comment but i decided 'not yet', check back later.

    ws.send(JSON.stringify({ message: 'connected', session, status: 'activate'}))

    ws.on('close', () => {
        console.log('[Main] Session deactivated TwT;', id)
    })
})

app.listen(config.server.port, config.server.host || 'localhost', () => {
    console.log(`Started; port: ${config.server.port}; host: ${config.server.host}`)
    console.log(`[Main] Despite the config will update, port and host cannot be changed without restarting the server. Have fun!! ^^`)
})