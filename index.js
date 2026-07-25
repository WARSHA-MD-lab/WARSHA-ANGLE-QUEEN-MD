global.crypto = require('crypto');
global.Buffer = require('buffer').Buffer;
global.process = require('process');

const express = require('express');
const app = express();
const bodyParser = require("body-parser");
const PORT = process.env.PORT || 8000;
const pino = require('pino');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const startBot = async () => {
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' })
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            console.log('\n\n======= SCAN THIS QR NOW =======\n');
            qrcode.generate(qr, { small: true });
            console.log('\n================================\n\n');
        }
        
        if (connection === 'open') {
            console.log('✅ Bot Connected Successfully!');
        } else if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            console.log('❌ Connection closed. Status:', statusCode);
            // loggedOut = 401 නම් ආපහු connect වෙන්න එපා
            if (statusCode !== DisconnectReason.loggedOut) {
                console.log('Restarting in 3s...');
                setTimeout(() => startBot(), 3000);
            }
        }
    });
};

startBot();

app.get('/', (req, res) => res.send('WARSH-ANGLE-QUEEN-MD is Running'));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
