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

- `libs/game-names-tw.js` 的 `lookupUnit()` 負責職業／專精／英雄天賦，`lookup()` 負責副本／團本／首領的官方繁中名稱；`Warrior`、`Arms`、`Death Knight` 等不可放進本站字典。
- `libs/wowhead-tw-helper.js` 負責 Wowhead URL 正規化、`data-wowhead` 的 `domain=tw`、`data-wh-rename-link` 與 SPA 的 `MutationObserver`／history 掃描。
- 掃描到的 Wowhead 物品連結形態為 `https://www.wowhead.com/item=<ID>`，可帶 `bonus`、`original-item`、`gems`、`ench`；裝備與附魔的名稱連結是純文字 anchor，沒有 `data-wh-rename-link`，圖示放在另一個 `aria-hidden` 的 anchor。
- **寶石連結例外**（站方 2.3.x，2026-09-21 掃描）：`<a><img><span>Flawless Masterful Peridot</span></a>`，圖示與名稱同在一個 anchor，前面有時還多一個 `<span>2×</span>` 數量。這種連結不能掛 `data-wh-rename-link`（widget 會連圖示一起換掉），腳本改開 helper 的 `enableIconLinkRename` 走探針。
- 寶石／附魔旁有複製鈕，`title` 與 `aria-label` 是 `Copy <物品名>`；寶石 anchor 本身也有 `title="<物品名>"`。這些只能等 Wowhead 配對（`wowheadNameMap`）翻好再換，不能交給通用規則。
- 2.3.x 新增來源切換（原生 `<select>`：`Guide` / `Warcraft Logs`）。Warcraft Logs 模式的標題與說明帶玩家標籤（`The gear #1 Noxiv (US) wears`），由 regex 處理；Guide 模式把屬性說明拆成兩個以 `<br>` 分隔的文字節點。
- 本次沒有發現可直接共用的「站方 UI 字典」；既有 `EXACT_TW` 是各站專用，因此 KeystoneLoot 另建 `libs/keystoneloot-tw.js`。

## 實作邊界

- `keystoneloot-zh-hant.user.js` 只處理 KeystoneLoot UI 文字、職業／專精與副本／團本／首領的 generated lookup，以及將頁面上的 Wowhead 連結交給共用 helper/widget。
- `libs/keystoneloot-tw.js` 只存本站掃描到的 UI／來源標籤與 `DPS`／`TANK`／`HEAL` 角色標籤；不存物品、法術、地城、首領、職業或專精名稱。
- 套裝區塊不建立季節字典：執行期以頁面上的套裝物品 ID 對照 Wago `ItemSet`／`ItemSetSpell` DB2，套裝名稱取 zhTW 欄位，套裝效果再以對應 spell ID 從 Wowhead zhTW tooltip 取得。
- `← All <Class> specs` 由腳本讀取 URL／DOM 後以 `lookupUnit()` 動態組合，避免把單一職業寫死。
- 物品、附魔與寶石名稱不手寫；已有 Wowhead 連結的名稱交由 widget 改名，只有未包成連結但鄰近 Wowhead 圖示的名稱才由 helper 的 safe linkify 補上連結後改名。
- helper 會以 `refreshLinks(true)` 強制進入 Wowhead 的改名掃描，但仍保持全域 `renameLinks`
  關閉，避免 widget 把同一個連結內的圖示與數據一起替換。KeystoneLoot 另以執行期的
  Wowhead item ID 配對保存「英文名稱→繁中名稱」，讓說明段落中的同一批物品也能同步更新。
- 來源列的 `in`／`from` 是獨立文字節點，先註冊為非物品名稱，再由站台腳本翻成「於」／「來自」，避免 safe linkify 把連接詞誤綁到裝備圖示。

## 瀏覽器實測結果

2026-08-31 已在 `/en/classes/mage/arcane` 實測：站方 UI、標題、屬性、部位、來源、副本／首領、物品／寶石／附魔連結均已翻譯；所有 Wowhead 連結已轉為 `tw.wowhead.com`，圖示仍保留，來源連接詞沒有被誤連結。另確認 `Locale.getId() === 10`、`whTooltips.locale === 'zhtw'`、`whTooltips.domain === 'tw'`。

尚需在實際 userscript manager 安裝後，於 `/en/classes`、`/en/classes/warrior/arms` 與至少一次職業／專精 SPA 導航確認正式載入的 `@require` 快取版本，以及在使用者環境 hover tooltip。

### 2026-09-21：寶石探針改名（v0.5.0）

使用者回報寶石（`Flawless Masterful Peridot`）與 `Crafted by Jewelcrafting` 沒翻。原因是站方改版後寶石名稱與圖示同在一個 anchor（見上），helper 的 `!hasImage` 守門刻意不掛改名標記。

本機驗證方式：內建瀏覽器沒有 Tampermonkey，而且會擋外站對 localhost 的請求，所以用一支反向代理把 `keystoneloot.io` 整站轉到 `127.0.0.1`，在 `</head>` 前注入本機的三支 lib 與 userscript（`tools/inject-proxy.py`，用法見檔頭；只供驗證）。兩個代理環境的限制，不是腳本問題：

- 站方用 Next.js `lazyOnload` 載入 `power.js`，代理頁面有資源掛住 `load` 事件時 widget 不會到；測試時手動 `appendChild` power.js 再 `$WowheadPower.refreshLinks(true)`。
- `wago.tools` 沒有 CORS header，`fetch` 後援拿不到套裝資料；真實環境走 `GM_xmlhttpRequest` 沒有這個問題。

在 `/en/classes/paladin/retribution`（Guide／Warcraft Logs 兩種來源、含 SPA 切換）與 `/en/classes/warrior/fury?source=warcraft-logs` 確認：寶石（含 `2×` 前綴）、寶石 `title`、複製鈕 `title`／`aria-label`、附魔、裝備、來源標籤、Warcraft Logs 標題與段落均已翻譯，探針全數回收（`body > a[data-wh-rename-link]` 為 0）。
