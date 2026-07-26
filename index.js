const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion, Browsers } = require('@whiskeysockets/baileys')
const { Boom } = require('@hapi/boom')
const express = require('express')
const qrcode = require('qrcode')
const fs = require('fs')
const path = require('path')
const pino = require('pino')

const app = express()
const PORT = process.env.PORT || 8080
let qr = null
let sock = null

app.use(express.static('public'))
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'main.html'))
})

// QR image එක ගන්න API
app.get('/qr', async (req, res) => {
    if(qr){
        const qrImage = await qrcode.toDataURL(qr)
        res.send(`<img src="${qrImage}" style="width:300px"> <p>Scan this QR in 20s</p>`)
    } else {
        res.send('QR not generated yet. Refresh in 5s <meta http-equiv="refresh" content="5">')
    }
})

app.listen(PORT, () => console.log(`Server running on port ${PORT}`))


async function startSock() {
    const { state, saveCreds } = await useMultiFileAuthState('./session')
    const { version } = await fetchLatestBaileysVersion()

    sock = makeWASocket({
        version,
        logger: pino({ level: 'info' }),
        auth: state,
        browser: Browsers.ubuntu('Chrome')
    })

    sock.ev.on('creds.update', saveCreds)
    
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr: qrCode } = update
        if(qrCode) {
            qr = qrCode
            console.log('New QR Generated')
        }
        if(connection === 'close') {
            qr = null
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut
            console.log('Connection closed. Reconnecting...', shouldReconnect)
            if(shouldReconnect) startSock()
        }
        if(connection === 'open') {
            qr = null
            console.log('Connected successfully!')
        }
    })
    
    // msg.js import කරගන්න
    require('./msg.js')(sock)
}

startSock()
