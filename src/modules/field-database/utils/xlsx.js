/*
 * A small .xlsx writer, enough for the field formats: several sheets, a bold header row (optionally
 * under a title row), column widths, a frozen header and dropdowns that point at a CODES sheet.
 * Files are zipped without compression, which every spreadsheet program opens.
 *
 * sheets: [{ name, title?, header: [..], rows: [[..]], widths?: [..], lists?: { [colIndex]: 'CODES!$C$2:$C$57' } }]
 * A cell may be a formula: { f: 'E2/D2%', v: 101.4 }.
 * or, for a sheet laid out as a form (label beside its value):
 *         [{ name, cells: { A3: 'Project:', B3: '...' }, bold?: ['A1'], merges?: ['A1:E1'], widths?: [..], validations?: [{ ref: 'H5', formula: 'Code!$C$2:$C$4' }] }]
 * Either kind may carry charts placed over cells (col and row counted from 0, as Excel's drawings count them):
 *   charts: [{ kind: 'line' | 'scatter', title, from: [col, row], to: [col, row], series: [{ name, cat | x, val | y, line?, markers? }] }]
 */

const enc = new TextEncoder()

const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[i] = c >>> 0
  }
  return t
})()

function crc32(bytes) {
  let c = 0xffffffff
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

// 1 Jan 1980, the earliest date a zip entry can carry (a zero date is not a valid one).
const DOS_DATE = (0 << 9) | (1 << 5) | 1

function zip(files) {
  const chunks = []
  const central = []
  let offset = 0
  files.forEach(({ name, data }) => {
    const nameBytes = enc.encode(name)
    const bytes = typeof data === 'string' ? enc.encode(data) : data
    const crc = crc32(bytes)
    const local = new DataView(new ArrayBuffer(30))
    local.setUint32(0, 0x04034b50, true)
    local.setUint16(4, 20, true)
    local.setUint16(8, 0, true) // stored
    local.setUint16(12, DOS_DATE, true)
    local.setUint32(14, crc, true)
    local.setUint32(18, bytes.length, true)
    local.setUint32(22, bytes.length, true)
    local.setUint16(26, nameBytes.length, true)
    chunks.push(new Uint8Array(local.buffer), nameBytes, bytes)

    const entry = new DataView(new ArrayBuffer(46))
    entry.setUint32(0, 0x02014b50, true)
    entry.setUint16(4, 20, true)
    entry.setUint16(6, 20, true)
    entry.setUint16(14, DOS_DATE, true)
    entry.setUint32(16, crc, true)
    entry.setUint32(20, bytes.length, true)
    entry.setUint32(24, bytes.length, true)
    entry.setUint16(28, nameBytes.length, true)
    entry.setUint32(42, offset, true)
    central.push(new Uint8Array(entry.buffer), nameBytes)
    offset += 30 + nameBytes.length + bytes.length
  })
  const size = central.reduce((t, c) => t + c.length, 0)
  const end = new DataView(new ArrayBuffer(22))
  end.setUint32(0, 0x06054b50, true)
  end.setUint16(8, files.length, true)
  end.setUint16(10, files.length, true)
  end.setUint32(12, size, true)
  end.setUint32(16, offset, true)
  return new Blob([...chunks, ...central, new Uint8Array(end.buffer)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const colName = (i) => {
  let s = ''
  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s
  return s
}

function cell(ref, value, style = 0) {
  const s = style ? ` s="${style}"` : ''
  if (value === '' || value == null) return style ? `<c r="${ref}"${s}/>` : ''
  // A formula, with the value it gives so the sheet reads right before Excel recalculates.
  if (typeof value === 'object' && value.f) return `<c r="${ref}"${s}><f>${esc(value.f)}</f>${Number.isFinite(value.v) ? `<v>${value.v}</v>` : ''}</c>`
  if (typeof value === 'number' && Number.isFinite(value)) return `<c r="${ref}"${s}><v>${value}</v></c>`
  return `<c r="${ref}"${s} t="inlineStr"><is><t xml:space="preserve">${esc(value)}</t></is></c>`
}

/* A sheet laid out cell by cell, as the client's form sheets and letter are. */
function formSheetXml({ cells, bold = [], merges = [], widths = [], validations = [] }) {
  const byRow = new Map()
  Object.entries(cells).forEach(([ref, v]) => {
    const [, col, row] = /^([A-Z]+)(\d+)$/.exec(ref)
    if (!byRow.has(+row)) byRow.set(+row, [])
    byRow.get(+row).push({ ref, col, v })
  })
  const colIndex = (c) => [...c].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0)
  const rowsXml = [...byRow.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([r, cs]) => `<row r="${r}">${cs.sort((a, b) => colIndex(a.col) - colIndex(b.col)).map((c) => cell(c.ref, c.v, bold.includes(c.ref) ? 1 : 0)).join('')}</row>`)
  const cols = widths.map((w, i) => (w ? `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>` : '')).filter(Boolean)
  const dv = validations.map((v) => `<dataValidation type="list" allowBlank="1" showErrorMessage="1" sqref="${v.ref}"><formula1>${esc(v.formula)}</formula1></dataValidation>`)
  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
    (cols.length ? `<cols>${cols.join('')}</cols>` : '') +
    `<sheetData>${rowsXml.join('')}</sheetData>` +
    (merges.length ? `<mergeCells count="${merges.length}">${merges.map((m) => `<mergeCell ref="${m}"/>`).join('')}</mergeCells>` : '') +
    (dv.length ? `<dataValidations count="${dv.length}">${dv.join('')}</dataValidations>` : '') +
    DRAWING +
    '</worksheet>'
  )
}

/* ---------- Charts: a drawing per sheet, a chart part per chart ---------- */

const DRAWING = '<!--drawing-->'
const withDrawing = (xml, sheet) => xml.replace(DRAWING, sheet.charts?.length ? '<drawing r:id="rId1"/>' : '')

const strRef = (tag, f) => (f ? `<c:${tag}><c:strRef><c:f>${esc(f)}</c:f></c:strRef></c:${tag}>` : '')
const numRef = (tag, f) => (f ? `<c:${tag}><c:numRef><c:f>${esc(f)}</c:f></c:numRef></c:${tag}>` : '')

function seriesXml(chart, s, i) {
  const line = s.line === false ? '<c:spPr><a:ln w="19050"><a:noFill/></a:ln></c:spPr>' : ''
  const marker = s.markers === false ? '<c:marker><c:symbol val="none"/></c:marker>' : '<c:marker><c:symbol val="circle"/><c:size val="6"/></c:marker>'
  const head = `<c:idx val="${i}"/><c:order val="${i}"/>${strRef('tx', s.name)}${line}${marker}`
  if (chart.kind === 'scatter') return `<c:ser>${head}${strRef('xVal', s.x)}${numRef('yVal', s.y)}<c:smooth val="0"/></c:ser>`
  return `<c:ser>${head}${strRef('cat', s.cat)}${numRef('val', s.val)}<c:smooth val="0"/></c:ser>`
}

const axis = (tag, id, cross, pos, extra = '') =>
  `<c:${tag}><c:axId val="${id}"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="${pos}"/>${pos === 'l' ? '<c:majorGridlines/>' : ''}` +
  `<c:numFmt formatCode="General" sourceLinked="1"/><c:tickLblPos val="nextTo"/><c:crossAx val="${cross}"/><c:crosses val="autoZero"/>${extra}</c:${tag}>`

function chartXml(chart) {
  const series = chart.series.map((s, i) => seriesXml(chart, s, i)).join('')
  const plot =
    chart.kind === 'scatter'
      ? `<c:scatterChart><c:scatterStyle val="lineMarker"/><c:varyColors val="0"/>${series}<c:axId val="1"/><c:axId val="2"/></c:scatterChart>` +
        axis('valAx', 1, 2, 'b', '<c:crossBetween val="midCat"/>') +
        axis('valAx', 2, 1, 'l', '<c:crossBetween val="midCat"/>')
      : `<c:lineChart><c:grouping val="standard"/><c:varyColors val="0"/>${series}<c:marker val="1"/><c:axId val="1"/><c:axId val="2"/></c:lineChart>` +
        axis('catAx', 1, 2, 'b', '<c:auto val="1"/><c:lblAlgn val="ctr"/><c:lblOffset val="100"/><c:noMultiLvlLbl val="0"/>') +
        axis('valAx', 2, 1, 'l', '<c:crossBetween val="between"/>')
  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
    `<c:chart><c:title><c:tx><c:rich><a:bodyPr/><a:p><a:r><a:t>${esc(chart.title)}</a:t></a:r></a:p></c:rich></c:tx><c:overlay val="0"/></c:title><c:autoTitleDeleted val="0"/>` +
    `<c:plotArea><c:layout/>${plot}</c:plotArea><c:legend><c:legendPos val="b"/><c:overlay val="0"/></c:legend><c:plotVisOnly val="1"/><c:dispBlanksAs val="gap"/></c:chart></c:chartSpace>`
  )
}

function drawingXml(charts) {
  const anchors = charts.map(
    (c, i) =>
      `<xdr:twoCellAnchor><xdr:from><xdr:col>${c.from[0]}</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${c.from[1]}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from>` +
      `<xdr:to><xdr:col>${c.to[0]}</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${c.to[1]}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:to>` +
      `<xdr:graphicFrame macro=""><xdr:nvGraphicFramePr><xdr:cNvPr id="${i + 2}" name="Chart ${i + 1}"/><xdr:cNvGraphicFramePr/></xdr:nvGraphicFramePr>` +
      '<xdr:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/></xdr:xfrm>' +
      `<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart"><c:chart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" r:id="rId${i + 1}"/></a:graphicData></a:graphic></xdr:graphicFrame><xdr:clientData/></xdr:twoCellAnchor>`,
  )
  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
    anchors.join('') +
    '</xdr:wsDr>'
  )
}

const rels = (items) =>
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
  items.map(([id, type, target]) => `<Relationship Id="${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/${type}" Target="${target}"/>`).join('') +
  '</Relationships>'

function sheetXml({ title, header, rows, widths, lists = {} }) {
  const headerRow = title ? 3 : 1
  const out = []
  if (title) out.push(`<row r="1">${cell('B1', title, 2)}</row>`)
  out.push(`<row r="${headerRow}">${header.map((h, i) => cell(`${colName(i)}${headerRow}`, h, 1)).join('')}</row>`)
  rows.forEach((r, ri) => {
    const rn = headerRow + 1 + ri
    out.push(`<row r="${rn}">${r.map((v, i) => cell(`${colName(i)}${rn}`, v)).join('')}</row>`)
  })
  const cols = header.map((h, i) => {
    const w = widths?.[i] ?? Math.min(48, Math.max(10, String(h).length + 3, ...rows.slice(0, 200).map((r) => String(r[i] ?? '').length + 2)))
    return `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`
  })
  // Given widths reach past the headings too (the counts beside the SAMPLE NO list).
  ;(widths ?? []).slice(header.length).forEach((w, k) => w && cols.push(`<col min="${header.length + k + 1}" max="${header.length + k + 1}" width="${w}" customWidth="1"/>`))
  // Columns reading the same list share one dropdown, as in the client's sheets (ROCK_TYPE and SYN_ROCK).
  const byRange = new Map()
  Object.entries(lists).forEach(([i, range]) => byRange.set(range, [...(byRange.get(range) ?? []), `${colName(Number(i))}${headerRow + 1}:${colName(Number(i))}1048576`]))
  const validations = [...byRange].map(
    ([range, areas]) => `<dataValidation type="list" allowBlank="1" showErrorMessage="1" sqref="${areas.join(' ')}"><formula1>${esc(range)}</formula1></dataValidation>`,
  )
  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
    (cols.length ? `<cols>${cols.join('')}</cols>` : '') +
    `<sheetData>${out.join('')}</sheetData>` +
    (title ? `<mergeCells count="1"><mergeCell ref="B1:P2"/></mergeCells>` : '') +
    (validations.length ? `<dataValidations count="${validations.length}">${validations.join('')}</dataValidations>` : '') +
    DRAWING +
    '</worksheet>'
  )
}

const STYLES =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
  '<fonts count="3"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="14"/><name val="Calibri"/></font></fonts>' +
  '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFE699"/><bgColor indexed="64"/></patternFill></fill></fills>' +
  '<borders count="2"><border/><border><left style="thin"/><right style="thin"/><top style="thin"/><bottom style="thin"/></border></borders>' +
  '<cellStyleXfs count="1"><xf/></cellStyleXfs>' +
  '<cellXfs count="3"><xf/><xf fontId="1" fillId="2" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/><xf fontId="2" applyFont="1"/></cellXfs>' +
  '</styleSheet>'

/* Excel allows 31 characters and no []:*?/\ in a sheet name. */
const safeName = (name) => name.replace(/[[\]:*?/\\]/g, ' ').slice(0, 31)

export function workbookBlob(sheets) {
  const names = sheets.map((s) => safeName(s.name))
  // Drawings are numbered over the sheets that have charts, charts over the whole workbook.
  let chartNo = 0
  let drawings = 0
  const drawn = sheets.map((s) => (s.charts?.length ? { no: ++drawings, charts: s.charts.map((c) => ({ ...c, no: ++chartNo })) } : null))
  const chartFiles = drawn.flatMap((d, i) =>
    d
      ? [
          { name: `xl/worksheets/_rels/sheet${i + 1}.xml.rels`, data: rels([['rId1', 'drawing', `../drawings/drawing${d.no}.xml`]]) },
          { name: `xl/drawings/drawing${d.no}.xml`, data: drawingXml(d.charts) },
          { name: `xl/drawings/_rels/drawing${d.no}.xml.rels`, data: rels(d.charts.map((c, k) => [`rId${k + 1}`, 'chart', `../charts/chart${c.no}.xml`])) },
          ...d.charts.map((c) => ({ name: `xl/charts/chart${c.no}.xml`, data: chartXml(c) })),
        ]
      : [],
  )
  const files = [
    {
      name: '[Content_Types].xml',
      data:
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
        '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
        sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('') +
        drawn.filter(Boolean).map((d) => `<Override PartName="/xl/drawings/drawing${d.no}.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>`).join('') +
        drawn.filter(Boolean).flatMap((d) => d.charts).map((c) => `<Override PartName="/xl/charts/chart${c.no}.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/>`).join('') +
        '</Types>',
    },
    {
      name: '_rels/.rels',
      data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    },
    {
      name: 'xl/workbook.xml',
      data:
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' +
        names.map((n, i) => `<sheet name="${esc(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('') +
        '</sheets></workbook>',
    },
    {
      name: 'xl/_rels/workbook.xml.rels',
      data:
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('') +
        `<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
        '</Relationships>',
    },
    { name: 'xl/styles.xml', data: STYLES },
    ...sheets.map((s, i) => ({ name: `xl/worksheets/sheet${i + 1}.xml`, data: withDrawing(s.cells ? formSheetXml(s) : sheetXml(s), s) })),
    ...chartFiles,
  ]
  return zip(files)
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
