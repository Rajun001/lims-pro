import prisma from '../config/db.js';

export const handleQbwcSoap = async (req, res) => {
  const xml = req.body;
  if (!xml) {
    return res.status(400).send('No XML body received');
  }

  let responseXml = '';
  
  const decodeXmlEntities = (str) => {
    if (!str) return '';
    return str
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, '&');
  };

  const getTagValue = (str, tag) => {
    const match = str.match(new RegExp(`<([a-zA-Z0-9_]+:)?${tag}[^>]*>([\\s\\S]*?)</\\1?${tag}>`, 'i'));
    return match ? match[2].trim() : '';
  };

  // Helper to log sync operations
  const logSync = async (status, details) => {
    const logVal = JSON.stringify({ time: new Date().toISOString(), status, details });
    await prisma.qbSettings.upsert({
      where: { key: 'last_sync_log' },
      update: { value: logVal },
      create: { key: 'last_sync_log', value: logVal }
    });
  };

  try {
    if (xml.includes('<authenticate xmlns') || xml.includes('<authenticate>')) {
      const username = getTagValue(xml, 'strUserName');
      const password = getTagValue(xml, 'strPassword');
      
      const savedPassDoc = await prisma.qbSettings.findUnique({ where: { key: 'sync_password' } });
      const savedPass = savedPassDoc ? savedPassDoc.value : 'microlabs123'; // Default password
      
      if (username === 'microlabs_sync' && password === savedPass) {
        const sessionToken = 'session_' + Math.random().toString(36).substring(2) + Date.now();
        await prisma.qbSettings.upsert({
          where: { key: 'current_session_token' },
          update: { value: sessionToken },
          create: { key: 'current_session_token', value: sessionToken }
        });
        
        // Return session token and empty company file (uses currently active one)
        responseXml = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <authenticateResponse xmlns="http://developer.intuit.com/">
      <authenticateResult>
        <string>${sessionToken}</string>
        <string></string>
      </authenticateResult>
    </authenticateResponse>
  </soap:Body>
</soap:Envelope>`;
        await logSync('Conectando', 'Autenticación exitosa. Iniciando sesión de sincronización.');
      } else {
        responseXml = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <authenticateResponse xmlns="http://developer.intuit.com/">
      <authenticateResult>
        <string>nomanager</string>
        <string>Credenciales inválidas en LIMS</string>
      </authenticateResult>
    </authenticateResponse>
  </soap:Body>
</soap:Envelope>`;
        await logSync('Error', 'Intento de conexión fallido: Credenciales inválidas del Web Connector.');
      }
    } 
    else if (xml.includes('<sendRequestXML xmlns') || xml.includes('<sendRequestXML>')) {
      const ticket = getTagValue(xml, 'ticket');
      const savedTokenDoc = await prisma.qbSettings.findUnique({ where: { key: 'current_session_token' } });
      
      if (savedTokenDoc && savedTokenDoc.value === ticket) {
        const sentQueryDoc = await prisma.qbSettings.findUnique({ where: { key: 'sent_query_state' } });
        if (sentQueryDoc && sentQueryDoc.value === 'yes') {
          // No more requests to process, close session
          responseXml = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <sendRequestXMLResponse xmlns="http://developer.intuit.com/">
      <sendRequestXMLResult></sendRequestXMLResult>
    </sendRequestXMLResponse>
  </soap:Body>
</soap:Envelope>`;
          await prisma.qbSettings.upsert({ where: { key: 'sent_query_state' }, update: { value: 'no' }, create: { key: 'sent_query_state', value: 'no' } });
        } else {
          // Send request to query customers
          const qbxml = `<?xml version="1.0" encoding="utf-8"?>
<?qbxml version="13.0"?>
<QBXML>
  <QBXMLMsgsRq onError="stopOnError">
    <CustomerQueryRq requestID="1">
      <MaxReturned>2000</MaxReturned>
      <OwnerID>0</OwnerID>
    </CustomerQueryRq>
  </QBXMLMsgsRq>
</QBXML>`;
          
          responseXml = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <sendRequestXMLResponse xmlns="http://developer.intuit.com/">
      <sendRequestXMLResult><![CDATA[${qbxml}]]></sendRequestXMLResult>
    </sendRequestXMLResponse>
  </soap:Body>
</soap:Envelope>`;
          
          await prisma.qbSettings.upsert({
            where: { key: 'sent_query_state' },
            update: { value: 'yes' },
            create: { key: 'sent_query_state', value: 'yes' }
          });
          await logSync('Sincronizando', 'Solicitando lista de clientes a QuickBooks.');
        }
      } else {
        responseXml = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <sendRequestXMLResponse xmlns="http://developer.intuit.com/">
      <sendRequestXMLResult></sendRequestXMLResult>
    </sendRequestXMLResponse>
  </soap:Body>
</soap:Envelope>`;
      }
    }
    else if (xml.includes('<receiveResponseXML xmlns') || xml.includes('<receiveResponseXML>')) {
      const response = getTagValue(xml, 'response');
      
      let count = 0;
      if (response) {
        const decodedResponse = decodeXmlEntities(response);
        const customerBlocks = decodedResponse.split('</CustomerRet>');
        for (const block of customerBlocks) {
          if (!block.includes('<CustomerRet>')) continue;
          const listId = getTagValue(block, 'ListID');
          const name = getTagValue(block, 'Name') || getTagValue(block, 'FullName');
          if (!listId || !name) continue;
          
          const companyName = getTagValue(block, 'CompanyName');
          const phone = getTagValue(block, 'Phone');
          const email = getTagValue(block, 'Email');
          
          const billAddressBlock = getTagValue(block, 'BillAddress');
          let billingAddr = '';
          if (billAddressBlock) {
            const addr1 = getTagValue(billAddressBlock, 'Addr1');
            const addr2 = getTagValue(billAddressBlock, 'Addr2');
            billingAddr = [addr1, addr2].filter(Boolean).join(', ');
          }
          
          // QuickBooks standard fields for account number/tax id
          let document = getTagValue(block, 'AccountNumber') || getTagValue(block, 'TaxRegistrationNumber');
          let documentType = '';
          let activityCode = '';
          
          // Check DataExtRet custom fields
          const dataExtBlocks = block.split('</DataExtRet>');
          for (const ext of dataExtBlocks) {
            if (!ext.includes('<DataExtRet>')) continue;
            const extName = getTagValue(ext, 'DataExtName').toLowerCase();
            const extValue = getTagValue(ext, 'DataExtValue');
            if (extName.includes('cedula') || extName.includes('identificacion') || extName.includes('taxid') || extName.includes('dni')) {
              document = extValue;
            } else if ((extName.includes('tipo') && extName.includes('cedula')) || extName.includes('doctype') || extName.includes('tipoidentificacion')) {
              documentType = extValue;
            } else if (extName.includes('actividad') || extName.includes('activity')) {
              activityCode = extValue;
            }
          }
          
          if (document) {
            const cleanDni = document.replace(/\D/g, '');
            if (!documentType) {
              if (cleanDni.length === 10) {
                documentType = 'Cédula Jurídica';
              } else if (cleanDni.length === 11 || cleanDni.length === 12) {
                documentType = 'DIMEX';
              } else {
                documentType = 'Cédula Física';
              }
            }
          }
          
          await prisma.qbSyncedClient.upsert({
            where: { listId },
            update: { name, companyName, email, phone, document, documentType, activityCode, billingAddr, syncedAt: new Date() },
            create: { listId, name, companyName, email, phone, document, documentType, activityCode, billingAddr }
          });
          count++;
        }
      }
      
      responseXml = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <receiveResponseXMLResponse xmlns="http://developer.intuit.com/">
      <receiveResponseXMLResult>100</receiveResponseXMLResult>
    </receiveResponseXMLResponse>
  </soap:Body>
</soap:Envelope>`;
      
      await logSync('Éxito', `Sincronización finalizada. Se procesaron ${count} clientes/pacientes desde QuickBooks.`);
    }
    else if (xml.includes('<closeConnection xmlns') || xml.includes('<closeConnection>')) {
      responseXml = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <closeConnectionResponse xmlns="http://developer.intuit.com/">
      <closeConnectionResult>OK</closeConnectionResult>
    </closeConnectionResponse>
  </soap:Body>
</soap:Envelope>`;
      // Clean temporary session credentials
      await prisma.qbSettings.deleteMany({
        where: { key: { in: ['current_session_token', 'sent_query_state'] } }
      });
    }
    else if (xml.includes('<connectionError xmlns') || xml.includes('<connectionError>')) {
      const message = getTagValue(xml, 'message') || 'Error desconocido';
      responseXml = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <connectionErrorResponse xmlns="http://developer.intuit.com/">
      <connectionErrorResult>done</connectionErrorResult>
    </connectionErrorResponse>
  </soap:Body>
</soap:Envelope>`;
      await logSync('Error', `Conexión abortada por QuickBooks Web Connector: ${message}`);
    }
    else {
      responseXml = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <getLastErrorResponse xmlns="http://developer.intuit.com/">
      <getLastErrorResult>OK</getLastErrorResult>
    </getLastErrorResponse>
  </soap:Body>
</soap:Envelope>`;
    }
  } catch (err) {
    console.error('[QBWC] SOAP Endpoint error:', err);
    await logSync('Error', `Fallo interno del servidor LIMS al procesar SOAP: ${err.message}`);
    
    responseXml = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <soap:Fault>
      <soap:faultcode>soap:Server</soap:faultcode>
      <soap:faultstring>Internal error: ${err.message}</soap:faultstring>
    </soap:Fault>
  </soap:Body>
</soap:Envelope>`;
  }

  res.setHeader('Content-Type', 'text/xml; charset=utf-8');
  res.send(responseXml);
};

// Dynamic QWC file generation for user download
export const getQwcFile = async (req, res) => {
  const host = req.get('host') || 'localhost:3001';
  const protocol = req.protocol || 'http';
  const qwcContent = `<?xml version="1.0" encoding="utf-8"?>
<QBWCXML>
  <AppName>LIMS Microlabs Sync</AppName>
  <AppID>{85F3AC6D-5B76-4C56-9EC6-D3D6189BF3B9}</AppID>
  <AppURL>${protocol}://${host}/api/qbwc</AppURL>
  <AppDescription>Sincronización automatizada de clientes de QuickBooks Desktop a LIMS Microlabs</AppDescription>
  <AppSupport>${protocol}://${host}/api/health</AppSupport>
  <UserName>microlabs_sync</UserName>
  <OwnerID>{90A7D453-2F42-4D90-BA32-0268B150A654}</OwnerID>
  <FileID>{D787F6F5-6254-4D4F-943E-1234F9010A65}</FileID>
  <QBType>QBFS</QBType>
  <Scheduler>
    <RunEveryNMinutes>60</RunEveryNMinutes>
  </Scheduler>
</QBWCXML>`;

  res.setHeader('Content-Disposition', 'attachment; filename="microlabs_sync.qwc"');
  res.setHeader('Content-Type', 'application/xml');
  res.send(qwcContent);
};

// Sync Settings GET
export const getQbSettings = async (req, res) => {
  try {
    const passwordDoc = await prisma.qbSettings.findUnique({ where: { key: 'sync_password' } });
    const logDoc = await prisma.qbSettings.findUnique({ where: { key: 'last_sync_log' } });
    
    res.json({
      username: 'microlabs_sync',
      hasPassword: !!passwordDoc,
      lastSyncLog: logDoc ? JSON.parse(logDoc.value) : null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Sync Settings POST
export const saveQbSettings = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: 'La contraseña es requerida' });
    }
    
    await prisma.qbSettings.upsert({
      where: { key: 'sync_password' },
      update: { value: password },
      create: { key: 'sync_password', value: password }
    });
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Synced clients GET
export const getQbClients = async (req, res) => {
  try {
    const clients = await prisma.qbSyncedClient.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(clients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Clear synced clients DELETE
export const clearQbClients = async (req, res) => {
  try {
    await prisma.qbSyncedClient.deleteMany({});
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
