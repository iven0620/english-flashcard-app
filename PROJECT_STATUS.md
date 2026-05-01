以下是目前英文單字卡專案狀態整理，可直接複製到下一個 Codex 對話。

1. 專案使用技術

HTML
CSS
JavaScript
Supabase JavaScript Client CDN
Supabase Database
Vercel 部署
GitHub 版本管理
不使用 React / Vue / Next.js
無後端，自前端直接讀寫 Supabase
2. 目前已有功能

從 Supabase 讀取 wordbooks
顯示單字本列表
選擇單字本
從 Supabase vocabularies 依 wordbook_id 讀取單字
一般 Anki 10 題練習模式
今日任務模式
新單字 20 題
錯題 20 題
模糊 10 題
錯題本模式
從 study_records 讀取 unknown / uncertain
去重複後回查 vocabularies
翻卡功能
答題按鈕：
熟悉
模糊
沒看過
Anki 簡化 reviewQueue 邏輯：
熟悉：從本輪移除
模糊：往後第 4 個位置
沒看過：往後第 2 個位置
本輪完成畫面
本輪統計
每次答題寫入 Supabase study_records
localStorage 仍保留本機學習紀錄與正確率統計
3. 目前主要檔案與用途

index.html
網站結構
Header
Hero
統計卡
今日任務
單字本 Library
分類區
練習頁
完成畫面
載入 Supabase CDN 與 app.js
style.css
深色高級版 Premium Learning Dashboard UI
Midnight SaaS / AI learning app 風格
Responsive layout
Hero / cards / buttons / tags / flashcard 樣式
app.js
Supabase client 初始化
讀取 wordbooks
讀取 vocabularies
今日任務資料組合
錯題本資料讀取
Anki reviewQueue 邏輯
翻卡與答題流程
寫入 study_records
localStorage 紀錄
README.md
專案說明
Supabase 設定
測試方式
4. Supabase 資料表結構

wordbooks

id
name
description
level
created_at
vocabularies

id
wordbook_id
word
part_of_speech
meaning_zh
example_en
example_zh
category
difficulty
created_at
study_records

id
vocabulary_id
status
review_count
known_count
uncertain_count
unknown_count
last_reviewed_at
created_at
5. app.js 中重要 function

createSupabaseClient()
建立 Supabase client
initializeApp()
頁面載入後讀取單字本
loadWordbooksFromSupabase()
從 wordbooks 讀取單字本，並計算每本單字數
loadVocabulariesFromSupabase(wordbookId)
依單字本讀取 vocabularies
loadMistakeCardsFromSupabase()
讀取 unknown / uncertain 的錯題
loadReviewedVocabularyIdsFromSupabase()
讀取已練過的 vocabulary id
loadCardsByStudyStatus(status, limit)
依 study_records.status 抽題
mapVocabularyRow(item)
將 Supabase 欄位轉成前端卡片格式
selectWordbook(wordbookId)
選擇單字本並載入單字
startRound()
一般 10 題練習
startMistakeBookRound()
錯題本練習
startDailyTaskRound()
今日任務練習
startRoundWithCards(cards, mode, count = 10)
共用的 Anki 練習啟動函式
restartCurrentRound()
根據目前模式重新練習
renderCurrentCard()
顯示 reviewQueue 第一張卡
flipCard()
翻卡
handleReviewAnswer(rating)
處理熟悉 / 模糊 / 沒看過
updateSavedProgress(card, rating)
更新 localStorage 學習紀錄
saveStudyRecord(card, rating)
寫入 Supabase study_records
createStudyRecordPayload(card, rating)
建立 study_records payload
insertCardBackIntoQueue(card, distance)
將卡片插回 reviewQueue
showRoundComplete()
顯示本輪完成畫面
updateRoundStatsView()
更新本輪統計 UI
pickRandomItems(items, count)
隨機抽題
uniqueCards(cards)
卡片去重複
6. app.js 使用到的重要 DOM id

homeView
practiceView
startButton
dailyTaskButton
mistakeBookButton
backHomeButton
resetButton
flashcard
nextButton
completeView
restartRoundButton
dueCount
totalCount
accuracyRate
selectedWordbookName
wordbookList
categoryList
statusMessage
cardProgress
wordCategory
wordText
partOfSpeech
meaningText
exampleText
translationText
practiceWordbookName
practiceModeName
roundTotalCount
roundKnownCount
roundRemainingCount
roundUnclearCount
roundForgotCount
completeTotalCount
completeKnownCount
completeUnclearCount
completeForgotCount
7. 目前 UI 風格

深色高級版 Premium Learning Dashboard
Midnight SaaS Dashboard / Premium AI Learning App 風格
無 sidebar
上下式 dashboard layout
深 navy / charcoal / midnight gradient 背景
深藍灰玻璃感卡片
淡藍細邊框
柔和陰影與少量 blue glow
Hero 左右分欄
三張 stats cards
Daily Mission 橫向主卡
Library 單字本 grid
Selected 單字本有亮藍 border、subtle gradient、Selected pill
桌面 4 欄單字本 grid
平板 2 欄
手機 1 欄
8. 已知注意事項

不要改 SUPABASE_URL
不要改 SUPABASE_ANON_KEY
不要改資料表名稱：
wordbooks
vocabularies
study_records
不要刪除或改名 app.js 使用到的 DOM id
wrongBookButton / dailyMissionButton 不是目前實際 id
實際是 mistakeBookButton
實際是 dailyTaskButton
如果 Supabase 讀取或寫入失敗，通常是 RLS policy 問題
study_records 前端需要可 insert
study_records 前端需要可 select 才能做錯題本與今日任務
vocabularies 前端需要可 select
wordbooks 前端需要可 select
目前沒有登入功能，因此所有紀錄是公開寫入邏輯，之後若加入 Auth 需要加 user_id
localStorage 仍保存本機正確率，但 Supabase 也有 study_records，未來可整合統計來源
今日任務目前會從已選單字本取新單字，但錯題 / 模糊題是從所有 study_records 對應單字中抓，不一定限制在目前單字本
9. 下一步建議開發項目

加入 Supabase Auth
study_records 加上 user_id
將錯題本與今日任務限制在目前使用者資料
將今日任務的錯題 / 模糊題限制在目前選擇單字本
建立真正的 spaced repetition 欄位：
next_review_at
ease_factor
interval_days
將 localStorage 正確率改為從 Supabase 統計
新增學習紀錄 dashboard
新增每本單字本完成率
新增每日 streak
新增搜尋單字功能
新增分類篩選
新增單字發音
新增例句朗讀
新增管理者匯入 CSV 頁面
新增錯題移除條件，例如連續熟悉 2 次後不再列為錯題
優化 Supabase 查詢，避免資料量大時一次抓太多 records