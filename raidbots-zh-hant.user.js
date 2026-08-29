// ==UserScript==
// @name         Raidbots Traditional Chinese + Wowhead Patch
// @namespace    https://www.raidbots.com/
// @version      1.6.3
// @description  Translate Raidbots UI to Traditional Chinese and patch Wowhead links/tooltips for dynamic SPA pages.
// @author       mcc
// @match        https://www.raidbots.com/*
// @match        https://raidbots.com/*
// @require      https://raw.githubusercontent.com/mcc1/WowUserScript/master/libs/wowhead-tw-helper.js?v=1.6.1
// @require      https://raw.githubusercontent.com/mcc1/WowUserScript/master/libs/game-names-tw.js?v=1
// @updateURL    https://raw.githubusercontent.com/mcc1/WowUserScript/master/raidbots-zh-hant.user.js
// @downloadURL  https://raw.githubusercontent.com/mcc1/WowUserScript/master/raidbots-zh-hant.user.js
// @run-at       document-start
// @grant        none
// @license      MIT
// ==/UserScript==

(function () {
  'use strict';

  const TW_PREF_KEY = 'tw-translation-enabled';

  function readTranslationPref() {
    try {
      const stored = localStorage.getItem(TW_PREF_KEY);
      return stored === null ? true : stored === 'true';
    } catch (err) {
      return true;
    }
  }

  function persistTranslationPrefAndReload(enabled, defer) {
    try {
      localStorage.setItem(TW_PREF_KEY, enabled ? 'true' : 'false');
    } catch (err) {}
    if (defer) {
      setTimeout(() => location.reload(), 80);
    } else {
      location.reload();
    }
  }

  const translationEnabled = readTranslationPref();

  function findRaidbotsLanguageMenu() {
    const menus = document.querySelectorAll('.Menu');
    for (const menu of menus) {
      const items = menu.querySelectorAll('.NavItem');
      for (const item of items) {
        const text = (item.textContent || '').trim();
        if (text === 'Deutsch' || text === 'Português (Brasil)') {
          return menu;
        }
      }
    }
    return null;
  }

  function bindRaidbotsLanguageItems(menu) {
    const items = menu.querySelectorAll('.NavItem:not([data-tw-lang-option])');
    for (const item of items) {
      if (item.dataset.twDisableListener === 'true') continue;
      item.dataset.twDisableListener = 'true';
      item.addEventListener('click', () => {
        if (!translationEnabled) return;
        persistTranslationPrefAndReload(false, true);
      });
    }
  }

  function setLanguageTriggerLabel(trigger) {
    if (!trigger) return;
    for (const node of trigger.childNodes) {
      if (node.nodeType === Node.TEXT_NODE && (node.textContent || '').trim()) {
        if (node.textContent !== '正體中文') {
          node.textContent = '正體中文';
        }
        return;
      }
    }
    trigger.insertBefore(document.createTextNode('正體中文'), trigger.firstChild);
  }

  function injectTwLanguageOption() {
    const menu = findRaidbotsLanguageMenu();
    if (!menu) return false;
    bindRaidbotsLanguageItems(menu);

    if (translationEnabled) {
      const dropdown = menu.closest('.Dropdown');
      if (dropdown) {
        const trigger = dropdown.querySelector('a.NavItem');
        if (trigger) {
          setLanguageTriggerLabel(trigger);
        }
      }
    }

    if (menu.querySelector('[data-tw-lang-option="zhtw"]')) return true;

    const item = document.createElement('a');
    item.className = 'NavItem';
    item.dataset.twLangOption = 'zhtw';
    item.textContent = translationEnabled ? '✓ 正體中文' : '正體中文';
    item.title = translationEnabled
      ? '已啟用正體中文翻譯（點擊停用）'
      : '啟用正體中文翻譯';
    item.style.cssText = [
      'box-sizing: border-box',
      'font-size: 12px',
      'font-weight: 700',
      'line-height: 1rem',
      'text-decoration: none',
      'display: flex',
      'align-items: center',
      'align-self: stretch',
      'padding: 10px',
      'cursor: pointer',
      'text-transform: uppercase',
      'letter-spacing: 0.2em',
      'color: ' + (translationEnabled ? '#0f8' : '#fb3'),
    ].join('; ');
    item.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      persistTranslationPrefAndReload(!translationEnabled, false);
    });
    menu.insertBefore(item, menu.firstChild);
    return true;
  }

  function startTwLanguageInjector() {
    if (!document.body) {
      document.addEventListener('DOMContentLoaded', startTwLanguageInjector, { once: true });
      return;
    }
    injectTwLanguageOption();
    setTimeout(injectTwLanguageOption, 500);
    setTimeout(injectTwLanguageOption, 2000);

    let injectScheduled = false;
    const scheduleInject = () => {
      if (injectScheduled) return;
      injectScheduled = true;
      requestAnimationFrame(() => {
        injectScheduled = false;
        injectTwLanguageOption();
      });
    };
    const observer = new MutationObserver(scheduleInject);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  startTwLanguageInjector();

  if (!translationEnabled) {
    return;
  }

  window.Locale = {
    getId: function () { return 10; },
    getName: function () { return 'zhtw'; },
  };

  if (typeof window.whTooltips === 'undefined') {
    window.whTooltips = {};
  }
  window.whTooltips.colorLinks = true;
  window.whTooltips.iconizeLinks = false;
  window.whTooltips.renameLinks = false;
  window.whTooltips.locale = 'zhtw';
  window.whTooltips.domain = 'tw';




  // 副本／團本／首領的譯名不寫在這裡 —— 由 libs/game-names-tw.js 提供，
  // 該檔由 tools/generate-game-names.mjs 依暴雪官方 Journal API（zh_TW）產生。
  //
  // 以下只保留暴雪 Journal 沒有對應條目的 raidbots 自訂標籤（例如把 Mechagon
  // 拆成工坊／廢料場、DOTI 與 Tazavesh 的分段）。新增副本請重跑產生器，不要加在這裡。
  const DUNGEON_TW_MAP = Object.freeze({
    // World of Warcraft: Midnight (12.0 / 12.1) - Raids (午夜團隊副本)
    march_on_queldanas: '進軍奎爾達納斯',

    // World of Warcraft: Midnight (12.1 Season 2) - Dungeons (午夜第 2 季地城)

    // World of Warcraft: Midnight (12.0 Season 1) - Dungeons (午夜第 1 季地城)

    // The War Within - Raids (地心之戰團隊副本)

    // The War Within - Season 2 Dungeons (第 2 季地城)
    the_floodgate: '水閘行動',
    operation_mechagon_workshop: '機械岡行動 - 工坊',
    operation_mechagon_junkyard: '機械岡行動 - 廢料場',
    mechagon_workshop: '機械岡行動 - 工坊',
    mechagon_junkyard: '機械岡行動 - 廢料場',

    // The War Within - Season 1 Dungeons (第 1 季地城)

    // The War Within - Delves (探究)
    mycomancers_cavern: '菌術師洞穴',

    // Midnight - Delves & Dungeons (午夜探究與地城)

    // Classic / Previous Expansions Dungeons & Raids
    uldaman_legacy_of_tyr: '奧達曼：提爾的遺產',
    dotis_galakronds_fall: '永恆黎明：葛拉克朗殞命之地',
    dotis_murozonds_rise: '永恆黎明：姆多茲諾崛起',
    galakronds_fall: '葛拉克朗殞命之地',
    murozonds_rise: '姆多茲諾崛起',
    tazavesh_streets_of_wonder: '塔札維許：奇蹟街道',
    tazavesh_soleahs_gambit: '塔札維許：索利亞的計謀',
  });


  const EXACT_TW = Object.freeze({
    'Top Gear': '最佳配裝',
    'Quick Sim': '快速模擬',
    Droptimizer: '掉落最佳化',
    Advanced: '進階',
    More: '更多',
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
    'Catalyst Charges': '催化次數',
    'How many Catalyst charges do you want to use?': '你想使用幾次催化？',
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
    'Dungeon Summary': '副本總覽',
    Sort: '排序',
    Priority: '優先順序',
    'Expected Value': '期望值',
    Best: '最佳',
    'Show All Variations': '顯示所有變體',
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
    'Convert to Catalyst Item': '轉化為催化物品',
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
    'Sets the upgrade level of the item and allows catalyst transformations': '設定物品升級等級，並允許催化轉化。',
    'Select multiple pieces of gear and Raidbots will generate all possible combinations and sim them': '選擇多件裝備後，Raidbots 會產生所有可能組合並進行模擬。',
    'Stats to apply to crafted items. Default determined by what is most common on your items': '套用到製作裝備的屬性。預設值依你目前裝備最常見屬性決定。',
    'Warning: Item Search is only intended for max level characters and may allow simming items that cannot be obtained in game.': '警告：物品搜尋僅針對滿等角色，且可能允許模擬遊戲中無法取得的物品。',
    'This will limit how many Catalyst items are included in a single combination. You must use the': '這會限制單一組合中可包含的催化物品數量。你必須使用',
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
    'Boss Summary': '首領總覽',
    'Boss Order': '首領順序',
    Sources: '來源',
    'Show Previous Tiers': '顯示先前階段',
    'Raid Difficulty': '團隊副本難度',
    'Raid Finder': '團隊搜尋器',
    Normal: '普通',
    Heroic: '英雄',
    Mythic: '傳奇',
    'Items to Sim': '模擬物品',
    'Group By': '分組依據',
    'Item Slot': '物品欄位',
    Boss: '首領',
    'Main Hand Weapon': '主手武器',
    'Off Hand Weapon': '副手武器',
    FINGER: '手指',
    Finger: '手指',
    Trinket: '飾品',
    'Trinket 1': '飾品 1',
    'Trinket 2': '飾品 2',
    'All items have been excluded. Please enable some to run Droptimizer': '所有物品均已被排除。請啟用部分物品以執行掉落最佳化',
    'Preferred Gem:': '偏好寶石：',
    'Notes / Limitations': '注意事項 / 限制',
    'Run Droptimizer': '執行掉落最佳化',
    'Load from Armory': '從戰網檔案匯入',
    Region: '地區',
    Realm: '伺服器',
    Character: '角色',
    // Droptimizer Sources & Seasons
    'BONUS ROLL SUMMARY': '好運符總覽',
    'Bonus Roll Summary': '好運符總覽',
    '好運符 SUMMARY': '好運符總覽',
    '好運符 Summary': '好運符總覽',
    'BONUS ROLL': '好運符',
    'Bonus Roll': '好運符',
    'Best Item': '最佳物品',
    'SimC Export': 'SimC 匯出',
    'Report Options': '報告選項',
    'More Info': '更多資訊',
    SUMMARY: '總覽',
    Summary: '總覽',
    'SimC Notifications': 'SimC 通知',
    'The sim generated some warning/error messages. Check the "SimC Notifications" section for more details.':
      '模擬產生了一些警告/錯誤訊息。請查看「SimC 通知」區塊以了解更多細節。',
    'Heroic Vault': '英雄寶庫',
    'Mythic Vault': '傳奇寶庫',
    'Normal Vault': '普通寶庫',
    'LFR Vault': '團隊搜尋器寶庫',
    '- Heroic Vault': '- 英雄寶庫',
    '- Mythic Vault': '- 傳奇寶庫',
    '- Normal Vault': '- 普通寶庫',
    '- LFR Vault': '- 團隊搜尋器寶庫',
    '1 variation hidden': '1 個變體已隱藏',
    'Midnight Raids': '午夜團隊副本',
    'Midnight Dungeons': '午夜地城',
    'The Tidebound Grotto': '浪縛石窟',
    'Tidebound Grotto': '浪縛石窟',
    'Nymrissa Wavecaller': '『召浪者』奈姆莉莎',
    'Nymrissa': '奈姆莉莎',
    'High Shaman Talan': '高階薩滿塔蘭',
    'Tidebound Colossus': '浪縛巨像',
    'Season 1 Raids': '第 1 季團隊副本',
    'Season 2 Raids': '第 2 季團隊副本',
    'Season 3 Raids': '第 3 季團隊副本',
    'The War Within Raids': '地心之戰團隊副本',
    'The War Within Dungeons': '地心之戰地城',
    'Season 1 Dungeons': '第 1 季地城',
    'Season 2 Dungeons': '第 2 季地城',
    'Season 3 Dungeons': '第 3 季地城',
    'Season 1 Mythic+ Dungeons': '第 1 季傳奇鑰石地城',
    'Season 2 Mythic+ Dungeons': '第 2 季傳奇鑰石地城',
    'Season 3 Mythic+ Dungeons': '第 3 季傳奇鑰石地城',
    'Mythic+ Dungeons': '傳奇鑰石地城',
    'Season 1 Normal Dungeons': '第 1 季普通地下城',
    'Season 2 Normal Dungeons': '第 2 季普通地下城',
    'Season 3 Normal Dungeons': '第 3 季普通地下城',
    'Normal Dungeons': '普通地下城',
    'World Bosses': '世界首領',
    'World Bosses (Midnight)': '世界首領（午夜）',
    'World Bosses (The War Within)': '世界首領（地心之戰）',
    'World Bosses (Season 1)': '第 1 季世界首領',
    'World Bosses (Season 2)': '第 2 季世界首領',
    'World Bosses (Season 3)': '第 3 季世界首領',
    'Season 1': '第 1 季',
    'Season 2': '第 2 季',
    'Season 3': '第 3 季',
    'The Coiled Isle': '盤蛇島',
    'Coiled Isle': '盤蛇島',
    'Curse of Ula\'tek': '烏拉泰克的詛咒',
    'Epic Profession Items': '史詩專業物品',
    'Rare Profession Items': '稀有專業物品',
    'PVP Profession Items': 'PVP 專業物品',
    'Catalyst Season 1': '第 1 季催化',
    'Catalyst Season 2': '第 2 季催化',
    'Catalyst Season 3': '第 3 季催化',
    'Delves Season 1': '第 1 季探索',
    'Delves Season 2': '第 2 季探索',
    'Delves Season 3': '第 3 季探索',
    'Prey Season 1': '第 1 季獵物',
    'Prey Season 2': '第 2 季獵物',
    'Prey Season 3': '第 3 季獵物',
    'PVP Season 1 (Conquest)': '第 1 季 PVP（征服）',
    'PVP Season 2 (Conquest)': '第 2 季 PVP（征服）',
    'PVP Season 3 (Conquest)': '第 3 季 PVP（征服）',
    'PVP Season 1 (Bloody Tokens)': '第 1 季 PVP（血腥代幣）',
    'PVP Season 2 (Bloody Tokens)': '第 2 季 PVP（血腥代幣）',
    'PVP Season 3 (Bloody Tokens)': '第 3 季 PVP（血腥代幣）',
    'PVP Season 1 (Honor)': '第 1 季 PVP（榮譽）',
    'PVP Season 2 (Honor)': '第 2 季 PVP（榮譽）',
    'PVP Season 3 (Honor)': '第 3 季 PVP（榮譽）',

    // Midnight - Raids (午夜團隊副本)
    'March on Quel\'Danas': '進軍奎爾達納斯',

    // The Venomous Abyss Bosses (劇毒深淵首領 - 台服官方繁中)
    'Nek\'zali the Soulcoiler': '『纏魂者』尼札利',
    'Nekzali the Soulcoiler': '『纏魂者』尼札利',
    'Nek\'zali': '尼札利',
    'The Twin Fangs': '雙生毒牙',
    'Twin Fangs': '雙生毒牙',
    'Vexhul and Ithraz': '薇克修爾與伊斯拉茲',
    'Vexhul': '薇克修爾',
    'Ithraz': '伊斯拉茲',
    'Entombed Sentinels': '埋葬衛哨',
    'Vashnik the Malignant': '『惡性之毒』伐許尼克',
    'Vashnik': '伐許尼克',
    'The Lost Explorers': '迷路的探險者',
    'Lost Explorers': '迷路的探險者',
    'Sszorak': '司佐拉',
    'The Coiled Altar': '盤蛇祭壇',
    'Coiled Altar': '盤蛇祭壇',
    'Ula\'tek': '烏拉特克',
    'Ulatek': '烏拉特克',

    // Midnight Season 2 Dungeons & Bosses (午夜第 2 季地城與首領 - 台服官方繁中)
    'Rav\'i': '拉維',
    'High Evolutionist': '高階進化者',
    'Zul\'jan': '祖爾贊',

    'Nalorakk': '納羅拉克',

    'The Golden Serpent': '黃金巨蛇',
    'Mchimba the Embalmer': '防腐者姆沁巴',
    'The Council of Tribes': '部族議會',
    'Dazar, The First King': '始祖之王達薩',

    'Adderis and Aspix': '艾德里斯與阿斯皮克斯',
    'Merektha': '梅雷克莎',
    'Galvazzt': '加瓦茲特',
    'Avatar of Sethraliss': '瑟沙利斯的化身',

    'Melidrussa Chillworn': '莫莉杜莎·霜亡',
    'Kokia Blazehoof': '柯奇亞·熾足',
    'Kyrakka and Erkhart Stormvein': '凱拉卡與埃克哈特·風脈',

    // Midnight Season 1 Dungeons (午夜第 1 季地城 - 台服官方繁中)

    // The War Within - Raids (地心之戰團隊副本)
    'The Liberation of Undermine': '解放幽坑城',

    // Liberation of Undermine Bosses (解放幽坑城首領)
    'Vexie and the Geargrinders': '薇克希和齒輪幫',
    'Vexie & the Geargrinders': '薇克希和齒輪幫',
    'Cauldron of Carnage': '兇殘大鍋',
    'Rik Reverb': '里克‧李福伯',
    'Stix Bunkjunker': '史提克‧邦江克',
    'Sprocketmonger Lockenstock': '鏈販‧鎖貨',
    'The One-Armed Bandit': '獨臂強盜',
    'One-Armed Bandit': '獨臂強盜',
    'Mug\'Zee, Heads of Security': '瑪格吉',
    'Mug\'Zee': '瑪格吉',
    'Chrome King Gallywix': '閃亮亮大王加里維克斯',
    'Gallywix': '加里維克斯',

    // Nerub-ar Palace Bosses (奈幽巴宮殿首領)
    'Ulgrax the Devourer': '吞噬者烏格拉克斯',
    'The Bloodbound Horror': '血縛恐懼',
    'Bloodbound Horror': '血縛恐懼',
    'Sikran, Captain of the Sureki': '蘇雷吉隊長希克朗',
    'Sikran': '希克朗',
    'Rasha\'nan': '羅夏南',
    'Broodtwister Ovi\'nax': '育巢者歐維納克斯',
    'Nexus-Princess Ky\'veza': '奧核之姬綺維札',
    'The Silken Court': '絲線議會',
    'Silken Court': '絲線議會',
    'Queen Ansurek': '安蘇芮克女王',

    // World Bosses (世界首領)
    'Orta, the Broken Mountain': '碎山歐爾塔',
    'Kordac, the Dormant Protector': '沉睡的守護者寇達克',
    'Aggregation of Horrors': '恐怖聚合體',
    'Shurrai, Atrocity of the Undersea': '海底暴行舒瑞',

    // Season 2 Dungeons & Bosses (第 2 季地城與首領)
    'Big Dahlia': '大達莉亞',
    'Demolition Duo': '爆破雙人組',
    'Swampface': '沼澤臉',
    'Geezle Gigazap': '吉澤爾·吉咖電',

    'Brew Master Aldryr': '釀酒大師艾德里爾',
    'I\'pa': '愛帕',
    'Benk Buzzbee': '班克·嗡蜂',
    'Goldie Baronbottom': '高蒂·男爵底',

    'Ol\' Waxbeard': '老蠟鬍',
    'Blazikon': '烈焰巨鳥',
    'The Candle King': '蠟燭之王',
    'Candle King': '蠟燭之王',
    'The Darkness': '黑暗',

    'The Priory of the Sacred Flame': '聖焰隱修院',
    'Captain Dailcry': '戴克里隊長',
    'Baron Braunpyre': '布朗派爾男爵',
    'Prioress Murrpray': '女修道院長穆爾普雷',

    'Kyrioss': '基里奧斯',
    'Stormguard Gorrena': '風暴守衛戈雷納',
    'Voidstone Monstrosity': '虛無之石巨怪',

    'Coin-Operated Crowd Pummeler': '投幣式群眾重擊者',
    'Azerokk': '艾澤洛克',
    'Rixxa Fluxflame': '瑞克莎·流火',
    'Mogul Razdunk': '商業大亨拉茲敦克',

    'An Affront of Challengers': '挑戰者聚會',
    'Gorechop': '高爾喬普',
    'Xav the Unfallen': '不屈的薩夫',
    'Kul\'tharok': '庫薩洛克',
    'Mordretha, the Endless Empress': '無盡女皇莫德蕾薩',
    'Mordretha': '莫德蕾薩',

    'Operation: Mechagon - Workshop': '機械岡行動 - 工坊',
    'Operation Mechagon - Workshop': '機械岡行動 - 工坊',
    'Operation: Mechagon - Junkyard': '機械岡行動 - 廢料場',
    'Operation Mechagon - Junkyard': '機械岡行動 - 廢料場',
    'Tussie Tonks': '狂歡坦克',
    'K.U.-J.0.': '狂犬狗',
    'Machinist\'s Garden': '機械師花園',
    'King Mechagon': '麥卡貢國王',
    'King Gobbamak': '高巴馬克國王',
    'Gunker': '岡克',
    'Trixie & Naeno': '翠克希與奈諾',
    'HK-8 Aerial Oppression Unit': 'HK-8 空中壓制單位',

    // Season 1 Dungeons & Bosses (第 1 季地城與首領)
    'Avanoxx': '阿瓦諾克斯',
    'Anub\'zekt': '阿努布澤克特',
    'Ki\'katal the Harvester': '收割者基卡塔爾',

    'Orator Krix\'vizk': '演說者克里克斯維茲克',
    'Fangs of the Queen': '女王之牙',
    'The Coaglamation': '凝聚之物',
    'Coaglamation': '凝聚之物',
    'Izo, the Grand Splicer': '大接合師伊佐',

    'E.D.N.A.': '愛德娜',
    'Skarmorak': '斯卡莫拉克',
    'Master Machinists': '機械大師',
    'Void Speaker Eirich': '虛無宣講者艾利希',

    'Speaker Shadowcrown': '宣講者暗冠',
    'Anub\'ikkaj': '阿努比卡吉',
    'Rasha\'nan (The Dawnbreaker)': '羅夏南',

    'Ingra Maloch': '英格拉·馬羅克',
    'Mistcaller': '喚霧者',
    'Tred\'ova': '特雷多瓦',

    'Blightbone': '凋骨',
    'Amarth, The Harvester': '收割者阿瑪斯',
    'Surgeon Stitchflesh': '縫肉外科醫生',
    'Nalthor the Rimebinder': '縛霜者納爾索',

    'Chopper Redhook': '「屠夫」紅鉤',
    'Dread Captain Lockwood': '恐怖船長洛克伍德',
    'Hadal Darkfathom': '哈達爾·黑淵',
    'Viq\'Goth': '維克戈斯',

    'General Umbriss': '昂布里斯將軍',
    'Forgemaster Throngus': '鍛造大師索隆格斯',
    'Drahga Shadowburner': '達加·燃影者',
    'Erudax, the Duke of Below': '「地底公爵」埃魯達克斯',
    'Erudax': '埃魯達克斯',
    'Include Off-Spec Items': '包含非主專精物品',
    'Catalyst': '催化',
    'Great Vault Item': '大秘寶庫物品',
    'Upgraded Item': '升級物品',
    'Recraft': '重製',
    'Token': '代幣',
    'Runecarver Legendary': '符文雕刻師傳說',
    'Removed Enchant': '已移除附魔',
    'Removed Gems': '已移除寶石',
    'Added Socket': '已新增插槽',
    'Added Socket from Great Vault': '來自大秘寶庫的新增插槽',
    'Modified Item': '已修改物品',
    'Top Gear Search': '最佳配裝搜尋',
    'Include Catalyst Items': '包含催化物品',
    'Add Vault Socket': '新增寶庫插槽',
    'Preferred Gem': '偏好寶石',
    'Upgrade up to:': '升級至：',
    'Upgrade All Equipped Gear to the Same Level': '將所有已裝備裝備升級至相同等級',
    'Base level, no upgrades': '基礎等級，無升級',
    'Click any row or item to toggle inclusion in the sim': '點擊任一列或物品以切換是否納入模擬',
    'Include All Items': '包含所有物品',
    'Exclude All Items': '排除所有物品',
    'Choose a source and Droptimizer will evaluate all Personal Loot against your currently equipped gear.':
      '選擇來源後，掉落最佳化會將所有個人戰利品與你目前裝備進行比較。',
    'More info on how Droptimizer works': '更多關於掉落最佳化的運作說明',
    'How does Droptimizer work?': '掉落最佳化如何運作？',
    'Highlighted icons indicate 0.05% or better DPS increase.': '高亮圖示代表 0.05% 以上的 DPS 提升。',
    'DPS compared to your current gear.': '與目前裝備相比的 DPS。',
    'These fields allow for a proper comparison to be made for main hand / off hand items when you have a two-hander equipped':
      '這些欄位讓你在裝備雙手武器時，能正確比較主手／副手物品。',
    'The enchant from your two-hander will be used on the main hand item to maintain consistency in the sim':
      '雙手武器的附魔會套用至主手物品，以維持模擬一致性。',
    'Your equipped weapons are used. To test Two Hand vs Main/Off Hand you will need to run multiple sims.':
      '使用你目前裝備的武器。若要測試雙手武器與主手／副手的差異，需執行多次模擬。',
    'Enchants are copied from your current items.': '附魔會沿用目前物品的設定。',
    'Necklace/rings sockets and gems are copied from your current neck or first ring.':
      '項鍊／戒指的插槽與寶石會沿用目前項鍊或第一只戒指。',
    'Rings and trinkets are tried in both slots (as long as a Unique-Equipped constraint is not violated).':
      '戒指與飾品會在兩個欄位都嘗試（除非違反唯一裝備限制）。',
    'Dual wield classes try weapons in both hands.': '雙持職業會在雙手都嘗試武器。',
    'Simulation time is slower when there are more potential upgrades.':
      '潛在升級越多，模擬時間越長。',
    'Droptimizer always uses Smart Sim': '掉落最佳化一律使用 Smart Sim',
    'Vantus Rune not used': '未使用萬塔斯符文',
    'First Aid': '急救',
    Blacksmithing: '鍛造',
    Leatherworking: '製皮',
    Alchemy: '鍊金術',
    Herbalism: '草藥學',
    Cooking: '烹飪',
    Mining: '採礦',
    Tailoring: '裁縫',
    Engineering: '工程學',
    Enchanting: '附魔',
    Fishing: '釣魚',
    Skinning: '剝皮',
    Jewelcrafting: '珠寶設計',
    Inscription: '銘文學',
    Archaeology: '考古學',
  });

  // raidbots 物品卡片上的徽章短碼（bundle 內的 shortName）。
  // 只做大小寫敏感的完全比對，不進 EXACT_TW：EXACT_TW_CI 會自動衍生小寫鍵，
  // 那會讓「Cat」（貓形態之類）這種普通字也被替換掉。
  const ITEM_BADGE_TW = Object.freeze({
    GV: '寶庫',    // Great Vault Item
    CAT: '催化',   // Catalyst
    UPG: '升級',   // Upgraded Item
    REC: '重製',   // Recraft
    TOK: '代幣',   // Token
    RL: '傳說',    // Runecarver Legendary
    MOD: '改造',   // Removed Enchant / Removed Gems / Added Socket / Modified Item
    TGS: '配裝',   // Top Gear Search
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

  const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'CODE', 'PRE']);
  const SKIP_CLASS_KEYWORDS = ['ace_', 'CodeMirror', 'monaco-editor'];
  const ATTRIBUTE_SELECTOR = '[aria-label],[title],[placeholder],input[type="button"][value],input[type="submit"][value],input[type="reset"][value]';
  const ATTRIBUTE_NAMES = ['aria-label', 'title', 'placeholder'];
  const MAX_TERM_WORDS = 5;

  // SPA 換頁時需重建（見 onUrlChange），避免舊節點被誤判為已翻譯
  let translatedNodeText = new WeakMap();

  // 由 @require 的 libs/game-names-tw.js 提供（暴雪 client DB2 的官方 zhTW），
  // 該檔尚未產生時安全降級為查不到。
  function gameNames() {
    return typeof window !== 'undefined' ? window.WowGameNamesTw : null;
  }

  /** 副本／團本／首領 */
  function lookupGameName(value) {
    const table = gameNames();
    if (!table || typeof table.lookup !== 'function' || !value) return null;
    try {
      return table.lookup(value);
    } catch (_) {
      return null;
    }
  }

  /** 種族／職業／專精／英雄天賦 */
  function lookupGameUnit(value) {
    const table = gameNames();
    if (!table || typeof table.lookupUnit !== 'function' || !value) return null;
    try {
      return table.lookupUnit(value);
    } catch (_) {
      return null;
    }
  }

  function normalizeKey(value) {
    return String(value || '')
      .trim()
      .toLowerCase()
      .replace(/['’]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s-]+/g, '_');
  }

  // 職業／專精／種族／英雄天賦的譯名不手寫，一律取自 libs/game-names-tw.js
  function translateName(value) {
    return lookupGameUnit(value);
  }

  function translateDungeon(value) {
    // 優先採用暴雪官方 zh_TW（生成檔），其次才是站台自訂標籤
    const official = lookupGameName(value);
    if (official) return official;

    const key = normalizeKey(value);
    return DUNGEON_TW_MAP[key] || null;
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

  const DIFFICULTY_TW = Object.freeze({
    'heroic vault': '英雄寶庫',
    'mythic vault': '傳奇寶庫',
    'normal vault': '普通寶庫',
    'lfr vault': '團隊搜尋器寶庫',
    'raid finder vault': '團隊搜尋器寶庫',
    heroic: '英雄',
    mythic: '傳奇',
    normal: '普通',
    lfr: '團隊搜尋器',
  });

  function translateSuffix(suffix) {
    const raw = String(suffix || '').trim();
    const lower = raw.toLowerCase();
    if (DIFFICULTY_TW[lower]) {
      return DIFFICULTY_TW[lower];
    }
    const plusVault = raw.match(/^\+(\d+)\s+Vault$/i);
    if (plusVault) {
      return `+${plusVault[1]} 寶庫`;
    }
    const plusDungeon = raw.match(/^Mythic\s+(\d+)$/i);
    if (plusDungeon) {
      return `傳奇 ${plusDungeon[1]}`;
    }
    const variationsMatch = raw.match(/^(\d+)\s+variations?\s+hidden$/i);
    if (variationsMatch) {
      return `${variationsMatch[1]} 個變體已隱藏`;
    }
    return raw;
  }

  const MONTH_TW = Object.freeze({
    jan: '1', feb: '2', mar: '3', apr: '4', may: '5', jun: '6',
    jul: '7', aug: '8', sep: '9', oct: '10', nov: '11', dec: '12',
  });

  function translateDate(dateStr) {
    const match = String(dateStr || '').trim().match(/^([A-Za-z]+)\s+(\d+)(?:st|nd|rd|th)?$/i);
    if (match) {
      const m = MONTH_TW[match[1].toLowerCase().slice(0, 3)];
      if (m) {
        return `${m} 月 ${match[2]} 日`;
      }
    }
    return dateStr;
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

    const badgeTw = ITEM_BADGE_TW[trimmed];
    if (badgeTw && Object.prototype.hasOwnProperty.call(ITEM_BADGE_TW, trimmed)) {
      return replaceTrimmed(text, trimmed, badgeTw);
    }

    const exact = EXACT_TW[trimmed];
    if (exact) {
      return replaceTrimmed(text, trimmed, exact);
    }

    const exactCaseInsensitive = EXACT_TW_CI[trimmed.toLowerCase()];
    if (exactCaseInsensitive) {
      return replaceTrimmed(text, trimmed, exactCaseInsensitive);
    }

    const hotfixMatch = trimmed.match(/^Raidbots is up-to-date with the latest (.+) hotfixes$/i);
    if (hotfixMatch) {
      const dateTw = translateDate(hotfixMatch[1]);
      return replaceTrimmed(text, trimmed, `Raidbots 已更新至最新的 ${dateTw} 線上修正`);
    }

    const bossTargetMatch = trimmed.match(/^(\d+)\s+boss\s+targets?$/i);
    if (bossTargetMatch) {
      return replaceTrimmed(text, trimmed, `${bossTargetMatch[1]} 個首領目標`);
    }

    const variationHiddenMatch = trimmed.match(/^(\d+)\s+variations?\s+hidden$/i);
    if (variationHiddenMatch) {
      return replaceTrimmed(text, trimmed, `${variationHiddenMatch[1]} 個變體已隱藏`);
    }

    const summaryHeadingMatch = trimmed.match(/^(.+?)\s+(?:SUMMARY|Summary)$/);
    if (summaryHeadingMatch) {
      const prefix = summaryHeadingMatch[1].trim();
      const prefixTw = EXACT_TW[prefix] || EXACT_TW_CI[prefix.toLowerCase()] || prefix;
      return replaceTrimmed(text, trimmed, `${prefixTw} 總覽`);
    }

    const leadingDashMatch = trimmed.match(/^-\s*(.+)$/);
    if (leadingDashMatch) {
      const rest = leadingDashMatch[1].trim();
      const restTw = translateSuffix(rest) || EXACT_TW[rest] || EXACT_TW_CI[rest.toLowerCase()] || translateDungeon(rest);
      if (restTw && restTw !== rest) {
        return replaceTrimmed(text, trimmed, `- ${restTw}`);
      }
    }

    const topGearGlobalSettingMatch = trimmed.match(/^Top Gear will use the global (.+?) setting$/i);
    if (topGearGlobalSettingMatch) {
      const param = topGearGlobalSettingMatch[1].trim();
      const paramTw = EXACT_TW[param] || EXACT_TW_CI[param.toLowerCase()] || param;
      return replaceTrimmed(text, trimmed, `Top Gear 將使用全域 ${paramTw} 設定`);
    }

    const lowLevelHiddenMatch = trimmed.match(/^(\d+)\s+low\s+level\s+items?\s+hidden\.\s*(.+)$/i);
    if (lowLevelHiddenMatch) {
      const count = lowLevelHiddenMatch[1];
      const rest = lowLevelHiddenMatch[2].trim();
      const restTw = EXACT_TW[rest] || EXACT_TW_CI[rest.toLowerCase()] || rest;
      return replaceTrimmed(text, trimmed, `${count} 件低等級物品已隱藏。${restTw}`);
    }

    const ilvlEnchantMatch = trimmed.match(/^(\d+)\s+(.+)$/);
    if (ilvlEnchantMatch) {
      const ilvl = ilvlEnchantMatch[1];
      const rest = ilvlEnchantMatch[2].trim();
      const restTw = EXACT_TW[rest] || EXACT_TW_CI[rest.toLowerCase()] || translateName(rest);
      if (restTw && restTw !== rest) {
        return replaceTrimmed(text, trimmed, `${ilvl} ${restTw}`);
      }
    }

    const suffixDirect = translateSuffix(trimmed);
    if (suffixDirect && suffixDirect !== trimmed) {
      return replaceTrimmed(text, trimmed, suffixDirect);
    }

    const titleMatch = trimmed.match(/^Top Gear - (.+?) - ([\d,]+\s+DPS) - Raidbots$/);
    if (titleMatch) {
      return replaceTrimmed(text, trimmed, `最佳配裝 - ${titleMatch[1]} - ${titleMatch[2]} - Raidbots`);
    }

    const dungeonOnly = translateDungeon(trimmed);
    if (dungeonOnly) {
      return replaceTrimmed(text, trimmed, dungeonOnly);
    }

    const itemRowMatch = trimmed.match(/^(\d+)\s+(.+?)\s+(.+?)\s+-\s+(.+)$/);
    if (itemRowMatch) {
      const ilvl = itemRowMatch[1];
      const slot = itemRowMatch[2];
      const source = itemRowMatch[3];
      const suffix = itemRowMatch[4];
      const slotTw = translateTermSequence(slot) || translateName(slot) || slot;
      const sourceTw = translateDungeon(source) || EXACT_TW[source] || EXACT_TW_CI[source.toLowerCase()] || source;
      const suffixTw = translateSuffix(suffix);
      if (slotTw !== slot || sourceTw !== source || suffixTw !== suffix) {
        return replaceTrimmed(text, trimmed, `${ilvl} ${slotTw} ${sourceTw} - ${suffixTw}`);
      }
    }

    const sourceWithSuffix = trimmed.match(/^(.+?)\s+-\s+(.+)$/);
    if (sourceWithSuffix) {
      const left = sourceWithSuffix[1].trim();
      const right = sourceWithSuffix[2].trim();
      const leftTw = translateDungeon(left) || EXACT_TW[left] || EXACT_TW_CI[left.toLowerCase()] || left;
      const rightTw = translateSuffix(right);
      if (leftTw !== left || rightTw !== right) {
        return replaceTrimmed(text, trimmed, `${leftTw} - ${rightTw}`);
      }
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

  function translateDocumentTitle() {
    const translated = translateText(document.title);
    if (translated && translated !== document.title) {
      document.title = translated;
    }
  }

  // ── 啟動 Wowhead 共用庫與 DOM 監聽 ───────────────────────────────────────
  const whHelper = typeof WowheadTwHelper !== 'undefined'
    ? new WowheadTwHelper({
        enableRenameLinks: true,
        enableSafeLinkify: true,
        excludedPanelKeywords: ['summary', '總覽', 'bonus roll', '好運符', 'boss summary', 'dungeon summary'],
        onScan: (root) => {
          translateAttributesInTree(root);
          walkTextNodes(root);
          translateDocumentTitle();
        },
        onUrlChange: () => {
          translatedNodeText = new WeakMap();
        },
      })
    : null;

  if (whHelper) {
    whHelper.registerNonItemNames(Object.keys(EXACT_TW));
    // 徽章短碼疊在裝備圖示上，絕不能被 linkify 成物品連結
    whHelper.registerNonItemNames(Object.keys(ITEM_BADGE_TW));
    whHelper.registerDungeonMap(DUNGEON_TW_MAP);
    whHelper.registerGameNameLookup(lookupGameName);
    whHelper.start();
  } else {
    // 獨立 Fallback 監聽器，防止 @require 載入失敗或快取未就緒時翻譯失效
    const fallbackScan = (root) => {
      if (!root) return;
      translateAttributesInTree(root);
      walkTextNodes(root);
      translateDocumentTitle();
    };
    const startFallback = () => {
      fallbackScan(document.body);
      setTimeout(() => fallbackScan(document.body), 300);
      setTimeout(() => fallbackScan(document.body), 1000);
      setTimeout(() => fallbackScan(document.body), 2500);

      const observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
          if (m.type === 'childList') {
            for (const n of m.addedNodes) {
              if (n.nodeType === Node.ELEMENT_NODE || n.nodeType === Node.TEXT_NODE) {
                fallbackScan(n.nodeType === Node.ELEMENT_NODE ? n : n.parentElement);
              }
            }
          } else if (m.type === 'characterData') {
            fallbackScan(m.target.parentElement || m.target);
          } else if (m.type === 'attributes') {
            if (m.target instanceof Element) {
              fallbackScan(m.target);
            }
          }
        }
      });
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: ['aria-label', 'title', 'placeholder', 'value'],
      });
    };

    if (!document.body) {
      document.addEventListener('DOMContentLoaded', startFallback, { once: true });
    } else {
      startFallback();
    }

    const rawPush = history.pushState.bind(history);
    history.pushState = function (...args) {
      const res = rawPush(...args);
      translatedNodeText = new WeakMap();
      setTimeout(() => fallbackScan(document.body), 200);
      return res;
    };
    window.addEventListener('popstate', () => {
      translatedNodeText = new WeakMap();
      setTimeout(() => fallbackScan(document.body), 200);
    });
  }
})();


