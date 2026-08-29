#!/usr/bin/env node
/**
 * 產生 libs/game-names-tw.js —— 遊戲資料的官方繁中譯名對照表。
 *
 * 這支程式是「不要手寫遊戲資料譯名」這條規則的執行機制：
 *
 *   1. 資料來源是 wago.tools 匯出的 WoW client DB2 表，帶 locale 參數就能取得
 *      enUS 與 zhTW 兩版欄位（`?locale=zhTW`）。不需要任何憑證或 API key。
 *   2. 表內的 ID 就是遊戲本身的 ID：JournalInstance / JournalEncounter 的 ID 與
 *      raidbots instances.json 使用的 Journal ID 完全一致。
 *   3. 依 ID 把 enUS 名稱配上 zhTW 名稱，產出「英文別名 -> 官方繁中」對照表。
 *      全程沒有任何人工翻譯。
 *
 * 用法：
 *   node tools/generate-game-names.mjs              # 產生 libs/game-names-tw.js
 *   node tools/generate-game-names.mjs --self-test  # 不連網，只驗證模板
 *
 * 遊戲改版後重跑即可；新副本／新首領會自動出現，不需要人工登記 ID。
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_FILE = path.join(ROOT, 'libs', 'game-names-tw.js');
const WAGO_CSV = 'https://wago.tools/db2/';
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

// NAMES 表：副本／團本／首領。順序即優先權，同名時先寫入者勝。
const NAME_TABLES = [
  { db2: 'JournalInstance', column: 'Name_lang' },
  { db2: 'JournalEncounter', column: 'Name_lang' },
];

// UNITS 表：種族／職業／專精／英雄天賦樹。與 NAMES 分開，避免首領名與專精名互相覆蓋
// （例如 Sentinel 同時是首領名與英雄天賦名）。
const UNIT_TABLES = [
  { db2: 'ChrRaces', column: 'Name_lang', group: 'races' },
  { db2: 'ChrClasses', column: 'Name_lang', group: 'classes' },
  { db2: 'ChrSpecialization', column: 'Name_lang', group: 'specs' },
  { db2: 'TraitSubTree', column: 'Name_lang', group: 'heroTalents' },
];

// TraitSubTree 混有未上線的測試列，一律略過。
const SKIP_NAME = /\[DNT\]|UI Test/i;

function die(msg) {
  console.error('error: ' + msg);
  process.exit(1);
}

/** 最小 CSV 解析（處理引號、逃逸引號與欄內換行）。 */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];

    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      quoted = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (ch !== '\r') {
      field += ch;
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  if (rows.length === 0) return [];
  const header = rows[0];
  return rows.slice(1).map((cells) => {
    const record = {};
    for (let i = 0; i < header.length; i += 1) record[header[i]] = cells[i];
    return record;
  });
}

async function fetchCsv(db2, locale) {
  const url = WAGO_CSV + db2 + '/csv?locale=' + locale;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'text/csv' } });
      if (res.ok) return parseCsv(await res.text());
      if (res.status === 404) return null;
    } catch (_) {}
    await new Promise((resolve) => setTimeout(resolve, 600 * (attempt + 1)));
  }
  return null;
}

/**
 * 取一張 DB2 表的 enUS / zhTW 兩版，依 ID 配對。
 * @returns {Promise<Array<{id: string, en: string, tw: string}>>}
 */
async function fetchPairs(db2, column) {
  const [en, tw] = await Promise.all([fetchCsv(db2, 'enUS'), fetchCsv(db2, 'zhTW')]);
  if (!en || !tw) {
    console.log('  ' + db2 + ': unavailable, skipped');
    return [];
  }

  const twById = new Map();
  for (const row of tw) twById.set(row.ID, row[column]);

  const pairs = [];
  for (const row of en) {
    const english = row[column];
    const chinese = twById.get(row.ID);
    // zhTW 未翻譯時 client 會回填英文，那種條目沒有價值，直接略過。
    if (english && chinese && chinese !== english && !SKIP_NAME.test(english)) {
      pairs.push({ id: row.ID, en: english, tw: chinese });
    }
  }
  console.log('  ' + db2 + ': ' + pairs.length + ' / ' + en.length + ' rows translated');
  return pairs;
}

/** 由官方英文名推導頁面上可能出現的寫法，避免為了短名再開一條手寫字典。 */
function deriveAliases(englishName) {
  const out = new Set();
  const base = String(englishName || '').trim();
  if (!base) return out;

  const push = (value) => {
    const key = String(value).toLowerCase().replace(/[^a-z0-9]+/g, '');
    if (key) out.add(key);
  };
  const variants = (value) => {
    push(value);
    push(value.replace(/^the\s+/i, ''));
    if (!/^the\s+/i.test(value)) push('the ' + value);
  };

  variants(base);
  const comma = base.indexOf(',');
  if (comma > 0) variants(base.slice(0, comma));
  return out;
}

function buildTable(entries) {
  const table = new Map();
  for (const entry of entries) {
    for (const alias of deriveAliases(entry.en)) {
      if (!table.has(alias)) table.set(alias, entry.tw);
    }
  }
  return table;
}

function toRows(table) {
  return [...table.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .map(([alias, tw]) => '    ' + JSON.stringify(alias) + ': ' + JSON.stringify(tw) + ',');
}

/**
 * 把配對結果組裝成 libs/game-names-tw.js 的內容。
 * 抽成獨立函式，讓 --self-test 能在不連網的情況下驗證模板。
 */
function renderModule(nameEntries, unitEntries) {
  const table = buildTable(nameEntries);
  const unitTable = buildTable(unitEntries);
  const rows = toRows(table);
  const unitRows = toRows(unitTable);

  // 各分類的官方英文名清單。呼叫端需要用英文名做前綴比對或 CSS class 偵測
  // （例如 archon 要把「Frost Mage」拆成專精 + 職業），這是英文資料不是翻譯。
  const groups = {};
  for (const entry of unitEntries) {
    if (!entry.group) continue;
    (groups[entry.group] = groups[entry.group] || new Set()).add(entry.en);
  }
  const listRows = Object.keys(groups)
    .sort()
    .map((name) => {
      const values = [...groups[name]].sort().map((v) => JSON.stringify(v));
      return '    ' + name + ': Object.freeze([' + values.join(', ') + ']),';
    });

  const header = [
    '/**',
    ' * GENERATED FILE — DO NOT EDIT BY HAND.',
    ' *',
    ' * 遊戲資料的官方繁中譯名，取自 wago.tools 匯出的 WoW client DB2 表（locale=zhTW）。',
    ' * 表內 ID 即遊戲本身的 ID；JournalInstance / JournalEncounter 與 raidbots 使用的',
    ' * Journal ID 一致。全程沒有人工翻譯。',
    ' *',
    ' * 改版後請重跑：node tools/generate-game-names.mjs',
    ' *',
    ' * 產生時間：' + new Date().toISOString(),
    ' * NAMES：' + table.size + ' 筆別名（副本／團本／首領，' + nameEntries.length + ' 個實體）',
    ' * UNITS：' + unitTable.size + ' 筆別名（種族／職業／專精，' + unitEntries.length + ' 個實體）',
    ' */',
    '',
  ].join('\n');

  return (
    header +
    [
      '(function (root, factory) {',
      "  if (typeof module === 'object' && module.exports) {",
      '    module.exports = factory();',
      '  } else {',
      '    root.WowGameNamesTw = factory();',
      '  }',
      "})(typeof window !== 'undefined' ? window : this, function () {",
      "  'use strict';",
      '',
      '  // 副本／團本／首領',
      '  const NAMES = Object.freeze({',
      ...rows,
      '  });',
      '',
      '  // 種族／職業／專精／英雄天賦樹',
      '  const UNITS = Object.freeze({',
      ...unitRows,
      '  });',
      '',
      '  // 各分類的官方英文名（供呼叫端做前綴比對／識別用）',
      '  const UNIT_LISTS = Object.freeze({',
      ...listRows,
      '  });',
      '',
      '  function normalize(value) {',
      "    return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '');",
      '  }',
      '',
      '  function get(table, englishName) {',
      '    const key = normalize(englishName);',
      '    return key && Object.prototype.hasOwnProperty.call(table, key) ? table[key] : null;',
      '  }',
      '',
      '  /**',
      '   * 副本／團本／首領的官方繁中名',
      '   * @param {string} englishName',
      '   * @returns {string|null}',
      '   */',
      '  function lookup(englishName) {',
      '    return get(NAMES, englishName);',
      '  }',
      '',
      '  /**',
      '   * 種族／職業／專精的官方繁中名',
      '   * @param {string} englishName',
      '   * @returns {string|null}',
      '   */',
      '  function lookupUnit(englishName) {',
      '    return get(UNITS, englishName);',
      '  }',
      '',
      '  return {',
      '    NAMES: NAMES,',
      '    UNITS: UNITS,',
      '    UNIT_LISTS: UNIT_LISTS,',
      '    lookup: lookup,',
      '    lookupUnit: lookupUnit,',
      '    normalize: normalize,',
      '  };',
      '});',
      '',
    ].join('\n')
  );
}

function selfTest() {
  const body = renderModule(
    [
      { id: '1', en: 'The Necrotic Wake', tw: '死靈戰地' },
      { id: '2', en: 'Queen Ansurek', tw: '安蘇芮克女王' },
      { id: '3', en: 'Ara-Kara, City of Echoes', tw: '『回音之城』厄拉卡拉' },
    ],
    [
      { id: '1', en: 'Dracthyr', tw: '龍希爾' },
      { id: '2', en: 'Beast Mastery', tw: '野獸控制' },
    ]
  );

  const module = { exports: {} };
  new Function('module', 'exports', body)(module, module.exports);
  const api = module.exports;

  const cases = [
    ['lookup the-form', api.lookup('The Necrotic Wake'), '死靈戰地'],
    ['lookup bare-form', api.lookup('Necrotic Wake'), '死靈戰地'],
    ['lookup boss', api.lookup('Queen Ansurek'), '安蘇芮克女王'],
    ['lookup comma short form', api.lookup('Ara-Kara'), '『回音之城』厄拉卡拉'],
    ['lookup miss', api.lookup('Bloodthirsty Greatsword'), null],
    ['unit race', api.lookupUnit('dracthyr'), '龍希爾'],
    ['unit spec snake_case', api.lookupUnit('beast_mastery'), '野獸控制'],
    ['units kept out of NAMES', api.lookup('Dracthyr'), null],
  ];

  let failed = 0;
  for (const [label, actual, expected] of cases) {
    const ok = actual === expected;
    if (!ok) failed += 1;
    console.log(
      (ok ? '  PASS ' : '  FAIL ') +
        label +
        '  got=' +
        JSON.stringify(actual) +
        (ok ? '' : ' want=' + JSON.stringify(expected))
    );
  }
  console.log(failed === 0 ? 'self-test OK' : failed + ' self-test failures');
  process.exit(failed === 0 ? 0 : 1);
}

async function collect(tables) {
  const entries = [];
  for (const spec of tables) {
    const pairs = await fetchPairs(spec.db2, spec.column);
    for (const pair of pairs) entries.push(Object.assign({ group: spec.group || '' }, pair));
  }
  return entries;
}

async function main() {
  console.log('fetching DB2 tables from wago.tools ...');
  const nameEntries = await collect(NAME_TABLES);
  const unitEntries = await collect(UNIT_TABLES);

  if (nameEntries.length === 0) die('no journal names resolved — refusing to write an empty table');
  if (unitEntries.length === 0) die('no race/class/spec names resolved — refusing to write an empty table');

  const body = renderModule(nameEntries, unitEntries);
  await fs.writeFile(OUT_FILE, body, 'utf8');
  console.log('wrote ' + path.relative(ROOT, OUT_FILE) + ' (' + body.length + ' bytes)');
}

if (process.argv.includes('--self-test')) {
  selfTest();
} else {
  main().catch((err) => die(err && err.stack ? err.stack : String(err)));
}
