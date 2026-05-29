const net = require('net');
const { parseHL7 } = require('./parsers/hl7');
const { parseASTM } = require('./parsers/astm');

// Configuration
const PORT = process.env.ANALYZER_PORT || 9000;
const HOST = '0.0.0.0';

// Helper to send data to the API
const sendToAPI = async (parsedData) => {
  try {
    const res = await fetch('http://localhost:3001/api/analyzer-ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsedData)
    });
    if (!res.ok) {
      console.error(`[API ERROR] ${res.status} ${res.statusText}`);
    } else {
      console.log(`[API SUCCESS] Data ingested successfully`);
    }
  } catch (err) {
    console.error(`[API ERROR] No connection to LIMS API: ${err.message}`);
  }
};

// Create a TCP server
const server = net.createServer((socket) => {
  console.log(`[+] New connection from ${socket.remoteAddress}:${socket.remotePort}`);

  socket.on('data', async (data) => {
    // Convert buffer to string
    const message = data.toString('utf-8');
    console.log(`[DATA] Received raw frame:`);
    console.log(message);

    // Try parsing
    if (message.includes('OBX') || message.includes('PID')) {
      const hl7Data = parseHL7(data);
      console.log('--- Parsed HL7 Data ---');
      console.dir(hl7Data, { depth: null });
      if (hl7Data) await sendToAPI(hl7Data);
    } else if (message.includes('1H') || message.includes('|\\^&|')) {
      const astmData = parseASTM(data);
      console.log('--- Parsed ASTM Data ---');
      console.dir(astmData, { depth: null });
      if (astmData) await sendToAPI(astmData);
    } else {
      console.log('Unknown message format.');
    }


    // Here we would implement parsing logic (HL7 or ASTM)
    // and sending parsed data to the API or directly via Prisma
    
    // Example: Acknowledge reception (ASTM ACK = <ACK> i.e., 0x06, HL7 requires an ACK message)
    // For now, we just log it.
  });

  socket.on('end', () => {
    console.log(`[-] Connection ended by ${socket.remoteAddress}`);
  });

  socket.on('error', (err) => {
    console.error(`[!] Socket error: ${err.message}`);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Analyzer Service TCP Server listening on ${HOST}:${PORT}`);
  console.log(`Waiting for connections from clinical/industrial analyzers...`);
});
