const net = require('net');

// Fake ASTM frame simulating a Vitek 2 or similar microbiology result
// H = Header
// P = Patient
// O = Order (Barcode M-10001)
// R = Result (MIC values for AST)
// L = Terminator
const fakeASTMMessage = `1H|\\^&|||VITEK2|||||||P|1
2P|1||12345678||Pérez^Juan||19800101|M|||||
3O|1|M-10001||^^^CULTIVO||||||||||||||||||||||F
4R|1|^^^Amoxicilina|16|mm||S||F||
5R|2|^^^Ciprofloxacino|12|mm||R||F||
6L|1|N
`;

// Simulate connection to our local TCP server
const client = new net.Socket();

client.connect(9000, '127.0.0.1', () => {
    console.log('[SIMULATOR] Connected to Analyzer TCP Server');
    
    console.log('[SIMULATOR] Sending ASTM message...');
    client.write(fakeASTMMessage);
    
    // Close after a short delay
    setTimeout(() => {
        console.log('[SIMULATOR] Disconnecting...');
        client.destroy();
    }, 1000);
});

client.on('error', (err) => {
    console.error(`[SIMULATOR ERROR] Make sure the analyzer-service is running on port 9000!`);
    console.error(err.message);
});
