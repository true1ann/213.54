import fs from 'fs'

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