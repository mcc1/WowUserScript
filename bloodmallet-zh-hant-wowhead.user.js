// ==UserScript==
// @name         Bloodmallet Traditional Chinese Wowhead
// @namespace    https://bloodmallet.com/
// @version      0.11.0
// @description  Add zh-hant mode, switch item links/names to the zh-hant Wowhead locale, and translate class/spec labels.
// @author       mcc
// @match        https://bloodmallet.com/*
// @match        http://bloodmallet.com/*
// @require      https://raw.githubusercontent.com/mcc1/WowUserScript/master/libs/wowhead-tw-helper.js?v=1.10.3
// @require      https://raw.githubusercontent.com/mcc1/WowUserScript/master/libs/game-names-tw.js?v=5
// @updateURL    https://raw.githubusercontent.com/mcc1/WowUserScript/master/bloodmallet-zh-hant-wowhead.user.js
// @downloadURL  https://raw.githubusercontent.com/mcc1/WowUserScript/master/bloodmallet-zh-hant-wowhead.user.js
// @run-at       document-start
// @grant        none
// @license      MIT
// ==/UserScript==

(function () {
  'use strict';

  const TW_MODE_STORAGE_KEY = 'bm-language-override';
  const TW_MODE_VALUE = 'zh-hant';
  const ZH_HANS_VALUE = 'zh-hans';
  const ZH_HANT_VALUE = 'zh-hant';
  const KEY_PREFIX = 'navbar_';
  const KEY_SUFFIX = '_selector';

  // 職業／專精／種族的譯名不手寫，一律取自 libs/game-names-tw.js
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

  /** bloodmallet 以 snake_case 的職業代號當 CSS class，需要官方英文名清單來比對 */
  function wowClassSlugs() {
    const table = gameNames();
    const list = table && table.UNIT_LISTS ? table.UNIT_LISTS.classes : null;
    if (!Array.isArray(list)) return [];
    return list.map(function (name) {
      return name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    });
  }

  // 戰鬥風格是模擬器概念，不是遊戲實體。Patchwerk 雖然源自 Naxxramas 的首領
  // 「縫補者」，但在模擬器語境下指的是站樁不動的木樁戰，與 raidbots 用語一致。
  const FIGHT_STYLE_TW_MAP = Object.freeze({
    patchwerk: '木樁戰',
    castingpatchwerk: '施法木樁戰',
    castingpatchwerk5: '施法木樁戰 (5目標)',
    castingpatchwerk3: '施法木樁戰 (3目標)',
    hecticaddcleave: '混亂順劈',
    dungeon: '地城',
    dungeonslice: '地城切片',
  });

  // 圖表類型是站台自己的分類標籤，頁面上沒有可用的遊戲 ID，屬於 AGENTS.md 說的
  // 「只有這類才手寫」。譯名仍取暴雪官方 zh-TW，查證記錄：
  //   Phial 藥瓶（item=191359）、Potion 藥水（item=191387）、附魔（spell=7411）
  // 「副屬性分配」與「天賦目標數量縮放」暴雪沒有對應字串 —— 前者用台服社群通行
  // 的說法，後者是 bloodmallet 自創術語。
  const CHART_TYPE_TW_MAP = Object.freeze({
    trinkets: '飾品',
    phials: '藥瓶',
    potions: '藥水',
    races: '種族',
    weapon_enchantments: '武器附魔',
    secondary_distributions: '副屬性分配',
    talent_target_scaling: '天賦目標數量縮放',
  });

  // 站台 UI 控件。Dungeon / Raid 這裡指飾品「來源」，與同名的戰鬥風格語境不同，
  // 所以另開一張表而不是共用 FIGHT_STYLE_TW_MAP。
  // On Use / Passive：官方 tooltip 只寫「使用：」「裝備：」，沒有名詞化的分類詞。
  const UI_TW_MAP = Object.freeze({
    'Advanced Options': '進階選項',
    'Custom fight style': '自訂戰鬥風格',
    'Custom APL': '自訂 APL',
    'Use absolute values': '顯示絕對數值',
    'Raw chart data': '原始圖表資料',
    'Accept GA tracking': '接受 GA 追蹤',
    'Reject GA tracking': '拒絕 GA 追蹤',
    'Dungeon': '地城',
    'Raid': '團隊副本',
    'High PvP': 'PvP 高階',
    'Profession': '專業',
    'On Use': '使用類',
    'Passive': '被動類',
    // 天賦目標數量縮放圖表的篩選
    'Min target count:': '最少目標數：',
    'Max target count:': '最多目標數：',
  });

  // 複合字串沒辦法完全比對，例如手風琴標題是「Character profile (Source:
  // simulationcraft)」。改用子字串置換，長的排前面避免被短的先吃掉。
  const UI_PARTIAL_TW = Object.freeze({
    'SimulationCraft settings': 'SimulationCraft 設定',
    '(Source: simulationcraft)': '（來源：simulationcraft）',
    'Character profile': '角色配置',
  });

  // 導覽列、篩選標籤、圖表說明與頁尾。站方把說明句用 <a>／<code> 切成碎片，
  // 這裡收的是切開後的文字節點原文。圖表說明收了導覽列上的七種圖表類型；
  // power_infusion / windfury_totem / trinket_compare 這三種不在導覽列上，還沒收。
  const PAGE_TW = Object.freeze({
    // spell=10060 的官方譯名；動詞在前，憑印象寫成「能量灌注」是錯的
    'Power Infusion': '注入能量',
    'Trinkets': '飾品',
    'Login': '登入',
    '登录': '登入',
    'Register': '註冊',
    'Settings': '設定',
    'Itemlevels:': '物品等級：',
    'Sources:': '來源：',
    'Show:': '顯示：',
    'SimulationCraft hash:': 'SimulationCraft 版本雜湊：',
    'Chart Explanation': '圖表說明',
    "What's going on here?": '這裡在做什麼？',
    'This chart shows how much power a single trinket adds to a profile.': '這張圖表顯示單一飾品能為配置增加多少強度。',
    'It uses the "tier appropriate"': '它使用「符合當前階段」的',
    'SimulationCraft profile': 'SimulationCraft 配置',
    '. If the fight style is neither': '。如果戰鬥風格既不是',
    'nor': '也不是',
    'a "tier appropriate"': '，就會改用「符合當前階段」的',
    'fallback profile': '後備配置',
    'is used to improve the data quality. In a custom chart if the creator provided a profile, it replaces the formerly mentioned profiles.':
      '以提升資料品質。在自訂圖表中，若建立者提供了配置，則會取代前述的配置。',
    'Both trinkets are removed from the profile. Instead one trinket with the appropriate primary stat and a static Versatility amount is equipped. This profile is the base profile. For each trinket and trinket itemlevel you see above a new profile is created.':
      '配置中的兩個飾品都會被移除，改為裝備一個具備對應主屬性與固定臨機應變數值的飾品。這個配置就是基礎配置。上方每一個飾品與每個物品等級都會各自產生一個新的配置。',
    // 其他圖表類型的說明（H5 標題與段落）。rating 照官方「致命一擊等級」的說法譯成「等級」。
    'Phials': CHART_TYPE_TW_MAP.phials,
    'Potions': CHART_TYPE_TW_MAP.potions,
    'Races': CHART_TYPE_TW_MAP.races,
    'Weapon Enchantments': CHART_TYPE_TW_MAP.weapon_enchantments,
    'Secondary Distributions': CHART_TYPE_TW_MAP.secondary_distributions,
    'Talent Target Scaling': CHART_TYPE_TW_MAP.talent_target_scaling,
    'This chart shows the impact of phials at different ranks.': '這張圖表顯示不同等級藥瓶的影響。',
    'The identified base profile is used. To get the value of phials a simulation without any phials is done and compared to simulations using the different mentioned phials.':
      '使用判定出的基礎配置。為了取得藥瓶的價值，會先模擬一次不使用任何藥瓶的情況，再與使用上述各種藥瓶的模擬結果比較。',
    'This chart shows the impact of potions and different ranks.': '這張圖表顯示藥水及其不同等級的影響。',
    'The identified base profile is used. To get the value of potions a simulation without any potion is done and compared to simulations using the different mentioned potions.':
      '使用判定出的基礎配置。為了取得藥水的價值，會先模擬一次不使用任何藥水的情況，再與使用上述各種藥水的模擬結果比較。',
    'This chart shows the impact of Racial abilities.': '這張圖表顯示種族技能的影響。',
    'The identified base profile is used and its race is replaced by all races available to this spec.':
      '使用判定出的基礎配置，並將其種族依序替換為此專精可選的所有種族。',
    'This chart shows how much power each spec gains from having different SINGLE weapon enchantments applied to their primary weapon.':
      '這張圖表顯示各專精在主要武器上套用「單一」不同武器附魔時，各能獲得多少強度。',
    'This chart shows how much power different distributions of secondary stats provide.': '這張圖表顯示不同的副屬性分配能提供多少強度。',
    "At first the available sum of secondary ratings is extracted from the profile. Then the secondary ratings are redistributed. The lowest portion of secondary ratings per stat are 10%. Because we're dealing with 4 different stats this means the highest concentration on a single stat can be 70% of the sum. The sum and parts of it are always ratings, like the values on the items themselves.":
      '首先從配置中取出副屬性等級的總和，再把這些等級重新分配。每項屬性最少分到 10%，由於共有 4 種屬性，單一屬性最多只能集中到總和的 70%。總和與各部分一律以等級計算，和物品上標示的數值相同。',
    'Example: 2000 secondaries are available. One of the distributions uses 20% of the ratings for crit, 30% for haste, 40% for mastery, and the remaining 10% for versatility. This means 400 crit rating, 600 haste rating, 800 mastery rating, and 200 versatility rating will be set in this profile.':
      '範例：可用的副屬性共 2000。其中一種分配把 20% 分給致命一擊、30% 給加速、40% 給精通，剩下的 10% 給臨機應變。也就是說，這個配置會設定 400 致命一擊等級、600 加速等級、800 精通等級與 200 臨機應變等級。',
    'Setting ratings as described above does not affect stat procs. E.g. trinkets.': '以上述方式設定等級不會影響屬性觸發效果，例如飾品。',
    // 句子被 <a>talent path</a>、<a>these files…</a> 切成三段
    'This chart shows how much power each': '這張圖表顯示每一條',
    'talent path': '天賦路線',
    'gains against different enemy counts.': '在面對不同敵人數量時能獲得多少強度。',
    'Each talent path is simulated against several different enemy counts.': '每一條天賦路線都會針對多種不同的敵人數量進行模擬。',
    'Please submit talent paths to': '請將天賦路線提交到',
    'these files in the bloodytools repository': 'bloodytools 儲存庫中的這些檔案',
    'to enhance this view.': '，以充實這個檢視。',
    // 首頁簡介
    'This site provides an overview about several simulateable aspects for almost all specs in World of Warcraft using':
      '本站以',
    '. These overviews are an entry point.': ' 為魔獸世界幾乎所有專精提供多項可模擬面向的總覽。這些總覽只是入門的起點。',
    // 句尾的 <a>Patreon</a> 是頁尾也在用的連結文字，不能動；把句子收在連結前面
    'You can generate your own charts by becoming a': '你也可以成為贊助者來產生自己的圖表：',
    'For indepth information about your spec use your theorycrafters guides.': '關於你的專精的深入資訊，請參考理論研究者的攻略。',
    'Bugreport': '回報錯誤',
    'Handbook': '手冊',
    'FAQ': '常見問題',
    'About': '關於',
    'Terms and Conditions': '條款與細則',
    'Greetings,': '您好，',
    'bloodmallet.com would like to use': 'bloodmallet.com 想使用',
    'anonymized': '匿名的',
    ', to know how many people are using the website. You can either accept or reject this. Your choice will be saved on your device in a cookie.':
      '，以了解有多少人在使用本網站。你可以接受或拒絕。你的選擇會以 cookie 儲存在你的裝置上。',
  });

  const PAGE_SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE', 'TEXTAREA', 'INPUT', 'OPTION']);

  /** 逐個文字節點比對 PAGE_TW；圖表本體與 Wowhead 連結歸別的機制管，不碰。 */
  function translatePageText(root) {
    const scope = root && root.nodeType === Node.ELEMENT_NODE ? root : document.body;
    if (!scope) return;

    const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        let el = node.parentElement;
        while (el && el !== scope.parentElement) {
          if (PAGE_SKIP_TAGS.has(el.tagName)) return NodeFilter.FILTER_REJECT;
          if (el.id === 'chart' || (el.tagName === 'A' && /wowhead\.com/i.test(el.getAttribute('href') || ''))) {
            return NodeFilter.FILTER_REJECT;
          }
          el = el.parentElement;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    let node;
    while ((node = walker.nextNode())) {
      const raw = node.textContent;
      const trimmed = raw.trim();
      if (!trimmed) continue;
      // 站方模板有換行縮排，句子中間會夾著換行加空格；比對時先壓成單一空格
      const key = trimmed.replace(/\s+/g, ' ');
      let next = PAGE_TW[key];
      if (!next && node.parentElement.classList.contains('bm-title')) {
        next = CHART_TYPE_TW_MAP[key];
      }
      if (next && next !== trimmed) node.textContent = raw.replace(trimmed, next);
    }
  }

  // 站方 bm-charts.js 的 x_axis_texts（total / relative / absolute 三種算法）
  const CHART_AXIS_TW_MAP = Object.freeze({
    'total damage per second (character)': '每秒總傷害（角色）',
    '% damage per second': '每秒傷害百分比',
    'absolute damage per second': '每秒傷害（絕對值）',
    'damage per second': '每秒傷害',
  });

  // 長條圖 tooltip 的欄位標題（bm-charts.js 的 legend_title）。站台自己的分類詞，
  // 沒有遊戲 ID。Ranks 指藥瓶／藥水／附魔的製作品質階數，非官方用語。
  const CHART_LEGEND_TW_MAP = Object.freeze({
    'Race': '種族',
    'Itemlevels': '物品等級',
    'Ranks': '等級',
    'Targets': '目標數',
    'Effect': '效果',
    // 圖表右上角複製按鈕的 tooltip
    'Copy raw chart data to clipboard': '複製原始圖表資料到剪貼簿',
  });

  const SLOT_LABELS_TW = Object.freeze({
    'Head': '頭部',
    'Hands': '手部',
    'Neck': '頸部',
    'Waist': '腰部',
    'Shoulders': '肩部',
    'Legs': '腿部',
    'Back': '背部',
    'Feet': '腳部',
    'Chest': '胸部',
    'Finger': '手指',
    'Finger 1': '手指 1',
    'Finger 2': '手指 2',
    'Trinket': '飾品',
    'Trinket 1': '飾品 1',
    'Trinket 2': '飾品 2',
    'Wrists': '手腕',
    'Main Hand': '主手',
    'Off Hand': '副手',
    // 站方 2026-09 改版後的部位佔位字與 meta 標籤（舊字串保留，兩版都認）
    'Ring': '戒指',
    'Weapon': '武器',
    'Off-Hand': '副手',
    'Fight style': '戰鬥風格',
    'SimulationCraft Hash': 'SimulationCraft 版本雜湊',
    'Base profile': '基礎配置',
    'Spec &': '專精 &',
    'Class': '職業',
    'Spec': '專精',
    'Race': '種族',
    'Talents': '天賦',
    'Tier': '套裝',
    'Fight Style': '戰鬥風格',
    'Target Error': '目標誤差',
    'Iterations': '迭代次數',
    'SimC Hash': 'SimC 版本雜湊',
  });

  const CHARACTER_PROFILE_SLOT_IDS = [
    'c_head', 'c_hands', 'c_neck', 'c_waist', 'c_shoulders', 'c_legs',
    'c_back', 'c_feet', 'c_chest', 'c_finger1', 'c_finger2',
    'c_trinket1', 'c_trinket2', 'c_wrists', 'c_main_hand', 'c_off_hand',
  ];

  const isSettingsPage = location.pathname === '/settings/general';
  const isChartPage = location.pathname.startsWith('/chart/');
  const isIndexPage = /^\/(?:index(?:\.html?)?\/?)?$/.test(location.pathname);

  function normalizeKey(value) {
    return String(value || '')
      .trim()
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s-]+/g, '_');
  }

  function translateClassOrSpec(value) {
    return lookupGameUnit(value);
  }

  /** /chart/<class>/<spec>/<type>/<fight style> */
  function getChartPathParts() {
    const parts = location.pathname.split('/').filter(Boolean);
    return {
      wowClass: parts[1] || '',
      wowSpec: parts[2] || '',
      chartType: parts[3] || '',
      fightStyle: parts[4] || '',
    };
  }

  function setElementTextById(id, text) {
    const element = document.getElementById(id);
    if (element && text && element.textContent !== text) {
      element.textContent = text;
    }
  }

  function translateClassAndSpecLabels() {
    const { wowClass, wowSpec, chartType, fightStyle } = getChartPathParts();
    const classTw = lookupGameUnit(wowClass);
    const specTw = lookupGameUnit(wowSpec);

    if (classTw) {
      setElementTextById('navbar_wow_class_selection', classTw);
      setElementTextById('c_class', classTw);
    }
    if (specTw) {
      setElementTextById('navbar_wow_spec_selection', specTw);
      setElementTextById('c_spec', specTw);
    }

    // 目前選中的圖表類型與戰鬥風格改從網址推，比抓 DOM 文字穩 —— 站方改了
    // 顯示字串也不會失效，因為 URL 片段就是查詢鍵本身。
    setElementTextById('navbar_simulation_type_selection', CHART_TYPE_TW_MAP[chartType]);
    setElementTextById('navbar_fight_style_selection', FIGHT_STYLE_TW_MAP[fightStyle]);

    // 選單項目的 id 形如 navbar_<key>_selector，<key> 直接就是查詢鍵。
    // 三段 fallback：遊戲資料（職業／專精）→ 圖表類型 → 戰鬥風格。
    // 戰鬥風格的譯名早就在 FIGHT_STYLE_TW_MAP 裡，只是從來沒接到導覽列上。
    const selectorLinks = document.querySelectorAll('a[id^="navbar_"][id$="_selector"]');
    for (const link of selectorLinks) {
      const id = link.id || '';
      const key = id.slice(KEY_PREFIX.length, id.length - KEY_SUFFIX.length);
      const translated = translateClassOrSpec(key)
        || CHART_TYPE_TW_MAP[key]
        || FIGHT_STYLE_TW_MAP[key];
      if (translated && link.textContent !== translated) {
        link.textContent = translated;
      }
    }
  }

  /**
   * 站台 UI 控件的翻譯。一律走文字節點，不整個換掉 textContent —— 手風琴標題
   * 「Character profile (Source: simulationcraft)」的來源那段包在子 span 裡，
   * 換掉整顆 textContent 會把那個 span 一起吃掉。
   */
  function translateUiControls(root) {
    const scope = root && root.querySelectorAll ? root : document;

    for (const el of scope.querySelectorAll('button, label, .btn')) {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let node;

      while ((node = walker.nextNode())) {
        const raw = node.textContent;
        const trimmed = raw.trim();
        if (!trimmed) continue;

        let next = UI_TW_MAP[trimmed];
        if (!next) {
          next = trimmed;
          for (const [en, tw] of Object.entries(UI_PARTIAL_TW)) {
            if (next.includes(en)) next = next.split(en).join(tw);
          }
        }

        // 用 raw.replace 保留原本的前後空白，維持排版
        if (next !== trimmed) node.textContent = raw.replace(trimmed, next);
      }
    }
  }

  /** 圖表座標軸標題。文字與 .bm-bar-min / .bm-bar-max 混在同一個容器，只換文字節點。 */
  function translateChartAxis(root) {
    const scope = root && root.querySelectorAll ? root : document;
    for (const title of scope.querySelectorAll('.bm-axis .bm-bar-title')) {
      for (const node of title.childNodes) {
        if (node.nodeType !== Node.TEXT_NODE) continue;
        const translated = CHART_AXIS_TW_MAP[node.textContent.trim()];
        if (translated && node.textContent !== translated) {
          node.textContent = translated;
        }
      }
    }
  }

  /** 站方直接印出的遊戲字串（屬性名）。逐列登記在產生器的 LABEL_TABLES */
  function lookupGameLabel(value) {
    const table = gameNames();
    if (!table || typeof table.lookupLabel !== 'function' || !value) return null;
    try {
      return table.lookupLabel(value);
    } catch (_) {
      return null;
    }
  }

  /**
   * 種族圖表的列名。站方把贊達拉食人妖依洛阿神祇拆成三列（Zandalari Troll
   * Kimbul / Paku / Bwonsamdi），整串查不到 —— 只翻官方種族名那段前綴，神祇
   * 名照原文留著（那是 SimC 的參數值，不是遊戲顯示字串）。
   */
  function translateRaceName(value) {
    const text = String(value || '').trim();
    if (!text) return null;
    const whole = lookupGameUnit(text);
    if (whole) return whole;

    const table = gameNames();
    const races = table && table.UNIT_LISTS ? table.UNIT_LISTS.races : null;
    if (!Array.isArray(races)) return null;
    let best = '';
    for (const race of races) {
      if (race.length > best.length && text.startsWith(race + ' ')) best = race;
    }
    const prefixTw = best ? lookupGameUnit(best) : null;
    return prefixTw ? prefixTw + text.slice(best.length) : null;
  }

  /** 圖表裡的一段文字（座標軸、tooltip 欄位、種族名、屬性名）→ 譯文或 null */
  function translateChartLabel(text) {
    const key = String(text || '').trim();
    if (!key) return null;
    const fixed = CHART_AXIS_TW_MAP[key] || CHART_LEGEND_TW_MAP[key];
    if (fixed) return fixed;
    const { chartType } = getChartPathParts();
    if (chartType === 'races') return translateRaceName(key);
    // 副屬性分配的四個屬性名（ITEM_MOD_*，官方全名）
    if (chartType === 'secondary_distributions') return lookupGameLabel(key);
    return null;
  }

  function translateTextNodeWith(node, translate) {
    const raw = node.textContent;
    const trimmed = raw.trim();
    const next = translate(trimmed);
    if (next && next !== trimmed) node.textContent = raw.replace(trimmed, next);
  }

  /** data-bm-tooltip-text 是一段 HTML 字串：拆開、翻每個葉節點、再序列化回去 */
  function translateTooltipHtml(raw) {
    const box = document.createElement('template');
    box.innerHTML = raw;
    let changed = false;
    const walker = document.createTreeWalker(box.content, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const before = node.textContent;
      translateTextNodeWith(node, translateChartLabel);
      if (node.textContent !== before) changed = true;
    }
    return changed ? box.innerHTML : null;
  }

  /**
   * 圖表本體（#chart 底下，translatePageText 不碰的那一塊）。
   * 種族名與 tooltip 不是 Wowhead 連結，widget 改不到；屬性名在雷達圖的 SVG
   * <text> 裡，也一樣只能自己翻。
   */
  function translateChartBody() {
    const chart = document.getElementById('chart') || document;

    for (const key of chart.querySelectorAll('.bm-key')) {
      if (key.querySelector('a')) continue; // 品名歸 Wowhead widget
      for (const node of key.childNodes) {
        if (node.nodeType === Node.TEXT_NODE) translateTextNodeWith(node, translateChartLabel);
      }
    }

    for (const text of chart.querySelectorAll('svg text')) {
      translateTextNodeWith(text, translateChartLabel);
    }

    // 副屬性分配的比例列：「40」+<span class="bm-unit"> Critical Strike</span>
    for (const unit of chart.querySelectorAll('.bm-stat-cell .bm-unit')) {
      translateTextNodeWith(unit, translateChartLabel);
    }
    for (const cell of chart.querySelectorAll('.bm-stat-cell')) {
      const first = cell.firstChild;
      if (first && first.nodeType === Node.TEXT_NODE && first.textContent.startsWith('Best Ratio: ')) {
        first.textContent = '最佳比例：' + first.textContent.slice('Best Ratio: '.length);
      }
    }

    for (const el of chart.querySelectorAll('[data-bm-tooltip-text]')) {
      const raw = el.getAttribute('data-bm-tooltip-text') || '';
      const next = translateTooltipHtml(raw);
      if (next && next !== raw) el.setAttribute('data-bm-tooltip-text', next);
    }

    translateChartSubtitle(chart);
  }

  /**
   * 「arms warrior | castingpatchwerk | UTC 2026-10-14 02:39:52」—— 專精、職業、
   * 戰鬥風格都從網址算（見 AGENTS.md〈能從網址算出來的東西，不要等 DOM〉），
   * 時間戳照抄。網址那段查不到就保留原文那段。
   */
  function translateChartSubtitle(scope) {
    const subtitle = scope.querySelector('.bm-subtitle');
    if (!subtitle || subtitle.children.length) return;
    const match = subtitle.textContent.trim().match(/^(.+?) \| (.+?) \| (UTC .+)$/);
    if (!match) return;
    const { wowClass, wowSpec, fightStyle } = getChartPathParts();
    const classTw = lookupGameUnit(wowClass);
    const specTw = lookupGameUnit(wowSpec);
    const unit = classTw && specTw ? `${specTw} ${classTw}` : match[1];
    const style = FIGHT_STYLE_TW_MAP[fightStyle] || match[2];
    const next = `${unit} | ${style} | ${match[3]}`;
    if (subtitle.textContent !== next) subtitle.textContent = next;
  }

  function translateCharacterProfile() {
    // 1. 翻譯所有欄位值（Class, Spec, Race, Fight Style 等）
    const raceEl = document.getElementById('c_race');
    if (raceEl) {
      // 資料還沒載入時欄位是佔位字「Race」，不是種族名
      const twRace = lookupGameUnit(raceEl.textContent) || SLOT_LABELS_TW[raceEl.textContent.trim()];
      if (twRace && raceEl.textContent !== twRace) raceEl.textContent = twRace;
    }

    const fightStyleEl = document.getElementById('c_fight_style');
    if (fightStyleEl) {
      const key = normalizeKey(fightStyleEl.textContent);
      const twStyle = FIGHT_STYLE_TW_MAP[key];
      if (twStyle) fightStyleEl.textContent = twStyle;
    }

    const classEl = document.getElementById('c_class');
    if (classEl) {
      const twClass = lookupGameUnit(classEl.textContent);
      if (twClass) classEl.textContent = twClass;
    }

    const specEl = document.getElementById('c_spec');
    if (specEl) {
      const twSpec = lookupGameUnit(specEl.textContent);
      if (twSpec) specEl.textContent = twSpec;
    }

    // 2. 翻譯未填充物品時的部位佔位文字與已有裝備圖示
    let linksTouched = false;
    for (const id of CHARACTER_PROFILE_SLOT_IDS) {
      const el = document.getElementById(id);
      if (!el) continue;
      if (el.children.length === 0) {
        const text = el.textContent.trim();
        const translated = SLOT_LABELS_TW[text];
        if (translated && el.textContent !== translated) {
          el.textContent = translated;
        }
      } else {
        const link = el.querySelector('a[href*="wowhead.com"]');
        if (link && helper) {
          const href = link.getAttribute('href') || '';
          const twHref = helper.toTwWowheadUrl(href);
          if (twHref && href !== twHref) {
            link.setAttribute('href', twHref);
            linksTouched = true;
          }
          if (helper.applyTwDomainToDataWowhead(link)) linksTouched = true;
          if (link.dataset.whRenameLink !== 'true') {
            link.dataset.whRenameLink = 'true';
            link.setAttribute('data-wh-rename-link', 'true');
            linksTouched = true;
          }
        }
      }
    }

    // 3. 翻譯 Table 標題列
    const profileLabels = document.querySelectorAll('#meta-info th, #meta-info td, #character-profile-label button');
    for (const el of profileLabels) {
      const text = (el.textContent || '').trim();
      if (SLOT_LABELS_TW[text]) {
        el.textContent = SLOT_LABELS_TW[text];
      }
      if (text.includes('Character profile')) {
        el.textContent = text.replace('Character profile', '角色配置');
      }
      if (text.includes('SimulationCraft settings')) {
        el.textContent = text.replace('SimulationCraft settings', 'SimulationCraft 設定');
      }
    }

    // 只在真的動到連結時才叫 widget 重掃。這個函式掛在每次 DOM 變動上，而
    // refreshLinks(true) 會把頁面上每一條連結重新改名、重新掛圖示（每條各一次
    // childList + attributes 變動）——無條件叫它就是一個自我維持的迴圈：
    // 重掃 → 65 條連結變動 → observer → 這裡 → 再重掃，實測每秒 8～27 輪，
    // 滑鼠下的連結不斷被換掉，tooltip 就跟著閃。
    if (helper && linksTouched) {
      helper.queueWowheadRefresh();
    }
  }

  function isTwModeEnabled() {
    try {
      const val = window.localStorage.getItem(TW_MODE_STORAGE_KEY);
      return val === null || val === TW_MODE_VALUE || val === 'true';
    } catch (_) {
      // 瀏覽器封鎖 storage 時視為預設啟用，不讓整支腳本中止
      return true;
    }
  }

  function setTwModeEnabled(enabled) {
    try {
      window.localStorage.setItem(TW_MODE_STORAGE_KEY, enabled ? TW_MODE_VALUE : 'false');
    } catch (_) {}
  }

  // ── bloodmallet 語言表註冊 ──────────────────────────────────────────────
  // 站方改版後（bm-utils.js）用 bmUtils.languageMap 把站台語言碼對應到資料語
  // 言碼，再用 bmUtils.wowheadSubdomains 決定 Wowhead 子網域。兩張表都沒有
  // zh-hant，而 detectUserLanguage() 對未登記的值是原樣穿透的：
  //     'zh-hant' → 'zh-hant' → wowheadSubdomains['zh-hant'] === undefined
  // 整條鏈於是崩回英文。這就是「zh-hant 一旦真的送到伺服器，之後每次載入都
  // 變英文」的成因 — 不是我們的覆蓋層失效，是站方的查表失敗。
  //
  // 對應到 cn_CN 而非 zh_TW 是刻意的：資料與品名仍走站方既有的 cn 管線，我們
  // 在其上用 Wowhead zhTW 重寫，現行行為完全不變；差別只在 zh-hant 漏到伺服
  // 器時不再炸成英文。若日後確認站方資料支援 zh_TW，改這個常數即可。
  const BM_LANGUAGE_FALLBACK = 'cn_CN';

  function registerZhHantLanguage(utils) {
    if (!utils || utils.__twZhHantRegistered) return false;

    const map = utils.languageMap;
    if (!map || typeof map !== 'object') return false;

    if (!map[ZH_HANT_VALUE]) {
      map[ZH_HANT_VALUE] = BM_LANGUAGE_FALLBACK;
    }

    // 讓站方自己產生的 Wowhead 連結直接指向 tw，少一輪事後重寫
    const subdomains = utils.wowheadSubdomains;
    if (subdomains && typeof subdomains === 'object' && !subdomains.zh_TW) {
      subdomains.zh_TW = 'tw';
    }

    utils.__twZhHantRegistered = true;
    return true;
  }

  /**
   * bmUtils 是 bm-utils.js 在 document-start 之後才掛上 window 的，
   * 用 setter 在賦值當下註冊以避免 race，另備輪詢作為保險。
   */
  function registerZhHantLanguageWhenReady() {
    if (registerZhHantLanguage(window.bmUtils)) return;

    let current = window.bmUtils;
    try {
      Object.defineProperty(window, 'bmUtils', {
        configurable: true,
        enumerable: true,
        get() { return current; },
        set(value) {
          current = value;
          registerZhHantLanguage(value);
        },
      });
    } catch (_) {
      // defineProperty 被擋下就純靠下面的輪詢
    }

    let retries = 0;
    const intervalId = window.setInterval(() => {
      retries += 1;
      if (registerZhHantLanguage(window.bmUtils) || retries >= 120) {
        window.clearInterval(intervalId);
      }
    }, 100);
  }

  // @run-at document-start：立刻裝上攔截，趕在 bm-utils.js 賦值之前。
  // 放進 start() 就太晚了 — DOMContentLoaded 時 bmUtils 早已掛好，setter 攔不到。
  registerZhHantLanguageWhenReady();

  function injectZhHantOption() {
    const select = document.querySelector('select#language_selection[name="language"]');
    const form = select ? select.closest('form[action="/i18n/setlang/"]') : null;
    if (!select || !form) {
      return;
    }

    let zhHantOption = select.querySelector('option[value="zh-hant"]');
    if (!zhHantOption) {
      zhHantOption = document.createElement('option');
      zhHantOption.value = ZH_HANT_VALUE;
      zhHantOption.textContent = '正體中文 (zh-hant)';
      select.appendChild(zhHantOption);
    }

    if (isTwModeEnabled() && select.value === ZH_HANS_VALUE) {
      select.value = ZH_HANT_VALUE;
    }

    form.addEventListener(
      'submit',
      () => {
        const useTraditional = select.value === ZH_HANT_VALUE;
        setTwModeEnabled(useTraditional);

        if (useTraditional) {
          select.value = ZH_HANS_VALUE;
        }
      },
      true
    );
  }

  function getTranslateKeyFromElementClass(element) {
    for (const className of element.classList) {
      if (className.startsWith('translate_')) {
        return className.slice('translate_'.length);
      }
    }
    return '';
  }

  function detectWowClassFromElement(element) {
    const className = element.className || '';
    for (const wowClass of wowClassSlugs()) {
      if (className.includes(`translate_${wowClass}`) || className.includes(`${wowClass}-`)) {
        return wowClass;
      }
    }
    return '';
  }

  function parseChartPathFromHref(href) {
    try {
      const url = new URL(href, window.location.href);
      const match = url.pathname.match(/^\/chart\/([^/]+)\/([^/]+)\//);
      if (!match) {
        return { wowClass: '', wowSpec: '' };
      }
      return { wowClass: normalizeKey(match[1]), wowSpec: normalizeKey(match[2]) };
    } catch (_) {
      return { wowClass: '', wowSpec: '' };
    }
  }

  function translateIndexClassSpecLinks(root = document) {
    const table = root.querySelector('#spec_table');
    if (!table) {
      return;
    }

    const specButtons = table.querySelectorAll('a.spec-btn');
    for (const btn of specButtons) {
      const { wowSpec } = parseChartPathFromHref(btn.getAttribute('href') || '');
      const translated = lookupGameUnit(wowSpec);
      if (translated && btn.textContent !== translated) {
        btn.textContent = translated;
      }
    }

    const classHeaders = table.querySelectorAll('.wow-class-header-content');
    for (const header of classHeaders) {
      const wowClass = detectWowClassFromElement(header);
      const translated = lookupGameUnit(wowClass);
      if (translated && header.textContent !== translated) {
        header.textContent = translated;
      }
    }

    const translatableElements = table.querySelectorAll('[class*="translate_"]');
    for (const element of translatableElements) {
      const translateKey = getTranslateKeyFromElementClass(element);
      if (!translateKey) continue;

      const translated = translateClassOrSpec(translateKey);
      if (!translated) continue;

      if (element.textContent !== translated) {
        element.textContent = translated;
      }
    }
  }

  // ── Wowhead 全域強制設定 ─────────────────────────────────────────────────
  function forceTwWowheadEnvironment() {
    window.Locale = {
      getId: function () { return 10; },
      getName: function () { return 'zhtw'; },
    };

    if (typeof window.whTooltips === 'undefined') {
      window.whTooltips = {};
    }
    window.whTooltips.colorLinks = true;
    window.whTooltips.iconizeLinks = true;
    window.whTooltips.domain = 'tw';
    window.whTooltips.locale = 'zhtw';
    window.whTooltips.renameLinks = true;
  }

  // ── WowheadTwHelper 實例 ──────────────────────────────────────────────────
  let helper = null;
  if (isTwModeEnabled()) {
    forceTwWowheadEnvironment();
    helper = new window.WowheadTwHelper({
      enableRenameLinks: true,
      enableSafeLinkify: false,
      onScan: (root) => {
        translateClassAndSpecLabels();
        translateCharacterProfile();
        translateUiControls(root);
        translateChartAxis(root);
        if (isChartPage) translateChartBody();
        translatePageText(root);
        if (isIndexPage) {
          translateIndexClassSpecLinks(root);
        }
      },
      onUrlChange: () => {
        if (helper) helper.runFullPass();
      }
    });
  }

  // ── 長條圖 tooltip 品名同步 ────────────────────────────────────────────
  // .bm-key 的品名是 <a data-wh-rename-link>，Wowhead widget 會把它的文字節點
  // 換成 zhTW。但 .bm-bar 的 tooltip 是 render 當下就序列化進
  // data-bm-tooltip-text 屬性的一段 HTML 字串 — widget 改得到文字節點，改不到
  // 屬性，於是 bar 的標題永遠停在站台語言（cn_CN → 简中）。
  //
  // 這不是漏翻字典，是屬性裡的 HTML 快照沒人更新；同一列正確的品名就在旁邊，
  // 回填即可，不需要查表也不需要再打一次 Wowhead。
  const TOOLTIP_TITLE_RE = /(<div class="bm-tooltip-title">)([\s\S]*?)(<\/div>)/;

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /** 取該列的品名文字，扣掉 Wowhead 圖示 span */
  function getRowItemName(row) {
    const link = row.querySelector('.bm-key a');
    if (!link) return '';

    let text = '';
    for (const node of link.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent;
      } else if (node.nodeType === Node.ELEMENT_NODE && !node.classList.contains('iconsmall')) {
        text += node.textContent;
      }
    }
    return text.trim();
  }

  function syncBarTooltipNames(root) {
    const scope = root && root.querySelectorAll ? root : document;
    const rows = scope.querySelectorAll('.bm-row');
    let updated = 0;

    for (const row of rows) {
      const bar = row.querySelector('.bm-bar[data-bm-tooltip-text]');
      if (!bar) continue;

      const name = getRowItemName(row);
      if (!name) continue;

      const raw = bar.getAttribute('data-bm-tooltip-text') || '';
      const match = raw.match(TOOLTIP_TITLE_RE);
      if (!match) continue;

      const escaped = escapeHtml(name);
      if (match[2] === escaped) continue;

      bar.setAttribute(
        'data-bm-tooltip-text',
        raw.replace(TOOLTIP_TITLE_RE, (whole, open_, _old, close) => open_ + escaped + close)
      );

      // bm-tooltips.js 的 create_tooltip() 是在 mouseover 當下才讀這個屬性、
      // mouseleave 就把節點丟掉，所以改屬性下次 hover 就生效。這裡只補「回填
      // 剛好發生在使用者正懸停時」那一瞬間的殘影。
      const tooltipId = bar.getAttribute('data-bm-tooltip-id');
      const live = tooltipId ? document.getElementById(tooltipId) : null;
      const liveTitle = live ? live.querySelector('.bm-tooltip-title') : null;
      if (liveTitle && liveTitle.textContent !== name) {
        liveTitle.textContent = name;
      }

      updated += 1;
    }

    return updated;
  }

  let barSyncQueued = false;

  function watchBarTooltips() {
    const chart = document.getElementById('chart') || document.body;

    // Wowhead 改名是非同步的，圖表本身切換資料時也會重繪，兩邊都要跟。
    // 回填後再次掃描會因為名稱已相同而不產生變動，所以不會無限循環。
    const observer = new MutationObserver(() => {
      if (barSyncQueued) return;
      barSyncQueued = true;
      window.requestAnimationFrame(() => {
        barSyncQueued = false;
        syncBarTooltipNames();
        // 切換「顯示絕對數值」等選項時站方會整張重繪，tooltip 與種族名要跟著重翻
        translateChartBody();
      });
    });

    observer.observe(chart, { childList: true, subtree: true, characterData: true });

    syncBarTooltipNames();
    setTimeout(syncBarTooltipNames, 500);
    setTimeout(syncBarTooltipNames, 1500);
    setTimeout(syncBarTooltipNames, 3000);
  }

  function enableTwModeOnChartPages() {
    watchBarTooltips();

    if (helper) {
      helper.start();
    }

    // 監聽並自動翻譯 Character profile
    const metaObserver = new MutationObserver(() => {
      translateCharacterProfile();
    });

    const metaTarget = document.getElementById('meta-info') || document.body;
    metaObserver.observe(metaTarget, {
      childList: true,
      subtree: true,
    });

    translateCharacterProfile();
    setTimeout(translateCharacterProfile, 500);
    setTimeout(translateCharacterProfile, 1500);
    setTimeout(translateCharacterProfile, 3000);
  }

  function enableTwModeOnIndexPage() {
    let retries = 0;
    const maxRetries = 80;

    const intervalId = window.setInterval(() => {
      retries += 1;
      translateIndexClassSpecLinks(document);

      const table = document.querySelector('#spec_table');
      if (table && table.querySelector('.spec-btn')) {
        window.clearInterval(intervalId);
      } else if (retries >= maxRetries) {
        window.clearInterval(intervalId);
      }
    }, 100);

    if (helper) {
      helper.start();
    }
  }

  function start() {
    // 只有在 zh-hant 模式開啟時才覆寫 Wowhead 全域語系，
    // 否則使用者從設定頁切回其他語言仍會被強制看到繁中 tooltip。
    if (isTwModeEnabled()) {
      forceTwWowheadEnvironment();
    }

    if (isSettingsPage) {
      injectZhHantOption();
    }

    if (isChartPage && isTwModeEnabled()) {
      enableTwModeOnChartPages();
    }

    if (isIndexPage && isTwModeEnabled()) {
      enableTwModeOnIndexPage();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
