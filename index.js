const crypto = require('crypto');
if (typeof globalThis.crypto === 'undefined') {
    Object.defineProperty(globalThis, 'crypto', { value: crypto });
}

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 8000;

const start = async () => {
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    const sock = makeWASocket({ auth: state, logger: pino({level: 'fatal'}) });

    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', (u) => {
        const { connection, lastDisconnect, qr } = u;
        if(qr) {
            console.log('\n\n====== SCAN QR ======\n');
            qrcode.generate(qr, {small: true});
            console.log('\n=====================\n\n');
        }
        if(connection === 'close') {
            const code = lastDisconnect.error?.output?.statusCode;
            if(code !== DisconnectReason.loggedOut) start();
        }
    });
};
start();

app.get('/', (req, res) => res.send('OK'));
app.listen(PORT, () => console.log('Server running on port', PORT));
