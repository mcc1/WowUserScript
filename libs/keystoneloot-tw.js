/**
 * KeystoneLoot Traditional Chinese Dictionary
 * @version 1.1.0
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
    'Haste': '加速',
    'Critical strike': '致命一擊',
    'Mastery': '精通',
    'Versatility': '臨機應變',
    'Hero talent (M+)': '英雄天賦（傳奇鑰石）',
    'Into the catalyst': '進入催化器',
    'Raw item': '原始物品',
    'T-set item': '套裝物品',
    'with the same stats': '相同屬性',
    'BoE trash drop': '裝備綁定的小怪掉落',
    'Crafted': '製作',
    'by': '由',
    'Catalyst': '催化器',
    'Tailoring': '裁縫',
    'Inscription': '銘文學',
    'Blacksmithing': '鍛造',

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
    "Convert these pieces to get the set's 4-piece bonus. New in Season 2: the tier piece takes on the secondary stats of what you put in, and the item level always came along anyway. So all that matters is which slots you pick. The tooltip on the right shows the converted piece, with your stats already on it.": '轉換這些部位即可取得套裝的 4 件套裝效果。第 2 季的新變化是：套裝部位會採用你放入物品的副屬性，而且物品等級本來就會一併保留。因此，你只需要決定要選哪些部位。右側的提示資訊會顯示轉換後的物品，並已套用你的屬性。',
    'Midnight · Season 2': '至暗之夜 · 第 2 季',
    'Midnight · Season 2 · 12.1.0': '至暗之夜 · 第 2 季 · 12.1.0',
    'Navigation': '導覽',
    'Tools': '工具',
    'Project': '專案',

    'Overall': '總體',
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
