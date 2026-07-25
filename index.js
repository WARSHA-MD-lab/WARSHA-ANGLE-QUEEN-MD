const crypto = require('crypto');
if (typeof globalThis.crypto === 'undefined') {
    Object.defineProperty(globalThis, 'crypto', { value: crypto });
}

const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const fs = require('fs');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 8000;

// IMPORTANT: හැම deploy එකේදීම session මකනවා = QR force වෙනවා
const sessionPath = './session';
if(fs.existsSync(sessionPath)){
    fs.rmSync(sessionPath, { recursive: true, force: true });
    console.log('Old session deleted. Generating new QR...');
}

const start = async () => {
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const sock = makeWASocket({ 
        auth: state, 
        logger: pino({level: 'silent'}) 
    });

    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', (u) => {
        const { connection, qr } = u;
        if(qr) {
            console.log('\n\n====== SCAN QR NOW ======\n');
            qrcode.generate(qr, {small: true});
            console.log('\n=========================\n\n');
        }
        if(connection === 'open') console.log('✅ BOT CONNECTED SUCCESSFULLY!');
    });
};
start();

app.get('/', (req, res) => res.send('OK'));
app.listen(PORT, () => console.log('Server running on port', PORT));
