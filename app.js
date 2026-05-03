const SUPABASE_URL = "https://gcaiqgxpamblufeqxzjv.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_ya9qrXLyFN5YCjQkSrcZ5g_8wQMVWKE";
const STORAGE_KEY = "englishFlashcardProgress";
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const TEXT = {
  chooseWordbook: "\u8acb\u5148\u9078\u64c7\u55ae\u5b57\u672c",
  loadingWordbooks: "\u6b63\u5728\u8b80\u53d6\u55ae\u5b57\u672c...",
  noWordbooks: "\u76ee\u524d\u6c92\u6709\u55ae\u5b57\u672c\u8cc7\u6599",
  loadFailed: "\u8cc7\u6599\u8b80\u53d6\u5931\u6557\uff0c\u8acb\u7a0d\u5f8c\u518d\u8a66",
  unnamedWordbook: "\u672a\u547d\u540d\u55ae\u5b57\u672c",
  noDescription: "\u5c1a\u672a\u65b0\u589e\u63cf\u8ff0",
  uncategorized: "\u672a\u5206\u985e",
  wordsUnit: "\u500b\u55ae\u5b57",
  noCategoryHint: "\u9078\u64c7\u55ae\u5b57\u672c\u5f8c\u6703\u986f\u793a\u5206\u985e",
  loadingVocabulary: "\u6b63\u5728\u8b80\u53d6\u55ae\u5b57\u8cc7\u6599...",
  noVocabulary: "\u9019\u500b\u55ae\u5b57\u672c\u76ee\u524d\u6c92\u6709\u55ae\u5b57",
  loadingMistakes: "\u6b63\u5728\u8b80\u53d6\u932f\u984c\u672c...",
  noMistakes: "\u76ee\u524d\u6c92\u6709\u932f\u984c\uff0c\u8acb\u5148\u5b8c\u6210\u4e00\u8f2a\u7df4\u7fd2",
  loadingDaily: "\u6b63\u5728\u5efa\u7acb\u4eca\u65e5\u4efb\u52d9...",
  noDaily: "\u76ee\u524d\u6c92\u6709\u53ef\u7528\u7684\u4eca\u65e5\u4efb\u52d9\uff0c\u8acb\u5148\u5b8c\u6210\u4e00\u8f2a\u7df4\u7fd2",
  noPracticeCards: "\u76ee\u524d\u6c92\u6709\u53ef\u7df4\u7fd2\u7684\u5167\u5bb9",
  loadingPhrases: "\u6b63\u5728\u8b80\u53d6\u6bcf\u65e5\u7247\u8a9e...",
  noPhrases: "\u76ee\u524d\u6c92\u6709\u7247\u8a9e\u8cc7\u6599",
  resetConfirm: "\u78ba\u5b9a\u8981\u91cd\u7f6e\u672c\u6a5f\u5b78\u7fd2\u7d00\u9304\u55ce\uff1f",
  remaining: "\u5269\u9918",
  cards: "\u5f35",
  normalMode: "\u4e00\u822c\u7df4\u7fd2",
  dailyMode: "\u4eca\u65e5\u4efb\u52d9",
  mistakeMode: "\u932f\u984c\u672c\u7df4\u7fd2",
  phraseMode: "\u6bcf\u65e5\u7247\u8a9e",
  mistakeBook: "\u932f\u984c\u672c",
  phraseBook: "\u9ad8\u983b\u7247\u8a9e",
  notSelected: "\u5c1a\u672a\u9078\u64c7",
  wordCompleteTitle: "\u672c\u8f2a\u7df4\u7fd2\u5b8c\u6210",
  dailyCompleteTitle: "\u4eca\u65e5\u4efb\u52d9\u5b8c\u6210",
  mistakeCompleteTitle: "\u932f\u984c\u672c\u8907\u7fd2\u5b8c\u6210",
  phraseCompleteTitle: "\u4eca\u65e5\u7247\u8a9e\u7df4\u7fd2\u5b8c\u6210",
  wordCompleteMessage: "\u4f60\u5df2\u5b8c\u6210\u9019\u6b21\u7684\u55ae\u5b57\u8907\u7fd2",
  phraseCompleteMessage: "\u4f60\u5df2\u5b8c\u6210\u9019\u6b21\u7684\u7247\u8a9e\u8907\u7fd2",
  restartWords: "\u518d\u7df4 10 \u984c",
  restartPhrases: "\u518d\u7df4 10 \u500b\u7247\u8a9e",
  practiceTitleWords: "\u55ae\u5b57\u7df4\u7fd2",
  practiceTitlePhrases: "\u7247\u8a9e\u7df4\u7fd2",
};

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
const dailyPhraseButton = document.querySelector("#dailyPhraseButton");
const mistakeBookButton = document.querySelector("#mistakeBookButton");
const backHomeButton = document.querySelector("#backHomeButton");
const resetButton = document.querySelector("#resetButton");
const flashcard = document.querySelector("#flashcard");
const phraseCard = document.querySelector("#phraseCard");
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
const practiceTitle = document.querySelector("#practiceTitle");
const wordCategory = document.querySelector("#wordCategory");
const wordText = document.querySelector("#wordText");
const partOfSpeech = document.querySelector("#partOfSpeech");
const meaningText = document.querySelector("#meaningText");
const exampleText = document.querySelector("#exampleText");
const translationText = document.querySelector("#translationText");
const phraseMeta = document.querySelector("#phraseMeta");
const phraseText = document.querySelector("#phraseText");
const phraseMeaning = document.querySelector("#phraseMeaning");
const phraseUsage = document.querySelector("#phraseUsage");
const phraseExampleEn = document.querySelector("#phraseExampleEn");
const phraseExampleZh = document.querySelector("#phraseExampleZh");
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
dailyPhraseButton.addEventListener("click", startDailyPhraseRound);
mistakeBookButton.addEventListener("click", startMistakeBookRound);
backHomeButton.addEventListener("click", showHome);
flashcard.addEventListener("click", flipCard);
phraseCard.addEventListener("click", flipCard);
nextButton.addEventListener("click", () => handleReviewAnswer("unclear"));
resetButton.addEventListener("click", resetProgress);
restartRoundButton.addEventListener("click", restartCurrentRound);
completeHomeButton.addEventListener("click", showHome);
completeMistakeButton.addEventListener("click", startMistakeBookRound);

ratingButtons.forEach((button) => {
  button.addEventListener("click", () => {
    handleReviewAnswer(button.dataset.rating);
  });
});

initializeApp();

function createSupabaseClient() {
  // Supabase CDN creates window.supabase before this file runs.
  if (typeof window === "undefined" || !window.supabase) {
    return null;
  }

  return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

async function initializeApp() {
  setStatusMessage(TEXT.loadingWordbooks);
  startButton.disabled = true;
  dailyTaskButton.disabled = true;

  try {
    wordbooks = await loadWordbooksFromSupabase();
    vocabulary = [];
    selectedWordbook = null;
    renderHome();

    if (wordbooks.length === 0) {
      setStatusMessage(TEXT.noWordbooks);
      return;
    }

    setStatusMessage("");
  } catch (error) {
    console.error("Failed to initialize app:", error);
    wordbooks = [];
    vocabulary = [];
    selectedWordbook = null;
    renderHome();
    setStatusMessage(TEXT.loadFailed, true);
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
    name: item.name || TEXT.unnamedWordbook,
    description: item.description || TEXT.noDescription,
    level: item.level || "general",
    createdAt: item.created_at || "",
  }));

  // The homepage card shows each wordbook's vocabulary count.
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

async function loadPhrasesFromSupabase() {
  if (!supabaseClient) {
    throw new Error("Supabase client is not ready.");
  }

  const { data, error } = await supabaseClient
    .from("phrases")
    .select("id, phrase, meaning_zh, usage_zh, example_en, example_zh, category, difficulty, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data || []).map(mapPhraseRow);
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
    type: "word",
    id: String(item.id),
    wordbookId: String(item.wordbook_id),
    word: item.word || "",
    partOfSpeech: item.part_of_speech || "",
    category: item.category || TEXT.uncategorized,
    meaning: item.meaning_zh || "",
    example: item.example_en || "",
    translation: item.example_zh || "",
    difficulty: item.difficulty || ""
  };
}

function mapPhraseRow(item) {
  return {
    type: "phrase",
    id: String(item.id),
    phrase: item.phrase || "",
    meaning: item.meaning_zh || "",
    usage: item.usage_zh || "",
    example: item.example_en || "",
    translation: item.example_zh || "",
    category: item.category || TEXT.uncategorized,
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
  selectedWordbookName.textContent = selectedWordbook ? selectedWordbook.name : TEXT.chooseWordbook;
  startButton.disabled = vocabulary.length === 0;
  dailyTaskButton.disabled = vocabulary.length === 0;
  renderWordbooks();
  renderCategories();
}

function renderWordbooks() {
  if (wordbooks.length === 0) {
    wordbookList.innerHTML = `<p class="empty-state">${TEXT.noWordbooks}</p>`;
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
            <span>${wordbook.wordCount} ${TEXT.wordsUnit}</span>
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
    categoryList.innerHTML = `<p class="empty-state">${TEXT.noCategoryHint}</p>`;
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
        <span>${count} ${TEXT.wordsUnit}</span>
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
  setStatusMessage(TEXT.loadingVocabulary);

  try {
    vocabulary = await loadVocabulariesFromSupabase(nextWordbook.id);
    renderHome();

    if (vocabulary.length === 0) {
      setStatusMessage(TEXT.noVocabulary);
      return;
    }

    setStatusMessage("");
  } catch (error) {
    console.error("Failed to load vocabularies:", error);
    vocabulary = [];
    renderHome();
    setStatusMessage(TEXT.loadFailed, true);
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
    const record = progress.words[getProgressKey(card)];
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
    setStatusMessage(selectedWordbook ? TEXT.noVocabulary : TEXT.chooseWordbook);
    return;
  }

  startRoundWithCards(vocabulary, "normal");
}

async function startMistakeBookRound() {
  setStatusMessage(TEXT.loadingMistakes);
  mistakeBookButton.disabled = true;
  completeMistakeButton.disabled = true;

  try {
    const mistakeCards = await loadMistakeCardsFromSupabase();

    if (mistakeCards.length === 0) {
      setStatusMessage(TEXT.noMistakes);
      return;
    }

    setStatusMessage("");
    startRoundWithCards(mistakeCards, "mistakes");
  } catch (error) {
    console.error("Failed to load mistake book:", error);
    setStatusMessage(TEXT.loadFailed, true);
  } finally {
    mistakeBookButton.disabled = false;
    completeMistakeButton.disabled = false;
  }
}

async function startDailyTaskRound() {
  if (vocabulary.length === 0) {
    setStatusMessage(selectedWordbook ? TEXT.noVocabulary : TEXT.chooseWordbook);
    return;
  }

  setStatusMessage(TEXT.loadingDaily);
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
      setStatusMessage(TEXT.noDaily);
      return;
    }

    setStatusMessage("");
    startRoundWithCards(dailyCards, "daily", dailyCards.length);
  } catch (error) {
    console.error("Failed to load daily task:", error);
    setStatusMessage(TEXT.loadFailed, true);
  } finally {
    dailyTaskButton.disabled = vocabulary.length === 0;
  }
}

async function startDailyPhraseRound() {
  setStatusMessage(TEXT.loadingPhrases);
  dailyPhraseButton.disabled = true;

  try {
    const phraseCards = await loadPhrasesFromSupabase();

    if (phraseCards.length === 0) {
      setStatusMessage(TEXT.noPhrases);
      return;
    }

    setStatusMessage("");
    startRoundWithCards(phraseCards, "phrases", 10);
  } catch (error) {
    console.error("Failed to load daily phrases:", error);
    setStatusMessage(TEXT.loadFailed, true);
  } finally {
    dailyPhraseButton.disabled = false;
  }
}

function startRoundWithCards(cards, mode, count = 10) {
  const selectedCards = pickRandomItems(cards, count);

  if (selectedCards.length === 0) {
    setStatusMessage(TEXT.noPracticeCards);
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
  if (currentPracticeMode === "phrases") {
    void startDailyPhraseRound();
    return;
  }

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
  const isPhraseCard = card.type === "phrase";

  resetVisibleCards();
  answerActions.classList.remove("is-hidden");
  ratingButtons.forEach((button) => button.classList.remove("is-selected"));
  answerActions.hidden = false;
  completeView.classList.remove("is-visible");

  cardProgress.textContent = `${TEXT.remaining} ${reviewQueue.length} ${TEXT.cards}`;
  practiceTitle.textContent = isPhraseCard ? TEXT.practiceTitlePhrases : TEXT.practiceTitleWords;

  if (isPhraseCard) {
    renderPhraseCard(card);
  } else {
    renderWordCard(card);
  }

  updateRoundStatsView();
}

function renderWordCard(card) {
  flashcard.hidden = false;
  flashcard.classList.remove("is-hidden", "is-flipped");
  wordCategory.textContent = card.category;
  wordText.textContent = card.word;
  partOfSpeech.textContent = card.partOfSpeech;
  meaningText.textContent = card.meaning;
  exampleText.textContent = card.example;
  translationText.textContent = card.translation;
}

function renderPhraseCard(card) {
  phraseCard.hidden = false;
  phraseCard.classList.remove("is-hidden", "is-flipped");
  phraseMeta.textContent = card.category || card.difficulty || "Phrase";
  phraseText.textContent = card.phrase;
  phraseMeaning.textContent = card.meaning;
  phraseUsage.textContent = card.usage;
  phraseExampleEn.textContent = card.example;
  phraseExampleZh.textContent = card.translation;
}

function flipCard() {
  if (reviewQueue.length === 0) {
    return;
  }

  getActiveCardElement().classList.toggle("is-flipped");
}

function handleReviewAnswer(rating) {
  if (reviewQueue.length === 0) {
    renderPracticeComplete();
    return;
  }

  const card = reviewQueue.shift();
  updateSavedProgress(card, rating);
  void saveReviewRecord(card, rating);

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
  const progressKey = getProgressKey(card);
  const oldRecord = progress.words[progressKey] || {
    familiarity: 0,
    timesReviewed: 0
  };
  const familiarity = getNextFamiliarity(oldRecord.familiarity, rating);

  progress.totalAnswers += 1;

  if (rating === "known") {
    progress.correctAnswers += 1;
  }

  progress.words[progressKey] = {
    familiarity,
    timesReviewed: oldRecord.timesReviewed + 1,
    lastRating: rating,
    lastReviewedAt: Date.now(),
    nextReviewAt: getNextReviewDate(familiarity, rating)
  };

  saveProgress();
}

async function saveReviewRecord(card, rating) {
  if (card.type === "phrase") {
    await savePhraseStudyRecord(card, rating);
    return;
  }

  await saveStudyRecord(card, rating);
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

async function savePhraseStudyRecord(card, rating) {
  if (!supabaseClient) {
    console.error("Phrase study record was not saved because Supabase client is not ready.");
    return;
  }

  try {
    const { error } = await supabaseClient
      .from("phrase_study_records")
      .insert([createPhraseStudyRecordPayload(card, rating)]);

    if (error) {
      console.error("Failed to save phrase study record:", error);
    }
  } catch (error) {
    console.error("Failed to save phrase study record:", error);
  }
}

function createStudyRecordPayload(card, rating) {
  return {
    vocabulary_id: card.id,
    ...createReviewCountPayload(rating)
  };
}

function createPhraseStudyRecordPayload(card, rating) {
  return {
    phrase_id: card.id,
    ...createReviewCountPayload(rating)
  };
}

function createReviewCountPayload(rating) {
  const statusMap = {
    known: "known",
    unclear: "uncertain",
    forgot: "unknown"
  };

  return {
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
  const confirmed = window.confirm(TEXT.resetConfirm);

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
    if (seenIds.has(`${card.type}:${card.id}`)) {
      return false;
    }

    seenIds.add(`${card.type}:${card.id}`);
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
  const isPhraseMode = currentPracticeMode === "phrases";

  resetVisibleCards();
  answerActions.hidden = true;
  answerActions.classList.add("is-hidden");
  completeView.classList.add("is-visible");
  cardProgress.textContent = completeTitleText;
  completeTitle.textContent = completeTitleText;
  completeMessage.textContent = isPhraseMode ? TEXT.phraseCompleteMessage : TEXT.wordCompleteMessage;
  restartRoundButton.textContent = isPhraseMode ? TEXT.restartPhrases : TEXT.restartWords;
  completeMistakeButton.hidden = isPhraseMode;
  updateRoundStatsView();

  completeTotalCount.textContent = roundStats.totalCards;
  completeKnownCount.textContent = roundStats.familiarCount;
  completeUnclearCount.textContent = roundStats.unclearCount;
  completeForgotCount.textContent = roundStats.forgotCount;
}

function resetPracticeView() {
  resetVisibleCards();
  answerActions.hidden = false;
  answerActions.classList.remove("is-hidden");
  completeView.classList.remove("is-visible");
  completeMistakeButton.hidden = false;
  restartRoundButton.textContent = TEXT.restartWords;
}

function resetVisibleCards() {
  flashcard.hidden = true;
  phraseCard.hidden = true;
  flashcard.classList.add("is-hidden");
  phraseCard.classList.add("is-hidden");
  flashcard.classList.remove("is-flipped");
  phraseCard.classList.remove("is-flipped");
}

function resetRoundState() {
  reviewQueue = [];
  roundCards = [];
  roundStats = createEmptyRoundStats();
  currentPracticeMode = "normal";
}

function getActiveCardElement() {
  return currentPracticeMode === "phrases" ? phraseCard : flashcard;
}

function getProgressKey(card) {
  return `${card.type}:${card.id}`;
}

function getPracticeModeLabel() {
  if (currentPracticeMode === "daily") {
    return TEXT.dailyMode;
  }

  if (currentPracticeMode === "mistakes") {
    return TEXT.mistakeMode;
  }

  if (currentPracticeMode === "phrases") {
    return TEXT.phraseMode;
  }

  return TEXT.normalMode;
}

function getPracticeWordbookLabel() {
  if (currentPracticeMode === "daily") {
    return TEXT.dailyMode;
  }

  if (currentPracticeMode === "mistakes") {
    return TEXT.mistakeBook;
  }

  if (currentPracticeMode === "phrases") {
    return TEXT.phraseBook;
  }

  return selectedWordbook ? selectedWordbook.name : TEXT.notSelected;
}

function getPracticeCompleteTitle() {
  if (currentPracticeMode === "daily") {
    return TEXT.dailyCompleteTitle;
  }

  if (currentPracticeMode === "mistakes") {
    return TEXT.mistakeCompleteTitle;
  }

  if (currentPracticeMode === "phrases") {
    return TEXT.phraseCompleteTitle;
  }

  return TEXT.wordCompleteTitle;
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
