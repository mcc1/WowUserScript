/**
 * KeystoneLoot Traditional Chinese Dictionary
 * @version 1.3.0
 * @description Site-owned UI strings for the KeystoneLoot Traditional Chinese UserScript.
 * @license MIT
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.KeystoneLootTwDictionary = factory();
  }
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';

  // 這裡只放 KeystoneLoot 自有的介面／來源標籤；職業、專精與物品名稱不放手寫表。
  const EXACT_TW = Object.freeze({
    'Classes': '職業',
    'Tier list': '強度排行',
    'Dungeons': '地城',
    'Raid': '團隊副本',
    'Upgrades': '升級',
    'Compare': '比較',
    'Editor': '編輯器',

    'Skip to content': '跳至內容',
    'Every class in the game, with the specs that have a list ready.': '遊戲中的每個職業，以及已經備妥清單的專精。',
    'Slot by slot, at the best upgrade state this season allows.': '逐個部位，採用本賽季允許的最佳升級狀態。',
    'Import to KeystoneLoot': '匯入 KeystoneLoot',
    'Open the addon, click the gear icon, choose Import. You can merge with your current list or replace it.': '開啟插件，點選齒輪圖示並選擇「匯入」。你可以與目前的清單合併，也可以直接取代目前清單。',
    'Close': '關閉',
    'KeystoneLoot on CurseForge': 'CurseForge 上的 KeystoneLoot',
    'Last Update': '上次更新',
    'Found a bug?': '發現錯誤？',
    'A wrong item, an item level that looks off, or anything else wrong with the site? Every report goes into the next update.': '發現物品錯誤、物品等級不對，或網站還有其他問題嗎？所有回報都會納入下一次更新。',
    'Tell us about it': '告訴我們',
    'No addon yet?': '還沒有插件？',

    'Stat priority': '屬性優先級',
    'Intellect': '智力',
    'Strength': '力量',
    'Agility': '敏捷',
    'Haste': '加速',
    'Critical strike': '致命一擊',
    'Mastery': '精通',
    'Versatility': '臨機應變',
    'Hero talent (M+)': '英雄天賦（傳奇鑰石）',
    'Hero talent': '英雄天賦',
    'Weekly key': '每週鑰石',
    'High keys': '高層鑰石',
    'Source': '來源',
    'Guide': '攻略',
    'Player': '玩家',
    'Where the items in this list drop': '這份清單的物品掉落來源',
    'Back to top': '回到頂端',
    'Main': '主選單',
    'Language': '語言',
    'Menu': '選單',
    'love': '愛心',
    'Into the catalyst': '進入催化器',
    'Raw item': '原始物品',
    'T-set item': '套裝物品',
    'with the same stats': '相同屬性',
    'BoE trash drop': '裝備綁定的小怪掉落',
    'Crafted': '製作',
    'by': '由',
    'Catalyst': '催化器',
    // 專業名稱：對照 wago.tools SkillLine DB2 zhTW（ID 164/165/171/197/202/333/755/773）。
    'Tailoring': '裁縫',
    'Inscription': '銘文學',
    'Blacksmithing': '鍛造',
    'Jewelcrafting': '珠寶設計',
    'Leatherworking': '製皮',
    'Engineering': '工程學',
    'Alchemy': '鍊金術',
    'Enchanting': '附魔',

    'Head': '頭部',
    'Neck': '頸部',
    'Shoulder': '肩部',
    'Back': '背部',
    'Chest': '胸部',
    'Wrist': '手腕',
    'Hands': '手部',
    'Waist': '腰部',
    'Legs': '腿部',
    'Feet': '腳部',
    'Ring': '戒指',
    'Ring 1': '戒指 1',
    'Ring 2': '戒指 2',
    'Trinket': '飾品',
    'Trinket 1': '飾品 1',
    'Trinket 2': '飾品 2',
    'Main hand': '主手',
    'Off hand': '副手',
    'Shirt': '襯衣',
    'Tabard': '外袍',

    'Tier set': '套裝',
    '2-set': '2 件套裝',
    '4-set': '4 件套裝',
    'Midnight': '至暗之夜',
    'Season 2': '第 2 季',
    'This list is compiled from publicly available guides for this specialisation and is kept current; the timestamp sits above the list. It shows what counts as the best item per slot for Season 2, and is no substitute for simming your own character.': '這份清單整理自公開的本專精攻略，並會持續更新；時間戳記位於清單上方。清單列出第 2 季各部位的最佳物品，但不能取代對你自己角色進行模擬。',
    // 站方 2.3.x 把上句拆成兩個以 <br> 分隔的文字節點；第二句含季數，由腳本的 regex 處理。
    'This list is compiled from publicly available guides for this specialisation and is kept current.': '這份清單整理自公開的本專精攻略，並會持續更新。',
    "Convert these pieces to get the set's 4-piece bonus. New in Season 2: the tier piece takes on the secondary stats of what you put in, and the item level always came along anyway. So all that matters is which slots you pick. The tooltip on the right shows the converted piece, with your stats already on it.": '轉換這些部位即可取得套裝的 4 件套裝效果。第 2 季的新變化是：套裝部位會採用你放入物品的副屬性，而且物品等級本來就會一併保留。因此，你只需要決定要選哪些部位。右側的提示資訊會顯示轉換後的物品，並已套用你的屬性。',
    'Navigation': '導覽',
    'Tools': '工具',
    'Project': '專案',

    'Overall': '總體',

    // 升級軌道：Adventurer／Veteran／Champion 由 game-names-tw.js 的 LABELS 提供
    // （ItemNameDescription）。Hero 與 Myth 在 client 資料裡沒有單獨成列的字串，
    // 譯名取自同一季紋章的官方名（CurrencyTypes 3440「英雄迷霧紋章」、
    // 3441「神話迷霧紋章」）去掉「迷霧紋章」。
    'Hero': '英雄',
    'Myth': '神話',

    // 首頁（2026-10-18 掃描）
    'Season': '賽季',
    // 改版名，client 資料裡沒有這個標題；人名照 SpellName 的官方寫法
    // （1288103「烏拉特克的佈道」），不是「烏拉泰克」
    "Curse of Ula'tek": '烏拉特克的詛咒',
    'Best in slot,': '最佳配裝，',
    'for every spec.': '涵蓋每個專精。',
    "The current BiS item list for all 13 classes, slot by slot, at this season's highest upgrade rank. Copy the string, paste it into the addon. Done.":
      '全部 13 個職業目前的最佳配裝清單，逐個部位列出，並採用本賽季最高的升級階級。複製字串、貼進插件，就完成了。',
    'Choose your spec': '選擇你的專精',
    'Download the addon': '下載插件',
    // 數字底下的標籤（「40」「specs」）
    'specs': '專精',
    'items tracked': '追蹤物品',
    'addon downloads': '插件下載次數',
    'addon version': '插件版本',
    'Streamer approved': '實況主推薦',
    'on Twitch': '的 Twitch 頻道',
    'Opens in a new tab': '在新分頁開啟',
    'Partner sites': '合作網站',
    'Mythic+ DPS rankings': '傳奇鑰石 DPS 排行',
    'WoW guides for Midnight': '至暗之夜的 WoW 攻略',
    'Upgrade tracks': '升級軌道',
    'Six ranks each. Which rank a piece enters at depends on the difficulty it came from: higher keys and higher raid difficulties drop further up the track. From there, every upgrade costs crests of that track.':
      '每條軌道各有 6 個階級。裝備從哪一階開始，取決於它掉落時的難度：鑰石層數越高、團隊副本難度越高，掉落時就越接近軌道上方。之後每次升級都要花費該軌道的紋章。',
    'Upgrading gear': '裝備升級',
    'Pick a class': '選擇職業',
    'See every spec': '查看所有專精',

    // /dungeons
    'The dungeon pool': '地城輪替',
    'Eight dungeons in rotation this season, and the item level each key rewards.': '本賽季輪替的八座地城，以及各層鑰石獎勵的物品等級。',
    "Eight dungeons make up this season's Mythic+ pool: four from Midnight itself, four from earlier expansions. Which one you run is decided by your keystone, and every completed run raises it. What lands in the chest at the end, and in the Great Vault the week after, depends on the level alone and not on the dungeon.":
      '本賽季的傳奇鑰石地城共有八座：四座來自至暗之夜，四座來自先前的資料片。要打哪一座由你的鑰石決定，每完成一次就會提升鑰石層數。結束時寶箱裡的獎勵，以及下週寶庫裡的獎勵，只取決於層數，與地城無關。',
    'What drops in Mythic+': '傳奇鑰石的掉落',
    'Item level at the end of the run, and in the Great Vault the week after.': '完成時獲得的物品等級，以及下週寶庫中的物品等級。',
    'Key level': '鑰石層數',
    'End of run': '完成時',
    // 官方 client 字串是「寶庫」（DELVES_GREAT_VAULT_LABEL）
    'Great Vault': '寶庫',
    'and up': '以上',

    // /raid。Mythic 難度是「傳奇」，見 AGENTS.md 用語規則
    'The raid': '團隊副本',
    'Bosses, difficulties, and what each wing drops.': '首領、難度，以及每個區域的掉落。',
    'Difficulty': '難度',
    'LFR': '團隊搜尋器',
    'Normal': '普通',
    'Heroic': '英雄',
    'Mythic': '傳奇',
    'World': '世界',
    'Loot item levels': '掉落物品等級',
    'Item level climbs with difficulty and with how deep into the raid a boss sits.': '物品等級隨難度提高，也隨首領在團隊副本中的位置越深而提高。',
    'Bosses': '首領',
    'Crests': '紋章',
    'On Mythic, the last two bosses drop above the Myth curve, at the level of a 9/6 piece and with nothing left to upgrade.':
      '在傳奇難度下，最後兩個首領的掉落會高於神話軌道，等同 9/6 的裝備，而且無法再升級。',
    'What the raid drops': '團隊副本的掉落',

    // /tier-list。「職務」與 archon 一致（暴雪沒有給坦克／治療者／傷害一個上位詞）
    'Mythic+ Tier List': '傳奇鑰石強度排行',
    'WoW Mythic+ Tier List': 'WoW 傳奇鑰石強度排行',
    "Ranked by the in-game Mythic+ score, straight from Blizzard's own leaderboards. Every run counts, including the ones nobody logged.":
      '依遊戲內的傳奇鑰石分數排名，資料直接取自暴雪官方排行榜。每一場都會計入，包括沒有人上傳紀錄的場次。',
    // 「The tier list is based on the <b>95th percentile</b> of the <b>top 500</b>, across <b>US</b>, …」
    'The tier list is based on the': '這份強度排行依據',
    '95th percentile': '第 95 百分位數',
    'of the': '，取樣範圍為',
    'top 500': '前 500 名',
    ', across': '，涵蓋',
    'US': '美服',
    'EU': '歐服',
    'Korea': '韓服',
    'and': '與',
    'Taiwan': '台服',
    ". Because of a limitation in Blizzard's API, China is not included.": '。由於暴雪 API 的限制，不包含中國。',
    'Last updated': '最後更新',
    'All roles': '所有職務',
    'Other roles': '其他職務',

    // /upgrades
    'A piece is upgraded with crests. Which track it has is decided by the difficulty it dropped from: the keystone level, or the raid difficulty.':
      '裝備用紋章升級。它屬於哪條軌道，取決於掉落時的難度：鑰石層數或團隊副本難度。',
    'Rank': '階級',
    'Cost': '花費',
    'Entry rank': '起始階級',
    'The tracks below': '較低的軌道',
    'World content and Looking For Raid drop on these. They cap under Champion, so nothing here reaches a BiS list, but they use crests of their own.':
      '世界內容與團隊搜尋器的掉落屬於這些軌道。它們的上限低於勇士軌道，所以不會出現在最佳配裝清單中，但也有各自的紋章。',
    'Crest': '紋章',
    'Caps at': '上限',
    'Earned from': '取得方式',
    // 紋章來源。寫法照 CurrencyTypes 3437–3441 的官方說明（「重複進行的戶外活動」
    // 「英雄難度賽季地城」）。Prey 的 Hard／Nightmare 難度在 client 字串裡找不到，
    // 「困難」「惡夢」是非官方譯名。
    'Repeatable outdoor events': '重複進行的戶外活動',
    'Weekly outdoor events': '每週戶外活動',
    'Normal Prey Hunts': '普通難度狩獵',
    'Hard Prey Hunts': '困難難度狩獵',
    'Nightmare Prey Hunts': '惡夢難度狩獵',
    'Raid Finder': '團隊搜尋器',
    'Heroic seasonal dungeons': '英雄難度賽季地城',
    'Mythic seasonal dungeons': '傳奇難度賽季地城',
    'Normal raid': '普通難度團隊副本',
    'Heroic raid': '英雄難度團隊副本',
    'Mythic raid': '傳奇難度團隊副本',
    'Trading crests down': '紋章降級兌換',
    'Trade down': '向下兌換',
    'Trade up': '向上兌換',

    // /compare
    'Compare two specs': '比較兩個專精',
    'Put two specs side by side to see where they want the same drop. Pick both, and the link is shareable.':
      '把兩個專精並排，看看它們在哪些部位想要同一件掉落物。兩個都選好後，連結就能分享。',
    'First spec': '第一個專精',
    'Second spec': '第二個專精',
    'Class': '職業',
    'Spec': '專精',
    'Marked rows want the same item. Worth knowing before you queue together.': '標記的列代表兩者想要同一件物品。一起排隊前值得先知道。',
    'Slot': '部位',
    'Same item': '相同物品',

    // /editor
    'Import string editor': '匯入字串編輯器',
    'Paste a KeystoneLoot string, edit the list, and hand it on as a string or as a link. Or build one from scratch. The string itself never leaves your browser: only the item ids are looked up, to show names and drop sources.':
      '貼上 KeystoneLoot 字串、編輯清單，再以字串或連結的形式分享出去；也可以從頭建立一份。字串本身永遠不會離開你的瀏覽器：只會查詢物品 ID，用來顯示名稱與掉落來源。',
    'Paste string': '貼上字串',
    'Read string': '讀取字串',
    'Clear': '清除',
    'Or: start a new list': '或者：建立新清單',
    'Pick a spec and put the items together yourself.': '選擇一個專精，自己挑選物品。',
    'Nothing loaded yet. Paste a string above.': '尚未載入任何內容。請在上方貼上字串。',
    'Choose a spec…': '選擇專精…',

    // /raidbots。Droptimizer 照 raidbots 腳本的譯名「掉落最佳化」
    'Your droptimizer as an import string': '把你的掉落最佳化結果轉成匯入字串',
    'Beta': '測試版',
    'Paste your droptimizer URL and get the import string for the addon.': '貼上你的掉落最佳化網址，取得插件用的匯入字串。',
    'URL of the droptimizer result': '掉落最佳化結果的網址',
    'Read it': '讀取',
    'How it works': '運作方式',
    // 「Sim your character on <a>raidbots.com</a> with the droptimizer …」
    'Sim your character on': '在',
    'with the droptimizer and copy the URL of the result.': '上用掉落最佳化模擬你的角色，並複製結果的網址。',
    'Paste the URL here. We work out which drops are an upgrade for you and by how much.': '把網址貼到這裡。我們會算出哪些掉落對你是提升，以及提升多少。',
    'You get an import string. Import it into the addon and the game shows you which dungeon or which raid boss the items drop from.':
      '你會拿到一組匯入字串。把它匯入插件後，遊戲就會告訴你這些物品是從哪座地城或哪個團隊副本首領掉落。',
    'Why bother': '為什麼要這樣做',
    'The droptimizer tells you which item moves you forward and where it drops. Except it says so in a browser tab while you are in the game. With the string it is in the KeystoneLoot addon, and you can track it as loot appears.':
      '掉落最佳化會告訴你哪件物品能讓你進步，以及它從哪裡掉落；只是它顯示在瀏覽器分頁裡，而你人在遊戲中。有了這組字串，資訊就會出現在 KeystoneLoot 插件裡，戰利品出現時就能追蹤。',
    "What we don't do": '我們不做的事',
    // 「We do not sim. The sim runs at <a>Raidbots</a>, we only read …」
    'We do not sim. The sim runs at': '我們不做模擬。模擬是在',
    ', we only read the result and turn it into an import string.': ' 上執行的，我們只讀取結果並轉成匯入字串。',

    // /about。資料片名照暴雪 zh-TW 官方書名（巨龍崛起）
    'Who is behind it, and why the site and the addon exist.': '幕後是誰，以及這個網站與插件存在的原因。',
    // whitespace-pre-line 的段落，原文的換行要保留
    'Behind KeystoneLoot are just two people, not a big team:\nShantalya (Wolkenschutz), a good friend of mine, makes the addon, and I, Rusty Nail, make the site.':
      'KeystoneLoot 的背後只有兩個人，不是什麼大團隊：\n我的好朋友 Shantalya（Wolkenschutz）負責插件，而我 Rusty Nail 負責網站。',
    "It started in Dragonflight. Finding out where an item drops meant slogging through Blizzard's dungeon journal, boss by boss, every single time. That is the part the addon takes off your hands: it shows what drops in Mythic+ and in the raid, filtered to your class and spec, and which items the Catalyst turns into a tier piece. The site came later. It puts together the BiS list for each spec, and the import string marks exactly those items as favourites at the Best in Slot tier.":
      '這一切始於巨龍崛起。當時要查一件物品從哪裡掉落，每次都得在暴雪的地城導覽裡一個首領一個首領地慢慢翻。插件替你省下的就是這件事：它會依你的職業與專精，列出傳奇鑰石與團隊副本的掉落，以及哪些物品能在催化器轉化為套裝。網站是後來才有的：它為每個專精整理最佳配裝清單，而匯入字串會把這些物品標記為「最佳裝備」等級的最愛。',
    'Both are a free fan project. The lists come from publicly available guides and from a selection of the 5 best players per spec, and they are kept current. Every spec page shows its own timestamp.':
      '兩者都是免費的粉絲專案。清單取自公開的攻略，以及每個專精表現最好的 5 名玩家，並會持續更新。每個專精頁面都會顯示各自的時間戳記。',
    // 「The addon is <a>on CurseForge</a>, where it has been downloaded 5.3M times …」
    'The addon is': '插件可以在',
    'on CurseForge': 'CurseForge 上取得',
    'A wrong item, or an item level that looks off?': '物品錯了，或物品等級看起來不對？',
    ', every report goes into the next update.': '，每一則回報都會納入下一次更新。',

    // /contact
    'A bug, a wrong item, a spec that looks off? Or just an idea for something we could do better? Let us know.':
      '發現錯誤、物品不對，或某個專精看起來怪怪的？或者只是想到我們可以做得更好的地方？告訴我們吧。',
    'Name': '姓名',
    'E-mail': '電子郵件',
    'Subject': '主旨',
    'Message': '訊息',
    'I agree that my details will be used to answer this message. See the privacy policy.': '我同意你們使用我的資料來回覆這則訊息。詳見隱私權政策。',
    'Send': '送出',
    'Prefer direct contact?': '想直接聯絡？',
    'The postal address is in the': '郵寄地址請見',
    'Copy Discord name': '複製 Discord 名稱',

    // 404
    'This page does not exist': '這個頁面不存在',
    'An old link, perhaps, or a typo. The class list is a good place to start.': '可能是舊連結或打錯字了。職業清單是不錯的起點。',
    'See the classes': '查看職業',
    'Go home': '回到首頁',
    'Mythic+': '傳奇鑰石',
    'Copy import string': '複製匯入字串',

    'About KeystoneLoot': '關於 KeystoneLoot',
    'Contact': '聯絡方式',
    'Developers': '開發者',
    'Imprint': '網站資訊',
    'Privacy': '隱私權',
    'Made with': '製作於',
    'in Germany': '德國',
    'Cookies and consent': 'Cookie 與同意設定',
    'Cookie settings': 'Cookie 設定',
    'Allow everything': '全部允許',
    'Essential only': '僅必要項目',
    'Settings': '設定',
    'Cookie': 'Cookie',
    'Cookies': 'Cookies',
    'privacy policy': '隱私權政策',
    'KeystoneLoot is a fan project, built by players for players. Not affiliated with or endorsed by Blizzard Entertainment.': 'KeystoneLoot 是由玩家為玩家打造的粉絲專案，與 Blizzard Entertainment 無關，也未獲其認可。',
    'World of Warcraft® and Blizzard Entertainment® are trademarks of Blizzard Entertainment, Inc. All artwork, meaning class and spec icons, instance and boss images, and loading screens, is the property of Blizzard Entertainment and is shown here for informational purposes, as are class, spec, instance, and item names.': 'World of Warcraft® 與 Blizzard Entertainment® 是 Blizzard Entertainment, Inc. 的商標。所有美術素材，包括職業與專精圖示、副本與首領圖片以及載入畫面，均為 Blizzard Entertainment 所有；職業、專精、副本與物品名稱也僅供資訊參考。',
    'The essential ones are always set: your language choice and Wowhead\'s tooltip script. The rest is up to you. Ads appear either way; your choice only decides whether they are tailored to you. All of it in detail is in the': '必要的項目一律會設定：你的語言選擇與 Wowhead 提示資訊腳本。其餘設定由你決定；無論如何都會顯示廣告，你的選擇只會決定廣告是否依你的偏好調整。詳細內容請見',
  });

  // 長句中的固定介面術語；物品、法術與遊戲內容名稱仍由連結 widget 或 generated lookup 處理。
  const INLINE_TW = Object.freeze({
    'Intellect': '智力',
    'Strength': '力量',
    'Agility': '敏捷',
    'Haste': '加速',
    'Critical strike': '致命一擊',
    'Mastery': '精通',
    'Versatility': '臨機應變',
    'item level': '物品等級',
    'secondary stats': '副屬性',
    'best item per slot': '各部位的最佳物品',
    'The best in slot list for': '最佳配裝清單：',
  });

  const ROLE_TW = Object.freeze({
    DPS: 'DPS',
    TANK: '坦克',
    HEAL: '治療',
  });

  return Object.freeze({
    EXACT_TW,
    INLINE_TW,
    ROLE_TW,
  });
});
