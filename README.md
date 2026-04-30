# 英文單字卡練習網站

這是一個使用 HTML、CSS、JavaScript 製作的純前端英文單字卡練習網站，不需要後端，也不需要安裝框架。單字本會從 Supabase 的 `wordbooks` 資料表讀取，單字會從 `vocabularies` 資料表依照 `wordbook_id` 讀取，學習紀錄則保存在瀏覽器 localStorage。

## 功能

- 首頁顯示所有單字本卡片
- 單字本卡片顯示名稱、描述、等級、單字數量
- 選擇單字本後，首頁顯示今日待複習數、總單字數、正確率
- 練習頁面顯示可翻面的單字卡
- 正面顯示英文單字與詞性
- 背面顯示中文意思、英文例句、例句中文翻譯
- 支援「不認識」「模糊」「認識」「下一張」
- 使用 localStorage 保存學習紀錄
- 從 Supabase 讀取分類，例如 TOEIC、日常生活、商業英文、科技英文
- 支援返回單字本列表
- 支援手機版與桌機版

## 使用方式

先完成 Supabase 設定，再用瀏覽器開啟 `index.html`，或部署到 Vercel 後開啟正式網址。

## 檔案說明

- `index.html`：網站的 HTML 結構
- `style.css`：畫面樣式與手機版排版
- `app.js`：Supabase 讀取、翻卡、熟悉度更新、localStorage 儲存邏輯
- `README.md`：專案說明

## Supabase 設定教學

1. 到 Supabase 專案後台，確認已建立 `wordbooks` 和 `vocabularies` 資料表。
2. `wordbooks` 欄位需要包含：
   `id`, `name`, `description`, `level`, `created_at`
3. `vocabularies` 欄位需要包含：
   `id`, `wordbook_id`, `word`, `part_of_speech`, `meaning_zh`, `example_en`, `example_zh`, `category`, `difficulty`, `created_at`
4. 到 Supabase 專案的 API 設定頁，複製 Project URL。
5. 複製 Publishable key，或舊版專案的 anon public key。
6. 打開 `app.js`，替換以下兩個常數：

```js
const SUPABASE_URL = "https://YOUR_PROJECT_REF.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY";
```

注意：前端只能使用 Publishable key 或 anon public key，不要把 `service_role` 或 secret key 放進前端程式碼。

如果你的資料表有啟用 RLS，請替 `wordbooks` 和 `vocabularies` 加入允許公開讀取的 SELECT policy，否則前端會讀不到資料。這個專案目前不做登入功能，所以只需要讀取單字本與單字資料。

範例 SQL：

```sql
alter table public.vocabularies enable row level security;
alter table public.wordbooks enable row level security;

create policy "Allow public read wordbooks"
on public.wordbooks
for select
to anon
using (true);

create policy "Allow public read vocabularies"
on public.vocabularies
for select
to anon
using (true);
```

## 如何新增單字

請先在 Supabase 的 `wordbooks` 資料表新增單字本，再到 `vocabularies` 資料表新增單字，並把 `wordbook_id` 填成對應單字本的 `id`。

`wordbooks` 範例：

| 欄位 | 範例 |
| --- | --- |
| name | TOEIC 基礎單字 |
| description | 適合初學者的 TOEIC 常見字 |
| level | beginner |

`vocabularies` 範例：

| 欄位 | 範例 |
| --- | --- |
| wordbook_id | 對應 wordbooks.id |
| word | invoice |
| part_of_speech | noun |
| meaning_zh | 發票；帳單 |
| example_en | Please send the invoice by Friday. |
| example_zh | 請在星期五前寄出發票。 |
| category | TOEIC |
| difficulty | easy |

新增後重新整理網站，就會從 Supabase 讀取最新單字本與單字。

## 如何測試

1. 在 VS Code 安裝 Live Server 擴充套件。
2. 用 VS Code 開啟此專案資料夾。
3. 在 `index.html` 上按右鍵，選擇 `Open with Live Server`。
4. 瀏覽器會開啟類似 `http://127.0.0.1:5500/index.html` 的網址。
5. 首頁應該會顯示 Supabase `wordbooks` 表中的所有單字本卡片。
6. 點擊某一本單字本後，首頁「總單字數」應該等於該 `wordbook_id` 底下的單字數。
7. 點「開始練習」，確認卡片正面顯示 `word` 和 `part_of_speech`。
8. 點卡片翻面，確認背面顯示 `meaning_zh`, `example_en`, `example_zh`。
9. 點「不認識」「模糊」「認識」，再按「下一張」，確認練習流程正常。
10. 點「返回單字本列表」，確認會回到首頁。
11. 如果某本沒有單字，會顯示「這個單字本目前沒有單字」。
12. 如果 URL、key、RLS policy 或網路設定有問題，會顯示「資料讀取失敗，請稍後再試」。
