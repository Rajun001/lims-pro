const net = require('net');

const HOST = '127.0.0.0';
const PORT = 9000;

// Standard HL7 Chemistry Result using MLLP standard
const hl7Message = `MSH|^~\\&|NX6000|LAB|||20260519100000||ORU^R01|MSG0001|P|2.3\rPID|1||12345678^^^LIMS||Doe^John||19800101|M\rOBR|1||MC-2026-0515|GLU^Glucose|||20260519095000|||||||||\rOBX|1|NM|GLU^Glucose|1|105|mg/dL|70-100|H|||F\rOBX|2|NM|CHOL^Cholesterol|1|210|mg/dL|<200|H|||F`;

// MLLP Wrappers
const VT = '\x0b';
const FS = '\x1c';
const CR = '\x0d';

const mllpMessage = `${VT}${hl7Message}${FS}${CR}`;

console.log(`[Mock Analyzer] Attempting to connect to ${HOST}:${PORT}...`);

const client = new net.Socket();

client.connect(PORT, '127.0.0.1', () => {
    console.log('[Mock Analyzer] Connected to LIMS Local Agent');
    console.log('[Mock Analyzer] Sending test results for Barcode MC-2026-0515...');
    client.write(mllpMessage);
});

client.on('data', (data) => {
    const rawData = data.toString('utf-8');
    const cleanData = rawData.replace(/[\x0b\x1c\x0d]/g, '\n');
    console.log(`[Mock Analyzer] Received ACK from LIMS:\n${cleanData}`);
    
    console.log('[Mock Analyzer] Disconnecting...');
    client.destroy(); // kill client after server's response
});

client.on('close', () => {
    console.log('[Mock Analyzer] Connection closed');
});

client.on('error', (err) => {
    console.error('[Mock Analyzer] Error:', err.message);
});
