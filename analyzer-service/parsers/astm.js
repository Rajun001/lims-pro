/**
 * Basic ASTM Parser
 * ASTM E1381/E1394 uses frames like: <ENQ>, <STX>1H|\^&||...<CR><ETX>CH<CR><LF>, <EOT>
 */

function parseASTM(dataBuffer) {
  const str = dataBuffer.toString('utf-8');
  
  // Basic frame split by <CR> or line feeds
  const frames = str.split(/\r?\n|\r/);
  
  const parsedData = {
    type: 'ASTM',
    patient: null,
    orders: [],
    results: []
  };

  frames.forEach(frame => {
    // Strip control characters for processing
    // eslint-disable-next-line no-control-regex
    const cleanFrame = frame.replace(/[\x02\x03]/g, ''); // Remove STX/ETX
    if (!cleanFrame) return;

    // The first character of the data frame determines the record type
    // e.g. "1H..." -> H is the type. (Sometimes there is a sequence number before it)
    const match = cleanFrame.match(/^\d?([H|P|O|R|C|Q|L])/);
    if (!match) return;

    const recordType = match[1];
    const fields = cleanFrame.split('|');

    switch (recordType) {
      case 'H': // Header
        break;
      case 'P': // Patient
        parsedData.patient = {
          patientId: fields[3],
          name: fields[5]
        };
        break;
      case 'O': // Order
        parsedData.orders.push({
          orderId: fields[2],
          testCode: fields[4]
        });
        break;
      case 'R': // Result
        parsedData.results.push({
          testCode: fields[2],
          value: fields[3],
          units: fields[4],
          referenceRanges: fields[5],
          abnormalFlags: fields[6]
        });
        break;
      case 'L': // Terminator
        break;
    }
  });

  return parsedData;
}

module.exports = { parseASTM };
