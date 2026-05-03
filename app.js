const SUPABASE_URL = "https://gcaiqgxpamblufeqxzjv.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_ya9qrXLyFN5YCjQkSrcZ5g_8wQMVWKE";
const STORAGE_KEY = "englishFlashcardProgress";
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const supabaseClient = createSupabaseClient();

let wordbooks = [];
let vocabulary = [];
let selectedWordbook = null;
let progress = loadProgress();
let reviewQueue = [];
let roundCards = [];
let roundStats = createEmptyRoundStats();
let currentPracticeMode = "normal";

const homeView = document.querySelector("#homeView");
const practiceView = document.querySelector("#practiceView");
const startButton = document.querySelector("#startButton");
const dailyTaskButton = document.querySelector("#dailyTaskButton");
const mistakeBookButton = document.querySelector("#mistakeBookButton");
const backHomeButton = document.querySelector("#backHomeButton");
const resetButton = document.querySelector("#resetButton");
const flashcard = document.querySelector("#flashcard");
const nextButton = document.querySelector("#nextButton");
const ratingButtons = document.querySelectorAll("[data-rating]");
const answerActions = document.querySelector(".answer-actions");
const completeView = document.querySelector("#completeView");
const completeTitle = document.querySelector("#completeTitle");
const completeMessage = document.querySelector("#completeMessage");
const completeHomeButton = document.querySelector("#completeHomeButton");
const completeMistakeButton = document.querySelector("#completeMistakeButton");
const restartRoundButton = document.querySelector("#restartRoundButton");

const dueCount = document.querySelector("#dueCount");
const totalCount = document.querySelector("#totalCount");
const accuracyRate = document.querySelector("#accuracyRate");
const selectedWordbookName = document.querySelector("#selectedWordbookName");
const wordbookList = document.querySelector("#wordbookList");
const categoryList = document.querySelector("#categoryList");
const statusMessage = document.querySelector("#statusMessage");
const cardProgress = document.querySelector("#cardProgress");
const wordCategory = document.querySelector("#wordCategory");
const wordText = document.querySelector("#wordText");
const partOfSpeech = document.querySelector("#partOfSpeech");
const meaningText = document.querySelector("#meaningText");
const exampleText = document.querySelector("#exampleText");
const translationText = document.querySelector("#translationText");
const practiceWordbookName = document.querySelector("#practiceWordbookName");
const practiceModeName = document.querySelector("#practiceModeName");
const roundTotalCount = document.querySelector("#roundTotalCount");
const roundKnownCount = document.querySelector("#roundKnownCount");
const roundRemainingCount = document.querySelector("#roundRemainingCount");
const roundUnclearCount = document.querySelector("#roundUnclearCount");
const roundForgotCount = document.querySelector("#roundForgotCount");
const completeTotalCount = document.querySelector("#completeTotalCount");
const completeKnownCount = document.querySelector("#completeKnownCount");
const completeUnclearCount = document.querySelector("#completeUnclearCount");
const completeForgotCount = document.querySelector("#completeForgotCount");

startButton.addEventListener("click", startRound);
dailyTaskButton.addEventListener("click", startDailyTaskRound);
mistakeBookButton.addEventListener("click", startMistakeBookRound);
backHomeButton.addEventListener("click", showHome);
flashcard.addEventListener("click", flipCard);
nextButton.addEventListener("click", () => handleReviewAnswer("unclear"));
resetButton.addEventListener("click", resetProgress);
restartRoundButton.addEventListener("click", restartCurrentRound);
completeHomeButton?.addEventListener("click", showHome);
completeMistakeButton?.addEventListener("click", startMistakeBookRound);

ratingButtons.forEach((button) => {
  button.addEventListener("click", () => {
    handleReviewAnswer(button.dataset.rating);
  });
});

initializeApp();

function createSupabaseClient() {
  // Supabase CDN 載入後會提供 window.supabase。
  if (typeof window === "undefined" || !window.supabase) {
    return null;
  }

  return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

async function initializeApp() {
  setStatusMessage("正在讀取單字本...");
  startButton.disabled = true;
  dailyTaskButton.disabled = true;

  try {
    wordbooks = await loadWordbooksFromSupabase();
    vocabulary = [];
    selectedWordbook = null;
    renderHome();

    if (wordbooks.length === 0) {
      setStatusMessage("目前沒有單字本資料");
      return;
    }

    setStatusMessage("");
  } catch (error) {
    console.error("Failed to initialize app:", error);
    wordbooks = [];
    vocabulary = [];
    selectedWordbook = null;
    renderHome();
    setStatusMessage("資料讀取失敗，請稍後再試", true);
  }
}

async function loadWordbooksFromSupabase() {
  if (!supabaseClient) {
    throw new Error("Supabase client is not ready.");
  }

  const { data, error } = await supabaseClient
    .from("wordbooks")
    .select("id, name, description, level, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  const basicWordbooks = (data || []).map((item) => ({
    id: String(item.id),
    name: item.name || "未命名單字本",
    description: item.description || "尚未新增描述",
    level: item.level || "general",
    createdAt: item.created_at || "",
  }));

  // 每一本單字本另外查詢 vocabularies 的數量，首頁卡片會用到。
  return Promise.all(
    basicWordbooks.map(async (wordbook) => {
      const { count, error: countError } = await supabaseClient
        .from("vocabularies")
        .select("id", { count: "exact", head: true })
        .eq("wordbook_id", wordbook.id);

      if (countError) {
        throw countError;
      }

      return {
        ...wordbook,
        wordCount: count || 0
      };
    })
  );
}

async function loadVocabulariesFromSupabase(wordbookId) {
  if (!supabaseClient) {
    throw new Error("Supabase client is not ready.");
  }

  const { data, error } = await supabaseClient
    .from("vocabularies")
    .select("id, wordbook_id, word, part_of_speech, meaning_zh, example_en, example_zh, category, difficulty, created_at")
    .eq("wordbook_id", wordbookId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data || []).map(mapVocabularyRow);
}

async function loadMistakeCardsFromSupabase() {
  if (!supabaseClient) {
    throw new Error("Supabase client is not ready.");
  }

  const { data: records, error: recordsError } = await supabaseClient
    .from("study_records")
    .select("vocabulary_id, status")
    .in("status", ["unknown", "uncertain"]);

  if (recordsError) {
    throw recordsError;
  }

  const vocabularyIds = uniqueVocabularyIds(records);

  if (vocabularyIds.length === 0) {
    return [];
  }

  return loadCardsByIds(vocabularyIds);
}

async function loadReviewedVocabularyIdsFromSupabase() {
  if (!supabaseClient) {
    throw new Error("Supabase client is not ready.");
  }

  const { data, error } = await supabaseClient
    .from("study_records")
    .select("vocabulary_id");

  if (error) {
    throw error;
  }

  return new Set(uniqueVocabularyIds(data));
}

async function loadCardsByStudyStatus(status, limit) {
  if (!supabaseClient) {
    throw new Error("Supabase client is not ready.");
  }

  const { data: records, error: recordsError } = await supabaseClient
    .from("study_records")
    .select("vocabulary_id, status")
    .eq("status", status);

  if (recordsError) {
    throw recordsError;
  }

  const selectedIds = pickRandomItems(uniqueVocabularyIds(records), limit);

  if (selectedIds.length === 0) {
    return [];
  }

  return loadCardsByIds(selectedIds);
}

async function loadCardsByIds(vocabularyIds) {
  const { data, error } = await supabaseClient
    .from("vocabularies")
    .select("id, wordbook_id, word, part_of_speech, meaning_zh, example_en, example_zh, category, difficulty, created_at")
    .in("id", vocabularyIds);

  if (error) {
    throw error;
  }

  return (data || []).map(mapVocabularyRow);
}

function uniqueVocabularyIds(records) {
  return [...new Set((records || [])
    .map((record) => record.vocabulary_id)
    .filter(Boolean)
    .map(String))];
}

function mapVocabularyRow(item) {
  return {
    id: String(item.id),
    wordbookId: String(item.wordbook_id),
    word: item.word || "",
    partOfSpeech: item.part_of_speech || "",
    category: item.category || "未分類",
    meaning: item.meaning_zh || "",
    example: item.example_en || "",
    translation: item.example_zh || "",
    difficulty: item.difficulty || ""
  };
}

function loadProgress() {
  const savedProgress = localStorage.getItem(STORAGE_KEY);

  if (!savedProgress) {
    return createEmptyProgress();
  }

  try {
    return { ...createEmptyProgress(), ...JSON.parse(savedProgress) };
  } catch (error) {
    return createEmptyProgress();
  }
}

function createEmptyProgress() {
  return {
    words: {},
    totalAnswers: 0,
    correctAnswers: 0
  };
}

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

function createEmptyRoundStats() {
  return {
    totalCards: 0,
    familiarCount: 0,
    unclearCount: 0,
    forgotCount: 0
  };
}

function renderHome() {
  dueCount.textContent = getDueCards().length;
  totalCount.textContent = vocabulary.length;
  accuracyRate.textContent = getAccuracyText();
  selectedWordbookName.textContent = selectedWordbook ? selectedWordbook.name : "請先選擇單字本";
  startButton.disabled = vocabulary.length === 0;
  dailyTaskButton.disabled = vocabulary.length === 0;
  renderWordbooks();
  renderCategories();
}

function renderWordbooks() {
  if (wordbooks.length === 0) {
    wordbookList.innerHTML = `<p class="empty-state">目前沒有單字本資料</p>`;
    return;
  }

  wordbookList.innerHTML = wordbooks
    .map((wordbook) => {
      const selectedClass = selectedWordbook && selectedWordbook.id === wordbook.id ? " is-selected" : "";

      return `
        <button class="wordbook-card${selectedClass}" type="button" data-wordbook-id="${escapeHtml(wordbook.id)}">
          <h4>${escapeHtml(wordbook.name)}</h4>
          <p>${escapeHtml(wordbook.description)}</p>
          <div class="wordbook-meta">
            <span>${escapeHtml(wordbook.level)}</span>
            <span>${wordbook.wordCount} 個單字</span>
          </div>
        </button>
      `;
    })
    .join("");

  document.querySelectorAll("[data-wordbook-id]").forEach((button) => {
    button.addEventListener("click", () => {
      selectWordbook(button.dataset.wordbookId);
    });
  });
}

function renderCategories() {
  if (vocabulary.length === 0) {
    categoryList.innerHTML = `<p class="empty-state">選擇單字本後會顯示分類</p>`;
    return;
  }

  const categoryCounts = vocabulary.reduce((counts, card) => {
    counts[card.category] = (counts[card.category] || 0) + 1;
    return counts;
  }, {});

  categoryList.innerHTML = Object.entries(categoryCounts)
    .map(([category, count]) => `
      <article class="category-item">
        <strong>${escapeHtml(category)}</strong>
        <span>${count} 個單字</span>
      </article>
    `)
    .join("");
}

async function selectWordbook(wordbookId) {
  const nextWordbook = wordbooks.find((wordbook) => wordbook.id === String(wordbookId));

  if (!nextWordbook) {
    return;
  }

  selectedWordbook = nextWordbook;
  vocabulary = [];
  resetRoundState();
  startButton.disabled = true;
  dailyTaskButton.disabled = true;
  renderHome();
  setStatusMessage("正在讀取單字資料...");

  try {
    vocabulary = await loadVocabulariesFromSupabase(nextWordbook.id);
    renderHome();

    if (vocabulary.length === 0) {
      setStatusMessage("這個單字本目前沒有單字");
      return;
    }

    setStatusMessage("");
  } catch (error) {
    console.error("Failed to load vocabularies:", error);
    vocabulary = [];
    renderHome();
    setStatusMessage("資料讀取失敗，請稍後再試", true);
  }
}

function getAccuracyText() {
  if (progress.totalAnswers === 0) {
    return "0%";
  }

  return `${Math.round((progress.correctAnswers / progress.totalAnswers) * 100)}%`;
}

function getDueCards() {
  const today = startOfToday();

  return vocabulary.filter((card) => {
    const record = progress.words[card.id];
    return !record || !record.nextReviewAt || record.nextReviewAt <= today;
  });
}

function startOfToday() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.getTime();
}

function startRound() {
  if (vocabulary.length === 0) {
    setStatusMessage(selectedWordbook ? "這個單字本目前沒有單字" : "請先選擇單字本");
    return;
  }

  startRoundWithCards(vocabulary, "normal");
}

async function startMistakeBookRound() {
  setStatusMessage("正在讀取錯題本...");
  mistakeBookButton.disabled = true;
  completeMistakeButton && (completeMistakeButton.disabled = true);

  try {
    const mistakeCards = await loadMistakeCardsFromSupabase();

    if (mistakeCards.length === 0) {
      setStatusMessage("目前沒有錯題，請先完成一輪練習");
      return;
    }

    setStatusMessage("");
    startRoundWithCards(mistakeCards, "mistakes");
  } catch (error) {
    console.error("Failed to load mistake book:", error);
    setStatusMessage("資料讀取失敗，請稍後再試", true);
  } finally {
    mistakeBookButton.disabled = false;
    completeMistakeButton && (completeMistakeButton.disabled = false);
  }
}

async function startDailyTaskRound() {
  if (vocabulary.length === 0) {
    setStatusMessage(selectedWordbook ? "這個單字本目前沒有單字" : "請先選擇單字本");
    return;
  }

  setStatusMessage("正在建立今日任務...");
  dailyTaskButton.disabled = true;

  try {
    const reviewedIds = await loadReviewedVocabularyIdsFromSupabase();
    const newCards = pickRandomItems(
      vocabulary.filter((card) => !reviewedIds.has(card.id)),
      20
    );
    const unknownCards = await loadCardsByStudyStatus("unknown", 20);
    const uncertainCards = await loadCardsByStudyStatus("uncertain", 10);
    const dailyCards = uniqueCards([
      ...newCards,
      ...unknownCards,
      ...uncertainCards
    ]);

    if (dailyCards.length === 0) {
      setStatusMessage("目前沒有可用的今日任務，請先完成一輪練習");
      return;
    }

    setStatusMessage("");
    startRoundWithCards(dailyCards, "daily", dailyCards.length);
  } catch (error) {
    console.error("Failed to load daily task:", error);
    setStatusMessage("資料讀取失敗，請稍後再試", true);
  } finally {
    dailyTaskButton.disabled = vocabulary.length === 0;
  }
}

function startRoundWithCards(cards, mode, count = 10) {
  const selectedCards = pickRandomItems(cards, count);

  if (selectedCards.length === 0) {
    setStatusMessage("目前沒有可練習的單字");
    return;
  }

  setStatusMessage("");
  currentPracticeMode = mode;
  roundCards = selectedCards;
  reviewQueue = [...roundCards];
  roundStats = {
    ...createEmptyRoundStats(),
    totalCards: roundCards.length
  };

  showPractice();
  renderCurrentCard();
}

function restartCurrentRound() {
  if (currentPracticeMode === "daily") {
    void startDailyTaskRound();
    return;
  }

  if (currentPracticeMode === "mistakes") {
    void startMistakeBookRound();
    return;
  }

  startRound();
}

function showHome() {
  homeView.classList.add("is-active");
  practiceView.classList.remove("is-active");
  resetPracticeView();
  renderHome();
}

function showPractice() {
  homeView.classList.remove("is-active");
  practiceView.classList.add("is-active");
  resetPracticeView();
}

function renderCurrentCard() {
  if (reviewQueue.length === 0) {
    renderPracticeComplete();
    return;
  }

  const card = reviewQueue[0];

  flashcard.classList.remove("is-flipped", "is-hidden");
  answerActions.classList.remove("is-hidden");
  ratingButtons.forEach((button) => button.classList.remove("is-selected"));
  flashcard.hidden = false;
  answerActions.hidden = false;
  completeView.classList.remove("is-visible");

  cardProgress.textContent = `剩餘 ${reviewQueue.length} 張`;
  wordCategory.textContent = card.category;
  wordText.textContent = card.word;
  partOfSpeech.textContent = card.partOfSpeech;
  meaningText.textContent = card.meaning;
  exampleText.textContent = card.example;
  translationText.textContent = card.translation;
  updateRoundStatsView();
}

function flipCard() {
  if (reviewQueue.length === 0) {
    return;
  }

  flashcard.classList.toggle("is-flipped");
}

function handleReviewAnswer(rating) {
  if (reviewQueue.length === 0) {
    renderPracticeComplete();
    return;
  }

  const card = reviewQueue.shift();
  updateSavedProgress(card, rating);
  void saveStudyRecord(card, rating);

  if (rating === "known") {
    roundStats.familiarCount += 1;
  } else if (rating === "unclear") {
    roundStats.unclearCount += 1;
    insertCardBackIntoQueue(card, 4);
  } else {
    roundStats.forgotCount += 1;
    insertCardBackIntoQueue(card, 2);
  }

  if (reviewQueue.length === 0) {
    renderPracticeComplete();
    return;
  }

  renderCurrentCard();
}

function updateSavedProgress(card, rating) {
  const oldRecord = progress.words[card.id] || {
    familiarity: 0,
    timesReviewed: 0
  };
  const familiarity = getNextFamiliarity(oldRecord.familiarity, rating);

  progress.totalAnswers += 1;

  if (rating === "known") {
    progress.correctAnswers += 1;
  }

  progress.words[card.id] = {
    familiarity,
    timesReviewed: oldRecord.timesReviewed + 1,
    lastRating: rating,
    lastReviewedAt: Date.now(),
    nextReviewAt: getNextReviewDate(familiarity, rating)
  };

  saveProgress();
}

async function saveStudyRecord(card, rating) {
  if (!supabaseClient) {
    console.error("Study record was not saved because Supabase client is not ready.");
    return;
  }

  try {
    const { error } = await supabaseClient
      .from("study_records")
      .insert([createStudyRecordPayload(card, rating)]);

    if (error) {
      console.error("Failed to save study record:", error);
    }
  } catch (error) {
    console.error("Failed to save study record:", error);
  }
}

function createStudyRecordPayload(card, rating) {
  const statusMap = {
    known: "known",
    unclear: "uncertain",
    forgot: "unknown"
  };

  return {
    vocabulary_id: card.id,
    status: statusMap[rating],
    review_count: 1,
    known_count: rating === "known" ? 1 : 0,
    uncertain_count: rating === "unclear" ? 1 : 0,
    unknown_count: rating === "forgot" ? 1 : 0,
    last_reviewed_at: new Date().toISOString()
  };
}

function insertCardBackIntoQueue(card, distance) {
  const insertIndex = Math.min(distance, reviewQueue.length);
  reviewQueue.splice(insertIndex, 0, card);
}

function getNextFamiliarity(currentFamiliarity, rating) {
  if (rating === "forgot") {
    return Math.max(0, currentFamiliarity - 1);
  }

  if (rating === "unclear") {
    return Math.min(5, currentFamiliarity + 1);
  }

  return Math.min(5, currentFamiliarity + 2);
}

function getNextReviewDate(familiarity, rating) {
  const intervals = {
    forgot: 0,
    unclear: Math.max(1, familiarity),
    known: Math.max(2, familiarity * 2)
  };

  return startOfToday() + intervals[rating] * MS_PER_DAY;
}

function resetProgress() {
  const confirmed = window.confirm("確定要重置本機學習紀錄嗎？");

  if (!confirmed) {
    return;
  }

  progress = createEmptyProgress();
  saveProgress();
  renderHome();
}

function pickRandomItems(items, count) {
  return [...items]
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.min(count, items.length));
}

function uniqueCards(cards) {
  const seenIds = new Set();

  return cards.filter((card) => {
    if (seenIds.has(card.id)) {
      return false;
    }

    seenIds.add(card.id);
    return true;
  });
}

function updateRoundStatsView() {
  const remainingToFamiliar = Math.max(0, roundStats.totalCards - roundStats.familiarCount);

  practiceModeName.textContent = getPracticeModeLabel();
  practiceWordbookName.textContent = getPracticeWordbookLabel();
  roundTotalCount.textContent = roundStats.totalCards;
  roundKnownCount.textContent = roundStats.familiarCount;
  roundRemainingCount.textContent = remainingToFamiliar;
  roundUnclearCount.textContent = roundStats.unclearCount;
  roundForgotCount.textContent = roundStats.forgotCount;
}

function renderPracticeComplete() {
  const completeTitleText = getPracticeCompleteTitle();

  flashcard.hidden = true;
  answerActions.hidden = true;
  flashcard.classList.add("is-hidden");
  answerActions.classList.add("is-hidden");
  flashcard.classList.remove("is-flipped");
  completeView.classList.add("is-visible");
  cardProgress.textContent = completeTitleText;
  completeTitle.textContent = completeTitleText;
  completeMessage.textContent = "你已完成這次的單字複習";
  updateRoundStatsView();

  completeTotalCount.textContent = roundStats.totalCards;
  completeKnownCount.textContent = roundStats.familiarCount;
  completeUnclearCount.textContent = roundStats.unclearCount;
  completeForgotCount.textContent = roundStats.forgotCount;
}

function resetPracticeView() {
  flashcard.hidden = false;
  answerActions.hidden = false;
  flashcard.classList.remove("is-hidden", "is-flipped");
  answerActions.classList.remove("is-hidden");
  completeView.classList.remove("is-visible");
}

function resetRoundState() {
  reviewQueue = [];
  roundCards = [];
  roundStats = createEmptyRoundStats();
  currentPracticeMode = "normal";
}

function getPracticeModeLabel() {
  if (currentPracticeMode === "daily") {
    return "今日任務";
  }

  if (currentPracticeMode === "mistakes") {
    return "錯題本練習";
  }

  return "一般練習";
}

function getPracticeWordbookLabel() {
  if (currentPracticeMode === "daily") {
    return "今日任務";
  }

  if (currentPracticeMode === "mistakes") {
    return "錯題本";
  }

  return selectedWordbook ? selectedWordbook.name : "尚未選擇";
}

function getPracticeCompleteTitle() {
  if (currentPracticeMode === "daily") {
    return "今日任務完成";
  }

  if (currentPracticeMode === "mistakes") {
    return "錯題本複習完成";
  }

  return "本輪練習完成";
}

function setStatusMessage(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("is-visible", Boolean(message));
  statusMessage.classList.toggle("is-error", isError);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
