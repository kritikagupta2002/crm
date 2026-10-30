import { codeLabel, fieldsOf, rowsOf } from '../data/fieldFormats';
import { RESULT_ADDRESS, RESULT_MAILS, boxSummary, dispatchNumber } from './dispatch';
import { formatDate } from './date';

/* What the client's DISPATCH FORMAT sheet says, filled from a batch: the lines, the box table and the sample list. */
export function letterOf(record: any) {
  const v = fieldsOf(record);
  const samples = rowsOf(record, 'samples');
  const { rows, total } = boxSummary(samples);
  const elements = [v.ELEMENTS1, v.ELEMENTS2, v.ELEMENTS3, v.ELEMENTS4].filter(Boolean);
  const mails = [v.MAIL1, v.MAIL2, v.MAIL3].filter(Boolean).join(', ') || RESULT_MAILS;
  const top: [string, string][] = [
    ['Lab Details:', v.LAB],
    ['Name of Receiver:', v.LAB_OWNER],
    ['Address:', v.LAB_ADDRESS],
    ['Mobile No/Phone No:', v.LAB_CONTACT],
    ['Mail Id:', v.LAB_MAIL],
    ['Dispatch No:', dispatchNumber(v, record.date)],
    ['Batch Owner Name:', v.BATCH_OWNER],
    ['Owner Address:', v.SENDER_ADDRESS],
    ['Mobile No/Phone No:', v.SENDER_CONTACT],
    ['Mail Id:', v.SENDER_MAIL],
    ['Courier Name:', v.COURIER],
    ['Analysis for:', elements.map((e) => codeLabel('ELEMENT', e)).join('; ')],
  ];
  const bottom: [string, string][] = [
    ['Sample Preparation (Y/N)', v.SAMPLE_PREPARATION],
    ['Pulp Send to Owner (Y/N)', v.PULP_RETURN],
    ['Result in Digital format to:', mails],
    ['Result in Hard Copy and Invoice to:', RESULT_ADDRESS],
  ];
  return { v, samples, boxes: rows, total, top, bottom, date: record.date ? formatDate(record.date) : '' };
}

const esc = (s: any) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* The letter as a printable page (Print / Save as PDF). */
export function letterHtml(record: any) {
  const l = letterOf(record);
  const line = ([label, value]: [string, string]) => `<tr><th>${esc(label)}</th><td colspan="4">${esc(value || '—')}</td></tr>`;
  const box = (r: any) =>
    `<tr class="grid"><td>${esc(r.box)}</td><td>${r['Half Core'] || ''}</td><td>${r['Rock Chip'] || ''}</td><td>${r.Pulp || ''}</td><td>${r.total}</td></tr>`;
  const list = l.samples
    .map(
      (s: any) =>
        `<tr><td>${s.SEQ}</td><td>${esc(s.SAMPLE_NUMBER)}</td><td>${esc(s.FIELD_SAMPLE || '')}</td><td>${esc(s.QC)}</td><td>${esc(s.REFERENCE || '')}</td><td>${esc(s.CLASS)}</td><td>${esc(s.BOX_NO || '')}</td></tr>`,
    )
    .join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    body{font-family:Arial,Helvetica,sans-serif;color:#0f2a3d;margin:28px;font-size:12px}
    h1{font-size:16px;text-align:center;margin:0 0 14px}
    h2{font-size:14px;margin:26px 0 8px}
    table{width:100%;border-collapse:collapse}
    th,td{border:1px solid #9aa7b0;padding:5px 7px;text-align:left;vertical-align:top}
    th{width:32%;background:#f4f7f8;font-weight:700}
    .section th{background:#ddefef}
    .grid td,.gridhead th{text-align:center;width:auto}
    .total td{font-weight:700}
    .sign{display:flex;justify-content:space-between;margin-top:48px;font-weight:700}
    .list th{width:auto}
    .list{page-break-before:always}
  </style></head><body>
  <h1>Sample Dispatch, Preparation &amp; Analysis Format</h1>
  <table>
    <tr><th>Date of Dispatch:</th><td>${esc(l.date || '—')}</td><th>Batch ID:</th><td colspan="2">${esc(l.v.BATCH_ID || '—')}</td></tr>
    ${l.top.map(line).join('')}
    <tr class="section"><th colspan="5">Sample Details:</th></tr>
    <tr class="gridhead"><th>Box No</th><th>Half Core</th><th>Rock Chip</th><th>Pulp</th><th>Total</th></tr>
    ${l.boxes.map(box).join('')}
    <tr class="grid total"><td>Grand Total</td><td>${l.total['Half Core'] || ''}</td><td>${l.total['Rock Chip'] || ''}</td><td>${l.total.Pulp || ''}</td><td>${l.total.total}</td></tr>
    ${l.bottom.map(line).join('')}
  </table>
  <div class="sign"><span>Project Manager</span><span>Geologist</span></div>
  ${
    l.samples.length
      ? `<div class="list"><h2>Sample list · ${esc(record.projectName)}</h2><table><tr><th>#</th><th>Sample number</th><th>Field sample no.</th><th>Sample / QC</th><th>CRM / original</th><th>Class</th><th>Box</th></tr>${list}</table></div>`
      : ''
  }
  </body></html>`;
}
