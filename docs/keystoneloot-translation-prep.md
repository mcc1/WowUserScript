# KeystoneLoot 翻譯前準備

## 瀏覽器掃描紀錄

掃描日期：2026-08-31。

已用 `agent-browser` 實際載入並檢查：

- `https://keystoneloot.io/en/classes`
- `https://keystoneloot.io/en/classes/warrior/arms`

頁面是英文 Next.js／SPA，`document.title` 為 `Classes · KeystoneLoot`，`html[lang]`
為 `en`。點擊 `Arms DPS` 後，網址切換至 `/en/classes/warrior/arms` 並更新內容。

主要站方 UI 字串分成：

- 主導覽：`Classes`、`Tier list`、`Dungeons`、`Raid`、`Upgrades`、`Compare`、`Editor`。
- 專精頁控制與狀態：`Skip to content`、`All <Class> specs`、`Slot by slot, at the best upgrade state this season allows.`、`Import to KeystoneLoot`、`Close`、`Last Update`、`Found a bug?`、`Tell us about it`、`Stat priority`、`Hero talent (M+)`、`Into the catalyst`、`Overall`、`Mythic+`、`Raid`、`Copy import string`。
- 裝備來源標籤：`Raw item`、`T-set item`、`with the same stats`、`BoE trash drop`、`Crafted`、`by`、`Blacksmithing`。
- 頁尾／其他：`KeystoneLoot on CurseForge`、`About KeystoneLoot`、`Contact`、`Developers`、`Imprint`、`Privacy`、`Made with`、`in Germany`、`Cookies and consent`。
- Cookie 控件補充：`Cookie settings`、`Allow everything`、`Essential only`、`Settings`。

## 可共用的既有架構

- `libs/game-names-tw.js` 的 `lookupUnit()` 負責職業／專精／英雄天賦的官方繁中名稱；`Warrior`、`Arms`、`Death Knight` 等不可放進本站字典。
- `libs/wowhead-tw-helper.js` 負責 Wowhead URL 正規化、`data-wowhead` 的 `domain=tw`、`data-wh-rename-link` 與 SPA 的 `MutationObserver`／history 掃描。
- 掃描到的 Wowhead 物品連結形態為 `https://www.wowhead.com/item=<ID>`，可帶 `bonus`、`original-item`、`gems`、`ench`；連結是純文字 anchor，沒有 `data-wh-rename-link`，也沒有把 `img` 放在同一個 anchor 內。
- 本次沒有發現可直接共用的「站方 UI 字典」；既有 `EXACT_TW` 是各站專用，因此 KeystoneLoot 另建 `libs/keystoneloot-tw.js`。

## 實作邊界

- `keystoneloot-zh-hant.user.js` 只處理 KeystoneLoot UI 文字、職業／專精的 generated lookup，以及將頁面上的 Wowhead 連結交給共用 helper/widget。
- `libs/keystoneloot-tw.js` 只存本站掃描到的 UI 字串與 `DPS`／`TANK`／`HEAL` 角色標籤；不存物品、法術、地城、首領、職業或專精名稱。
- `← All <Class> specs` 由腳本讀取 URL／DOM 後以 `lookupUnit()` 動態組合，避免把單一職業寫死。

## 待瀏覽器實測

安裝本地 UserScript 後，需在 `/en/classes`、`/en/classes/warrior/arms` 與至少一次職業／專精 SPA 導航確認：站方 UI 變成正體中文、職業／專精由官方譯名產生、物品名稱由 Wowhead widget 變成繁中，且不改動輸入框或破壞連結內容。
