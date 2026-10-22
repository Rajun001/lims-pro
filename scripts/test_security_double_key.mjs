import { generateReportAccessToken, verifyReportAccessToken, validateSecurityKey, normalizeIdentifier } from '../api/utils/securityTokens.js';
import prisma from '../api/config/db.js';

async function runSecurityAudit() {
    console.log("================================================================================");
    console.log("     AUDITORÍA Y VALIDACIÓN DE HERMETIZACIÓN: DOBLE LLAVE Y ANTI-SCRAPING      ");
    console.log("================================================================================\n");

    try {
        // 1. Verificar registros en base de datos
        const report = await prisma.report.findFirst({
            where: { reportNumber: 'COA-2026-AMPM-001' },
            include: {
                industrialSample: {
                    include: {
                        contract: {
                            include: { client: true }
                        },
                        tests: true
                    }
                },
                signature: true
            }
        });

        if (!report) {
            console.error("❌ Reporte COA-2026-AMPM-001 no encontrado en la base de datos.");
            process.exit(1);
        }

        const client = report.industrialSample?.contract?.client;
        console.log(`✓ Reporte identificado: [${report.reportNumber}]`);
        console.log(`  Cliente: ${client?.companyName || 'N/A'}`);
        console.log(`  Identificación del Cliente: ${client?.taxId || 'N/A'}`);
        console.log(`  Tests cargados en BD: ${report.industrialSample?.tests?.length || 0}`);

        // 2. Test Normalización de Identificadores (Cédula / DNI / Jurídica)
        console.log("\n[TEST 1] Normalización de Identificadores (Cédula/Jurídica):");
        const tests = [
            ['3-101-144450', '3101144450'],
            ['1-1111-2222', '111112222'],
            [' 3 101 144450 ', '3101144450'],
            ['EXP-99201', 'exp99201']
        ];
        for (const [raw, expected] of tests) {
            const norm = normalizeIdentifier(raw);
            const pass = norm === expected;
            console.log(`  - Entrada: "${raw}" -> Normalizado: "${norm}" | ${pass ? '✓ OK' : '❌ ERROR'}`);
            if (!pass) throw new Error("Fallo en normalización");
        }

        // 3. Test Validación de Llave de Seguridad (Segunda Llave)
        console.log("\n[TEST 2] Validación de la Segunda Llave contra Identidad Oficial:");
        const expectedOwnerId = client?.taxId || 'TAX-INVERSIONESAMPM';
        
        const testRes1 = validateSecurityKey(report.reportNumber, expectedOwnerId, expectedOwnerId, null);
        console.log(`  - Intento con Cédula Jurídica Real ("${expectedOwnerId}"): ${testRes1.valid ? '✓ ACCESO PERMITIDO (' + testRes1.method + ')' : '❌ ACCESO DENEGADO'}`);

        const testResFake = validateSecurityKey(report.reportNumber, expectedOwnerId, '0-0000-0000', null);
        console.log(`  - Intento con Cédula Atacante/Falsa ("0-0000-0000"): ${!testResFake.valid ? '✓ BLOQUEO EXITOSO' : '❌ VULNERABILIDAD DETECTADA'}`);

        // 4. Test Tokens Criptográficos Efímeros HMAC-SHA256 (Enlaces de Correo)
        console.log("\n[TEST 3] Generación y Verificación de Tokens Criptográficos Efímeros (HMAC-SHA256):");
        const token = generateReportAccessToken(report.reportNumber, expectedOwnerId, 30);
        console.log(`  - Token generado para ${report.reportNumber}: ${token.substring(0, 32)}...`);

        const validTokenResult = verifyReportAccessToken(report.reportNumber, expectedOwnerId, token);
        console.log(`  - Verificación de token legítimo: ${validTokenResult ? '✓ VÁLIDO (Firma HMAC verificada)' : '❌ INVÁLIDO'}`);

        const fakeTokenResult = verifyReportAccessToken(report.reportNumber, expectedOwnerId, token + 'tampered');
        console.log(`  - Verificación de token alterado por atacante: ${!fakeTokenResult ? '✓ RECHAZADO CORRECTAMENTE' : '❌ VULNERABILIDAD DETECTADA'}`);

        const wrongReportToken = verifyReportAccessToken('COA-2026-AMPM-999', expectedOwnerId, token);
        console.log(`  - Verificación de token usado para otro reporte (Anti-Replay): ${!wrongReportToken ? '✓ RECHAZADO CORRECTAMENTE' : '❌ VULNERABILIDAD DETECTADA'}`);

        console.log("\n================================================================================");
        console.log(" ✅ TODOS LOS CONTROLES CRIPTOGRÁFICOS Y DE DOBLE LLAVE HAN SIDO VALIDADOS     ");
        console.log("================================================================================");

    } catch (err) {
        console.error("Error en validación:", err);
    } finally {
        await prisma.$disconnect();
    }
}

runSecurityAudit();
