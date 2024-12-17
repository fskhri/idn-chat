const express = require('express');
const WebSocket = require('ws');
const dns = require('dns');
const app = express();
const port = 3000;

// Middleware untuk parsing JSON
app.use(express.json());

function getHostIP() {
    return new Promise((resolve, reject) => {
        dns.resolve4('www.idn.app', (err, addresses) => {
            if (err) reject(err);
            resolve(addresses[0]);
        });
    });
}

// Menyimpan koneksi WebSocket aktif
let activeWs = null;
let messageBuffer = [];

async function setupWebSocket() {
    try {
        const ip = await getHostIP();
        
        const wsEndpoint = "get-ready-with-me-241217120921"; // This will be dynamic based on URL
        const channelId = "arn:aws:ivschat:us-east-1:050891932989:room/htf3oUJ0sS3i"; // This should be fetched or configured for each stream
        
        const headers = {
            'accept-language': 'en-US,en;q=0.9',
            'cache-control': 'no-cache',
            'pragma': 'no-cache',
            'sec-websocket-extensions': 'permessage-deflate; client_max_window_bits',
            'sec-websocket-version': '13',
            'origin': `https://${ip}`,
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            'accept-encoding': 'gzip, deflate, br, zstd',
            'host': 'chat.idn.app',
            'connection': 'Upgrade',
            'upgrade': 'websocket'
        };

        // WebSocket URL uses the endpoint from the live URL
        const ws = new WebSocket(`wss://chat.idn.app/${wsEndpoint}`, {
            headers: headers
        });

        let registered = false;
        let joined = false;

        ws.onopen = () => {
            console.log("Connecting to chat server...");
            ws.send('NICK websocket_user');
            ws.send('USER websocket 0 * :WebSocket User');
        };

        ws.onmessage = (event) => {
            try {
                const rawMessage = event.data;
                
                if (rawMessage.startsWith('PING')) {
                    ws.send('PONG' + rawMessage.substring(4));
                    return;
                }

                if (rawMessage.includes('001') && !registered) {
                    registered = true;
                    console.log("Successfully connected, joining channel...");
                    ws.send(`JOIN #${channelId}`);
                    return;
                }

                if (rawMessage.includes('JOIN') && !joined) {
                    joined = true;
                    console.log("Successfully joined channel, waiting for messages...\n");
                    return;
                }

                if (rawMessage.match(/^:[^ ]+ (00\d|2\d\d|3\d\d|45\d)/)) {
                    return;
                }

                if (rawMessage.includes('PRIVMSG')) {
                    const jsonMatch = rawMessage.match(/PRIVMSG #[^ ]+ :(.*)/);
                    if (jsonMatch) {
                        const jsonData = jsonMatch[1];
                        const data = JSON.parse(jsonData);
                        
                        const timeMatch = rawMessage.match(/@time=([^;]+)/);
                        const timestamp = timeMatch ? timeMatch[1] : new Date().toISOString();

                        // Menyimpan pesan ke buffer
                        messageBuffer.push({
                            timestamp,
                            data
                        });

                        // Membatasi buffer hanya menyimpan 100 pesan terakhir
                        if (messageBuffer.length > 100) {
                            messageBuffer.shift();
                        }
                    }
                }
            } catch (error) {
                if (!event.data.includes('system')) {
                    console.log("Debug - Raw message:", event.data);
                    console.log("Error:", error);
                }
            }
        };

        ws.onerror = (error) => {
            console.error("Connection error:", error);
        };

        ws.onclose = (event) => {
            console.log("\nDisconnected from chat server");
            if (event.reason) console.log("Reason:", event.reason);
            activeWs = null;
            // Mencoba reconnect setelah 5 detik
            setTimeout(setupWebSocket, 5000);
        };

        activeWs = ws;

    } catch (error) {
        console.error("Failed to connect:", error);
        // Mencoba reconnect setelah 5 detik
        setTimeout(setupWebSocket, 5000);
    }
}

// API Endpoints
app.get('/messages', (req, res) => {
    // Mengambil parameter limit dari query, default 50
    const limit = parseInt(req.query.limit) || 50;
    
    // Mengembalikan pesan sesuai limit yang diminta
    const messages = messageBuffer.slice(-Math.min(limit, messageBuffer.length));
    
    res.json({
        status: 'success',
        connected: activeWs !== null,
        messages: messages
    });
});

app.get('/status', (req, res) => {
    res.json({
        status: 'success',
        connected: activeWs !== null,
        messageCount: messageBuffer.length
    });
});

// Memulai server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    // Memulai koneksi WebSocket
    setupWebSocket();
});