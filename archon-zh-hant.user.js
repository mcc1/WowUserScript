// ==UserScript==
// @name         Archon.gg Traditional Chinese
// @namespace    https://www.archon.gg/
// @version      0.11.2
// @description  Translate archon.gg WoW build pages to Traditional Chinese.
// @author       mcc
// @match        https://www.archon.gg/wow/*
// @require      https://raw.githubusercontent.com/mcc1/WowUserScript/master/libs/wowhead-tw-helper.js?v=1.7.5
// @require      https://raw.githubusercontent.com/mcc1/WowUserScript/master/libs/game-names-tw.js?v=2
// @updateURL    https://raw.githubusercontent.com/mcc1/WowUserScript/master/archon-zh-hant.user.js
// @downloadURL  https://raw.githubusercontent.com/mcc1/WowUserScript/master/archon-zh-hant.user.js
// @run-at       document-start
// @grant        none
// @license      MIT
// ==/UserScript==

(function () {
  'use strict';

  // ── 翻譯表 ────────────────────────────────────────────────────────────────

  // 職業／專精／種族／英雄天賦的譯名不手寫，一律取自 libs/game-names-tw.js
  // （暴雪 client DB2 的官方 zhTW）。該檔尚未產生時安全降級為查不到。
  function gameNames() {
    return typeof window !== 'undefined' ? window.WowGameNamesTw : null;
  }

  function lookupGameUnit(value) {
    const table = gameNames();
    if (!table || typeof table.lookupUnit !== 'function' || !value) return null;
    try {
      return table.lookupUnit(value);
    } catch (_) {
      return null;
    }
  }

  /**
   * archon 需要用英文名做前綴比對（把「Frost Mage」拆成專精 + 職業），
   * 因此在啟動時用官方英文名清單組出對照表。這裡沒有任何人工翻譯。
   */
  /**
   * 副本／團本／首領的官方繁中。archon 的「選擇首領」下拉、團隊副本的首領篩選
   * 都需要，但這支腳本原本只查 lookupUnit（種族／職業／專精），從來沒查過這張
   * 表 —— 譯名一直都在產生器的輸出裡，只是沒人去拿。
   */
  function lookupGameName(value) {
    const table = gameNames();
    if (!table || typeof table.lookup !== 'function' || !value) return null;
    try {
      return table.lookup(value);
    } catch (_) {
      return null;
    }
  }

  function buildUnitMap(group) {
    const table = gameNames();
    const list = table && table.UNIT_LISTS ? table.UNIT_LISTS[group] : null;
    const map = {};
    if (!Array.isArray(list)) return map;
    for (const english of list) {
      const tw = lookupGameUnit(english);
      if (tw) map[english] = tw;
    }
    return map;
  }

  const CLASS_TW = buildUnitMap('classes');
  const SPEC_TW = buildUnitMap('specs');

  // 完整比對的 UI 字串
  const EXACT_TW = Object.freeze({
    // 導覽麵包屑
    'Meta Builds': '主流配置',
    'Articles': '文章',
    'Tier Lists': '強度排行',

    // 頁籤
    'Overview': '總覽',
    'Talents': '天賦',
    'Rotation': '迴圈',
    'Gear & Tier Set': '裝備 & 套裝',
    'Enchants & Gems': '附魔 & 寶石',
    'Consumables': '消耗品',
    'Trinkets': '飾品',

    // 內容類型
    'Mythic+': '傳奇鑰石',
    'Raid': '團隊副本',

    // 篩選標籤
    'Class': '職業',
    'Spec': '專精',
    'Content': '內容',
    'Levels': '等級',
    'Dungeon': '地城',
    'Affixes': '詞綴',
    'All Dungeons': '所有地城',
    'This Week': '本週',
    'Last Week': '上週',

    // 欄位標題
    'Item': '物品',
    'Popularity': '使用率',
    'Max Key': '最高層數',
    'DPS': 'DPS',
    'Added': '新增',
    'Removed': '移除',

    // 區塊標題（不含職業/專精名的部分）
    'Stats': '屬性',
    'Stat Priority': '屬性優先級',
    'Gear Overview': '裝備總覽',
    'View All Gear Options': '查看所有裝備選項',
    'View Alternative Builds': '查看其他配置',
    'Weapons & Trinkets': '武器 & 飾品',
    'Weapons': '武器',
    'Best in Slot data provided by': '最佳裝備資料來源：',

    // 天賦相關
    'Talent': '天賦',
    'Class Talents': '職業天賦',
    'Hero Talents': '英雄天賦',
    'Spec Talents': '專精天賦',
    'Hero Tree': '英雄天賦',
    'Spec & Hero Popularity': '專精 & 英雄使用率',
    'Keystone Level': '鑰石等級',
    'Top Log': '頂尖記錄',
    'Open Report': '開啟報告',
    'Currently Selected': '目前選擇',
    'Recommended Class Tree': '推薦職業天賦',
    'Recommended': '推薦',
    'Alternative Talents': '替代天賦',
    'Alternative Class Talents Trees': '替代職業天賦',
    'Alternative Class Tree': '替代職業天賦',
    'Show Alternative Class Trees': '顯示替代職業天賦',
    'Show Full Tree': '顯示完整天賦',
    'Talents Heatmap': '天賦熱點圖',
    'Alternative Builds': '其他配置',
    'Alternative Build': '其他配置',
    'Top 100': '前 100 名',
    'None': '無',
    'Alternative Class Talents': '替代職業天賦',
    'Export': '匯出',
    'Edit': '編輯',
    'Copy': '複製',

    // 天賦 tooltip 固定欄位
    'Passive': '被動',
    'Active': '主動',
    'Choice Node': '選擇節點',

    // 屬性名稱
    'Intellect': '智力',
    'Strength': '力量',
    'Agility': '敏捷',
    'Stamina': '耐力',
    'Crit': '致命',
    'Haste': '加速',
    'Mastery': '精通',
    'Versatility': '臨機',
    'Vers': '臨機',

    // 附魔／寶石頁
    // Omnium Folio 在頁面上只是區塊錨點 <a href="#omnium-folio">，沒有 Wowhead
    // 連結可推 ID。譯名取自暴雪 zh-TW 官網新聞（news.blizzard.com/zh-tw），
    // 是官方用語，不是社群翻譯。裡面的符文本身是普通 spell，有 ID，走 Wowhead。
    'Omnium Folio': '萬象儀對開本',
    'Enchants': '附魔',
    'Gems': '寶石',
    'Gem': '寶石',
    'Epic Gems': '史詩寶石',
    'Epic Gem': '史詩寶石',
    'Enchants by Slot': '各部位附魔',
    'Enchant Tables': '附魔表',
    'Most Popular': '最熱門',

    // 裝備部位（暴雪官方欄位名）
    'Head': '頭部',
    'Legs': '腿部',
    'Shoulders': '肩部',
    'Feet': '腳部',
    'Chest': '胸部',
    'Rings': '手指',
    'Main-Hand': '主手',

    // 消耗品頁。Flask 的官方分類是「合劑」（Wowhead item=191359 歸在該分類下）
    'Consumables by Type': '各類消耗品',
    'Consumable Tables': '消耗品表',
    'Flask': '合劑',
    'Health Potion': '治療藥水',
    'Combat Potion': '戰鬥藥水',
    'Food Buff': '食物增益',
    'Weapon Buff': '武器增益',

    // 團隊副本篩選。Mythic 難度是「傳奇」，見 AGENTS.md 用語規則
    'Select Encounter': '選擇首領',
    'Difficulty': '難度',
    'Mythic': '傳奇',
    'Boss': '首領',
    'All Bosses': '所有首領',
    'Show DPS & HPS': '顯示 DPS & HPS',

    // 其他 UI
    'Last updated': '最後更新',
    'Total Parses': '解析總數',
    'Show More': '顯示更多',
    'Show Less': '顯示更少',
    'Jump to': '跳至',
    'Download App': '下載應用程式',
    'Sign In': '登入',
    'BiS': '最佳裝備',
    'Remove Descriptive Text': '移除說明文字',
    'Advanced Settings': '進階設定',

    // 排行／強度排行頁
    // Role：暴雪官方職業頁只列出坦克／治療者／傷害三個值，沒有給這三者一個
    // 上位詞。「職務」取自遊戲內團隊搜尋器，屬非官方查證。不用「角色」——
    // WoW 的角色一律指 character（見 bloodmallet 的 Character profile 角色配置）。
    'Role': '職務',
    'Specialization': '專精',
    'M+ Score': '傳奇鑰石分數',
    'Parses': '解析',
    'Score': '分數',
    'Tier': '階級',
    'Disclaimers & FAQ': '免責聲明 & 常見問題',
    "What's this?": '這是什麼？',
    'Open Menu': '開啟選單',
    'Close Ad': '關閉廣告',

    // 遊戲版本選單
    'WoW - Midnight': 'WoW - 至暗之夜',
    'WoW - MoP': 'WoW - 潘達利亞之霧',
    'WoW - SoD': 'WoW - 發現賽季',
    'WoW - Fresh': 'WoW - 全新伺服器',
  });

  // 動態標題後綴：「{Spec} {Class} {後綴}」→「{專精} {職業} {中文後綴}」
  const TITLE_SUFFIX_TW = Object.freeze({
    'Stats': '屬性',
    'Stat Priority': '屬性優先級',
    'Talent Tree Build': '天賦配置',
    'Recommended Talent Tree Build': '推薦天賦配置',
    'Gear Overview': '裝備總覽',
    'Mythic+ Build': '傳奇鑰石配置',
    'Raid Build': '團隊副本配置',
    'Mythic+ Overview': '傳奇鑰石總覽',
    'Raid Overview': '團隊副本總覽',
    'Weapons & Trinkets': '武器 & 飾品',
    'Enchants & Gems': '附魔 & 寶石',
    'Consumables': '消耗品',
    'Tier Set': '套裝',
    'Rotation': '迴圈',
    'Overview': '總覽',
    'Talents': '天賦',
    'Tier List': '強度排行',
    'Talent Tree': '天賦',
    'Talent Build': '天賦配置',
    'Build': '配置',
  });

  const SORTED_SUFFIXES = Object.keys(TITLE_SUFFIX_TW).sort((a, b) => b.length - a.length);

  const SORTED_CLASSES = Object.keys(CLASS_TW).sort((a, b) => b.length - a.length);
  const SORTED_SPECS = Object.keys(SPEC_TW).sort((a, b) => b.length - a.length);

  function translateSpecClassPhrase(text) {
    for (const spec of SORTED_SPECS) {
      if (text.startsWith(spec + ' ')) {
        const afterSpec = text.slice(spec.length + 1);
        for (const cls of SORTED_CLASSES) {
          if (afterSpec === cls) {
            return `${SPEC_TW[spec]} ${CLASS_TW[cls]}`;
          }
        }
      }
    }
    return null;
  }

  const STAT_MAP = Object.freeze({
    'Crit': '致命',
    'Haste': '加速',
    'Mastery': '精通',
    'Versatility': '臨機',
    'Vers': '臨機',
    'Intellect': '智力',
    'Strength': '力量',
    'Agility': '敏捷',
    'Stamina': '耐力',
  });

  function translateStatSlash(text) {
    const parts = text.split(/\s*\/\s*/);
    if (parts.length < 2) return null;
    const translated = parts.map(p => STAT_MAP[p.trim()] || null);
    if (translated.some(t => t === null)) return null;
    return translated.join(' / ');
  }

  // ── 排行頁樣板 ────────────────────────────────────────────────────────────
  // 排行頁標題是樣板組出來的：{職責} {區段} for {鑰石範圍} {內容}。職責 3 種 ×
  // 區段 2 種 × 內容 2 種，而鑰石範圍還隨篩選器變動 —— 把組合寫進 EXACT_TW 會
  // 爆炸，而且使用者一換篩選就失效。跟 translateSpecClassPhrase 同樣走樣式比對。

  const ROLE_TW = Object.freeze({
    'DPS': 'DPS',
    'Tank': '坦克',
    'Healer': '治療者',
  });

  const RANKING_SECTION_TW = Object.freeze({
    'Tier List': '強度排行',
    'Rankings': '排行榜',
  });

  const CONTENT_TW = Object.freeze({
    'Mythic+': '傳奇鑰石',
    'Raid': '團隊副本',
  });

  // 資料片名不另開字典 —— 從既有的遊戲版本選單項目推出來，免得兩處要同步。
  const EXPANSION_PREFIX = 'WoW - ';
  const EXPANSION_TW = Object.freeze(Object.fromEntries(
    Object.entries(EXACT_TW)
      .filter(([en]) => en.startsWith(EXPANSION_PREFIX))
      .map(([en, tw]) => [en.slice(EXPANSION_PREFIX.length), tw.slice(EXPANSION_PREFIX.length)])
  ));

  const TIME_UNIT_TW = Object.freeze({
    second: '秒', minute: '分鐘', hour: '小時',
    day: '天', week: '週', month: '個月', year: '年',
  });

  const KEY_RANGE_RE = /^\+(\d+)\s+to\s+\+(\d+)$/;
  const RELATIVE_TIME_RE = /^(\d+)\s+(second|minute|hour|day|week|month|year)s?\s+ago$/i;
  const RANKING_HEADING_RE = /^(DPS|Tank|Healer)\s+(Tier List|Rankings)\s+for\s+(.+?)\s+(Mythic\+|Raid)$/;
  const PAGE_TITLE_RE = /^(\S+)\s+(DPS|Tank|Healer)\s+(Tier List|Rankings)\s+and\s+(Mythic\+|Raid)\s+(Tier List|Rankings)$/;

  /**
   * 依正體中文排版慣例接字：中西文之間補一個半形空格，中文與中文之間不補。
   * 直接用空格串會得到「傳奇鑰石 坦克 排行榜」這種被切碎的讀感，
   * 直接相接又會得到「DPS排行榜」這種黏住的西文。
   */
  function joinTw(...parts) {
    return parts.filter(Boolean).reduce((acc, part) => {
      if (!acc) return part;
      const needsSpace = /[A-Za-z0-9+]$/.test(acc) || /^[A-Za-z0-9+]/.test(part);
      return acc + (needsSpace ? ' ' : '') + part;
    }, '');
  }

  /** 「+7 to +19」→「+7 到 +19」 */
  function translateKeyRange(text) {
    const match = text.match(KEY_RANGE_RE);
    return match ? `+${match[1]} 到 +${match[2]}` : null;
  }

  /** 「1 day ago」→「1 天前」 */
  function translateRelativeTime(text) {
    const match = text.match(RELATIVE_TIME_RE);
    if (!match) return null;
    const unit = TIME_UNIT_TW[match[2].toLowerCase()];
    return unit ? `${match[1]} ${unit}前` : null;
  }

  /** 「DPS Tier List for +7 to +19 Mythic+」→「+7 到 +19 傳奇鑰石 DPS 強度排行」 */
  function translateRankingHeading(text) {
    const match = text.match(RANKING_HEADING_RE);
    if (!match) return null;
    const range = translateKeyRange(match[3]) || match[3];
    return joinTw(range, CONTENT_TW[match[4]], ROLE_TW[match[1]], RANKING_SECTION_TW[match[2]]);
  }

  /** 「Midnight DPS Rankings and Mythic+ Tier List」→「至暗之夜 DPS 排行榜與傳奇鑰石強度排行」 */
  function translatePageTitle(text) {
    const match = text.match(PAGE_TITLE_RE);
    if (!match) return null;
    const expansion = EXPANSION_TW[match[1]];
    if (!expansion) return null;
    return joinTw(expansion, ROLE_TW[match[2]], RANKING_SECTION_TW[match[3]])
      + '與' + joinTw(CONTENT_TW[match[4]], RANKING_SECTION_TW[match[5]]);
  }

  const NUMBERED_RE = /^(.+?)\s+#(\d+)$/;
  const CONTENT_PHRASE_RE = /^(Mythic\+|Raid)\s+(.+)$/;
  const PARSES_RE = /^([\d.,]+[kKmM]?)\s+parses$/;
  const ROW_RE = /^Row\s+(\d+)$/;

  /**
   * 「Mythic+ Talent Tree」→「傳奇鑰石天賦」。
   * 標題被職業／專精 span 切開後會留下這種「內容 + 區段」的殘片。
   */
  function translateContentPhrase(text) {
    const match = text.match(CONTENT_PHRASE_RE);
    if (!match) return null;
    const tail = TITLE_SUFFIX_TW[match[2]] || EXACT_TW[match[2]];
    return tail ? CONTENT_TW[match[1]] + tail : null;
  }

  /** 「Alternative Class Tree #1」→「替代職業天賦 #1」 */
  function translateNumbered(text) {
    const match = text.match(NUMBERED_RE);
    if (!match) return null;
    const base = EXACT_TW[match[1]] || TITLE_SUFFIX_TW[match[1]];
    return base ? `${base} #${match[2]}` : null;
  }

  /** 「Row 1」→「第 1 列」 */
  function translateRowLabel(text) {
    const match = text.match(ROW_RE);
    return match ? `第 ${match[1]} 列` : null;
  }

  /** 「138.5k parses」→「138.5k 筆解析」 */
  function translateParseCount(text) {
    const match = text.match(PARSES_RE);
    return match ? `${match[1]} 筆解析` : null;
  }

  function translateString(text) {
    if (!text) return null;
    const trimmed = text.trim();
    if (!trimmed) return null;

    if (EXACT_TW[trimmed] !== undefined) {
      return text.replace(trimmed, EXACT_TW[trimmed]);
    }
    if (CLASS_TW[trimmed] !== undefined) {
      return text.replace(trimmed, CLASS_TW[trimmed]);
    }
    if (SPEC_TW[trimmed] !== undefined) {
      return text.replace(trimmed, SPEC_TW[trimmed]);
    }

    // 英雄天賦樹、種族等其他遊戲資料
    const unitTw = lookupGameUnit(trimmed);
    if (unitTw) {
      return text.replace(trimmed, unitTw);
    }

    // 副本／團本／首領
    const nameTw = lookupGameName(trimmed);
    if (nameTw) {
      return text.replace(trimmed, nameTw);
    }

    const combinedTw = translateSpecClassPhrase(trimmed);
    if (combinedTw) {
      return text.replace(trimmed, combinedTw);
    }

    const slashTw = translateStatSlash(trimmed);
    if (slashTw) {
      return text.replace(trimmed, slashTw);
    }

    for (const suffix of SORTED_SUFFIXES) {
      if (trimmed.endsWith(' ' + suffix)) {
        const prefix = trimmed.slice(0, trimmed.length - suffix.length - 1);
        const prefixTw = translateSpecClassPhrase(prefix);
        if (prefixTw) {
          return text.replace(trimmed, `${prefixTw} ${TITLE_SUFFIX_TW[suffix]}`);
        }
      }
    }

    // 標題被職業／專精 span 切開了，例如
    //     <h1><span>Arcane Mage</span> Mythic+ Talent Tree</h1>
    //     <h2>Recommended <span>Arcane Mage</span> Talent Tree Build</h2>
    // 上面的 SORTED_SUFFIXES 分支永遠比不到 —— 它拿到的只有殘片。
    // TITLE_SUFFIX_TW 原本只在那條分支裡查得到，這裡讓它也能單獨命中。
    if (TITLE_SUFFIX_TW[trimmed] !== undefined) {
      return text.replace(trimmed, TITLE_SUFFIX_TW[trimmed]);
    }

    const templated = translateRankingHeading(trimmed)
      || translatePageTitle(trimmed)
      || translateContentPhrase(trimmed)
      || translateNumbered(trimmed)
      || translateParseCount(trimmed)
      || translateRowLabel(trimmed)
      || translateKeyRange(trimmed)
      || translateRelativeTime(trimmed);
    if (templated) {
      return text.replace(trimmed, templated);
    }

    return null;
  }

  const SKIP_TAGS = new Set([
    'SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA',
    'CODE', 'PRE', 'SVG', 'INPUT', 'SELECT',
  ]);

  const SKIP_CLASS_KEYWORDS = [
    'item-name', 'ability-name', 'spell-name',
    'wowhead', 'WhTooltip',
  ];

  function shouldSkipElement(el) {
    if (SKIP_TAGS.has(el.tagName)) return true;
    const cls = el.className || '';
    if (typeof cls === 'string' && SKIP_CLASS_KEYWORDS.some(k => cls.includes(k))) return true;
    return false;
  }

  let translatedNodeText = new WeakMap();

  function walkTextNodes(root) {
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          let el = parent;
          while (el && el !== root) {
            if (shouldSkipElement(el)) return NodeFilter.FILTER_REJECT;
            el = el.parentElement;
          }
          return NodeFilter.FILTER_ACCEPT;
        },
      }
    );

    const updates = [];
    let node;
    while ((node = walker.nextNode())) {
      const orig = node.textContent;
      if (translatedNodeText.get(node) === orig) continue;

      const translated = translateString(orig);
      if (translated !== null && translated !== orig) {
        updates.push({ node, translated });
      } else {
        translatedNodeText.set(node, orig);
      }
    }
    for (const { node, translated } of updates) {
      node.textContent = translated;
      translatedNodeText.set(node, translated);
    }
  }

  // ── 網址驅動的標籤同步 ──────────────────────────────────────────────────
  // 原本是被動的：等 React 把英文寫進 DOM，我們再翻。用篩選列的下拉選單切換職業
  // 時，網址已經換成 /preservation/evoker/，畫面上卻還留著「秘法 法師」——
  // React 沒有重寫那些節點，而且沒有丟任何例外（console 乾淨，快取也每次重建）。
  // 追不到它為什麼不寫，所以改成不依賴它：網址本身就是真相，直接算出來寫進去。
  //
  // 這比繞過一個 bug 重要。被動模式會讓錯誤看起來像對的 —— 使用者看到
  // 「武器 戰士」配著治療者的 HPS 數據，不會發現自己在看錯的東西。
  //
  //   /wow/builds/<專精>/<職業>/<內容>/...
  const BUILD_PATH_RE = /^\/wow\/builds\/([^/]+)\/([^/]+)\//;

  function getUrlSpecAndClass() {
    const match = location.pathname.match(BUILD_PATH_RE);
    if (!match) return null;

    // slug 直接查即可 —— lookupUnit 會正規化掉連字號（demon-hunter → demonhunter）
    const specTw = lookupGameUnit(match[1]);
    const classTw = lookupGameUnit(match[2]);
    return specTw && classTw ? { specTw: specTw, classTw: classTw } : null;
  }

  /** 只改元素內字最多的那個文字節點，避免動到職業圖示之類的子元素 */
  function setLeafText(element, text) {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let best = null;
    let bestLength = -1;
    let node;

    while ((node = walker.nextNode())) {
      const length = node.textContent.trim().length;
      if (length > bestLength) { best = node; bestLength = length; }
    }

    if (best) {
      if (best.textContent.trim() !== text) best.textContent = text;
    } else if (element.textContent.trim() !== text) {
      element.textContent = text;
    }
  }

  // 篩選列的標籤可能還是英文，也可能已經被我們翻過了，兩種都要認得
  const FILTER_LABEL_KIND = Object.freeze({
    'Class': 'class', '職業': 'class',
    'Spec': 'spec', '專精': 'spec',
  });

  function syncFilterLabelsFromUrl() {
    const parts = getUrlSpecAndClass();
    if (!parts) return;

    for (const select of document.querySelectorAll('.menu-select')) {
      const group = select.closest('.vertical-content') || select.parentElement;
      const label = group ? group.querySelector('b') : null;
      if (!label) continue;

      const kind = FILTER_LABEL_KIND[label.textContent.trim()];
      if (!kind) continue;

      const value = select.querySelector('.menu-select__single-value');
      if (value) setLeafText(value, kind === 'class' ? parts.classTw : parts.specTw);
    }
  }

  function syncSpecClassLabelsFromUrl() {
    const parts = getUrlSpecAndClass();
    if (!parts) return;

    const wanted = `${parts.specTw} ${parts.classTw}`;
    for (const el of document.querySelectorAll('span.do-not-change-color-on-hover')) {
      if (el.childElementCount > 0) continue;
      // 選單裡列的是「所有」專精，不是目前這個，不能一起蓋掉
      if (el.closest('[class*="Menu"], [class*="menu-select"], nav')) continue;
      // 選單項目是單一專精名（Frost），沒有空格；標題才是「專精 職業」的組合
      const current = el.textContent.trim();
      if (!current || current.indexOf(' ') === -1) continue;

      if (current !== wanted) el.textContent = wanted;
    }
  }

  function translateBreadcrumbs() {
    const specLabels = document.querySelectorAll('span.do-not-change-color-on-hover');
    for (const el of specLabels) {
      if (el.childElementCount > 0) continue;
      const t = translateString(el.textContent);
      if (t && t !== el.textContent) el.textContent = t;
    }

    const nav = document.querySelector('nav[aria-label="Breadcrumb"]');
    if (nav) {
      walkTextNodes(nav);
    }
  }

  // ── 初始化 WowheadTwHelper ────────────────────────────────────────────────
  const helper = new window.WowheadTwHelper({
    enableRenameLinks: true,
    enableSafeLinkify: false,
    // 探針式改名先只在 archon 開。raidbots 是最大宗使用者，等這裡驗過再說。
    enableIconLinkRename: true,
    // archon 在 hover 時會把麵包屑整組換回英文，同步處理才不會閃
    syncSmallMutations: true,
    onScan: (root) => {
      walkTextNodes(root);
      translateBreadcrumbs();
      // 一定要排在翻譯之後 —— 網址算出來的值優先於 DOM 上讀到的
      syncFilterLabelsFromUrl();
      syncSpecClassLabelsFromUrl();
    },
    onUrlChange: () => {
      translatedNodeText = new WeakMap();
      if (document.body) {
        helper.runFullPass();
      }
    },
  });

  function startWhenReady() {
    if (!document.body) {
      document.addEventListener('DOMContentLoaded', startWhenReady, { once: true });
      return;
    }

    // 寶石/附魔連結（含圖示）字型縮小，與物品名稱（純文字連結）做視覺區分
    const style = document.createElement('style');
    style.textContent = `
      a[href*="/item"][data-wh-rename-link="true"]:has(img) {
        font-size: 0.8em !important;
      }
    `;
    document.head.appendChild(style);

    helper.start();
  }

  startWhenReady();
})();
