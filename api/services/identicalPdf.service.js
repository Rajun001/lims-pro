import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer-core';
import prisma from '../config/db.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { buildHtml } = require('../../scripts/report_template.cjs');

const edgePaths = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
];

export class IdenticalPdfService {
  static getExecutablePath() {
    return edgePaths.find(p => fs.existsSync(p));
  }

  /**
   * Garantiza que exista el archivo PDF idéntico físico para un informe y retorna la ruta absoluta
   */
  static async ensureIdenticalPdf(report) {
    if (!report) throw new Error('Objeto reporte requerido.');

    // 1. Si ya tiene pdfUrl y existe en disco, retornarlo
    if (report.pdfUrl && fs.existsSync(report.pdfUrl)) {
      return path.resolve(report.pdfUrl);
    }

    const uploadDir = path.resolve('api/uploads/reports');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const targetPdfPath = path.join(uploadDir, `${report.reportNumber}.pdf`);
    if (fs.existsSync(targetPdfPath)) {
      await prisma.report.update({
        where: { id: report.id },
        data: { pdfUrl: targetPdfPath }
      });
      return targetPdfPath;
    }

    const isIndustrial = report.reportType === 'INDUSTRIAL_COA';
    const patient = report.clinicalOrder?.sample?.patient;
    const client = report.industrialSample?.contract?.client;
    const customerName = isIndustrial 
      ? (client?.companyName || 'Cliente Industrial') 
      : (patient ? `${patient.firstName} ${patient.lastName}`.trim() : 'Paciente Clínico');

    const rawDate = report.signedAt || report.createdAt || new Date();
    const txnDate = new Date(rawDate).toISOString().split('T')[0];

    const tests = isIndustrial 
      ? (report.industrialSample?.tests || []) 
      : (report.clinicalOrder?.tests || []);

    const items = [];
    if (isIndustrial) {
      items.push({
        type: 'group_header',
        name: `MICROBIOLOGÍA - ${report.industrialSample?.matrixType || 'ALIMENTOS'}`
      });
      for (const t of tests) {
        items.push({
          type: 'line',
          item: t.parameterName || 'Ensayo Microbiológico',
          desc: t.specificationLimit || 'Conforme a especificación',
          result: t.quantitativeResult !== null && t.quantitativeResult !== undefined 
            ? String(t.quantitativeResult) 
            : (t.qualitativeResult || 'Negativo'),
          unit: t.quantitativeResult !== null ? 'UFC/g' : '',
          method: t.isoStandardRef || 'AOAC / ISO 7218'
        });
      }
    } else {
      items.push({
        type: 'group_header',
        name: 'QUÍMICA CLÍNICA & HEMATOLOGÍA'
      });
      for (const t of tests) {
        items.push({
          type: 'line',
          item: t.testName || t.testCode || 'Ensayo Clínico',
          desc: t.appliedReferenceRange || 'Valores de Referencia Biológica',
          result: t.quantitativeResult !== null && t.quantitativeResult !== undefined 
            ? String(t.quantitativeResult) 
            : (t.calculatedResult !== null && t.calculatedResult !== undefined 
              ? String(t.calculatedResult) 
              : (t.rawResult !== null && t.rawResult !== undefined 
                ? String(t.rawResult) 
                : (t.qualitativeResult || 'Normal'))),
          unit: t.unit || '',
          method: t.technicalNotes ? t.technicalNotes.replace(/^Metodolog[ií]a:\s*/i, '').trim() : 'Método Normalizado'
        });
      }
    }

    const templateData = {
      refNumber: report.reportNumber,
      customerName,
      txnDate,
      headerCustom: {
        'Toma de Muestra': txnDate,
        'CEDULA': isIndustrial ? (client?.taxId || '') : (patient?.uniqueId || ''),
        'FN': patient?.dob ? new Date(patient.dob).toLocaleDateString('es-CR') : '',
        'Telefono': patient?.phone || client?.phone || '',
        'Medico': report.clinicalOrder?.physicianName || 'Dr. Roldan Ajún Chaverri'
      },
      items
    };

    const html = await buildHtml(templateData);
    const executablePath = this.getExecutablePath();
    if (!executablePath) {
      throw new Error('No se encontró ejecutable de navegador para compilación de PDF.');
    }

    const browser = await puppeteer.launch({
      executablePath,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'domcontentloaded' });
      await page.pdf({
        path: targetPdfPath,
        format: 'Letter',
        printBackground: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 }
      });
    } finally {
      await browser.close();
    }

    await prisma.report.update({
      where: { id: report.id },
      data: { pdfUrl: targetPdfPath }
    });

    return targetPdfPath;
  }
}
