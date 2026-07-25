const crypto = require('crypto');
if (typeof globalThis.crypto === 'undefined') {
    Object.defineProperty(globalThis, 'crypto', { value: crypto });
}

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const fs = require('fs');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 8000;

// 1. Web server එක alive තියාගන්න
app.get('/', (req, res) => res.send('Bot is Running'));
app.listen(PORT, () => console.log('Server running on port', PORT));

// 2. Session එක 1 පාරක් විතරක් මකමු
const sessionPath = './session';
let firstRun = !fs.existsSync(sessionPath);

const start = async () => {
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const sock = makeWASocket({ 
        auth: state, 
        logger: pino({level: 'silent'}),
        printQRInTerminal: true
    });

    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', (u) => {
        const { connection, lastDisconnect, qr } = u;
        
        if(qr && firstRun) { // පලවෙනි පාර විතරක් QR
            console.log('\n\n====== SCAN QR NOW ======\n');
            qrcode.generate(qr, {small: true});
            console.log('\n=========================\n\n');
        }
        
        if(connection === 'close') {
            const code = lastDisconnect?.error?.output?.statusCode;
            console.log('Connection closed:', code);
            if(code !== DisconnectReason.loggedOut) {
                setTimeout(start, 3000);
            }
        }
        if(connection === 'open') {
            console.log('✅ BOT CONNECTED!');
            firstRun = false;
        }
    });
};
start();
