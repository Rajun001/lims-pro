const fs = require('fs');
const path = require('path');

const xmlPath = 'C:/Users/HP LAB/Desktop/rach/estimaciones_roldan_raw.xml';
const raw = fs.readFileSync(xmlPath, 'utf8');
const pdfDir = 'C:/Users/HP LAB/Desktop/rach';
const pdfs = fs.readdirSync(pdfDir).filter(f => f.endsWith('.pdf')).map(f => f.replace('.pdf', ''));

function decodeXml(s) {
    if (!s) return '';
    return s.replace(/&#(\d+);/g, (m, dec) => String.fromCharCode(dec))
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&apos;/g, "'");
}

const estRegex = /<EstimateRet>([\s\S]*?)<\/EstimateRet>/g;
let m;
const allRecords = [];

while ((m = estRegex.exec(raw)) !== null) {
    const block = m[1];
    const getTag = (tag) => {
        const match = block.match(new RegExp('<' + tag + '>([\\s\\S]*?)<\\/' + tag + '>'));
        return match ? decodeXml(match[1].trim()) : '';
    };

    const ref = getTag('RefNumber');
    const date = getTag('TxnDate');
    const memo = getTag('Memo');
    const custMatch = block.match(/<CustomerRef>[\s\S]*?<FullName>(.*?)<\/FullName>/);
    const customerName = custMatch ? decodeXml(custMatch[1]) : '';
    const tmplMatch = block.match(/<TemplateRef>[\s\S]*?<FullName>(.*?)<\/FullName>/);
    const template = tmplMatch ? decodeXml(tmplMatch[1]) : '';

    // Header Custom Fields (DataExtRet directly under EstimateRet, after all lines)
    const headerCustom = {};
    const afterLines = block.split(/<\/EstimateLineRet>|<\/EstimateLineGroupRet>/).pop();
    const extRegex = /<DataExtRet>([\s\S]*?)<\/DataExtRet>/g;
    let em;
    while ((em = extRegex.exec(afterLines)) !== null) {
        const nameM = em[1].match(/<DataExtName>(.*?)<\/DataExtName>/);
        const valM = em[1].match(/<DataExtValue>(.*?)<\/DataExtValue>/);
        if (nameM && valM) {
            headerCustom[decodeXml(nameM[1])] = decodeXml(valM[1]);
        }
    }

    function parseLine(str) {
        const itemM = str.match(/<ItemRef>[\s\S]*?<FullName>(.*?)<\/FullName>/);
        const descM = str.match(/<Desc>([\s\S]*?)<\/Desc>/);
        const other1M = str.match(/<Other1>(.*?)<\/Other1>/);
        const other2M = str.match(/<Other2>(.*?)<\/Other2>/);
        const rateM = str.match(/<Rate>(.*?)<\/Rate>/);
        const amountM = str.match(/<Amount>(.*?)<\/Amount>/);

        const custom = {};
        const deRegex = /<DataExtRet>([\s\S]*?)<\/DataExtRet>/g;
        let de;
        while ((de = deRegex.exec(str)) !== null) {
            const nm = de[1].match(/<DataExtName>(.*?)<\/DataExtName>/);
            const vm = de[1].match(/<DataExtValue>(.*?)<\/DataExtValue>/);
            if (nm && vm) custom[decodeXml(nm[1])] = decodeXml(vm[1]);
        }

        const resultVal = other1M ? decodeXml(other1M[1]) : (other2M ? decodeXml(other2M[1]) : (custom['Other1'] || custom['Other2'] || custom['RESULTADOS'] || (amountM && amountM[1] !== '0,00' ? decodeXml(amountM[1]) : '')));

        return {
            type: 'line',
            item: itemM ? decodeXml(itemM[1]) : '',
            desc: descM ? decodeXml(descM[1]) : '',
            result: resultVal,
            unit: custom['UNIDAD'] || (rateM && rateM[1] !== '0,00' ? decodeXml(rateM[1]) : ''),
            method: custom['METODO'] || '',
            custom
        };
    }

    const items = [];
    const lineOrGroupRegex = /(<EstimateLineGroupRet>[\s\S]*?<\/EstimateLineGroupRet>|<EstimateLineRet>[\s\S]*?<\/EstimateLineRet>)/g;
    let lg;
    while ((lg = lineOrGroupRegex.exec(block)) !== null) {
        const seg = lg[1];
        if (seg.startsWith('<EstimateLineGroupRet>')) {
            const groupNameM = seg.match(/<ItemGroupRef>[\s\S]*?<FullName>(.*?)<\/FullName>/);
            const groupName = groupNameM ? decodeXml(groupNameM[1]) : '';
            items.push({
                type: 'group_header',
                name: groupName
            });
            const subRegex = /<EstimateLineRet>([\s\S]*?)<\/EstimateLineRet>/g;
            let sub;
            while ((sub = subRegex.exec(seg)) !== null) {
                items.push(parseLine(sub[1]));
            }
        } else {
            items.push(parseLine(seg));
        }
    }

    allRecords.push({
        refNumber: ref,
        txnDate: date,
        memo,
        customerName,
        template,
        headerCustom,
        items,
        alreadyInPdf: pdfs.includes(ref)
    });
}

allRecords.sort((a, b) => a.txnDate.localeCompare(b.txnDate));
const outPath = 'C:/Users/HP LAB/Desktop/rach/estimaciones_completas_roldan.json';
fs.writeFileSync(outPath, JSON.stringify(allRecords, null, 2), 'utf8');

console.log('Procesamiento completado con éxito!');
console.log('Total registros:', allRecords.length);
console.log('Ya en PDF:', allRecords.filter(r => r.alreadyInPdf).length);
console.log('Pendientes:', allRecords.filter(r => !r.alreadyInPdf).length);
