// 單字資料先放在 JavaScript 陣列中，之後如果要擴充可以直接新增物件。
const vocabulary = [
  {
    id: "toeic-001",
    word: "agenda",
    partOfSpeech: "noun",
    category: "TOEIC",
    meaning: "議程",
    example: "The manager sent the meeting agenda this morning.",
    translation: "經理今天早上寄出了會議議程。"
  },
  {
    id: "toeic-002",
    word: "reimburse",
    partOfSpeech: "verb",
    category: "TOEIC",
    meaning: "報銷；償還",
    example: "The company will reimburse your travel expenses.",
    translation: "公司會報銷你的差旅費。"
  },
  {
    id: "daily-001",
    word: "grocery",
    partOfSpeech: "noun",
    category: "日常生活",
    meaning: "食品雜貨",
    example: "I need to buy some groceries after work.",
    translation: "我下班後需要買一些食品雜貨。"
  },
  {
    id: "daily-002",
    word: "commute",
    partOfSpeech: "verb / noun",
    category: "日常生活",
    meaning: "通勤；通勤路程",
    example: "My daily commute takes about thirty minutes.",
    translation: "我每天通勤大約需要三十分鐘。"
  },
  {
    id: "business-001",
    word: "proposal",
    partOfSpeech: "noun",
    category: "商業英文",
    meaning: "提案",
    example: "The client approved our proposal yesterday.",
    translation: "客戶昨天核准了我們的提案。"
  },
  {
    id: "business-002",
    word: "negotiate",
    partOfSpeech: "verb",
    category: "商業英文",
    meaning: "談判；協商",
    example: "We need to negotiate the final price with the supplier.",
    translation: "我們需要和供應商協商最終價格。"
  },
  {
    id: "tech-001",
    word: "interface",
    partOfSpeech: "noun",
    category: "科技英文",
    meaning: "介面",
    example: "The new interface is easier for beginners to use.",
    translation: "新的介面更容易讓初學者使用。"
  },
  {
    id: "tech-002",
    word: "encrypt",
    partOfSpeech: "verb",
    category: "科技英文",
    meaning: "加密",
    example: "The app can encrypt your private messages.",
    translation: "這個應用程式可以加密你的私人訊息。"
  }
];

const STORAGE_KEY = "englishFlashcardProgress";
const MS_PER_DAY = 24 * 60 * 60 * 1000;

// 集中保存會被改變的狀態，畫面更新時比較好追蹤。
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
const categoryList = document.querySelector("#categoryList");
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

renderHome();

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
  renderCategories();
}

function renderCategories() {
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
