const express = require('express');
const app = express();
const _path = process.cwd();
const bodyParser = require("body-parser");
const PORT = process.env.PORT || 8000;
const pino = require('pino')
const { default: makeWASocket, useMultiFileAuthState, delay } = require('@whiskeysockets/baileys')
const qrcode = require('qrcode-terminal')

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

async function connectToWhatsApp () {
    const { state, saveCreds } = await useMultiFileAuthState('./session')
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true, // <-- මේක නිසා QR එයි
        logger: pino({ level: 'silent' })
    })

    sock.ev.on('creds.update', saveCreds)
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update
        if(qr){
            qrcode.generate(qr, {small: true}) // <-- Terminal එකේ QR print වෙයි
        }
        if(connection === 'close'){
            console.log('Connection closed. Reconnecting...')
            connectToWhatsApp()
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

module.exports = app;
