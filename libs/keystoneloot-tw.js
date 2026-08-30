/**
 * KeystoneLoot Traditional Chinese Dictionary
 * @version 1.0.0
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

  // 這裡只放 KeystoneLoot 自有的介面字串；職業、專精與物品名稱不放手寫表。
  const EXACT_TW = Object.freeze({
    'Classes': '職業',
    'Tier list': '強度排行',
    'Dungeons': '地城',
    'Raid': '團隊副本',
    'Upgrades': '升級',
    'Compare': '比較',
    'Editor': '編輯器',

    'Skip to content': '跳至內容',
    'Slot by slot, at the best upgrade state this season allows.': '逐個部位，採用本賽季允許的最佳升級狀態。',
    'Import to KeystoneLoot': '匯入 KeystoneLoot',
    'Close': '關閉',
    'KeystoneLoot on CurseForge': 'CurseForge 上的 KeystoneLoot',
    'Last Update': '上次更新',
    'Found a bug?': '發現錯誤？',
    'Tell us about it': '告訴我們',

    'Stat priority': '屬性優先級',
    'Hero talent (M+)': '英雄天賦（傳奇鑰石）',
    'Into the catalyst': '進入催化器',
    'Raw item': '原始物品',
    'T-set item': '套裝物品',
    'with the same stats': '相同屬性',
    'BoE trash drop': '裝備綁定的小怪掉落',
    'Crafted': '製作',
    'by': '由',
    'Blacksmithing': '鍛造',

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
  });

  const ROLE_TW = Object.freeze({
    DPS: 'DPS',
    TANK: '坦克',
    HEAL: '治療',
  });

  return Object.freeze({
    EXACT_TW,
    ROLE_TW,
  });
});
