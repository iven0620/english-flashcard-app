// TODO: 換成你的 Supabase 專案設定。不要使用 service_role 或 secret key。
const SUPABASE_URL = "https://gcaiqgxpamblufeqxzjv.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_ya9qrXLyFN5YCjQkSrcZ5g_8wQMVWKE";
const STORAGE_KEY = "englishFlashcardProgress";
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const supabaseClient = createSupabaseClient();

// 集中保存會被改變的狀態，畫面更新時比較好追蹤。
let wordbooks = [];
let vocabulary = [];
let selectedWordbook = null;
let progress = loadProgress();
let practiceQueue = [];
let currentIndex = 0;
let selectedRating = null;

const homeView = document.querySelector("#homeView");
const practiceView = document.querySelector("#practiceView");
const startButton = document.querySelector("#startButton");
const backHomeButton = document.querySelector("#backHomeButton");
const resetButton = document.querySelector("#resetButton");
const flashcard = document.querySelector("#flashcard");
const nextButton = document.querySelector("#nextButton");
const ratingButtons = document.querySelectorAll("[data-rating]");

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

startButton.addEventListener("click", startPractice);
backHomeButton.addEventListener("click", showHome);
flashcard.addEventListener("click", flipCard);
nextButton.addEventListener("click", showNextCard);
resetButton.addEventListener("click", resetProgress);

ratingButtons.forEach((button) => {
  button.addEventListener("click", () => {
    updateFamiliarity(button.dataset.rating);
  });
});

initializeApp();

function createSupabaseClient() {
  // CDN 載入成功後，Supabase client 會掛在 window.supabase 上。
  if (typeof window === "undefined" || !window.supabase) {
    return null;
  }

  try {
    return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (error) {
    return null;
  }
}

async function initializeApp() {
  setStatusMessage("單字本載入中...");
  startButton.disabled = true;

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
    wordbooks = [];
    vocabulary = [];
    selectedWordbook = null;
    startButton.disabled = true;
    renderHome();
    setStatusMessage("資料讀取失敗，請稍後再試", true);
  }
}

async function loadWordbooksFromSupabase() {
  if (!supabaseClient) {
    throw new Error("Supabase client is not ready.");
  }

  const { data: wordbookRows, error: wordbookError } = await supabaseClient
    .from("wordbooks")
    .select("id, name, description, level, created_at")
    .order("created_at", { ascending: true });

  if (wordbookError) {
    throw wordbookError;
  }

  const wordbooksWithBasicInfo = (wordbookRows || []).map((item) => ({
    id: String(item.id),
    name: item.name || "未命名單字本",
    description: item.description || "尚未提供描述",
    level: item.level || "未設定",
    createdAt: item.created_at || "",
  }));

  // 用 head + count 只取得數量，不下載整份單字資料。
  return Promise.all(
    wordbooksWithBasicInfo.map(async (wordbook) => {
      const { count, error } = await supabaseClient
        .from("vocabularies")
        .select("id", { count: "exact", head: true })
        .eq("wordbook_id", wordbook.id);

      if (error) {
        throw error;
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

  // 把資料庫欄位名稱轉成原本單字卡使用的欄位名稱，後面的練習邏輯就不用大改。
  return (data || []).map((item) => ({
    id: String(item.id),
    wordbookId: String(item.wordbook_id),
    word: item.word || "",
    partOfSpeech: item.part_of_speech || "",
    category: item.category || "未分類",
    meaning: item.meaning_zh || "",
    example: item.example_en || "",
    translation: item.example_zh || "",
    difficulty: item.difficulty || ""
  }));
}

function loadProgress() {
  // localStorage 只能存字串，所以讀出後要用 JSON.parse 轉回物件。
  const savedProgress = localStorage.getItem(STORAGE_KEY);

  if (!savedProgress) {
    return createEmptyProgress();
  }

  try {
    return { ...createEmptyProgress(), ...JSON.parse(savedProgress) };
  } catch (error) {
    // 如果資料壞掉，回到乾淨狀態，避免整個頁面不能使用。
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

function renderHome() {
  dueCount.textContent = getDueCards().length;
  totalCount.textContent = vocabulary.length;
  accuracyRate.textContent = getAccuracyText();
  selectedWordbookName.textContent = selectedWordbook ? selectedWordbook.name : "請先選擇單字本";
  startButton.disabled = vocabulary.length === 0;
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
    categoryList.innerHTML = `<p class="empty-state">選擇單字本後會顯示分類資料</p>`;
    return;
  }

  const categoryCounts = vocabulary.reduce((counts, card) => {
    counts[card.category] = (counts[card.category] || 0) + 1;
    return counts;
  }, {});

  categoryList.innerHTML = Object.entries(categoryCounts)
    .map(([category, count]) => `
      <article class="category-item">
        <strong>${category}</strong>
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
  startButton.disabled = true;
  renderHome();
  setStatusMessage("單字資料載入中...");

  try {
    vocabulary = await loadVocabulariesFromSupabase(nextWordbook.id);
    renderHome();

    if (vocabulary.length === 0) {
      setStatusMessage("這個單字本目前沒有單字");
      return;
    }

    setStatusMessage("");
  } catch (error) {
    vocabulary = [];
    startButton.disabled = true;
    renderHome();
    setStatusMessage("資料讀取失敗，請稍後再試", true);
  }
}

function getAccuracyText() {
  if (progress.totalAnswers === 0) {
    return "0%";
  }

  const rate = Math.round((progress.correctAnswers / progress.totalAnswers) * 100);
  return `${rate}%`;
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

function startPractice() {
  if (vocabulary.length === 0) {
    setStatusMessage(selectedWordbook ? "這個單字本目前沒有單字" : "請先選擇單字本");
    return;
  }

  const dueCards = getDueCards();
  // 如果今天沒有待複習，就讓使用者練習全部單字，避免按鈕按了卻沒東西看。
  practiceQueue = dueCards.length > 0 ? dueCards : [...vocabulary];
  currentIndex = 0;
  selectedRating = null;
  showPractice();
  renderCurrentCard();
}

function showHome() {
  homeView.classList.add("is-active");
  practiceView.classList.remove("is-active");
  renderHome();
}

function showPractice() {
  homeView.classList.remove("is-active");
  practiceView.classList.add("is-active");
}

function renderCurrentCard() {
  const card = practiceQueue[currentIndex];

  flashcard.classList.remove("is-flipped");
  selectedRating = null;
  ratingButtons.forEach((button) => button.classList.remove("is-selected"));
  cardProgress.textContent = `第 ${currentIndex + 1} 張 / 共 ${practiceQueue.length} 張`;
  wordCategory.textContent = card.category;
  wordText.textContent = card.word;
  partOfSpeech.textContent = card.partOfSpeech;
  meaningText.textContent = card.meaning;
  exampleText.textContent = card.example;
  translationText.textContent = card.translation;
}

function flipCard() {
  flashcard.classList.toggle("is-flipped");
}

function updateFamiliarity(rating) {
  const card = practiceQueue[currentIndex];
  const alreadyAnswered = selectedRating !== null;
  const previousRating = selectedRating;
  const oldRecord = progress.words[card.id] || {
    familiarity: 0,
    timesReviewed: 0
  };
  const familiarity = getNextFamiliarity(oldRecord.familiarity, rating);

  selectedRating = rating;
  ratingButtons.forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.rating === rating);
  });

  // 同一張卡片可以改答案，但只把第一次選擇算進總答題數。
  if (!alreadyAnswered) {
    progress.totalAnswers += 1;
  }

  if (!alreadyAnswered && rating === "known") {
    progress.correctAnswers += 1;
  } else if (alreadyAnswered && previousRating === "known" && rating !== "known") {
    progress.correctAnswers = Math.max(0, progress.correctAnswers - 1);
  } else if (alreadyAnswered && previousRating !== "known" && rating === "known") {
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
  // 簡化版間隔重複：越熟的字，下一次複習間隔越久。
  const intervals = {
    forgot: 0,
    unclear: Math.max(1, familiarity),
    known: Math.max(2, familiarity * 2)
  };

  return startOfToday() + intervals[rating] * MS_PER_DAY;
}

function showNextCard() {
  if (currentIndex < practiceQueue.length - 1) {
    currentIndex += 1;
    renderCurrentCard();
    return;
  }

  showHome();
}

function resetProgress() {
  const confirmed = window.confirm("確定要清除所有學習紀錄嗎？");

  if (!confirmed) {
    return;
  }

  progress = createEmptyProgress();
  saveProgress();
  renderHome();
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
