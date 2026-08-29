# AGENTS.md — WowUserScript

給 AI agent 與新進維護者的專案指南。**動手改任何檔案前先讀完本檔。**

## 這是什麼

一組把英文 WoW 工具網站在地化成**正體中文（zh-TW）** 的 UserScript（Tampermonkey / Violentmonkey）。
沒有 build step、沒有套件管理、沒有測試框架 — 原始檔即成品，直接被瀏覽器載入執行。
唯一的產生器是 `tools/generate-game-names.mjs`，見〈遊戲資料譯名〉。

## 檔案地圖

| 檔案 | 角色 |
|---|---|
| `libs/wowhead-tw-helper.js` | 共用函式庫（UMD），所有 `.user.js` 透過 `@require` 載入 |
| `libs/game-names-tw.js` | **generated** — 副本／團本／首領／種族／職業／專精的官方繁中譯名 |
| `tools/generate-game-names.mjs` | 產生上面那支；資料來自 wago.tools 的 client DB2，**不要手改產出檔** |
| `raidbots-zh-hant.user.js` | raidbots.com 全站翻譯 + Wowhead 連結修補（最大宗） |
| `archon-zh-hant.user.js` | archon.gg 翻譯 |
| `bloodmallet-zh-hant-wowhead.user.js` | bloodmallet.com 翻譯 + zh-hant 語言選項注入 |
| `wowhead-dual-language-title.user.js` | Wowhead 雙語標題 + 中英跨語搜尋（獨立，不使用 helper） |

## 遊戲資料譯名 — 本專案最重要的一條規則

> **遊戲內資料的譯名一律不手寫。有 ID 就用 ID 去拿官方譯名。**

手寫字典會隨改版漂移。實測稽核 82 個副本／團本，**29 個（35%）與官方繁中不符** —
例如 `The Necrotic Wake` 官方是「死靈戰地」而非「瘟疫之歿」、`Manaforge Omega` 是
「法力熔爐歐美加」而非「法力靈爐歐米茄」。這不是筆誤，是無人維護的必然結果。

三條取得譯名的管道，依資料類型選用：

| 資料類型 | ID 來源 | 譯名來源 | 現況 |
|---|---|---|---|
| 物品／法術／附魔／通貨 | 頁面上的 Wowhead 連結 | Wowhead widget（`data-wh-rename-link="true"`） | **執行期自動**，無字典 |
| 副本／團本／首領 | DB2 `JournalInstance` / `JournalEncounter` | wago.tools `?locale=zhTW` | **產生器**，見下 |
| 種族／職業／專精／英雄天賦 | DB2 `ChrRaces` / `ChrClasses` / `ChrSpecialization` / `TraitSubTree` | 同上 | **產生器** |
| 站台自己的 UI 字串 | 無 ID | 只有這類才手寫 | 各腳本的 `EXACT_TW` 等 |

**絕對不要**為了翻譯一個副本、首領、種族或專精而新增字典項目。改跑產生器。

### 重跑產生器（每次遊戲改版）

```sh
node tools/generate-game-names.mjs
```

**不需要任何憑證或 API key。** 資料來自 wago.tools 匯出的 WoW client DB2 表
（`https://wago.tools/db2/<Table>/csv?locale=zhTW`），同一張表換 `locale` 就能拿到
enUS 與 zhTW，依 `ID` 欄配對即可。新副本／新首領會自動出現，不需要人工登記 ID。

不連網的模板驗證：

```sh
node tools/generate-game-names.mjs --self-test
```

### 已評估並否決的兩條路，不要再走回去

1. **Wowhead tooltip 端點解析副本／首領。**
   `nether.wowhead.com/tooltip/{type}/{id}` 雖然帶 `Access-Control-Allow-Origin: *`，
   但只認 `item` / `spell` / `npc` / `zone` / `quest` / `currency` / `object` /
   `achievement` / `item-set`，**沒有 journal / encounter 類型**。
   而且要用它就得先有一張「頁面英文名 → Wowhead zone id」的表，那張表一樣要每次
   改版手動加，維護成本跟直接寫譯名沒有差別 —— 是繞路，不是解法。
2. **暴雪 Game Data API。**
   有官方 `zh_TW`，但需要 OAuth client credentials，secret 無法放進公開 userscript，
   也讓產生器多一道申請手續。wago.tools 直接給同樣的 client 資料且免憑證。

## 架構

### `WowheadTwHelper`（`libs/wowhead-tw-helper.js`）

1. **全域語系覆寫** — `setupGlobalLocale()` 覆寫 `window.Locale`（`getId() → 10`）與
   `window.whTooltips`（`domain: 'tw'`, `locale: 'zhtw'`），讓 Wowhead `power.js`
   widget 產出繁中 tooltip。
   **只在建立實例時觸發**（constructor 的 `autoInit`，預設 true），刻意不在函式庫載入時
   自動執行 —— 否則使用者關掉翻譯仍會被強制切成 zh-TW。呼叫端若讀完偏好設定決定不翻譯，
   就不要建立實例。
2. **連結正規化** — `toTwWowheadUrl()` 轉成 `tw.wowhead.com`（保留 `classic`/`ptr`/`beta`
   subdomain），並清掉路徑殘留的語系前綴。`data-wh-rename-link="true"` 讓 Wowhead widget
   自動把連結文字改寫成繁中物品名。
3. **SPA 監聽** — `start()` 掛 `MutationObserver` + 攔截 `history.pushState`/`replaceState`，
   節點進 `pendingRoots`，160ms debounce 後批次 flush，flush 時呼叫 `options.onScan(root)`。
4. **遊戲名稱查表** — `registerGameNameLookup(fn)` 接一個 `(englishName) => string|null`，
   由 `libs/game-names-tw.js` 提供。同時用於 linkify 守門（副本／首領名不可被當成裝備名）。

各站腳本的翻譯邏輯一律掛在 `onScan` / `onUrlChange` callback 上，**不要**自己再開 observer。

### 各站腳本的共同形狀

```
Object.freeze({ ... })  站台 UI 字串字典（不含遊戲資料）
translateText(raw)      字串 → 譯文 or null
walkTextNodes(root)     TreeWalker 掃文字節點，用 WeakMap 去重避免重複翻譯
new WowheadTwHelper({ onScan, onUrlChange })
```

`translatedNodeText` 是 `WeakMap<TextNode, string>` 快取；URL 變更時**必須**重建
（`translatedNodeText = new WeakMap()`），否則 SPA 換頁後舊節點被誤判為已翻譯。

### 生成檔的介面

`libs/game-names-tw.js` 掛在 `window.WowGameNamesTw`：

| 成員 | 用途 |
|---|---|
| `lookup(en)` | 副本／團本／首領 → 官方繁中，查不到回 `null` |
| `lookupUnit(en)` | 種族／職業／專精／英雄天賦 → 官方繁中 |
| `UNIT_LISTS` | 各分類的官方**英文**名清單，供前綴比對／CSS class 偵測（archon 要把
  「Frost Mage」拆成專精 + 職業；bloodmallet 要從 `translate_death_knight` 認出職業） |

查詢會正規化（轉小寫、去掉非英數），所以 `death_knight`、`Death Knight`、
`DEATH-KNIGHT` 都命中同一筆。另外會自動推導 `The X` ↔ `X`、以及逗號前的短寫法
（`Ara-Kara, City of Echoes` → 也接受 `Ara-Kara`），不需要為短名另開字典。

三支腳本都對生成檔缺席做了安全降級（查不到就當作沒有譯名），不會整支壞掉。

## 發版流程（重要，容易漏）

改 `libs/wowhead-tw-helper.js` 時，**兩處要同步更新**：

1. `libs/wowhead-tw-helper.js` 的 JSDoc `@version`
2. 三支 `.user.js` 的 `@require ...wowhead-tw-helper.js?v=X.Y.Z`

`?v=` 是 cache buster — 使用者的 userscript manager 以完整 URL 當 `@require` 的快取 key，
不改 query string 就永遠拿到舊版函式庫。重跑產生器後也要 bump
`game-names-tw.js?v=`。目前無自動檢查，改完自己 grep 比對：

```sh
grep -n '@version\|?v=' libs/wowhead-tw-helper.js *.user.js
```

改單一站台腳本時只 bump 該檔的 `@version`（版本已刻意 decouple，見 commit `2b76205`）。

`@require` / `@updateURL` / `@downloadURL` 全部指向
`raw.githubusercontent.com/mcc1/WowUserScript/master/...` —
**push 到 master 等於對所有使用者發版**，沒有 staging。改動要當成 production release 看待。

## 用語規則（非遊戲資料的部分）

- 一律使用**暴雪官方 zh-TW 譯名**，不用對岸（zh-CN）用語，也不自創。
- 已確認的易錯點：
  - Mythic 難度 = **傳奇**（不是「神話」，也不是 zh-CN 的「史詩」）。
    以 Wowhead 物品 tooltip 對照 `locale=0` / `locale=10` 驗證過。
  - Myth **裝備軌道** = 神話（與難度不同，勿一起改）。
  - Epic **品質** = 史詩。
  - Mythic+ = 傳奇鑰石；Raid Finder = 團隊搜尋器。
- 不確定就用 ID 去查，不要憑印象填。

## 手動驗證（沒有自動測試框架）

```sh
node --check <file>                          # 語法檢查
node tools/generate-game-names.mjs --self-test   # 產生器模板
```

然後在瀏覽器實測（Tampermonkey 指向本機檔案或暫時貼上）：

- **raidbots**: Droptimizer 輸入頁 / 結果圖表 / Top Gear 卡片 / Vault 區塊 / 語言選單切換
- **archon**: build 頁的麵包屑、頁籤、天賦 tooltip
- **bloodmallet**: `/`（spec table）、`/chart/...`（圖表 + Character profile）、`/settings/general`
- **wowhead**: 物品頁雙語標題、搜尋框輸入中文與英文

重點確認：**沒有無限迴圈**（observer 改 DOM → 觸發自己）與**沒有把使用者輸入框內容翻掉**。

## 尚未處理

- raidbots 的 `DUNGEON_TW_MAP` 還留 14 筆暴雪 Journal 沒有對應條目的
  raidbots 自訂標籤（把 Mechagon 拆成工坊／廢料場、DOTI 與 Tazavesh 的分段等）。
- `wowhead-dual-language-title.user.js` 仍完全獨立，沒有共用 helper。

## 慣例

- 程式碼、識別字、commit message、檔名：**英文**。註解與本檔：**正體中文**。
- Commit 格式：Conventional Commits + scope，標題結尾附版本，例如
  `fix(bloodmallet): ... (v0.6.0)`、`feat(lib): ... (v1.6.0)`。
- 縮排 2 空格，單引號，`'use strict'`，整支包在 IIFE 內。
- 字典一律 `Object.freeze({ ... })`。
- **不要**引入 build tool / bundler / npm 依賴 — 這個專案刻意保持零工具鏈，
  `tools/` 底下只放無依賴的 Node 腳本。
