const hl7 = require('hl7-standard');

/**
 * MLLP wrapper un-wrapper.
 * HL7 messages over TCP are often wrapped in MLLP: <VT> message <FS><CR>
 * <VT> = \x0b, <FS> = \x1c, <CR> = \x0d
 */
function unwrapMLLP(dataBuffer) {
  const str = dataBuffer.toString('utf-8');
  if (str.startsWith('\x0b') && str.endsWith('\x1c\x0d')) {
    return str.slice(1, -2);
  }
  return str;
}

/**
 * Parsers an HL7 message and returns an extracted object
 * @param {Buffer|string} data 
 */
function parseHL7(data) {
  try {
    const rawMessage = Buffer.isBuffer(data) ? unwrapMLLP(data) : data;
    
    // Parse the message
    let message = new hl7(rawMessage);
    message.transform(); // Builds the internal structure

    // Extract basic information
    const patientId = message.getSegment('PID').get('PID.3'); // Example PID
    const orderNumber = message.getSegment('OBR').get('OBR.2'); // Example Order
    
    // Get all OBX segments (results)
    const obxSegments = message.getSegments('OBX');
    const results = obxSegments.map(obx => {
      return {
        testId: obx.get('OBX.3'),
        value: obx.get('OBX.5'),
        unit: obx.get('OBX.6'),
        reference: obx.get('OBX.7'),
        flag: obx.get('OBX.8')
      };
    });

    return {
      type: 'HL7',
      patientId,
      orderNumber,
      results
    };
  } catch (err) {
    console.error('Error parsing HL7:', err.message);
    return null;
  }
}

module.exports = { parseHL7, unwrapMLLP };
