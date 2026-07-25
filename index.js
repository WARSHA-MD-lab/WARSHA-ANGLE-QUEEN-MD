const express = require('express');
const app = express();
const bodyParser = require("body-parser");
const PORT = process.env.PORT || 8000;
const pino = require('pino')
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const qrcode = require('qrcode-terminal')
const { Boom } = require('@hapi/boom')

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

async function connectToWhatsApp () {
    const { state, saveCreds } = await useMultiFileAuthState('./session')
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false, // false කරා
        logger: pino({ level: 'warn' })
    })

    sock.ev.on('creds.update', saveCreds)
    
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update
        
        if(qr){
            console.log('Scan this QR:')
            qrcode.generate(qr, {small: true}) // <-- මේකෙන් QR print වෙයි
        }
        
        if(connection === 'close'){
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut
            console.log('Connection closed. Reconnecting...', shouldReconnect)
            if(shouldReconnect){
                connectToWhatsApp()
            }
        } else if(connection === 'open'){
            console.log('Bot Connected Successfully!')
        }
    })
}

connectToWhatsApp()

app.get('/', (req, res) => {
  res.send('WARSH-ANGLE-QUEEN-MD is Running')
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
});
