# 英文單字卡練習網站

這是一個使用 HTML、CSS、JavaScript 製作的純前端英文單字卡練習網站，不需要後端，也不需要安裝框架。單字資料會從 Supabase 的 `vocabularies` 資料表讀取，學習紀錄則保存在瀏覽器 localStorage。

## 功能

- 首頁顯示今日待複習數、總單字數、正確率
- 練習頁面顯示可翻面的單字卡
- 正面顯示英文單字與詞性
- 背面顯示中文意思、英文例句、例句中文翻譯
- 支援「不認識」「模糊」「認識」「下一張」
- 使用 localStorage 保存學習紀錄
- 從 Supabase 讀取分類，例如 TOEIC、日常生活、商業英文、科技英文
- 支援手機版與桌機版

## 使用方式

先完成 Supabase 設定，再用瀏覽器開啟 `index.html`，或部署到 Vercel 後開啟正式網址。

## 檔案說明

- `index.html`：網站的 HTML 結構
- `style.css`：畫面樣式與手機版排版
- `app.js`：Supabase 讀取、翻卡、熟悉度更新、localStorage 儲存邏輯
- `README.md`：專案說明

## Supabase 設定教學

1. 到 Supabase 專案後台，確認已建立 `vocabularies` 資料表。
2. 資料表欄位需要包含：
   `id`, `word`, `part_of_speech`, `meaning_zh`, `example_en`, `example_zh`, `category`, `difficulty`, `created_at`
3. 到 Supabase 專案的 API 設定頁，複製 Project URL。
4. 複製 Publishable key，或舊版專案的 anon public key。
5. 打開 `app.js`，替換以下兩個常數：

```js
const SUPABASE_URL = "https://YOUR_PROJECT_REF.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY";
```

注意：前端只能使用 Publishable key 或 anon public key，不要把 `service_role` 或 secret key 放進前端程式碼。

如果你的 `vocabularies` 資料表有啟用 RLS，請加入允許公開讀取的 SELECT policy，否則前端會讀不到資料。這個專案目前不做登入功能，所以只需要讀取單字資料。

範例 SQL：

```sql
alter table public.vocabularies enable row level security;

create policy "Allow public read vocabularies"
on public.vocabularies
for select
to anon
using (true);
```

## 如何新增單字

請直接在 Supabase 的 `vocabularies` 資料表新增資料。範例：

| 欄位 | 範例 |
| --- | --- |
| word | invoice |
| part_of_speech | noun |
| meaning_zh | 發票；帳單 |
| example_en | Please send the invoice by Friday. |
| example_zh | 請在星期五前寄出發票。 |
| category | TOEIC |
| difficulty | easy |

新增後重新整理網站，就會從 Supabase 讀取最新單字。

## 如何測試

1. 確認 `app.js` 裡的 `SUPABASE_URL` 和 `SUPABASE_ANON_KEY` 已替換成你的專案設定。
2. 確認 Supabase `vocabularies` 表至少有一筆資料。
3. 重新整理 `index.html` 或 Vercel 網站。
4. 首頁「總單字數」應該等於資料表讀到的單字數。
5. 點「開始練習」，確認卡片正面顯示 `word` 和 `part_of_speech`。
6. 點卡片翻面，確認背面顯示 `meaning_zh`, `example_en`, `example_zh`。
7. 點「不認識」「模糊」「認識」，再回首頁確認正確率與待複習數會更新。
8. 如果表中沒有資料，首頁會顯示「目前沒有單字資料」。
9. 如果 URL、key、RLS policy 或網路設定有問題，首頁會顯示「資料庫連線失敗，請稍後再試」。
