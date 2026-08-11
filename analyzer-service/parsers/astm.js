/**
 * Basic ASTM Parser with E1381 framing and checksum validation.
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
    if (!frame) return;

    // Check for ASTM E1381 framing: contains <STX> (\x02)
    const stxIndex = frame.indexOf('\x02');
    let dataToParse = frame;

    if (stxIndex !== -1) {
      // Find end of frame: <ETX> (\x03) or <ETB> (\x17)
      let etxIndex = frame.indexOf('\x03');
      if (etxIndex === -1) {
        etxIndex = frame.indexOf('\x17');
      }

      if (etxIndex !== -1 && etxIndex > stxIndex) {
        // Calculate checksum: sum of ASCII values from stxIndex+1 up to and including etxIndex
        let calculatedSum = 0;
        for (let i = stxIndex + 1; i <= etxIndex; i++) {
          calculatedSum += frame.charCodeAt(i);
        }
        const calculatedHex = (calculatedSum % 256).toString(16).toUpperCase().padStart(2, '0');

        // Extract received checksum (2 characters after ETX/ETB)
        const receivedHex = frame.substring(etxIndex + 1, etxIndex + 3).toUpperCase();

        if (calculatedHex !== receivedHex) {
          console.warn(`[ASTM Parser] Warning: Checksum mismatch for frame. Calculated: ${calculatedHex}, Received: ${receivedHex}`);
        } else {
          console.log(`[ASTM Parser] Checksum OK (${calculatedHex})`);
        }

        // Clean the frame for field parsing (everything between STX and ETX/ETB)
        dataToParse = frame.substring(stxIndex + 1, etxIndex);
      } else {
        /* eslint-disable-next-line no-control-regex */
        dataToParse = frame.replace(/[\x02\x03\x17]/g, '');
      }
    } else {
      /* eslint-disable-next-line no-control-regex */
      dataToParse = frame.replace(/[\x02\x03\x17]/g, '');
    }

    dataToParse = dataToParse.trim();
    if (!dataToParse) return;

    // The first character of the data frame determines the record type
    // e.g. "1H..." -> H is the type. (Sometimes there is a sequence number before it)
    const match = dataToParse.match(/^\d?([H|P|O|R|C|Q|L])/);
    if (!match) return;

    const recordType = match[1];
    const fields = dataToParse.split('|');

    switch (recordType) {
      case 'H': // Header
        break;
      case 'P': // Patient
        parsedData.patient = {
          patientId: fields[3],
          name: fields[5] ? fields[5].replace(/\^/g, ' ') : 'Unknown'
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
