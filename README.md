# 英文單字卡練習網站

這是一個使用 HTML、CSS、JavaScript 製作的純前端英文單字卡練習網站，不需要後端，也不需要安裝框架。

## 功能

- 首頁顯示今日待複習數、總單字數、正確率
- 練習頁面顯示可翻面的單字卡
- 正面顯示英文單字與詞性
- 背面顯示中文意思、英文例句、例句中文翻譯
- 支援「不認識」「模糊」「認識」「下一張」
- 使用 localStorage 保存學習紀錄
- 內建分類：TOEIC、日常生活、商業英文、科技英文
- 支援手機版與桌機版

## 使用方式

直接用瀏覽器開啟 `index.html` 即可開始練習。

## 檔案說明

- `index.html`：網站的 HTML 結構
- `style.css`：畫面樣式與手機版排版
- `app.js`：單字資料、翻卡、熟悉度更新、localStorage 儲存邏輯
- `README.md`：專案說明

## 如何新增單字

打開 `app.js`，在 `vocabulary` 陣列中新增一筆資料：

```js
{
  id: "toeic-003",
  word: "invoice",
  partOfSpeech: "noun",
  category: "TOEIC",
  meaning: "發票；帳單",
  example: "Please send the invoice by Friday.",
  translation: "請在星期五前寄出發票。"
}
```

注意：每個單字的 `id` 不可以重複，因為 localStorage 會用它來保存學習紀錄。
