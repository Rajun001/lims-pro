const net = require('net');
const { parseHL7 } = require('./hl7Parser');
const { syncToFirebase } = require('./firebaseSync');

const PORT = process.env.PORT || 9000;
const HOST = '0.0.0.0'; // Listen on all network interfaces

const ALLOWED_IPS = process.env.ALLOWED_IPS 
    ? process.env.ALLOWED_IPS.split(',').map(ip => ip.trim()) 
    : ['127.0.0.1', '::1'];

const server = net.createServer((socket) => {
    let clientIp = socket.remoteAddress || '';
    if (clientIp.startsWith('::ffff:')) {
        clientIp = clientIp.substring(7);
    }

    const isAllowed = ALLOWED_IPS.includes(clientIp) || ALLOWED_IPS.includes(socket.remoteAddress);
    if (!isAllowed) {
        console.warn(`[TCP Server] Connection rejected from unauthorized IP: ${socket.remoteAddress}`);
        socket.destroy();
        return;
    }

    console.log(`[TCP Server] Connection established from ${socket.remoteAddress}:${socket.remotePort}`);

    // Set 10 seconds timeout for inactivity (Slowloris mitigation)
    socket.setTimeout(10000);
    socket.on('timeout', () => {
        console.warn(`[TCP Server] Socket timeout (10s inactive) for ${socket.remoteAddress}`);
        socket.destroy();
    });

    let dataBuffer = '';

    socket.on('data', async (data) => {
        const chunk = data.toString('utf-8');
        
        // Prevent buffer overflow / memory exhaustion (DoS mitigation, max 50KB)
        if (dataBuffer.length + chunk.length > 51200) {
            console.warn(`[TCP Server] Message buffer size limit exceeded (50KB) for ${socket.remoteAddress}`);
            socket.destroy();
            return;
        }

        dataBuffer += chunk;

        // In MLLP (Minimal Lower Layer Protocol) used for HL7 over TCP, 
        // messages start with <VT> (\x0b) and end with <FS><CR> (\x1c\x0d).
        // Since we might get raw streams or MLLP, we use a simple approach:
        // We will parse once the connection drops, or we look for MLLP end tokens.
        
        // Simple check for MLLP end block
        if (dataBuffer.includes('\x1c\x0d') || dataBuffer.includes('\u001c\r')) {
            const cleanMessage = dataBuffer.replace(/[\x0b\x1c\x0d]/g, '\n');
            console.log(`[TCP Server] Complete HL7 message received:\n${cleanMessage}`);
            
            try {
                const parsed = parseHL7(cleanMessage);
                console.log('[Parser] Extracted Data:', JSON.stringify(parsed, null, 2));

                // Sync to LIMS Cloud
                await syncToFirebase(parsed);
                
                // Send ACK back to analyzer (Standard HL7 ACK)
                const ackMessage = `MSH|^~\\&|LIMS|MICROLABS|${parsed.equipment || 'EQUIPMENT'}||${new Date().toISOString().replace(/\D/g,'').substring(0,14)}||ACK|ACK123|P|2.3\rMSA|AA|MSG0001\r`;
                const mllpAck = `\x0b${ackMessage}\x1c\x0d`;
                
                socket.write(mllpAck);
                console.log('[TCP Server] ACK sent to analyzer.');
            } catch (err) {
                console.error(`[TCP Server] Error parsing HL7 or syncing: ${err.message}`);
            }
            
            dataBuffer = ''; // Reset buffer for next message
        }
    });

    socket.on('close', () => {
        console.log(`[TCP Server] Connection closed for ${socket.remoteAddress}`);
    });

    socket.on('error', (err) => {
        console.error(`[TCP Server] Socket error: ${err.message}`);
    });
});

server.listen(PORT, HOST, () => {
    console.log('===================================================');
    console.log('       LIMS Local Agent (HL7 Middleware)           ');
    console.log('===================================================');
    console.log(`[TCP Server] Listening for Analyzers on port ${PORT}`);
    console.log('Configure your Fuji NX6000 or Snibe to send data to');
    console.log(`this machine's IP address on port ${PORT}.`);
    console.log('Waiting for connections...');
});
