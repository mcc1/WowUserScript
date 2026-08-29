// ==UserScript==
// @name         Archon.gg Traditional Chinese
// @namespace    https://www.archon.gg/
// @version      0.4.0
// @description  Translate archon.gg WoW build pages to Traditional Chinese.
// @author       mcc
// @match        https://www.archon.gg/wow/*
// @require      https://raw.githubusercontent.com/mcc1/WowUserScript/master/libs/wowhead-tw-helper.js?v=1.5.3
// @run-at       document-start
// @grant        none
// @license      MIT
// ==/UserScript==

(function () {
  'use strict';

  // ── 翻譯表 ────────────────────────────────────────────────────────────────

  const CLASS_TW = Object.freeze({
    'Death Knight': '死亡騎士',
    'Demon Hunter': '惡魔獵人',
    'Druid': '德魯伊',
    'Evoker': '喚能師',
    'Hunter': '獵人',
    'Mage': '法師',
    'Monk': '武僧',
    'Paladin': '聖騎士',
    'Priest': '牧師',
    'Rogue': '盜賊',
    'Shaman': '薩滿',
    'Warlock': '術士',
    'Warrior': '戰士',
  });

  const SPEC_TW = Object.freeze({
    'Affliction': '痛苦',
    'Arcane': '秘法',
    'Arms': '武器',
    'Assassination': '刺殺',
    'Augmentation': '強化',
    'Balance': '平衡',
    'Beast Mastery': '野獸控制',
    'Blood': '血魄',
    'Brewmaster': '釀酒',
    'Demonology': '惡魔學識',
    'Destruction': '毀滅',
    'Devastation': '破滅',
    'Devourer': '噬滅',
    'Discipline': '戒律',
    'Elemental': '元素',
    'Enhancement': '增強',
    'Feral': '野性戰鬥',
    'Fire': '火焰',
    'Frost': '冰霜',
    'Fury': '狂怒',
    'Guardian': '守護者',
    'Havoc': '災虐',
    'Holy': '神聖',
    'Marksmanship': '射擊',
    'Mistweaver': '禦霧',
    'Outlaw': '暴徒',
    'Preservation': '護存',
    'Protection': '防護',
    'Restoration': '恢復',
    'Retribution': '懲戒',
    'Shadow': '暗影',
    'Subtlety': '敏銳',
    'Survival': '生存',
    'Unholy': '穢邪',
    'Vengeance': '復仇',
    'Windwalker': '御風',
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
    'Mythic+': '史詩鑰石',
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
    'Alternative Class Talents': '替代職業天賦',
    'Export': '匯出',
    'Edit': '編輯',
    'Copy': '複製',

    // 英雄天賦名稱
    'Deathbringer': '死亡使者',
    'Rider of the Apocalypse': '天啟騎士',
    "San'layn": '煞婪',
    'Aldrachi Reaver': '奧達奇劫奪者',
    'Fel-Scarred': '魔痕',
    'Annihilator': '殲滅者',
    "Elune's Chosen": '伊露恩之選',
    'Keeper of the Grove': '利爪德魯伊',
    'Druid of the Claw': '林地看守者',
    'Wildstalker': '野地潛獵者',
    'Chronowarden': '時光看守者',
    'Flameshaper': '塑火者',
    'Scalecommander': '龍隊指揮官',
    'Dark Ranger': '黑暗遊俠',
    'Pack Leader': '獸群領袖',
    'Sentinel': '哨兵',
    'Frostfire': '霜火',
    'Spellslinger': '拋法者',
    'Sunfury': '日怒',
    'Conduit of the Celestials': '天尊引導者',
    'Master of Harmony': '和諧大師',
    'Shadopan': '影潘',
    'Herald of the Sun': '太陽先驅',
    'Lightsmith': '光鑄師',
    'Templar': '聖殿騎士',
    'Archon': '御靈者',
    'Oracle': '神諭者',
    'Voidweaver': '虛織者',
    'Deathstalker': '亡靈哨兵',
    'Fatebound': '命縛者',
    'Trickster': '欺詐者',
    'Farseer': '先知',
    'Stormbringer': '風暴使者',
    'Totemic': '圖騰師',
    'Diabolist': '崇魔者',
    'Hellcaller': '喚魔者',
    'Soul Harvester': '靈魂收割者',
    'Colossus': '巨像',
    'Mountain Thane': '山脈族長',
    'Slayer': '殺戮者',

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

    // 遊戲版本選單
    'WoW - Midnight': 'WoW - 午夜',
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
    'Mythic+ Build': '史詩鑰石配置',
    'Raid Build': '團隊副本配置',
    'Mythic+ Overview': '史詩鑰石總覽',
    'Raid Overview': '團隊副本總覽',
    'Weapons & Trinkets': '武器 & 飾品',
    'Enchants & Gems': '附魔 & 寶石',
    'Consumables': '消耗品',
    'Tier Set': '套裝',
    'Rotation': '迴圈',
    'Overview': '總覽',
    'Talents': '天賦',
    'Tier List': '強度排行',
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
    onScan: (root) => {
      walkTextNodes(root);
      translateBreadcrumbs();
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

    helper.observe(document.body);
    helper.startHistoryListener();
    helper.runFullPass();
  }

  startWhenReady();
})();
