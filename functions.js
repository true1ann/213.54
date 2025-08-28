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