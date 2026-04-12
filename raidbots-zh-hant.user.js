// ==UserScript==
// @name         Raidbots Traditional Chinese + Wowhead Patch
// @namespace    https://www.raidbots.com/
// @version      0.3.3
// @description  Translate Raidbots UI to Traditional Chinese and patch Wowhead links/tooltips for dynamic SPA pages.
// @author       mcc
// @match        https://www.raidbots.com/*
// @match        https://raidbots.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  if (typeof window.whTooltips === 'undefined') {
    window.whTooltips = {};
  }
  window.whTooltips.colorLinks = true;
  window.whTooltips.iconizeLinks = false;
  window.whTooltips.renameLinks = false;
  window.whTooltips.locale = 'zhtw';

  const CLASS_TW_MAP = Object.freeze({
    death_knight: '死亡騎士',
    demon_hunter: '惡魔獵人',
    druid: '德魯伊',
    evoker: '喚能師',
    hunter: '獵人',
    mage: '法師',
    monk: '武僧',
    paladin: '聖騎士',
    priest: '牧師',
    rogue: '盜賊',
    shaman: '薩滿',
    warlock: '術士',
    warrior: '戰士',
  });

  const SPEC_TW_MAP = Object.freeze({
    affliction: '痛苦',
    arcane: '秘法',
    arms: '武器',
    assassination: '刺殺',
    augmentation: '強化',
    balance: '平衡',
    beast_mastery: '野獸控制',
    blood: '血魄',
    brewmaster: '釀酒',
    demonology: '惡魔學識',
    destruction: '毀滅',
    devastation: '破滅',
    devourer: '噬滅',
    discipline: '戒律',
    elemental: '元素',
    enhancement: '增強',
    feral: '野性戰鬥',
    fire: '火焰',
    frost: '冰霜',
    fury: '狂怒',
    guardian: '守護者',
    havoc: '災虐',
    holy: '神聖',
    marksmanship: '射擊',
    mistweaver: '禦霧',
    outlaw: '暴徒',
    preservation: '護存',
    protection: '防護',
    restoration: '恢復',
    retribution: '懲戒',
    shadow: '暗影',
    subtlety: '敏銳',
    survival: '生存',
    unholy: '穢邪',
    vengeance: '復仇',
    windwalker: '御風',
  });

  const HERO_TALENT_TW_MAP = Object.freeze({
    deathbringer: '死亡使者',
    rider_of_the_apocalypse: '天啟騎士',
    sanlayn: '煞婪',
    aldrachi_reaver: '奧達奇劫奪者',
    fel_scarred: '魔痕',
    annihilator: '殲滅者',
    elunes_chosen: '伊露恩之選',
    keeper_of_the_grove: '林地看守者',
    druid_of_the_claw: '利爪德魯伊',
    wildstalker: '野地潛獵者',
    chronowarden: '時光看守者',
    flameshaper: '塑火者',
    scalecommander: '龍隊指揮官',
    dark_ranger: '黑暗遊俠',
    pack_leader: '獸群領袖',
    sentinel: '哨兵',
    frostfire: '霜火',
    spellslinger: '拋法者',
    sunfury: '日怒',
    conduit_of_the_celestials: '天尊引導者',
    master_of_harmony: '和諧大師',
    shadopan: '影潘',
    herald_of_the_sun: '太陽先驅',
    lightsmith: '光鑄師',
    templar: '聖殿騎士',
    archon: '御靈者',
    oracle: '神諭者',
    voidweaver: '虛織者',
    deathstalker: '亡靈哨兵',
    fatebound: '命縛者',
    trickster: '欺詐者',
    farseer: '先知',
    stormbringer: '風暴使者',
    totemic: '圖騰師',
    diabolist: '崇魔者',
    hellcaller: '喚魔者',
    soul_harvester: '靈魂收割者',
    colossus: '巨像',
    mountain_thane: '山脈族長',
    slayer: '殺戮者',
  });

  const RACE_TW_MAP = Object.freeze({
    human: '人類',
    dwarf: '矮人',
    night_elf: '夜精靈',
    gnome: '地精',
    draenei: '德萊尼',
    worgen: '狼人',
    pandaren: '熊貓人',
    dracthyr: '半龍人',
    void_elf: '虛無精靈',
    lightforged_draenei: '光鑄德萊尼',
    dark_iron_dwarf: '黑鐵矮人',
    kul_tiran: '庫爾提拉斯人',
    mechagnome: '機械侏儒',
    orc: '獸人',
    undead: '不死族',
    tauren: '牛頭人',
    troll: '食人妖',
    blood_elf: '血精靈',
    goblin: '哥布林',
    nightborne: '夜裔精靈',
    highmountain_tauren: '高嶺牛頭人',
    maghar_orc: '瑪格哈獸人',
    zandalari_troll: '贊達拉食人妖',
    vulpera: '狐人',
    earthen: '土靈',
  });

  const EXACT_TW = Object.freeze({
    'Top Gear': '最佳配裝',
    'Quick Sim': '快速模擬',
    Droptimizer: '掉落最佳化',
    Advanced: '進階',
    More: '更多',
    English: '英文',
    Stats: '屬性',
    Gear: '裝備',
    Enhancements: '強化',
    Consumables: '消耗品',
    Talents: '天賦',
    Input: '輸入',
    Options: '選項',
    'Quick Nav:': '快速導覽：',
    'Load from SimC Addon': '從 SimC 插件載入',
    'Copy/paste the text from the SimulationCraft addon.': '貼上 SimulationCraft 插件輸出文字。',
    'How to install and use the SimC addon': '如何安裝與使用 SimC 插件',
    'Selection deleted': '已刪除選擇',
    'Item Sets': '套裝',
    'Minimum Set Bonus': '最低套裝效果',
    'Item Upgrade Currency': '裝備升級貨幣',
    'Show All': '全部顯示',
    'Max All': '全部最大化',
    'Upgrade Selected to Max Affordable': '將已選裝備升級至可負擔最高等級',
    'Catalyst Charges': '轉化催化劑次數',
    'How many Catalyst charges do you want to use?': '你想使用幾次轉化催化劑？',
    'Catalyze Selected Items': '轉化已選物品',
    'Item Search': '物品搜尋',
    Name: '名稱',
    'Item Level': '物品等級',
    'Crafted Item Stats': '製作裝備屬性',
    'Only Seasonal Item Levels': '僅季節物品等級',
    'Only Usable': '僅顯示可用物品',
    'Require Sparks/Crests for Crafted Items': '製作裝備需消耗火花/紋章',
    'Run Sim Again': '再次模擬',
    'Your Top Gear': '你的最佳配裝',
    'Prefer Equipped if Sidegrade': '同等結果時優先已裝備',
    'Changes from your equipped gear are highlighted': '與目前裝備的差異已高亮顯示',
    'Top Gear (DPS)': '最佳配裝 (DPS)',
    'Go to equipped': '跳到目前裝備',
    'Relative DPS': '相對 DPS',
    'Show Gear Differences From': '顯示裝備差異基準',
    'Current Gear': '目前裝備',
    'Show Smart Sim Stage': '顯示 Smart Sim 階段',
    'Raw Input': '原始輸入',
    'Original Addon Input': '原始插件輸入',
    'Simulation Details': '模擬細節',
    Patchwerk: '木樁戰',
    Weekly: '每週',
    '5 minutes': '5 分鐘',
    '1 boss target': '1 個首領目標',
    'Sim Run': '模擬執行',
    'Margin of Error': '誤差範圍',
    'Number of simulated fights run': '已模擬戰鬥次數',
    Iterations: '迭代次數',
    Actors: '角色數',
    'Processing Time': '處理時間',
    'SimC Version': 'SimC 版本',
    'SimC Build Date': 'SimC 建置時間',
    'SimC Git Hash': 'SimC Git Hash',
    'Raw Files': '原始檔案',
    'Report disabled for large simulation': '大型模擬已停用報表',
    'Share Report URL': '分享報表連結',
    'Support / Help': '支援 / 說明',
    Developers: '開發者',
    'Blog Archive': '部落格存檔',
    Terms: '條款',
    'Terms of Use': '使用條款',
    'Privacy Policy': '隱私權政策',
    Contact: '聯絡我們',
    Etc: '其他',
    Reports: '報告',
    'Made by Seriallos': '由 Seriallos 製作',
    Copy: '複製',
    'Copy to Clipboard': '複製到剪貼簿',
    'Copy and Modify...': '複製並修改...',
    'Convert to Catalyst Item': '轉化為催化劑物品',
    'Add socket': '新增插槽',
    'Add socket (Great Vault)': '新增插槽（大秘寶庫）',
    'Remove socket': '移除插槽',
    'Remove enchant': '移除附魔',
    '(Cannot afford)': '（無法負擔）',
    Equipped: '已裝備',
    Default: '預設',
    None: '無',
    Hero: '英雄',
    Champion: '勇士',
    Adventurer: '冒險者',
    Veteran: '老兵',
    Myth: '神話',
    Max: '最大',
    Lock: '鎖定',
    'Show all items': '顯示所有物品',
    'Show All Enhancements': '顯示所有強化',
    'Show All Consumables': '顯示所有消耗品',
    'This item may not be intended for your spec': '此物品可能不適用於你的專精',
    'In-game Loadout': '遊戲內配置',
    Login: '登入',
    Logout: '登出',
    Account: '帳號',
    Email: '電子郵件',
    Password: '密碼',
    'Create an account': '建立帳號',
    'Forgot password?': '忘記密碼？',
    'For item search and tooltips only': '僅用於物品搜尋與提示',
    'Sign up for Raidbots Premium!': '註冊 Raidbots Premium！',
    'Skip the line, run larger sims, and more!': '跳過排隊、執行更大規模模擬，還有更多功能！',
    UPG: '升級',
    Talent: '天賦',
    Instant: '瞬發',
    Passive: '被動',
    Active: '主動',
    'Choice Node': '選擇節點',
    Head: '頭部',
    Neck: '頸部',
    Shoulder: '肩部',
    Back: '背部',
    Chest: '胸部',
    Wrist: '手腕',
    Hands: '手部',
    Waist: '腰部',
    Legs: '腿部',
    Feet: '腳部',
    Rings: '戒指',
    Trinkets: '飾品',
    'Main Hand': '主手',
    'Off Hand': '副手',
    Crit: '致命',
    Haste: '加速',
    Mastery: '精通',
    Vers: '臨機',
    'Crit/Haste': '致命/加速',
    'Crit/Mastery': '致命/精通',
    'Crit/Vers': '致命/臨機',
    'Haste/Crit': '加速/致命',
    'Haste/Mastery': '加速/精通',
    'Haste/Vers': '加速/臨機',
    'Mastery/Crit': '精通/致命',
    'Mastery/Haste': '精通/加速',
    'Mastery/Vers': '精通/臨機',
    'Vers/Crit': '臨機/致命',
    'Vers/Haste': '臨機/加速',
    'Vers/Mastery': '臨機/精通',
    'This combination was run at low precision.': '此組合以低精度執行。',
    'Large margin of error - actual DPS may be lower/higher.': '誤差較大，實際 DPS 可能更低或更高。',
    'just now': '剛剛',
    yesterday: '昨天',
    'a week ago': '1 週前',
    'an hour ago': '1 小時前',
    'a day ago': '1 天前',
    'a month ago': '1 個月前',
    'a year ago': '1 年前',
    '« Back to Top Gear': '« 返回最佳配裝',
    'Top Gear - Raidbots': '最佳配裝 - Raidbots',
    'Raidbots - Optimize Your WoW Characters': 'Raidbots - 優化你的 WoW 角色',
    'Select additional options': '選擇附加選項',
    'Find Top Gear': '執行最佳配裝',
    'High Precision (2x more precise, 4x slower)': '高精度（精準度提升 2 倍，速度約慢 4 倍）',
    'Get Raidbots Premium': '取得 Raidbots Premium',
    'for increased iteration limits.': '以提高迭代上限。',
    'Simulation Options:': '模擬選項：',
    'Custom APL and SimC Options:': '自訂 APL 與 SimC 選項：',
    'SimC Defaults': 'SimC 預設值',
    'Report and Notification Options': '報表與通知選項',
    'Show Simc Input': '顯示 SimC 輸入',
    'Select...': '選擇...',
    'Replace Existing Gems/Enchants': '取代現有寶石／附魔',
    'Add up to': '最多加入',
    'prismatic sockets with': '個棱彩插槽，並使用',
    'Will add a socket and the selected gem to items that are unsocketed.': '會在尚未有插槽的物品上新增插槽並套用所選寶石。',
    'Gem options below will still be used for existing sockets.': '下方寶石選項仍會套用到既有插槽。',
    Limitations: '限制',
    'Item shown with the socket in the report is arbitrary': '報告中顯示帶插槽的物品可能是任意一件。',
    'Some items may be socketed that are not allowed in-game': '可能會對遊戲內無法插槽的物品進行插槽模擬。',
    'Be aware:': '注意：',
    'gem combinations can take a very long time!': '寶石組合可能需要很長時間！',
    'Current selection results in only 1 valid combination. Check items for warnings, select more options, and/or check gem settings.': '目前選擇僅產生 1 個有效組合。請檢查物品警告、增加選項，或調整寶石設定。',
    'By default, SimC varies fight length for each iteration to avoid overly specific results.': '預設情況下，SimC 會在每次迭代調整戰鬥長度，避免結果過度侷限。',
    'In this sim, fight length varies from 240 to 360 seconds.': '此模擬中，戰鬥長度會在 240 到 360 秒之間變動。',
    'Top Gear will not change your prismatic gems': 'Top Gear 不會變更你的棱彩寶石',
    'Top Gear will use the global food setting': 'Top Gear 將使用全域食物設定',
    'Top Gear will use the global flask setting': 'Top Gear 將使用全域精煉藥劑設定',
    'Top Gear will use the global potion setting': 'Top Gear 將使用全域藥水設定',
    'Smart Sim, Patchwerk, 1 Boss, 5 minutes, SimC Weekly': 'Smart Sim、木樁戰、1 目標、5 分鐘、SimC 每週版',
    'Sets the upgrade level of the item and allows catalyst transformations': '設定物品升級等級，並允許催化劑轉化。',
    'Select multiple pieces of gear and Raidbots will generate all possible combinations and sim them': '選擇多件裝備後，Raidbots 會產生所有可能組合並進行模擬。',
    'Stats to apply to crafted items. Default determined by what is most common on your items': '套用到製作裝備的屬性。預設值依你目前裝備最常見屬性決定。',
    'Warning: Item Search is only intended for max level characters and may allow simming items that cannot be obtained in game.': '警告：物品搜尋僅針對滿等角色，且可能允許模擬遊戲中無法取得的物品。',
    'This will limit how many Catalyst items are included in a single combination. You must use the': '這會限制單一組合中可包含的催化劑物品數量。你必須使用',
    'Copy and Modify menu on items to convert an item.': '物品上的「複製並修改」選單來轉化物品。',
    'Copy and Modify menu to add an upgraded item to the sim.': '使用「複製並修改」選單把升級後物品加入模擬。',
    'Require having sparks/crests/etc available in the Item Upgrade Currency panel to use the item': '使用該物品時，要求在「裝備升級貨幣」面板中有可用火花／紋章等資源。',
    'Only show items intended for your spec (main stat, armor type, etc). Warning! Could crash your sim!': '僅顯示符合你專精的物品（主屬性、護甲類型等）。警告：可能導致模擬當機！',
    Ring: '戒指',
    Gems: '寶石',
    Food: '食物',
    Flask: '精煉藥劑',
    Potion: '藥水',
    'Only Max Colors': '僅最大顏色',
    'Always Use': '永遠使用',
    'Reset All Top Gear Settings': '重設所有最佳配裝設定',
    'Indecipherable Eversong Diamond': '難解的永歌鑽石',
    'Powerful Eversong Diamond': '強效永歌鑽石',
    'Telluric Eversong Diamond': '大地永歌鑽石',
    '50 Primary Stat': '50 主屬性',
    '64 Highest Secondary': '64 最高副屬性',
    '58 Versatility': '58 臨機應變',
    '58 Mastery': '58 精通',
    '58 Haste': '58 加速',
    '58 Crit': '58 致命',
    'Shattered Sun (Crit)': '破碎之日（致命）',
    'Blood Knights (Haste)': '血騎士（加速）',
    'Magisters (Mastery)': '博學者（精通）',
    'Thalassian Resistance (Vers)': '薩拉斯抗性（臨機）',
    "Draught of Rampant Abandon": '狂放拋棄藥劑',
    "Light's Potential": '聖光潛能藥水',
    'Potion of Recklessness': '魯莽藥水',
    'Potion of Zealotry': '狂熱藥水',
    "Arcane Mastery": '秘法專精',
    "Berserker's Rage": '狂戰之怒',
    "Flames of the Sin'dorei": '辛多雷之焰',
    "Jan'alai's Precision": '加亞萊之精準',
    'Strength of Halazzi': '哈拉齊之力',
    'Worldsoul Tenacity': '世界之魂堅韌',
    'Empowered Blessing of Speed': '強化速度祝福',
    'Empowered Hex of Leeching': '強化汲取咒印',
    'Empowered Rune of Avoidance': '強化迴避符文',
    "Akil'zon's Swiftness": '阿奇隆的迅捷',
    "Amirdrassil's Grace": '阿梅達希爾的恩典',
    "Silvermoon's Mending": '銀月修復',
    'Mark of the Magister': '博學者印記',
    'Arcanoweave Spellthread': '祕法織紋魔線',
    "Farstrider's Hunt": '遠行者狩獵',
    "Lynx's Dexterity": '山貓敏捷',
    "Shaladrassil's Roots": '薩拉達希爾之根',
    'Eyes of the Eagle': '雄鷹之眼',
    "Nature's Fury": '自然之怒',
    "Silvermoon's Alacrity": '銀月敏捷',
    "Silvermoon's Tenacity": '銀月堅韌',
    "Zul'jin's Mastery": '祖爾金專精',
  });

  const EXACT_TW_CI = Object.freeze(
    Object.fromEntries(
      Object.entries(EXACT_TW).map(([key, value]) => [key.toLowerCase(), value])
    )
  );

  const ENCHANT_SLOT_TW = Object.freeze({
    'main hand': '主手',
    head: '頭部',
    shoulder: '肩部',
    chest: '胸部',
    legs: '腿部',
    feet: '腳部',
    ring: '戒指',
  });

  const STAT_LABEL_TW = Object.freeze({
    crit: '致命',
    haste: '加速',
    mast: '精通',
    mastery: '精通',
    vers: '臨機',
    versatility: '臨機',
    'primary stat': '主屬性',
    'highest secondary': '最高副屬性',
  });

  const RELATIVE_UNIT_TW = Object.freeze({
    second: '秒',
    minute: '分鐘',
    hour: '小時',
    day: '天',
    week: '週',
    month: '個月',
    year: '年',
  });

  const WOWHEAD_SUBDOMAINS = /^(?:https?:)?\/\/(www|cn|[a-z]{2})\.wowhead\.com\//i;
  const WOWHEAD_ITEM_OR_SPELL_LINK = 'a[href*="wowhead.com/item="],a[href*="wowhead.com/spell="]';
  const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'CODE', 'PRE', 'SVG']);
  const SKIP_CLASS_KEYWORDS = ['ace_', 'CodeMirror', 'monaco-editor'];
  const ATTRIBUTE_SELECTOR = '[aria-label],[title],[placeholder],input[type="button"][value],input[type="submit"][value],input[type="reset"][value]';
  const ATTRIBUTE_NAMES = ['aria-label', 'title', 'placeholder'];
  const MAX_TERM_WORDS = 5;

  let translatedNodeText = new WeakMap();
  let wowheadRefreshTimer = null;
  let wowheadRefreshRetries = 0;
  const MAX_WOWHEAD_RETRIES = 30;

  let pendingRoots = new Set();
  let flushTimer = null;
  let lastUrl = location.href;

  function normalizeKey(value) {
    return String(value || '')
      .trim()
      .toLowerCase()
      .replace(/['’]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s-]+/g, '_');
  }

  function translateName(value) {
    const key = normalizeKey(value);
    return HERO_TALENT_TW_MAP[key] || SPEC_TW_MAP[key] || CLASS_TW_MAP[key] || RACE_TW_MAP[key] || null;
  }

  function translateTermSequence(value) {
    const words = String(value || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (words.length === 0) {
      return null;
    }

    const translated = [];
    let index = 0;
    while (index < words.length) {
      let matched = null;
      const maxWords = Math.min(MAX_TERM_WORDS, words.length - index);
      for (let size = maxWords; size >= 1; size -= 1) {
        const phrase = words.slice(index, index + size).join(' ');
        const tw = translateName(phrase);
        if (tw) {
          matched = { size, tw };
          break;
        }
      }
      if (!matched) {
        return null;
      }
      translated.push(matched.tw);
      index += matched.size;
    }

    return translated.join(' ');
  }

  function translateRelativeTime(value) {
    const lower = String(value || '').trim().toLowerCase();
    if (!lower) {
      return null;
    }

    const exact = EXACT_TW[lower];
    if (exact) {
      return exact;
    }

    const numberMatch = lower.match(/^(\d+)\s+(second|minute|hour|day|week|month|year)s?\s+ago$/);
    if (numberMatch) {
      return `${numberMatch[1]} ${RELATIVE_UNIT_TW[numberMatch[2]]}前`;
    }

    const singleMatch = lower.match(/^(a|an)\s+(second|minute|hour|day|week|month|year)\s+ago$/);
    if (singleMatch) {
      return `1 ${RELATIVE_UNIT_TW[singleMatch[2]]}前`;
    }

    return null;
  }

  function replaceTrimmed(original, trimmed, translated) {
    return original.replace(trimmed, translated);
  }

  function translateStatLabel(label) {
    const key = String(label || '').trim().toLowerCase();
    return STAT_LABEL_TW[key] || null;
  }

  function translateText(rawText) {
    const text = String(rawText || '');
    const trimmed = text.trim();
    if (!trimmed) {
      return null;
    }

    const exact = EXACT_TW[trimmed];
    if (exact) {
      return replaceTrimmed(text, trimmed, exact);
    }

    const exactCaseInsensitive = EXACT_TW_CI[trimmed.toLowerCase()];
    if (exactCaseInsensitive) {
      return replaceTrimmed(text, trimmed, exactCaseInsensitive);
    }

    const titleMatch = trimmed.match(/^Top Gear - (.+?) - ([\d,]+\s+DPS) - Raidbots$/);
    if (titleMatch) {
      return replaceTrimmed(text, trimmed, `最佳配裝 - ${titleMatch[1]} - ${titleMatch[2]} - Raidbots`);
    }

    const direct = translateName(trimmed);
    if (direct) {
      return replaceTrimmed(text, trimmed, direct);
    }

    const sequence = translateTermSequence(trimmed);
    if (sequence && sequence !== trimmed) {
      return replaceTrimmed(text, trimmed, sequence);
    }

    const withCount = trimmed.match(/^([A-Za-z' -]+)(\s*:\s*\d+\s*\/\s*\d+)$/);
    if (withCount) {
      const translatedName = translateTermSequence(withCount[1]) || translateName(withCount[1]);
      if (translatedName) {
        return replaceTrimmed(text, trimmed, `${translatedName}${withCount[2]}`);
      }
    }

    const classSpecBanner = trimmed.match(/^-\s*([A-Za-z' -]+)\s*-\s*([A-Za-z' -]+)$/);
    if (classSpecBanner) {
      const left = classSpecBanner[1].trim();
      const right = classSpecBanner[2].trim();
      const leftTw = translateTermSequence(left) || translateName(left) || left;
      const rightTw = translateTermSequence(right) || translateName(right) || right;
      if (leftTw !== left || rightTw !== right) {
        return replaceTrimmed(text, trimmed, `- ${leftTw} - ${rightTw}`);
      }
    }

    const patchwerkHistory = trimmed.match(/^Patchwerk\s*-\s*Weekly\s*-\s*(.+)$/i);
    if (patchwerkHistory) {
      const rawRelative = patchwerkHistory[1].trim();
      const relativeTw = translateRelativeTime(rawRelative) || rawRelative;
      return replaceTrimmed(text, trimmed, `木樁戰 - 每週 - ${relativeTw}`);
    }

    const relativeOnly = translateRelativeTime(trimmed);
    if (relativeOnly) {
      return replaceTrimmed(text, trimmed, relativeOnly);
    }

    const upgradeMatch = trimmed.match(/^Upgrade to\s+(\d+)$/i);
    if (upgradeMatch) {
      return replaceTrimmed(text, trimmed, `升級至 ${upgradeMatch[1]}`);
    }

    const setMatch = trimmed.match(/^(\d+)\s+set$/i);
    if (setMatch) {
      return replaceTrimmed(text, trimmed, `${setMatch[1]} 件套`);
    }

    const maxSelectionMatch = trimmed.match(/^Max\s+(\d+)\s+selections$/i);
    if (maxSelectionMatch) {
      return replaceTrimmed(text, trimmed, `最多選擇 ${maxSelectionMatch[1]} 項`);
    }

    const hiddenItemMatch = trimmed.match(/^(\d+)\s+low level item hidden\.$/i);
    if (hiddenItemMatch) {
      return replaceTrimmed(text, trimmed, `已隱藏 ${hiddenItemMatch[1]} 件低等級物品。`);
    }

    const levelSpecClassMatch = trimmed.match(/^(\d+)\s+([A-Za-z' -]+\s+[A-Za-z' -]+)$/);
    if (levelSpecClassMatch) {
      const translatedTail = translateTermSequence(levelSpecClassMatch[2]);
      if (translatedTail) {
        return replaceTrimmed(text, trimmed, `${levelSpecClassMatch[1]} ${translatedTail}`);
      }
    }

    const singleStatValue = trimmed.match(/^(\d+)\s+(Crit|Haste|Mast|Mastery|Vers|Versatility|Primary Stat|Highest Secondary)$/i);
    if (singleStatValue) {
      const statTw = translateStatLabel(singleStatValue[2]);
      if (statTw) {
        return replaceTrimmed(text, trimmed, `${singleStatValue[1]} ${statTw}`);
      }
    }

    const dualStatValue = trimmed.match(
      /^(\d+)\s+(Crit|Haste|Mast|Mastery|Vers|Versatility)\s*&\s*(\d+)\s+(Crit|Haste|Mast|Mastery|Vers|Versatility)$/i
    );
    if (dualStatValue) {
      const leftTw = translateStatLabel(dualStatValue[2]);
      const rightTw = translateStatLabel(dualStatValue[4]);
      if (leftTw && rightTw) {
        return replaceTrimmed(text, trimmed, `${dualStatValue[1]} ${leftTw} & ${dualStatValue[3]} ${rightTw}`);
      }
    }

    const wontChangeEnchant = trimmed.match(/^Top Gear will not change any (.+) enchants$/i);
    if (wontChangeEnchant) {
      const slotRaw = wontChangeEnchant[1].trim().toLowerCase();
      const slotTw = ENCHANT_SLOT_TW[slotRaw] || wontChangeEnchant[1].trim();
      return replaceTrimmed(text, trimmed, `Top Gear 不會變更任何${slotTw}附魔`);
    }

    const globalSetting = trimmed.match(/^Top Gear will use the global (food|flask|potion) setting$/i);
    if (globalSetting) {
      const settingTw =
        globalSetting[1].toLowerCase() === 'food'
          ? '食物'
          : globalSetting[1].toLowerCase() === 'flask'
            ? '精煉藥劑'
            : '藥水';
      return replaceTrimmed(text, trimmed, `Top Gear 將使用全域${settingTw}設定`);
    }

    return null;
  }

  function shouldSkipElement(el) {
    if (SKIP_TAGS.has(el.tagName)) {
      return true;
    }

    if (el.isContentEditable) {
      return true;
    }

    const className = typeof el.className === 'string' ? el.className : '';
    if (className && SKIP_CLASS_KEYWORDS.some((keyword) => className.includes(keyword))) {
      return true;
    }

    return false;
  }

  function walkTextNodes(root) {
    const rootNode = root instanceof Document ? root.body : root;
    if (!(rootNode instanceof Node)) {
      return;
    }

    const walker = document.createTreeWalker(
      rootNode,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          const parent = node.parentElement;
          if (!parent) {
            return NodeFilter.FILTER_REJECT;
          }

          let current = parent;
          while (current) {
            if (shouldSkipElement(current)) {
              return NodeFilter.FILTER_REJECT;
            }
            if (current === rootNode) {
              break;
            }
            current = current.parentElement;
          }

          return NodeFilter.FILTER_ACCEPT;
        },
      }
    );

    const updates = [];
    let node = walker.nextNode();
    while (node) {
      const original = node.textContent;
      if (translatedNodeText.get(node) === original) {
        node = walker.nextNode();
        continue;
      }

      const translated = translateText(original);
      if (translated && translated !== original) {
        updates.push({ node, translated });
      } else {
        translatedNodeText.set(node, original);
      }
      node = walker.nextNode();
    }

    for (const { node: targetNode, translated } of updates) {
      targetNode.textContent = translated;
      translatedNodeText.set(targetNode, translated);
    }
  }

  function translateAttribute(element, name) {
    const value = element.getAttribute(name);
    if (!value) {
      return false;
    }
    const translated = translateText(value);
    if (translated && translated !== value) {
      element.setAttribute(name, translated);
      return true;
    }
    return false;
  }

  function translateInputValue(element) {
    if (!(element instanceof HTMLInputElement)) {
      return false;
    }
    const type = (element.type || '').toLowerCase();
    if (type !== 'button' && type !== 'submit' && type !== 'reset') {
      return false;
    }
    const value = element.getAttribute('value');
    if (!value) {
      return false;
    }
    const translated = translateText(value);
    if (translated && translated !== value) {
      element.setAttribute('value', translated);
      return true;
    }
    return false;
  }

  function translateElementAttributes(element) {
    let touched = false;
    for (const name of ATTRIBUTE_NAMES) {
      if (translateAttribute(element, name)) {
        touched = true;
      }
    }
    if (translateInputValue(element)) {
      touched = true;
    }
    return touched;
  }

  function translateAttributesInTree(root) {
    if (!(root instanceof Element)) {
      return;
    }

    translateElementAttributes(root);
    const elements = root.querySelectorAll(ATTRIBUTE_SELECTOR);
    for (const element of elements) {
      translateElementAttributes(element);
    }
  }

  function queueWowheadRefresh() {
    if (wowheadRefreshTimer !== null) {
      return;
    }

    wowheadRefreshTimer = window.setTimeout(() => {
      wowheadRefreshTimer = null;
      const wowheadPower = window.$WowheadPower;
      if (wowheadPower && typeof wowheadPower.refreshLinks === 'function') {
        wowheadRefreshRetries = 0;
        wowheadPower.refreshLinks();
      } else if (wowheadRefreshRetries < MAX_WOWHEAD_RETRIES) {
        wowheadRefreshRetries += 1;
        queueWowheadRefresh();
      }
    }, 80);
  }

  function patchWowheadLinks(root = document) {
    const links = [];

    if (root instanceof HTMLAnchorElement) {
      links.push(root);
    }

    if (root instanceof Document || root instanceof Element) {
      for (const link of root.querySelectorAll('a[href*="wowhead.com"]')) {
        links.push(link);
      }
    }

    let touched = false;
    for (const link of links) {
      const href = link.getAttribute('href') || '';
      if (!WOWHEAD_SUBDOMAINS.test(href)) {
        continue;
      }
      if (!/(?:\/item(?:=|\/)|\/spell(?:=|\/))/.test(href)) {
        continue;
      }

      const newHref = href.replace(WOWHEAD_SUBDOMAINS, 'https://tw.wowhead.com/');
      if (newHref !== href) {
        link.setAttribute('href', newHref);
        touched = true;
      }

      const isItemLink = /\/item(?:=|\/)/.test(newHref);
      const isSpellLink = /\/spell(?:=|\/)/.test(newHref);
      const hasText = (link.textContent || '').trim().length > 0;
      const hasImage = link.querySelector('img') !== null;
      if ((isItemLink || isSpellLink) && hasText && !hasImage && link.dataset.whRenameLink !== 'true') {
        link.dataset.whRenameLink = 'true';
        touched = true;
      }
    }

    if (touched) {
      queueWowheadRefresh();
    }
  }

  function translateDocumentTitle() {
    const translated = translateText(document.title);
    if (translated && translated !== document.title) {
      document.title = translated;
    }
  }

  function getRectCenter(rect) {
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  }

  function isLikelyItemOrEnchantName(text) {
    if (!text) {
      return false;
    }

    const value = text.trim();
    if (value.length < 4 || value.length > 64) {
      return false;
    }

    if (EXACT_TW[value]) {
      return false;
    }

    if (!/[A-Za-z]/.test(value)) {
      return false;
    }

    if (/[0-9:/()[\]{}]/.test(value)) {
      return false;
    }

    if (/^[a-z\s'-]+$/.test(value)) {
      return false;
    }

    const words = value.split(/\s+/).filter(Boolean);
    if (words.length > 10) {
      return false;
    }

    return true;
  }

  function findNearestWowheadIconLink(textElement) {
    const textRect = textElement.getBoundingClientRect();
    if (textRect.width === 0 && textRect.height === 0) {
      return null;
    }

    const textCenter = getRectCenter(textRect);

    let ancestor = textElement;
    for (let depth = 0; depth < 6 && ancestor; depth += 1) {
      ancestor = ancestor.parentElement;
      if (!(ancestor instanceof Element)) {
        continue;
      }

      const links = ancestor.querySelectorAll(WOWHEAD_ITEM_OR_SPELL_LINK);
      let bestLink = null;
      let bestScore = Number.POSITIVE_INFINITY;

      for (const link of links) {
        if (!(link instanceof HTMLAnchorElement)) {
          continue;
        }
        if (link.querySelector('img') === null) {
          continue;
        }

        const rect = link.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) {
          continue;
        }

        const center = getRectCenter(rect);
        const dx = Math.abs(center.x - textCenter.x);
        const dy = Math.abs(center.y - textCenter.y);
        if (dy > 42 || dx > 420) {
          continue;
        }

        const score = dy * 8 + dx;
        if (score < bestScore) {
          bestScore = score;
          bestLink = link;
        }
      }

      if (bestLink) {
        return bestLink;
      }
    }

    return null;
  }

  function linkifyNameElement(nameElement, iconLink) {
    if (nameElement.closest('a')) {
      return false;
    }
    if (nameElement.dataset.twWowheadLinked === 'true') {
      return false;
    }

    const href = iconLink.getAttribute('href');
    if (!href || !/wowhead\.com\//i.test(href)) {
      return false;
    }

    const originalText = (nameElement.textContent || '').trim();
    if (!isLikelyItemOrEnchantName(originalText)) {
      return false;
    }

    const anchor = document.createElement('a');
    anchor.setAttribute('href', href);
    anchor.setAttribute('rel', 'noopener');
    anchor.setAttribute('target', '_blank');
    anchor.dataset.whRenameLink = 'true';
    anchor.style.color = 'inherit';
    anchor.style.textDecoration = 'none';
    anchor.textContent = originalText;

    const dataWowhead = iconLink.getAttribute('data-wowhead');
    if (dataWowhead) {
      anchor.setAttribute('data-wowhead', dataWowhead);
    }

    nameElement.textContent = '';
    nameElement.appendChild(anchor);
    nameElement.dataset.twWowheadLinked = 'true';
    return true;
  }

  function linkifyNearbyItemNames(root = document) {
    const scope = root instanceof Document ? root.body : root;
    if (!(scope instanceof Element)) {
      return false;
    }

    const candidates = [];
    if (scope.matches('p,span,div')) {
      candidates.push(scope);
    }
    for (const node of scope.querySelectorAll('p,span,div')) {
      candidates.push(node);
    }
    let touched = false;

    for (const candidate of candidates) {
      if (!(candidate instanceof Element)) {
        continue;
      }

      if (candidate.childElementCount !== 0) {
        continue;
      }
      if (candidate.closest('a,button,label,textarea,select,[role="button"]')) {
        continue;
      }
      if (candidate.classList.contains('Tooltip_box')) {
        continue;
      }
      if (candidate.dataset.twWowheadLinked === 'true') {
        continue;
      }

      const text = (candidate.textContent || '').trim();
      if (!isLikelyItemOrEnchantName(text)) {
        continue;
      }

      const iconLink = findNearestWowheadIconLink(candidate);
      if (!iconLink) {
        continue;
      }

      if (linkifyNameElement(candidate, iconLink)) {
        touched = true;
      }
    }

    return touched;
  }

  function queueRoot(root) {
    if (!root) {
      return;
    }

    let target = root;
    if (target instanceof Document) {
      target = target.body;
    } else if (target.nodeType === Node.TEXT_NODE) {
      target = target.parentElement;
    }

    if (!(target instanceof Element)) {
      return;
    }

    pendingRoots.add(target);
    if (flushTimer !== null) {
      return;
    }

    flushTimer = window.setTimeout(flushPendingRoots, 160);
  }

  function flushPendingRoots() {
    flushTimer = null;
    const roots = Array.from(pendingRoots);
    pendingRoots.clear();

    let linkifyTouched = false;
    for (const root of roots) {
      if (!document.body || !document.contains(root)) {
        continue;
      }
      if (linkifyNearbyItemNames(root)) {
        linkifyTouched = true;
      }
      translateAttributesInTree(root);
      walkTextNodes(root);
      patchWowheadLinks(root);
    }

    if (linkifyTouched) {
      patchWowheadLinks(document);
    }
    translateDocumentTitle();
  }

  function runFullPass(resetNodeCache = false) {
    if (!document.body) {
      return;
    }
    if (resetNodeCache) {
      translatedNodeText = new WeakMap();
    }
    queueRoot(document.body);
  }

  function onUrlChange(force = false) {
    const currentUrl = location.href;
    if (!force && currentUrl === lastUrl) {
      return;
    }

    lastUrl = currentUrl;
    runFullPass(true);
    setTimeout(() => runFullPass(false), 300);
    setTimeout(() => runFullPass(false), 900);
    setTimeout(() => runFullPass(false), 1800);
  }

  function startWhenReady() {
    if (!document.body) {
      document.addEventListener('DOMContentLoaded', startWhenReady, { once: true });
      return;
    }

    runFullPass(true);
    setTimeout(() => runFullPass(false), 350);
    setTimeout(() => runFullPass(false), 1000);
    setTimeout(() => runFullPass(false), 2200);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          for (const added of mutation.addedNodes) {
            if (added.nodeType === Node.ELEMENT_NODE || added.nodeType === Node.TEXT_NODE) {
              queueRoot(added);
            }
          }
        } else if (mutation.type === 'characterData') {
          queueRoot(mutation.target);
        } else if (mutation.type === 'attributes') {
          const target = mutation.target;
          if (target instanceof Element) {
            queueRoot(target);
            if (mutation.attributeName === 'href') {
              patchWowheadLinks(target);
            }
          }
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['href', 'title', 'aria-label', 'placeholder', 'value'],
    });
  }

  const rawPushState = history.pushState.bind(history);
  history.pushState = function (...args) {
    const result = rawPushState(...args);
    onUrlChange();
    return result;
  };

  const rawReplaceState = history.replaceState.bind(history);
  history.replaceState = function (...args) {
    const result = rawReplaceState(...args);
    onUrlChange();
    return result;
  };

  window.addEventListener('popstate', () => onUrlChange());
  window.addEventListener('hashchange', () => onUrlChange());

  startWhenReady();
})();
