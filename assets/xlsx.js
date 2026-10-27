'use strict';
/* 最小的 Excel（.xlsx）写出器：几张表 → Blob。不用第三方库（网站纯静态、不连 CDN）。
   xlsx = zip（这里不压缩，STORE）里放几个 XML；单元格用 inline string，数字照写，第一行加粗并冻结。 */
(() => {
  const enc = new TextEncoder();
  const CRC = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })();
  const crcUpdate = (crc, bytes) => {
    let c = crc ^ 0xffffffff;
    for (let i = 0; i < bytes.length; i++) c = CRC[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const BAD = /[\x00-\x08\x0B\x0C\x0E-\x1F￾￿]/g;
  const xml = (s) => String(s).replace(BAD, '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const colName = (i) => { let s = ''; i++; while (i) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; };
  const sheetName = (s, used) => {
    let n = String(s).replace(/[\[\]:*?/\\]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 31) || 'Sheet';
    let k = 2;
    while (used.has(n.toLowerCase())) n = n.slice(0, 28) + ' ' + k++;
    used.add(n.toLowerCase());
    return n;
  };

  // 一个 zip 条目：内容分成几段（大表一段一段编码，不用拼成一个大字符串）；浏览器支持就压缩（deflate），不支持就原样存
  async function entry(name, parts) {
    let crc = 0, size = 0;
    const bytes = parts.map((p) => (typeof p === 'string' ? enc.encode(p) : p));
    for (const b of bytes) { crc = crcUpdate(crc, b); size += b.length; }
    if (typeof CompressionStream !== 'undefined') {
      const z = new Uint8Array(await new Response(new Blob(bytes).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer());
      return { name: enc.encode(name), bytes: [z], crc, size, csize: z.length, method: 8 };
    }
    return { name: enc.encode(name), bytes, crc, size, csize: size, method: 0 };
  }

  function sheetParts(rows) {
    const parts = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetData>'];
    let buf = '';
    rows.forEach((row, r) => {
      buf += `<row r="${r + 1}">`;
      row.forEach((v, c) => {
        if (v === null || v === undefined || v === '') return;
        const ref = colName(c) + (r + 1);
        if (typeof v === 'number' && Number.isFinite(v)) buf += `<c r="${ref}"><v>${v}</v></c>`;
        else buf += `<c r="${ref}" t="inlineStr"${r === 0 ? ' s="1"' : ''}><is><t xml:space="preserve">${xml(String(v).slice(0, 32767))}</t></is></c>`;
      });
      buf += '</row>';
      if (buf.length > 1 << 20) { parts.push(buf); buf = ''; }
    });
    parts.push(buf + '</sheetData></worksheet>');
    return parts;
  }

  /** sheets: [{name, rows: [[表头…], [值…], …]}] → Promise<Blob>（.xlsx） */
  async function makeXlsx(sheets) {
    const used = new Set();
    const names = sheets.map((s) => sheetName(s.name, used));
    const NS = 'http://schemas.openxmlformats.org';
    const files = await Promise.all([
      entry('[Content_Types].xml', [`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="${NS}/package/2006/content-types">` +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
        '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
        sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('') +
        '</Types>']),
      entry('_rels/.rels', [`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="${NS}/package/2006/relationships">` +
        `<Relationship Id="rId1" Type="${NS}/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`]),
      entry('xl/workbook.xml', [`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<workbook xmlns="${NS}/spreadsheetml/2006/main" xmlns:r="${NS}/officeDocument/2006/relationships"><sheets>` +
        names.map((n, i) => `<sheet name="${xml(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('') + '</sheets></workbook>']),
      entry('xl/_rels/workbook.xml.rels', [`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="${NS}/package/2006/relationships">` +
        names.map((_, i) => `<Relationship Id="rId${i + 1}" Type="${NS}/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('') +
        `<Relationship Id="rId${names.length + 1}" Type="${NS}/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`]),
      entry('xl/styles.xml', [`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<styleSheet xmlns="${NS}/spreadsheetml/2006/main">` +
        '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>' +
        '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>' +
        '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
        '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
        '<cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs>' +
        '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>']),
      ...sheets.map((s, i) => entry(`xl/worksheets/sheet${i + 1}.xml`, sheetParts(s.rows))),
    ]);
    // zip：本地文件头 + 内容 …，中央目录，结尾记录
    const out = [], central = [];
    let offset = 0;
    const u16 = (v) => [v & 0xff, (v >>> 8) & 0xff];
    const u32 = (v) => [v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff];
    for (const f of files) {
      const head = new Uint8Array([...u32(0x04034b50), ...u16(20), ...u16(0x0800), ...u16(f.method), ...u16(0), ...u16(0x21),
        ...u32(f.crc), ...u32(f.csize), ...u32(f.size), ...u16(f.name.length), ...u16(0)]);
      out.push(head, f.name, ...f.bytes);
      central.push(new Uint8Array([...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0x0800), ...u16(f.method), ...u16(0), ...u16(0x21),
        ...u32(f.crc), ...u32(f.csize), ...u32(f.size), ...u16(f.name.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0),
        ...u32(0), ...u32(offset)]), f.name);
      offset += head.length + f.name.length + f.csize;
    }
    const cdSize = central.reduce((a, b) => a + b.length, 0);
    const end = new Uint8Array([...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(files.length), ...u16(files.length),
      ...u32(cdSize), ...u32(offset), ...u16(0)]);
    return new Blob([...out, ...central, end], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  window.PFDXlsx = { makeXlsx };
})();
