// ==UserScript==
// @name         Archon.gg Traditional Chinese
// @namespace    https://www.archon.gg/
// @version      0.14.0
// @description  Translate archon.gg WoW build pages to Traditional Chinese.
// @author       mcc
// @match        https://www.archon.gg/wow
// @match        https://www.archon.gg/wow/*
// @require      https://raw.githubusercontent.com/mcc1/WowUserScript/master/libs/wowhead-tw-helper.js?v=1.10.3
// @require      https://raw.githubusercontent.com/mcc1/WowUserScript/master/libs/game-names-tw.js?v=6
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
  // archon 自己縮短的副本／首領標籤（網址 slug 也是同一個短名）→ Journal 的官方
  // 英文全名。這是英文對英文，中文仍由 game-names-tw.js 提供。全名用 wago.tools
  // 的 JournalEncounter / JournalInstance 確認過只對應到一筆；「Sethraliss」不能
  // 交給模糊比對，因為同一個副本裡還有首領 Avatar of Sethraliss。
  const SHORT_GAME_NAMES = Object.freeze({
    'Sentinels': 'Entombed Sentinels',
    'Explorers': 'The Lost Explorers',
    'Nymrissa': 'Nymrissa Wavecaller',
    'Sethraliss': 'Temple of Sethraliss',
  });

  /** 站方直接印出的遊戲字串（套裝名等）。逐列登記在產生器的 LABEL_TABLES */
  function lookupGameLabel(value) {
    const table = gameNames();
    if (!table || typeof table.lookupLabel !== 'function' || !value) return null;
    try {
      return table.lookupLabel(value);
    } catch (_) {
      return null;
    }
  }

  function lookupGameName(value) {
    const table = gameNames();
    if (!table || typeof table.lookup !== 'function' || !value) return null;
    try {
      return table.lookup(value) || (SHORT_GAME_NAMES[value] ? table.lookup(SHORT_GAME_NAMES[value]) : null);
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
  const HERO_TW = buildUnitMap('heroTalents');

  // 強度排行頁的英雄天賦表把專精／職業縮寫成「Deathstalker Assa Rogue」
  // 「Aldrachi Reaver Havoc DH」。這兩張是站方縮寫 → 官方英文全名（英文對英文），
  // 中文仍由 game-names-tw.js 提供。查不到的縮寫整列保留英文。
  const SPEC_ABBR = Object.freeze({
    'Assa': 'Assassination',
    'Sin': 'Assassination',
    'Sub': 'Subtlety',
    'Ele': 'Elemental',
    'Enh': 'Enhancement',
    'Resto': 'Restoration',
    'WW': 'Windwalker',
    'MW': 'Mistweaver',
    'BrM': 'Brewmaster',
    'Brew': 'Brewmaster',
    'BM': 'Beast Mastery',
    'MM': 'Marksmanship',
    'Surv': 'Survival',
    'SV': 'Survival',
    'Ret': 'Retribution',
    'Prot': 'Protection',
    'Disc': 'Discipline',
    'Aff': 'Affliction',
    'Demo': 'Demonology',
    'Destro': 'Destruction',
    'Aug': 'Augmentation',
    'Dev': 'Devastation',
    'Pres': 'Preservation',
    'Bal': 'Balance',
    'Veng': 'Vengeance',
  });
  const CLASS_ABBR = Object.freeze({
    'DH': 'Demon Hunter',
    'DK': 'Death Knight',
    'Pala': 'Paladin',
    'Pally': 'Paladin',
    'Lock': 'Warlock',
    'Sham': 'Shaman',
    'Evo': 'Evoker',
  });

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
    'Neck': '頸部',
    'Back': '背部',
    'Wrist': '手腕',
    'Gloves': '手套',
    'Belt': '腰帶',
    'Trinket': '飾品',
    'Off-Hand': '副手',

    // 裝備頁區塊
    'Gear by Slot': '各部位裝備',
    'Crafted Gear': '製作裝備',
    'Crafted Gear Stats': '製作裝備屬性',
    'Embellishments': '裝飾',
    'Missive': '書狀',
    'Trinket Combinations': '飾品組合',
    'Individual Trinkets': '個別飾品',
    'Trinket combo': '飾品組合',
    'Filter': '篩選',
    'Only show combos using this trinket:': '只顯示包含此飾品的組合：',
    'Pick a trinket': '選擇飾品',
    'Due to stat distribution differences across set items, some may be more popular than others.':
      '由於套裝各部位的屬性分配不同，有些部位會比其他部位更受歡迎。',

    // 說明段落。站方把職業／專精、物品名等包成 <span> 插在句中，一句話被切成
    // 好幾個文字節點，這裡收的是切開後的固定碎片；帶數字的碎片走 PROSE_RE。
    // 碎片前後留給 span 的空白由站方決定，譯文兩端不補標點。
    'The most popular': '最熱門的',
    'These are the most popular': '以下是最熱門的',
    'This is the most recommended': '這是最推薦的',
    'hero talent tree is': '英雄天賦樹是',
    'crafted item is': '製作裝備是',
    'missives. The most popular missive is': '書狀。最熱門的書狀是',
    'embellishment combos. The most popular combo is': '裝飾組合。最熱門的組合是',
    'trinket combos. The most popular combo is': '飾品組合。最熱門的組合是',
    'trinkets. The two most popular trinkets individually are': '飾品。單獨來看最熱門的兩個飾品是',
    'epic gems. The most popular epic gem is': '史詩寶石。最熱門的史詩寶石是',
    'gems. The most popular gem is': '寶石。最熱門的寶石是',
    'enchants we have found.': '附魔。',
    'consumables we have found.': '消耗品。',
    'consumables.': '消耗品。',
    'Based on data in the last 2 weeks, the stat priority for': '根據過去兩週的資料，',
    'The above Class Tree is the most popular in combination with the Spec & Hero Tree. Here\'s the list of other popular Class Trees used with this Spec & Hero Tree.':
      '上方的職業天賦樹是與此專精 & 英雄天賦樹搭配最熱門的組合。以下列出其他常與此專精 & 英雄天賦樹搭配的職業天賦樹。',
    'You can find alternative': '你可以在這裡找到其他',
    'talent builds here. They will be a little less popular or performant than the recommended one, but may help you adapt to the needs of your group.':
      '天賦配置。它們的使用率或表現會比推薦配置稍低，但可能有助於你因應隊伍的需求。',
    'We\'ve built a heatmap of the': '我們製作了',
    'Here you can find the most popular Omnium Folio runes for each row.': '這裡列出每一列最熱門的萬象儀對開本符文。',
    'Here you can find the most popular enchants for each item slot.': '這裡列出各裝備部位最熱門的附魔。',
    'Here you can find the most used items for each slot of your inventory. These include powerful alternative options for your build, even if you can\'t get your hands on the Best in Slot.':
      '這裡列出各部位最常用的物品，其中包括即使拿不到最佳裝備時也很強的替代選項。',
    'While optimizing your gear and build is important, it\'s also important to use your':
      '最佳化裝備與配置固然重要，但有效地使用你的',
    'abilities effectively. This section lets you view how top players perform so that you can potentially spot opportunities for improvement in your own logs. To get started, select an encounter:':
      '技能同樣重要。本區塊讓你查看頂尖玩家的表現，幫助你從自己的紀錄中找出可改進之處。請先選擇一場戰鬥：',
    'Learn About': '透過 Wowhead 了解',
    'Gear With Wowhead': '裝備',
    'To learn more about your gearing choices, check out': '想更了解配裝選擇，請參考',
    '. While Archon can show you the current meta (what gear choices players are making and how they are performing with those choices), Wowhead can teach you more about why certain choices are better than others.':
      '。Archon 能讓你看到目前的主流（玩家選了哪些裝備、表現如何），Wowhead 則能告訴你為什麼某些選擇比其他的更好。',
    'Mythic+ Score is a good metric to use because players need a combination of damage, utility, and survivability to push high keys.':
      '傳奇鑰石分數是很好的指標，因為玩家需要兼具傷害、輔助與生存能力才能推上高層鑰石。',
    'Popularity is a useful metric because it includes signal from when groups bring players due to certain buffs and utility they provide and not just their raw throughput. However, popularity also includes noise from community bias or whether a spec is particularly fun or easy-to-play.':
      '使用率是很有用的指標，因為它反映了隊伍因某些增益與輔助能力（而非單純輸出）而帶上特定玩家的訊號。不過，使用率也包含社群偏好、或某個專精特別好玩／容易上手所造成的雜訊。',
    'Throughput': '輸出',
    'Survivability': '生存能力',
    'Our Mythic+ tier list uses the in-game Mythic+ Score as its metric. We pull data from the official Blizzard leaderboard so that all runs are included, even those that weren\'t logged. The score shown in the boxes is the 95th percentile value for that spec. Select a spec to dig into detailed data about its build options.':
      '我們的傳奇鑰石強度排行以遊戲內的傳奇鑰石分數為指標。資料取自暴雪官方排行榜，因此所有場次都會納入，包括沒有上傳紀錄的。方塊中顯示的分數是該專精的第 95 百分位數。選擇一個專精即可深入查看其配置選項的詳細資料。',

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
    'Heroic': '英雄',
    'Normal': '普通',
    'Boss': '首領',
    'All Bosses': '所有首領',
    'Show DPS & HPS': '顯示 DPS & HPS',

    // 迴圈頁（選了一場戰鬥之後）
    'Opener': '起手',
    'Cooldowns': '冷卻技能',
    'Sample': '樣本',
    'Rankings Sample': '排名樣本',
    'Fullscreen': '全螢幕',
    'Offensive': '攻擊',
    'Defensive': '防禦',
    'Utility': '輔助',
    'Externals': '外部增益',
    'Other': '其他',
    'Damage Breakdown': '傷害細目',
    'Healing Breakdown': '治療細目',
    'Damage Taken Breakdown': '承受傷害細目',
    'Damage To Bosses': '對首領傷害',
    'Damage to Bosses': '對首領傷害',
    'Damage to Adds': '對小怪傷害',
    'Healing To Tanks': '對坦克治療',
    'Healing to Tanks': '對坦克治療',
    'Healing to Non-Tanks': '對非坦克治療',
    'Damage Mitigated': '減免傷害',
    // 「Damage Done during <span>秘法奔騰</span>」：span 後面沒有文字節點可以接
    // 「期間」，只能把說明放前面
    'Damage Done during': '期間傷害：',
    'Damage Done to': '對',
    'Name': '名稱',
    'Amount': '總量',
    'Casts': '施放次數',
    'Avg Cast': '平均施放',
    'Uptime': '覆蓋率',
    'Overheal': '過量治療',
    'Hits': '命中次數',
    'Avg Hit': '平均命中',
    'Mitigated': '減免',
    'Total': '總計',
    'Melee': '近戰',
    'Show All Columns': '顯示所有欄位',
    'Date': '日期',
    'Duration': '時長',
    'Below are the opening rotations from a small sample of recent top': '以下是近期少量頂尖',
    'Below is the cooldown usage from a small sample of recent top': '以下是近期少量頂尖',
    'Below is an average breakdown of a small sample of top': '以下是少量頂尖',
    '. You can use this to compare to your own opener and find potential points of improvement. Note that the opener for some specs may vary based on when certain buffs proc.':
      '的起手迴圈。你可以拿來和自己的起手比較，找出可改進之處。注意，部分專精的起手會因特定增益觸發的時機而不同。',
    '. You can use this to help plan your own cooldowns. Note that some cooldown usage may be driven by the needs of the specific tactic or group composition.':
      '的冷卻技能使用狀況，可以用來規劃自己的冷卻技能。注意，部分冷卻技能的使用時機可能取決於特定戰術或隊伍組成的需求。',
    '. You can use this to compare to your own cast counts and uptime to find potential points of improvement. Note that the top logs on some encounters may be skewed towards unnecessary padding that you might not want to emulate.':
      '的平均數據細目。你可以拿來和自己的施放次數與覆蓋率比較，找出可改進之處。注意，部分戰鬥的頂尖紀錄可能偏重不必要的灌數據，未必值得仿效。',
    'Damage mitigated by abilities, as well as by passive sources like Versatility. These values are':
      '由技能以及臨機應變等被動來源減免的傷害。這些數值是',
    'estimates.': '估計值。',
    'The data on this page was generated using the following sample of recent top rankings that match your selection.':
      '本頁資料取自以下符合你篩選條件的近期頂尖排名樣本。',

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
    // 英雄天賦排行表的欄位
    'Hero Specialization': '英雄天賦',
    'Tree %': '天賦樹佔比',

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
    'Gear & Tier': '裝備 & 套裝',
    'Gear Tables': '裝備表',
    'Trinket Combos': '飾品組合',
    'Missives': '書狀',
    'Tier Set Slots': '套裝部位',
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

  /** 「Conduit of the Celestials WW Monk」→「天神御使 御風 武僧」；任何一段查不到就回 null */
  function translateHeroSpecClassRow(text) {
    let hero = '';
    for (const name of Object.keys(HERO_TW)) {
      if (name.length > hero.length && text.startsWith(name + ' ')) hero = name;
    }
    if (!hero) return null;

    const words = text.slice(hero.length + 1).split(' ');
    for (let cut = words.length - 1; cut >= 1; cut -= 1) {
      const specRaw = words.slice(0, cut).join(' ');
      const classRaw = words.slice(cut).join(' ');
      const spec = SPEC_TW[specRaw] ? specRaw : SPEC_ABBR[specRaw];
      const cls = CLASS_TW[classRaw] ? classRaw : CLASS_ABBR[classRaw];
      if (spec && cls && SPEC_TW[spec] && CLASS_TW[cls]) {
        return `${HERO_TW[hero]} ${SPEC_TW[spec]} ${CLASS_TW[cls]}`;
      }
    }
    return null;
  }

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

  // 英文詞夾在中文句子裡要留空格（「最完整的 DPS 排行榜」），中文詞不要
  //（「最完整的坦克排行榜」）。
  function padLatin(word) {
    return /^[A-Za-z]/.test(word) ? ` ${word} ` : word;
  }

  const RANKING_SECTION_TW = Object.freeze({
    'Tier List': '強度排行',
    'Hero Spec Rankings': '英雄天賦排行榜',
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
  const RANKING_HEADING_RE = /^(DPS|Tank|Healer)\s+(Tier List|Hero Spec Rankings|Rankings)\s+for\s+(.+?)\s+(Mythic\+|Raid)$/;
  // 團隊副本版：「DPS Tier List for Heroic The Venomous Abyss」
  const RAID_RANKING_HEADING_RE = /^(DPS|Tank|Healer)\s+(Tier List|Hero Spec Rankings|Rankings)\s+for\s+(Heroic|Normal|Mythic|LFR)\s+(.+)$/;
  // 地城難易度排行：「Dungeon Ease Tier List for +7 to +19 Mythic+」
  const DUNGEON_EASE_HEADING_RE = /^Dungeon Ease Tier List for\s+(.+?)\s+(Mythic\+)$/;
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
    if (match) {
      const range = translateKeyRange(match[3]) || match[3];
      return joinTw(range, CONTENT_TW[match[4]], ROLE_TW[match[1]], RANKING_SECTION_TW[match[2]]);
    }
    const easeMatch = text.match(DUNGEON_EASE_HEADING_RE);
    if (easeMatch) {
      const range = translateKeyRange(easeMatch[1]) || easeMatch[1];
      return joinTw(range, CONTENT_TW[easeMatch[2]], '地城難易度強度排行');
    }
    const raidMatch = text.match(RAID_RANKING_HEADING_RE);
    if (!raidMatch) return null;
    const raid = lookupGameName(raidMatch[4]);
    if (!raid) return null;
    return joinTw(EXACT_TW[raidMatch[3]] + raid, ROLE_TW[raidMatch[1]], RANKING_SECTION_TW[raidMatch[2]]);
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

  // ── 說明段落裡帶數字／名稱的碎片 ────────────────────────────────────────
  // 每個 handler 只吃 span 切開後的單一文字節點；比對整段才會誤傷別的句子。
  const SEASON_RE = /^Season (\d+)$/;

  function translateSeasonOrPatch(text) {
    const match = text.match(SEASON_RE);
    return match ? `第 ${match[1]} 季` : ` ${text} `;
  }

  function translateContentScope(text) {
    if (CONTENT_TW[text]) return CONTENT_TW[text];
    return lookupGameName(text) || text;
  }

  function translateStatOrder(text) {
    const parts = text.split(/\s*>\s*/);
    if (parts.length < 2) return text;
    return parts.map(part => STAT_MAP[part.trim()] || part.trim()).join(' > ');
  }

  const PROSE_RULES = [
    // 「Build in WoW - Midnight. Data-driven builds updated daily for Mythic+ in Midnight Season 2.」
    {
      re: /^(Build|Talent Tree|Rotation|Gear & Tier|Enchants & Gems|Consumables|Trinkets) in WoW - (.+?)\. Data-driven builds updated daily for (.+?) in (\S+) (Season \d+|[\d.]+)\.$/,
      tw: m => {
        const suffix = TITLE_SUFFIX_TW[m[1]] || EXACT_TW[m[1]];
        const expansion = EXPANSION_TW[m[2]];
        if (!suffix || !expansion) return null;
        return `${suffix}（WoW - ${expansion}）。資料來自實際紀錄，每日更新，涵蓋${EXPANSION_TW[m[4]] || m[4]}${translateSeasonOrPatch(m[5])}的${translateContentScope(m[3])}。`;
      },
    },
    { re: /^Based on all keys (\d+) and above in the last (\d+) days\.$/, tw: m => `統計自過去 ${m[2]} 天內 +${m[1]} 以上的鑰石。` },
    { re: /^Based on the top (\d+)% of data in the last (\d+) days\.$/, tw: m => `統計自過去 ${m[2]} 天內前 ${m[1]}% 的資料。` },
    { re: /^Based on all data from the last (\d+) days\.$/, tw: m => `統計自過去 ${m[1]} 天的所有資料。` },
    {
      re: /^Our tier lists are updated daily and are based on all data across the last (\d+) weeks\. We rank specs by multiple different metrics and let you choose which metric to see rankings for\. Swap between metrics to see the strengths and weaknesses of different specs\. The (DPS|HPS) shown in the boxes is the 95th percentile value for that spec\. Select a spec to dig into detailed data about its build options\.$/,
      tw: m => `我們的強度排行每日更新，統計自過去 ${m[1]} 週的所有資料。我們以多種不同指標為專精排名，並讓你自行選擇要查看哪種指標的排行。切換指標即可看出各專精的強項與弱點。方塊中顯示的 ${m[2]} 是該專精的第 95 百分位數。選擇一個專精即可深入查看其配置選項的詳細資料。`,
    },
    { re: /^Based on data in the last (\d+) weeks?, the stat priority for$/, tw: m => `根據過去 ${m[1]} 週的資料，` },
    {
      re: /^looks to be (.+?)\. However, there may be bias based on what gear is available to players\.$/,
      tw: m => `的屬性優先順序看來是 ${translateStatOrder(m[1])}。不過，這可能因玩家可取得的裝備而有所偏差。`,
    },
    // 「talent build for +7 to +21 Mythic+ on All Dungeons. Our recommendation is based on …」
    {
      re: /^talent build for (.+?) (Mythic\+|Raid) on (.+?)\. Our recommendation is based on the combined popularity of the Spec & Hero Trees? \(as these usually contain the most significant choices\) and then by (the highest key level reached with those Spec & Hero Trees|the popularity of Class Trees that use those Spec & Hero Trees)\.$/,
      tw: m => {
        const range = translateKeyRange(m[1]) || EXACT_TW[m[1]] || m[1];
        const scope = EXACT_TW[m[3]] || lookupGameName(m[3]) || m[3];
        const tail = m[4].startsWith('the highest')
          ? '使用這些天賦樹所達到的最高鑰石層數'
          : '搭配這些天賦樹的職業天賦樹使用率';
        return `天賦配置，適用於${scope}的 ${range} ${CONTENT_TW[m[2]]}。我們的推薦依據是專精 & 英雄天賦樹的綜合使用率（它們通常包含最關鍵的選擇），再依${tail}排序。`;
      },
    },
    {
      re: /^gear based on all data across the last (\d+) weeks\. This represents a strong set of gear for this point in (Season \d+|[\d.]+) that is close to Best in Slot but with some alternatives that are easier to obtain\. Tier pieces up to the maximum set bonus and legendary items have been prioritized once seen at least once\.$/,
      tw: m => `裝備，統計自過去 ${m[1]} 週的所有資料。這代表在${translateSeasonOrPatch(m[2])}目前這個階段，一套接近最佳裝備、但部分替代品較容易取得的強力配裝。套裝部位（至最高套裝效果為止）與傳說物品只要出現過一次就會優先列入。`,
    },
    { re: /^tier set in (Season \d+|[\d.]+)\. These are its effects:$/, tw: m => `在${translateSeasonOrPatch(m[1])}的套裝。效果如下：` },
    { re: /^(\d+) Set Bonus$/, tw: m => `${m[1]} 件套裝效果` },
    {
      re: /^talents from the top (\d+) rankings\. This should help you pick the most impactful talents and give you ideas on how to adapt your talents to your playstyle\.$/,
      tw: m => `天賦的熱點圖，資料來自前 ${m[1]} 名的紀錄。這能幫助你挑出影響最大的天賦，並依你的玩法調整天賦。`,
    },
    {
      re: /^Explore the WoW meta with our always up-to-date tier list for (.+?)\. Warcraft Logs has the best (\S+) (DPS|Tank|Healer) rankings for World of Warcraft in (Season \d+|[\d.]+)\.$/,
      tw: m => `透過我們隨時更新的${translateContentScope(m[1])}強度排行探索 WoW 的主流。Warcraft Logs 擁有魔獸世界${EXPANSION_TW[m[2]] || m[2]}${translateSeasonOrPatch(m[4])}最完整的${padLatin(ROLE_TW[m[3]])}排行榜。`,
    },
  ];

  // ── 迴圈頁的傷害／治療細目 ──────────────────────────────────────────────
  // 每段說明都被技能 span 切開：「… are <span/>, <span/>, and <span/>. The ability
  // … is <span/>, at 3.7M per cast.」。帶數字的殘片在這裡，連接詞在
  // ROTATION_CONNECTIVE_TW。
  const BREAKDOWN_KIND_TW = Object.freeze({ damage: '傷害', healing: '治療' });
  const BREAKDOWN_TARGET_TW = Object.freeze({
    'all targets': '所有目標',
    'friendly targets': '友方目標',
    'bosses': '首領',
    'non-bosses': '非首領目標',
    'tanks': '坦克',
    'non-tanks': '非坦克',
  });
  const MONTH_NUMBER = Object.freeze({
    Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
    Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
  });

  PROSE_RULES.push(
    { re: /^Based on a small sample of top rankings from the last (\d+) days\.$/, tw: m => `統計自過去 ${m[1]} 天內少量頂尖排名的樣本。` },
    {
      re: /^This table shows (damage|healing) to (all targets|friendly targets)\. The top (\d+) (damage|healing) abilities are$/,
      tw: m => `本表顯示對${BREAKDOWN_TARGET_TW[m[2]]}的${BREAKDOWN_KIND_TW[m[1]]}。${BREAKDOWN_KIND_TW[m[4]]}最高的前 ${m[3]} 個技能是`,
    },
    {
      re: /^This table shows damage taken from all enemies and mechanics\. The top (\d+) most damaging mechanics are$/,
      tw: m => `本表顯示承受自所有敵人與機制的傷害。傷害最高的前 ${m[1]} 個機制是`,
    },
    // 首領階段的說明是站方逐場手寫的（「Rav'i feeds at a bone pile …」），不翻；
    // 只翻接在後面的固定句。
    {
      re: /^(.*?)The top (\d+) (damage|healing) abilities are$/,
      tw: m => `${m[1]}${BREAKDOWN_KIND_TW[m[3]]}最高的前 ${m[2]} 個技能是`,
    },
    {
      re: /^This table shows (damage|healing) to (bosses|non-bosses|tanks|non-tanks)\. On average, ([\d.]+[KMB]?) total (?:damage|healing) was done to (?:bosses|non-bosses|tanks|non-tanks)\.$/,
      tw: m => m[1] === 'damage'
        ? `本表顯示對${BREAKDOWN_TARGET_TW[m[2]]}的傷害。平均對${BREAKDOWN_TARGET_TW[m[2]]}造成 ${m[3]} 傷害。`
        : `本表顯示對${BREAKDOWN_TARGET_TW[m[2]]}的治療。平均對${BREAKDOWN_TARGET_TW[m[2]]}治療 ${m[3]}。`,
    },
    { re: /^\. The ability that does the most (damage|healing) per cast is$/, tw: m => `。每次施放${BREAKDOWN_KIND_TW[m[1]]}最高的技能是` },
    { re: /^, at ([\d.]+[KMB]?) per cast\.$/, tw: m => `，每次施放 ${m[1]}。` },
    // 「Damage Done to Uncoiled Writhes」：小怪名是站方給的純文字
    { re: /^Damage Done to (.+)$/, tw: m => `對 ${lookupGameName(m[1]) || m[1]} 造成的傷害` },
    { re: /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{1,2})$/, tw: m => `${MONTH_NUMBER[m[1]]} 月 ${m[2]} 日` },
  );

  // 頁面標題 <p>：「Arcane Mage Mythic+ Rotation | Archon (WoW - Midnight)」
  PROSE_RULES.push({
    re: /^(.+?) (Mythic\+|Raid) (.+?) \| Archon \(WoW - (.+)\)$/,
    tw: m => {
      const unit = translateSpecClassPhrase(m[1]);
      const suffix = TITLE_SUFFIX_TW[m[3]] || EXACT_TW[m[3]];
      const expansion = EXPANSION_TW[m[4]];
      if (!unit || !suffix || !expansion) return null;
      return `${unit} ${CONTENT_TW[m[2]]}${suffix} | Archon（WoW - ${expansion}）`;
    },
  });

  function translateProse(text) {
    for (const rule of PROSE_RULES) {
      const match = text.match(rule.re);
      if (match) return rule.tw(match) || null;
    }
    return null;
  }

  // 「… is 日怒 with 99.6% usage.」這種句子裡的連接詞是獨立文字節點；只有在
  // 說明句裡才翻，否則頁面上任何一個孤立的 and / with 都會被換掉。
  const PROSE_CONNECTIVE_TW = Object.freeze({
    'with': '，使用率為',
    'usage.': '。',
    'usage and': '，以及',
    'and': '和',
    'is the': '是',
  });
  const PROSE_CONTEXT_RE = /most popular|usage|tier set in/i;

  // 迴圈頁說明句裡的連接詞。條件同上：只在那幾句裡才翻。整個節點換掉（不保留
  // 前後空白），「、」後面接空格很難看。上下文要同時認得英文與已翻好的中文，
  // 因為同一段裡先被翻掉的殘片會改變 textContent。
  const ROTATION_CONNECTIVE_TW = Object.freeze({
    ',': '、',
    ', and': '和',
    '.': '。',
    'rankings for': ' 在',
  });
  const ROTATION_CONTEXT_RE = /The top \d+|前 \d+ 個|small sample|少量頂尖/;
  // 「Damage Done to <span>魔導師之觸</span> Targets」
  const TARGETS_HEADING_RE = /^(Damage Done to|對)\s/;

  function translateProseConnective(node) {
    const trimmed = node.textContent.trim();
    const block = node.parentElement && node.parentElement.closest('p,div,li,h3');
    if (!block) return null;

    const rotationTw = ROTATION_CONNECTIVE_TW[trimmed];
    if (rotationTw && ROTATION_CONTEXT_RE.test(block.textContent)) return rotationTw;
    if (trimmed === 'Targets' && block.tagName === 'H3' && TARGETS_HEADING_RE.test(block.textContent.trim())) {
      return ' 目標造成的傷害';
    }

    const tw = PROSE_CONNECTIVE_TW[trimmed];
    if (!tw || !PROSE_CONTEXT_RE.test(block.textContent)) return null;
    return node.textContent.replace(trimmed, tw);
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

    // 套裝名（Primal Leywarden's Attire）等逐列登記的遊戲字串
    const labelTw = lookupGameLabel(trimmed);
    if (labelTw) {
      return text.replace(trimmed, labelTw);
    }

    const heroRowTw = translateHeroSpecClassRow(trimmed);
    if (heroRowTw) {
      return text.replace(trimmed, heroRowTw);
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
      || translateRelativeTime(trimmed)
      || translateProse(trimmed);
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
    // 站名 Archon 跟牧師的英雄天賦 Archon（御靈者）同名，頁首 logo 與擋廣告提示
    // 裡的站名不能交給 lookupUnit
    'rootBreadcrumb', 'fallback__content',
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
          // root 本身也要檢查：小批同步掃描時 root 可能就是那個 span
          while (el) {
            if (shouldSkipElement(el)) return NodeFilter.FILTER_REJECT;
            if (el === root) break;
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

      const translated = translateString(orig) ?? translateProseConnective(node);
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
