const fs = require('fs');

const logoBase64 = fs.readFileSync('c:/lims-microlabs/scripts/report_assets/img_0_1200x553.png').toString('base64');
const bgBase64 = fs.readFileSync('c:/lims-microlabs/scripts/report_assets/img_11_612x792.png').toString('base64');
const footerBase64 = fs.readFileSync('c:/lims-microlabs/scripts/report_assets/footer_food_official.png').toString('base64');

async function buildFoodHtml(report) {
    const customerName = report.customerName || '';
    const responsible = report.responsible || report.contactName || '';
    const sampledBy = report.sampledBy || 'MICROLABS';
    const refNumber = report.refNumber || '';
    const receptionDate = report.receptionDate || '';
    const mountingDate = report.mountingDate || '';
    const reportDate = report.reportDate || report.txnDate || '';

    // Render table rows
    let rowsHtml = '';

    // Each sample matrix category
    for (const cat of (report.categories || [])) {
        rowsHtml += `
            <tr class="category-header-row">
                <td colspan="5" class="category-header-title">${cat.name}</td>
            </tr>
        `;

        for (const sample of (cat.samples || [])) {
            const numTests = (sample.tests || []).length;
            sample.tests.forEach((test, idx) => {
                const isAlt = idx % 2 === 1;
                const altClass = isAlt ? 'alt-row' : '';
                
                rowsHtml += `
                    <tr class="data-row ${altClass}">
                        ${idx === 0 ? `<td rowspan="${numTests}" class="sample-name-cell">${sample.name}</td>` : ''}
                        <td class="param-cell">${test.parameter}</td>
                        <td class="result-cell">${test.result || ''}</td>
                        <td class="unit-cell">${test.unit || ''}</td>
                        <td class="other-cell">${test.method || ''}</td>
                    </tr>
                `;
            });

            // Spacer row between samples
            rowsHtml += `<tr class="sample-spacer-row"><td colspan="5" style="height: 4px; background: transparent;"></td></tr>`;
        }
    }

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
                height: 11in;
                page-break-after: always;
                page-break-inside: avoid;
                padding: 0.3in 0.42in 0.15in 0.42in;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                position: relative;
                background-image: url('data:image/png;base64,${bgBase64}');
                background-size: 8.5in 11in;
                background-repeat: no-repeat;
            }
            .content-area {
                flex: 1;
            }
            .top-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 6px;
            }
            .header-left {
                width: 58%;
            }
            .logo {
                width: 175px;
                height: auto;
                margin-bottom: 8px;
            }
            .company-info {
                font-size: 11px;
                line-height: 1.35;
            }
            .company-row {
                display: flex;
                margin-bottom: 2px;
            }
            .comp-label {
                width: 140px;
                font-size: 11px;
                color: #000000;
            }
            .comp-value {
                flex: 1;
                font-size: 11.5px;
                font-weight: bold;
                color: #000000;
            }
            .header-right {
                width: 38%;
                font-size: 11px;
                line-height: 1.35;
                padding-top: 15px;
            }
            .right-row {
                display: flex;
                justify-content: flex-end;
                margin-bottom: 2px;
            }
            .right-label {
                width: 140px;
                text-align: right;
                padding-right: 12px;
                color: #000000;
            }
            .right-value {
                width: 85px;
                color: #000000;
            }
            .report-code-title {
                color: #000000;
                font-size: 13px;
            }
            .report-code-val {
                color: #E65100;
                font-weight: bold;
                font-size: 19px;
                line-height: 1;
            }
            .title-bar {
                background: linear-gradient(90deg, #5B9BD5 0%, #6EA6E4 100%);
                color: #000000;
                text-align: center;
                font-size: 13px;
                font-weight: bold;
                letter-spacing: 0.8px;
                padding: 3px 0;
                margin-top: 4px;
                margin-bottom: 4px;
                border: 1px solid #4B8AC5;
            }
            .results-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 9px;
            }
            .table-header th {
                background-color: #5B9BD5;
                color: #000000;
                text-align: left;
                padding: 3.5px 6px;
                font-size: 9.5px;
                font-weight: bold;
                border: 1px solid #4A89C4;
            }
            .th-sample { width: 30%; }
            .th-param { width: 34%; }
            .th-result { width: 14%; }
            .th-unit { width: 10%; }
            .th-other { width: 12%; }

            .category-header-row td {
                background-color: transparent;
                color: #000000;
                font-weight: bold;
                font-size: 9.5px;
                padding: 5px 4px 2px 4px;
                text-transform: uppercase;
            }
            .data-row td {
                padding: 1.5px 6px;
                font-size: 8.5px;
                vertical-align: middle;
            }
            .alt-row td {
                background-color: #EBEBEB;
            }
            .sample-name-cell {
                background-color: #FFFFFF !important;
                vertical-align: top;
                font-weight: normal;
                font-size: 8.5px;
                padding-top: 2px;
                padding-right: 8px;
                line-height: 1.25;
            }
            .param-cell {
                color: #000000;
            }
            .result-cell {
                color: #000000;
                font-weight: normal;
            }
            .unit-cell {
                color: #000000;
            }
            .other-cell {
                color: #8B3A2B;
                font-size: 8px;
                white-space: nowrap;
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
        </style>
    </head>
    <body>
        <div class="page-container">
            <div class="content-area">
                <div class="top-header">
                    <div class="header-left">
                        <img class="logo" src="data:image/png;base64,${logoBase64}" />
                        <div class="company-info">
                            <div class="company-row">
                                <span class="comp-label">Empresa solicitante:</span>
                                <span class="comp-value">${customerName}</span>
                            </div>
                            <div class="company-row">
                                <span class="comp-label">Responsable:</span>
                                <span class="comp-value" style="font-weight: normal;">${responsible}</span>
                            </div>
                            <div class="company-row">
                                <span class="comp-label">Muestreado por:</span>
                                <span class="comp-value" style="font-weight: normal;">${sampledBy}</span>
                            </div>
                        </div>
                    </div>
                    <div class="header-right">
                        <div class="right-row" style="margin-bottom: 6px; align-items: baseline;">
                            <span class="right-label report-code-title">Código de reporte:</span>
                            <span class="right-value report-code-val">${refNumber}</span>
                        </div>
                        <div class="right-row">
                            <span class="right-label">Fecha de recepción:</span>
                            <span class="right-value">${receptionDate}</span>
                        </div>
                        <div class="right-row">
                            <span class="right-label">Fecha de montaje:</span>
                            <span class="right-value">${mountingDate}</span>
                        </div>
                        <div class="right-row">
                            <span class="right-label">Fecha de reporte:</span>
                            <span class="right-value">${reportDate}</span>
                        </div>
                    </div>
                </div>

                <div class="title-bar">REPORTE DE LABORATORIO</div>

                <table class="results-table">
                    <thead>
                        <tr class="table-header">
                            <th class="th-sample">MUESTRA (s)</th>
                            <th class="th-param">ANALISIS-DESCRIPCION</th>
                            <th class="th-result">RESULTADOS</th>
                            <th class="th-unit">UNIDAD</th>
                            <th class="th-other">OTROS</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                </table>
            </div>

            <div class="footer-area">
                <img class="footer-img" src="data:image/png;base64,${footerBase64}" />
            </div>
        </div>
    </body>
    </html>
    `;
}

module.exports = { buildFoodHtml };
