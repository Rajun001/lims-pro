const net = require('net');

// 1. ASTM Frame Simulation (Snibe / ASTM format)
const astmMessage = `1H|\\^&|||SNIBE|||||||P|1
2P|1|918|||Pérez^Yolanda||19850505|F|||||
3O|1|M-10002||^^^QUIMICA||||||||||||||||||||||F
4R|1|^^^GLU-03|95|mg/dL||N||F||
5R|2|^^^LIP-02|180|mg/dL||N||F||
6L|1|N
`;

// 2. HL7 Message Simulation (Fuji / HL7 format wrapped in MLLP)
const hl7Message = `\x0bMSH|^~\\&|FUJI|NX6000|LIMS|MICROLABS|20260612110500||ORU^R01|MSG00002|P|2.3\rPID|1||918||Perez^Yolanda||19850505|F\rPV1|1|O\rOBR|1|M-10002|||||20260612110000\rOBX|1|NM|GLU-03||105|mg/dL|70-110|H|||F\rOBX|2|NM|LIP-02||210|mg/dL|<200|H|||F\r\x1c\x0d`;

function sendSimulation(name, payload, _isHL7) {
  return new Promise((resolve) => {
    console.log(`[SIMULATOR] Connecting to send ${name}...`);
    const client = new net.Socket();
    
    client.connect(9000, '127.0.0.1', () => {
      console.log(`[SIMULATOR] Connected! Sending payload...`);
      client.write(payload);
      setTimeout(() => {
        client.destroy();
      }, 1500);
    });

    client.on('data', (data) => {
      console.log(`[SIMULATOR] Received response from server:`, data.toString('utf-8'));
    });

    client.on('close', () => {
      console.log(`[SIMULATOR] Connection closed for ${name}.\n`);
      resolve();
    });

    client.on('error', (err) => {
      console.error(`[SIMULATOR ERROR] Error during ${name}: ${err.message}`);
      resolve();
    });
  });
}

async function run() {
  console.log("=== STARTING SIMULATED TEST FOR YOLANDA PEREZ (M-10002) ===\n");
  
  // Send ASTM first
  await sendSimulation("Snibe Simulation (ASTM)", astmMessage, false);
  
  // Wait 2 seconds
  await new Promise(r => setTimeout(r, 2000));
  
  // Send HL7
  await sendSimulation("Fuji Simulation (HL7)", hl7Message, true);
  
  console.log("=== SIMULATED TEST COMPLETED ===");
}

run();
