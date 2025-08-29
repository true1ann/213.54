import express from 'express'
import express_ws from 'express-ws'
import { v4 as uuidv4 } from "uuid";
import { configStuff, normalize } from './functions.js'
import path from 'path'
import crypto from 'crypto'

// Fuck ES6
import { fileURLToPath } from 'url';
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
let freqs = new Map() // { name: String, sessions: [ sesison ]}

app.get('/', (req, res) => {
    config.allowGUI ? res.sendFile(path.join(__dirname, 'index.html')) : res.status(403).json({ message: "GUI was disabled in the server config." })
})

app.get('/api/version', (req, res) => {
    res.status(200).json({ version: 1, channel: "release" })
})

app.post('/api/makeSession', (req, res) => {
    let id = uuidv4().replaceAll('-', '')
    while (sessions.get(id)) id = uuidv4().replaceAll('-', '')
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

        // check if session already exists
        let newSession = true
        sessions.values().forEach(s => {
            if (
                newSession &&
                s.freq == freq &&
                s.pitchSeed == pitchSeed &&
                s.msptu == msptu
            ) {
                console.log(`[${new Date().toLocaleString()}]`, '[Main] Duplicate session @w@;', s.id)
                res.status(200).json({ ...s, type: 'reuse' })
                newSession = false
            }
        })

        if (newSession) {
            const hash = crypto.createHash('sha256').update(pitchSeed).digest('hex')
            const hashNumber = BigInt('0x' + hash)

            const pitch = config.caps.pitch[0] + (Number(hashNumber % BigInt(1e18)) / 1e18) * (config.caps.pitch[1] - config.caps.pitch[0])

            sessions.set(id, { msptu, pitch, pitchSeed, freq, id })
            const session = sessions.get(id)
            console.log(`[${new Date().toLocaleString()}]`, '[Main] Made session;', { ...session, type: 'new' })
            res.status(200).json({ ...session, type: 'new' })
            if (!freqs.get(freq)) freqs.set(freq, { name: freq, sessions: [] })
        }
    } catch (e) {
        console.error(`[${new Date().toLocaleString()}]`, '[Main]', e)
        res.status(500).json({ error: e.message, message: 'Internal server error'})
    }
})

app.ws('/api/radio/:id', (ws, req) => {
    const id = req.params.id
    const sendType = Number(req.params.mode) || 1
    console.log(`[${new Date().toLocaleString()}]`, '[Main] Session activated >w<;', id)
    const session = sessions.get(id)
    if (!session) {
        console.log(`[${new Date().toLocaleString()}]`, '[Main] ...nevermind -w-;', id, 'ERR:InvalidSession')
        ws.send(JSON.stringify({ message: "InvalidSession", error: "InvalidSession", status: 'close'}))
        ws.terminate() // sometimes ws.close fails so we use this instead
        return
    }

    // there should an arg-related comment but i decided 'not yet', check back later.
    const bucket = freqs.get(session.freq)
    if (bucket.sessions.some(s => s.id === session.id)) {
        ws.send(JSON.stringify({ message: "SessionActive", error: "SessionActive", status: 'close'}))
        ws.terminate()
        return
    } else {
        ws.send(JSON.stringify({ message: 'connected', session, status: 'activate'}))
        Object.defineProperty(session, 'ws', { value: ws, enumerable: false, writable: true })
		bucket.sessions.push(session)
	}

    ws.on('message', m => {
        m = String(m).trim() // Im lazy
        console.log(`[${new Date().toLocaleString()}]`, '[Main] Message;', id, `"${m}"`)
        const nm = normalize(m)
        console.log(`[${new Date().toLocaleString()}]`, '[Main] Normalized message;', id, `"${nm}"`)
        ws.send(JSON.stringify({ message: 'OK', details: nm, status: 'sent'}))
        bucket.sessions.forEach(s => {
            if (s.ws && s.ws.readyState === 1 && s.id !== session.id) {
                try {
                    switch (sendType) {
                        // case 1 is the default
                        case 2:
                            // send base64 encoded PCM
                            break
                        case 3:
                            s.ws.send(JSON.stringify({ message: nm, pitch, msptu }))
                            break
                        default:
                            // send raw PCM
                            break
                    }
                } catch (e) {
                    console.error(`[${new Date().toLocaleString()}]`, '[Main]', e)
                }
            }
        })
    })

    ws.on('close', () => {
        bucket.sessions = bucket.sessions.filter(s => s.id !== session.id)
        session.ws = ''
        console.log(`[${new Date().toLocaleString()}]`, '[Main] Session deactivated TwT;', id)
    })
})

app.listen(config.server.port, config.server.host || 'localhost', () => {
    console.log(`Started; port: ${config.server.port}; host: ${config.server.host}`)
    console.log(`[${new Date().toLocaleString()}]`, `[Main] Despite the config will update, port and host cannot be changed without restarting the server. Have fun!! ^^`)
})