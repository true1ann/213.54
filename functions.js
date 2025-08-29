import fs from 'fs'
import pkg_wavefile from 'wavefile'
const { WaveFile } = pkg_wavefile

let internalVars = {
    configStuff: {
        path: '',
        config: {}
    }
}

export const configStuff = {
    setPath: (path) => {
        internalVars.configStuff.path = path
        return true
    },
    checkPath: () => {
        if (!internalVars.configStuff.path) throw new Error('Use configStuff.setPath(<path>) first!')
        return true
    },
    read: () => {
        configStuff.checkPath()
        internalVars.configStuff.config = JSON.parse(fs.readFileSync(internalVars.configStuff.path, 'utf8'))
        return true
    },
    watch: () => {
        configStuff.checkPath()
        fs.watchFile(internalVars.configStuff.path, () => {
            console.log('[configStuff] Config updated! Reloading!')
            configStuff.read()
        })
    },
    get: () => {
        configStuff.checkPath()
        return internalVars.configStuff.config
    }
}

export function normalize (text) {
    text = String(text).trim()
    const sb = { // Symbols
        dt: new Set(['.', '+', '0', 'o']), // Dot
        dh: new Set(['_', '-', '1', 'i']), // Dash
        br: new Set(['/', ' ', '\\', '=']) // Break
    }

    let out = ''

    for (let s of text) {
        if (sb.dt.has(s)) {
            out += '.'
        } else if (sb.dh.has(s)) {
            out += '_'
        } else if (sb.br.has(s)) {
            out += '/'
        } else {
            // А иди ты нахуй
        }
    }

    return out
}

// this function was generated fully by ChatGPT. i didnt understand this so i just used ai, dont use it if you dont like ai or whatever i dont care
export function internal_generatePCMBuffer (msptu, pitchModifier, input, opts = {}) {
	const sampleRate = opts.sampleRate || 44100
	const baseFreq = opts.baseFreq || 440
	const freq = baseFreq * (pitchModifier || 1)
	const msToSamples = ms => Math.round((ms / 1000) * sampleRate)
	let totalMs = 0
	for (const ch of input) {
		if (ch === '.') totalMs += msptu
		else if (ch === '_') totalMs += msptu * 3
		else if (ch === '/') totalMs += msptu * 5
		else totalMs += msptu
		totalMs += msptu
	}
	const totalSamples = msToSamples(totalMs)
	const pcm = Buffer.alloc(totalSamples * 2)
	const maxAmp = Math.floor(0.9 * 0x7fff)
	const fadeMs = Math.min(10, Math.max(2, Math.floor(msptu * 0.1)))
	const fadeSamples = msToSamples(fadeMs)
	let samplePos = 0
	const writeSilence = ms => {
		const n = msToSamples(ms)
		for (let i = 0; i < n && samplePos < totalSamples; i++, samplePos++) {
			pcm.writeInt16LE(0, samplePos * 2)
		}
	}
	const writeTone = ms => {
		const n = msToSamples(ms)
		for (let i = 0; i < n && samplePos < totalSamples; i++, samplePos++) {
			const t = i / sampleRate
			let s = Math.sin(2 * Math.PI * freq * t)
			if (i < fadeSamples) s *= (i / fadeSamples)
			else if (i >= n - fadeSamples) s *= ((n - i - 1) / fadeSamples)
			const val = Math.round(s * maxAmp)
			pcm.writeInt16LE(val, samplePos * 2)
		}
	}
	for (const ch of input) {
		if (ch === '.') writeTone(msptu * 1)
		else if (ch === '_') writeTone(msptu * 3)
		else if (ch === '/') writeSilence(msptu * 5)
		else writeSilence(msptu)
		writeSilence(msptu * 1)
	}
	while (samplePos < totalSamples) {
		pcm.writeInt16LE(0, samplePos * 2)
		samplePos++
	}
	return pcm
}

export function generatePCMBuffer (config, text, base64, opts) {
    const buf = internal_generatePCMBuffer(config.msptu, config.pitch, text, opts) // Yes this function is a wrapper
    if (base64) {
        return buf.toString('base64')
    } else {
        return buf
    }
}