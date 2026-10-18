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

// LABELS 表：站台會直接把遊戲字串印在畫面上，但頁面上沒有 ID 可查的那些 ——
// 鑲飾效果名、系統名、屬性名。整張表太大不可能全帶（SpellName 上百萬列），
// 所以這裡「逐列登記」。登記的是哪一列（BaseTag 或 ID），不是譯名：中文照樣
// 從 client 資料取，手上永遠不碰。改版後重跑就會跟著更新。
const LABEL_TABLES = [
  {
    db2: 'GlobalStrings',
    column: 'TagText_lang',
    key: 'BaseTag',
    values: [
      // raidbots Top Gear 的面板標題（Midnight 的符文系統）
      'MIDNIGHT_LANDING_PAGE_TITLE',
      // 附魔／寶石簡碼指的屬性（Avoid2、CritPct2 這種標在圖示下面的字）
      'SPEC_FRAME_PRIMARY_STAT',
      'ITEM_MOD_STRENGTH_SHORT',
      'ITEM_MOD_AGILITY_SHORT',
      'ITEM_MOD_INTELLECT_SHORT',
      'ITEM_MOD_STAMINA_SHORT',
      'ITEM_MOD_CRIT_RATING_SHORT',
      'ITEM_MOD_HASTE_RATING_SHORT',
      'ITEM_MOD_MASTERY_RATING_SHORT',
      'ITEM_MOD_VERSATILITY',
      'ITEM_MOD_CR_AVOIDANCE_SHORT',
      'ITEM_MOD_CR_LIFESTEAL_SHORT',
      'ITEM_MOD_CR_SPEED_SHORT',
    ],
  },
  {
    db2: 'SpellName',
    column: 'Name_lang',
    key: 'ID',
    values: [
      // Midnight 打造裝備的鑲飾效果：raidbots 把效果名直接印在品名下面，
      // 那段文字沒有連結也沒有 ID，只能靠這裡登記。
      '1307906', // Venomcursed Critical Strike
      '1307922', // Venomcursed Mastery
      '1307927', // Venomcursed Haste
      '1317581', // Venomcursed Ascendance
    ],
  },
  {
    db2: 'ItemSet',
    column: 'Name_lang',
    key: 'ID',
    values: [
      // raidbots Top Gear 的「套裝」面板標題是套裝名，旁邊掛著其中一件的圖示。
      // 查不到譯名時探針會把它當成品名，改寫成那件飾品的名字。
      '2070', // Bite of Zul'jan
      // archon「裝備 & 套裝」頁的套裝標題（至暗之夜第 2 季，13 職業）
      '2055', // Baleful Grave-Knight's Crucible
      '2056', // Abyssal Doomhound's Pursuit
      '2057', // Bark of the Enigmatic Dreamwatcher
      '2058', // Echo of Calamity
      '2059', // Skulking Viper's Ambush
      '2060', // Primal Leywarden's Attire
      '2061', // Guile of the Monkey King
      '2062', // Radiance of the Consecrated Flame
      '2063', // Cosmic Penitent's Raiment
      '2064', // Chosen Bloodslayer's Hexweave
      '2065', // Ophidian Oracle's Prophecy
      '2066', // Damned Necrolyte's Shattered Restraints
      '2067', // Jade Warlord's Dominion
    ],
  },
  {
    db2: 'ItemNameDescription',
    column: 'Description_lang',
    key: 'ID',
    values: [
      // 升級軌道名（KeystoneLoot 首頁與 /upgrades 的「Champion 3/6」）。
      // Hero／Myth 沒有單獨成列的字串，見 libs/keystoneloot-tw.js。
      '14528', // Adventurer
      '13284', // Veteran
      '14156', // Champion
    ],
  },
  {
    db2: 'CurrencyTypes',
    column: 'Name_lang',
    key: 'ID',
    values: [
      // 至暗之夜第 2 季的升級紋章（KeystoneLoot /upgrades、/raid 的紋章表與 title）。
      // 3442–3446 是同名的製作用版本，登記一組就夠。
      '3437', // Adventurer Mistcrest
      '3438', // Veteran Mistcrest
      '3439', // Champion Mistcrest
      '3440', // Hero Mistcrest
      '3441', // Myth Mistcrest
    ],
  },
  {
    db2: 'ItemSparse',
    column: 'Display_lang',
    key: 'ID',
    values: [
      // KeystoneLoot 紋章表的來源欄「Trovehunter's Bounty 4–5」
      '252415', // Trovehunter's Bounty
      // raidbots Droptimizer 來源面板直接印出的物品名
      '274374', // Trovehunter's Bounty（另一個版本，同名）
      '285801', // Heroic Soul Fragment
      '285065', // Mythical Soul Fragment
    ],
  },
  {
    db2: 'AreaTable',
    column: 'AreaName_lang',
    key: 'ID',
    values: [
      // KeystoneLoot「紋章降級兌換」那句的地點（至暗之夜版的銀月城）
      '15969', // Silvermoon City
    ],
  },
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

async function fetchCsv(db2, locale, filter) {
  let url = WAGO_CSV + db2 + '/csv?locale=' + locale;
  if (filter) {
    url += '&filter[' + encodeURIComponent(filter.key) + ']=' + encodeURIComponent(filter.value);
  }
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

/**
 * GlobalStrings 的字串常帶格式參數（`Primary Stat: %s` / `主要屬性：%s`），
 * 當標籤用之前先把尾端的參數與標點去掉。
 */
function cleanLabel(value) {
  return String(value || '')
    .replace(/[:：]?\s*%[-\d.]*[a-z]\s*$/i, '')
    .trim();
}

/**
 * 逐列登記的遊戲字串：用 BaseTag／ID 把 enUS 與 zhTW 兩版對起來。
 * 一列一個請求（整張表太大不可能全帶），wago.tools 的 CSV 端點吃 filter。
 * @returns {Promise<Array<{id: string, en: string, tw: string}>>}
 */
async function fetchLabelPairs(spec) {
  const pairs = [];
  for (const value of spec.values) {
    const filter = { key: spec.key, value };
    const [en, tw] = await Promise.all([
      fetchCsv(spec.db2, 'enUS', filter),
      fetchCsv(spec.db2, 'zhTW', filter),
    ]);
    // filter 是模糊比對（ITEM_MOD_VERSATILITY 也會掃到 ITEM_MOD_VERSATILITY_SHORT
    // 這種列），所以要自己挑出完全相等的那一列。
    const enRow = (en || []).find((row) => row[spec.key] === value);
    const twRow = (tw || []).find((row) => row[spec.key] === value);
    if (!enRow || !twRow) {
      console.log('  ' + spec.db2 + ' ' + value + ': not found, skipped');
      continue;
    }

    const english = cleanLabel(enRow[spec.column]);
    const chinese = cleanLabel(twRow[spec.column]);
    // zhTW 未翻譯時 client 會回填英文，那種條目沒有價值。
    if (!english || !chinese || english === chinese) {
      console.log('  ' + spec.db2 + ' ' + value + ': untranslated, skipped');
      continue;
    }
    pairs.push({ id: enRow.ID, en: english, tw: chinese });
  }
  console.log('  ' + spec.db2 + ': ' + pairs.length + ' / ' + spec.values.length + ' labels resolved');
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

  // 「逗號 + 稱號」的短寫法：Sikran, Captain of the Sureki -> Sikran
  const comma = base.indexOf(',');
  if (comma > 0) variants(base.slice(0, comma));

  // 「本名 + the + 稱號」的短寫法：Nek'zali the Soulcoiler -> Nek'zali
  // 刻意收得很緊（本名必須是單一 token、稱號不含 of），否則像
  // 「Trial of the Crusader」會被剝成「Trial」這種會誤傷的別名。
  const epithet = base.match(/^(\S+)\s+the\s+[A-Za-z'\- ]+$/i);
  if (epithet && epithet[1].length >= 4) variants(epithet[1]);

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
function renderModule(nameEntries, unitEntries, labelEntries = []) {
  const table = buildTable(nameEntries);
  const unitTable = buildTable(unitEntries);
  const rows = toRows(table);
  const unitRows = toRows(unitTable);

  // 逐列登記的字串按原樣對照，不推導別名：這些是站台原樣印出來的整串文字。
  const labelTable = new Map();
  for (const entry of labelEntries) {
    const key = String(entry.en).toLowerCase().replace(/[^a-z0-9]+/g, '');
    if (key && !labelTable.has(key)) labelTable.set(key, entry.tw);
  }
  const labelRows = toRows(labelTable);

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
    ' * LABELS：' + labelTable.size + ' 筆逐列登記的字串（鑲飾效果／系統名／屬性名）',
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
      '  // 站台直接印在畫面上的遊戲字串（鑲飾效果／系統名／屬性名）',
      '  const LABELS = Object.freeze({',
      ...labelRows,
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
      '  // 頁面上的寫法可能與官方名有出入，查不到時依序退而求其次。',
      '  // 這是查詢端的正規化，不是另一本字典。',
      '  function variantsOf(englishName) {',
      '    const raw = String(englishName || \'\').trim();',
      '    const out = [raw];',
      '    // 去掉尾端括號補述：Rasha\'nan (The Dawnbreaker) -> Rasha\'nan',
      '    out.push(raw.replace(/\\s*\\([^()]*\\)\\s*$/, \'\'));',
      '    // & 與 and 互換：Vexie & the Geargrinders -> Vexie and the Geargrinders',
      '    out.push(raw.replace(/\\s*&\\s*/g, \' and \'));',
      '    out.push(raw.replace(/\\s+and\\s+/gi, \' & \'));',
      '    return out;',
      '  }',
      '',
      '  function get(table, englishName) {',
      '    for (const variant of variantsOf(englishName)) {',
      '      const key = normalize(variant);',
      '      if (key && Object.prototype.hasOwnProperty.call(table, key)) return table[key];',
      '    }',
      '    return null;',
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
      '  /**',
      '   * 站台直接印出的遊戲字串（鑲飾效果／系統名／屬性名）的官方繁中',
      '   * @param {string} englishName',
      '   * @returns {string|null}',
      '   */',
      '  function lookupLabel(englishName) {',
      '    return get(LABELS, englishName);',
      '  }',
      '',
      '  return {',
      '    NAMES: NAMES,',
      '    UNITS: UNITS,',
      '    LABELS: LABELS,',
      '    UNIT_LISTS: UNIT_LISTS,',
      '    lookup: lookup,',
      '    lookupUnit: lookupUnit,',
      '    lookupLabel: lookupLabel,',
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
    ],
    [
      { id: '1307922', en: 'Venomcursed Mastery', tw: '咒毒精通' },
      { id: '58702', en: 'Omnium Folio', tw: '萬象儀對開本' },
      { id: '24406', en: 'Avoidance', tw: '迴避' },
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
    ['label embellishment', api.lookupLabel('Venomcursed Mastery'), '咒毒精通'],
    ['label stat', api.lookupLabel('Avoidance'), '迴避'],
    ['label miss', api.lookupLabel('Rune of Avoidance'), null],
    ['labels kept out of NAMES', api.lookup('Omnium Folio'), null],
    ['format placeholder stripped', cleanLabel('主要屬性：%s'), '主要屬性'],
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

  const labelEntries = [];
  for (const spec of LABEL_TABLES) {
    labelEntries.push(...(await fetchLabelPairs(spec)));
  }

  if (nameEntries.length === 0) die('no journal names resolved — refusing to write an empty table');
  if (unitEntries.length === 0) die('no race/class/spec names resolved — refusing to write an empty table');
  if (labelEntries.length === 0) die('no registered labels resolved — refusing to write an empty table');

  const body = renderModule(nameEntries, unitEntries, labelEntries);
  await fs.writeFile(OUT_FILE, body, 'utf8');
  console.log('wrote ' + path.relative(ROOT, OUT_FILE) + ' (' + body.length + ' bytes)');
}

if (process.argv.includes('--self-test')) {
  selfTest();
} else {
  main().catch((err) => die(err && err.stack ? err.stack : String(err)));
}
