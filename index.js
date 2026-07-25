global.crypto = require('crypto'); // <-- මේක තමයි game changer

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
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            console.log('================= SCAN QR =================');
            qrcode.generate(qr, { small: true });
            console.log('===========================================');
        }
        
        if (connection === 'open') {
            console.log('✅ Bot Connected Successfully!');
        } else if (connection === 'close') {
            const reason = new DisconnectReason(lastDisconnect.error)?.output?.statusCode;
            console.log('❌ Connection closed. Reason:', reason);
            if (reason !== DisconnectReason.loggedOut) {
                startBot(); // auto reconnect
            }
        }
    });
};

startBot();

app.get('/', (req, res) => {
  res.send('WARSH-ANGLE-QUEEN-MD is Running');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
