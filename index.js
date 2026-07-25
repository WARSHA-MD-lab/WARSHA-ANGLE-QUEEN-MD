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

// Railway kill නොවෙන්න web server එක alive තියනවා
app.get('/', (req, res) => res.send('Bot is Running'));
app.listen(PORT, () => console.log('Server running on port', PORT));

// පලවෙනි පාර විතරක් session මකනවා
const sessionPath = './session';
if(!fs.existsSync(sessionPath)){
    console.log('No session found. Will generate QR...');
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
            console.log('\n\n');
            console.log('========================================');
            console.log('        SCAN THIS QR WITH WHATSAPP      ');
            console.log('========================================');
            qrcode.generate(qr, {small: false}); // small: false = ලොකු QR
            console.log('========================================');
            console.log('\n\n');
        }
        
        if(connection === 'open') {
            console.log('✅ BOT CONNECTED SUCCESSFULLY!');
        }
        if(connection === 'close') {
            console.log('Connection closed. Waiting 10s to retry...');
            setTimeout(start, 10000); // 10s ඉඳලා ආපහු try
        }
    });
};
start();
