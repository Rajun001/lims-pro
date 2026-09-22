const fs = require('fs');
const qrcode = require('qrcode');

const logoBase64 = fs.readFileSync('c:/lims-microlabs/scripts/report_assets/img_0_1200x553.png').toString('base64');
const bgBase64 = fs.readFileSync('c:/lims-microlabs/scripts/report_assets/img_11_612x792.png').toString('base64');
const footerBase64 = fs.readFileSync('c:/lims-microlabs/scripts/report_assets/footer_official.png').toString('base64');

async function buildHtml(report) {
    const qrData = await qrcode.toDataURL(`https://microlabscr.com/verify?id=${report.refNumber}`, {
        margin: 1,
        width: 120
    });

    const formatDate = (d) => {
        if (!d) return '';
        const p = d.split('-');
        if (p.length === 3) {
            const yr = p[0].substring(2);
            return `${parseInt(p[2], 10)}/${parseInt(p[1], 10)}/${yr}`;
        }
        return d;
    };

    const fechaReporte = formatDate(report.txnDate);
    const tomaMuestra = report.headerCustom['Toma de Muestra'] || fechaReporte;
    const cedula = report.headerCustom['CEDULA'] || '';
    const fn = report.headerCustom['FN'] || '';
    const telefono = report.headerCustom['Telefono'] || '';
    const medico = report.headerCustom['Medico'] || '';

    // Paginate items: calculate height weight
    const pagesItems = [];
    let currentPage = [];
    let currentWeight = 0;
    const MAX_WEIGHT_PAGE = 30; // 28-30 lines per page standard

    for (const item of report.items) {
        let weight = 1;
        if (item.type === 'group_header') {
            weight = 1.6;
        } else {
            const descLines = (item.desc || '').split('\n').length;
            if (descLines > 1) weight += (descLines - 1) * 0.8;
            if (!item.item && !item.desc && !item.result) weight = 0.5;
        }

        if (currentWeight + weight > MAX_WEIGHT_PAGE && currentPage.length > 0) {
            pagesItems.push(currentPage);
            currentPage = [];
            currentWeight = 0;
        }

        currentPage.push(item);
        currentWeight += weight;
    }

    if (currentPage.length > 0 || pagesItems.length === 0) {
        pagesItems.push(currentPage);
    }

    const totalPages = pagesItems.length;

    let pagesHtml = '';
    pagesItems.forEach((pageItems, pageIdx) => {
        const pageNum = pageIdx + 1;
        let rowsHtml = '';

        for (const item of pageItems) {
            if (item.type === 'group_header') {
                rowsHtml += `
                    <tr class="group-row">
                        <td colspan="5" class="group-title">${item.name}</td>
                    </tr>
                `;
            } else {
                const isSubHeader = (!item.desc && !item.result && !item.unit && item.item && !item.method);
                const itemNameClean = (item.item || '').replace(/^[^:]+:/, '');

                if (isSubHeader) {
                    rowsHtml += `
                        <tr class="subgroup-row">
                            <td class="subgroup-title">${itemNameClean}</td>
                            <td></td>
                            <td></td>
                            <td class="method-cell">${item.method || ''}</td>
                            <td></td>
                        </tr>
                    `;
                } else if (!item.item && !item.desc && !item.result) {
                    rowsHtml += `<tr class="spacer-row"><td colspan="5" style="height: 5px;"></td></tr>`;
                } else {
                    const descFormatted = (item.desc || '').replace(/\n/g, '<br>');
                    rowsHtml += `
                        <tr class="item-row">
                            <td class="item-cell">${itemNameClean}</td>
                            <td class="result-cell">${item.result || ''}</td>
                            <td class="unit-cell">${item.unit || ''}</td>
                            <td class="method-cell">${item.method || ''}</td>
                            <td class="ref-cell">${descFormatted}</td>
                        </tr>
                    `;
                }
            }
        }

        const pageIndicatorHtml = totalPages > 1 
            ? `<div class="page-indicator">Page ${pageNum}</div>`
            : '';

        pagesHtml += `
        <div class="page-container">
            <div class="content-area">
                <div class="top-header">
                    <img class="logo" src="data:image/png;base64,${logoBase64}" />
                    <img class="qr-code" src="${qrData}" />
                </div>
                <div class="patient-info-grid">
                    <div class="info-row">
                        <span class="info-label">Fecha de reporte:</span>
                        <span class="info-value">${fechaReporte}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Código Reporte:</span>
                        <span class="info-value report-code-val">${report.refNumber}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Nombre Paciente:</span>
                        <span class="info-value" style="font-weight: bold;">${report.customerName}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Toma de Muestra:</span>
                        <span class="info-value">${tomaMuestra}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">ID:</span>
                        <span class="info-value">${cedula}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Telefono:</span>
                        <span class="info-value">${telefono}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Medico:</span>
                        <span class="info-value">${medico}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">FN:</span>
                        <span class="info-value">${fn}</span>
                    </div>
                </div>

                <table class="results-table">
                    <thead>
                        <tr class="table-header">
                            <th class="th-analysis">ANÁLISIS</th>
                            <th class="th-result">RESULTADOS</th>
                            <th class="th-unit">UNIDAD</th>
                            <th class="th-method">MÉTODO</th>
                            <th class="th-ref">REFERENCIAS</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                </table>
            </div>

            <div class="footer-area">
                <img class="footer-img" src="data:image/png;base64,${footerBase64}" />
                ${pageIndicatorHtml}
            </div>
        </div>
        `;
    });

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            @page {
                size: letter portrait;
                margin: 0;
            }
            * {
                box-sizing: border-box;
                font-family: Arial, Helvetica, sans-serif;
            }
            body {
                margin: 0;
                padding: 0;
                background-color: #ffffff;
                color: #000000;
            }
            .page-container {
                width: 8.5in;
                height: 10.9in;
                page-break-after: always;
                page-break-inside: avoid;
                padding: 0.35in 0.45in 0.15in 0.45in;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                position: relative;
                background-image: url('data:image/png;base64,${bgBase64}');
                background-size: 8.5in 11in;
                background-repeat: no-repeat;
            }
            .page-container:last-child {
                page-break-after: auto;
            }
            .top-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 10px;
            }
            .logo {
                width: 220px;
                height: auto;
            }
            .qr-code {
                width: 75px;
                height: 75px;
            }
            .patient-info-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 2px 24px;
                font-size: 11px;
                line-height: 1.35;
                margin-bottom: 10px;
            }
            .info-row {
                display: flex;
            }
            .info-label {
                width: 120px;
                color: #000000;
                font-weight: normal;
            }
            .info-value {
                flex: 1;
                color: #000000;
            }
            .report-code-val {
                color: #ea580c;
                font-weight: bold;
                font-size: 13px;
            }
            .results-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 9px;
                margin-top: 2px;
            }
            .table-header th {
                background-color: #C6D9F1;
                color: #000000;
                text-align: left;
                padding: 3.5px 6px;
                font-size: 9.5px;
                font-weight: bold;
                letter-spacing: 0.5px;
            }
            .table-header th.th-result { width: 14%; }
            .table-header th.th-unit { width: 12%; }
            .table-header th.th-method { width: 14%; }
            .table-header th.th-ref { width: 28%; }
            .table-header th.th-analysis { width: 32%; }

            .group-row td {
                padding-top: 5px;
                padding-bottom: 2px;
                font-weight: bold;
                font-size: 9.5px;
                color: #000000;
            }
            .subgroup-row td {
                padding-top: 3px;
                padding-bottom: 1px;
                font-weight: bold;
                font-size: 9px;
                color: #222222;
            }
            .item-row td {
                padding: 1.2px 6px;
                vertical-align: top;
            }
            .item-cell {
                color: #000000;
            }
            .result-cell {
                color: #000000;
            }
            .unit-cell {
                color: #000000;
            }
            .method-cell {
                color: #000000;
            }
            .ref-cell {
                color: #000000;
                font-size: 8.5px;
            }
            .content-area {
                flex: 1;
            }
            .footer-area {
                position: relative;
                margin-top: auto;
            }
            .footer-img {
                width: 100%;
                height: auto;
                display: block;
            }
            .page-indicator {
                text-align: center;
                font-size: 10px;
                color: #333333;
                margin-top: 2px;
            }
        </style>
    </head>
    <body>
        ${pagesHtml}
    </body>
    </html>
    `;
}

module.exports = { buildHtml };
