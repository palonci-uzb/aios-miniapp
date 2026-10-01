const tg = window.Telegram?.WebApp;

if (tg) {
    tg.expand();
    tg.ready();
}

/* =====================================================
   AIOS STATE
===================================================== */

const state = {
    bank: {
        version: 0,
        updated_at: "",
        passages: []
    },
    weaknesses: {},
    navigation: [],
    currentTest: {
        fileName: null,
        title: null,
        category: null
    }
};


/* =====================================================
   LOCAL STORAGE
===================================================== */

const WEAKNESS_KEY = "aios_weaknesses_v1";
const TEST_STATE_KEY = "aios_test_state_v1";

function loadWeaknesses() {
    try {
        const saved = localStorage.getItem(WEAKNESS_KEY);
        if (saved) {
            state.weaknesses = JSON.parse(saved);
        }
    } catch (error) {
        console.error("Weakness load error:", error);
        state.weaknesses = {};
    }
}

function saveWeaknesses() {
    localStorage.setItem(
        WEAKNESS_KEY,
        JSON.stringify(state.weaknesses)
    );
}


/* =====================================================
   CONTENT BANK
===================================================== */

async function loadContentBank() {
    try {
        const response = await fetch("content_bank.json?t=" + Date.now());

        if (!response.ok) {
            throw new Error("content_bank.json topilmadi");
        }

        state.bank = await response.json();

        console.log("AIOS Content Bank:", state.bank);

        renderPassages();
        renderQuestionTypes();
        updatePassageCount();

    } catch (error) {
        console.error("Content Engine Error:", error);

        const list = document.getElementById("full-practice-list");

        if (list) {
            list.innerHTML = `
                <div class="analytics-card">
                    <h3>? Content Bank Error</h3>
                    <p>content_bank.json yuklanmadi.</p>
                    <p>GitHub Pages'ga content_bank.json faylini push qiling.</p>
                </div>
            `;
        }
    }
}


/* =====================================================
   NAVIGATION
===================================================== */

function showSection(sectionId, saveHistory = true) {
    const sections = [
        "main-dashboard",
        "reading-hub",
        "qtype-view",
        "weakness-analytics",
        "test-view"
    ];

    const current = sections.find(id => {
        const el = document.getElementById(id);
        return el && !el.classList.contains("hidden");
    });

    if (saveHistory && current && current !== sectionId) {
        state.navigation.push(current);
    }

    sections.forEach(id => {
        const element = document.getElementById(id);
        if (!element) return;

        if (id === sectionId) {
            element.classList.remove("hidden");
        } else {
            element.classList.add("hidden");
        }
    });

    updateBackButton();

    if (sectionId === "weakness-analytics") {
        renderAnalytics();
    }
}

function goBack() {
    if (state.navigation.length) {
        const previous = state.navigation.pop();
        showSection(previous, false);
        updateBackButton();
        return;
    }
    showSection("main-dashboard", false);
}

function updateBackButton() {
    document.querySelectorAll(".back-btn").forEach(button => {
        button.onclick = goBack;
    });

    if (!tg) return;

    if (state.navigation.length) {
        tg.BackButton.show();
        tg.BackButton.offClick(goBack);
        tg.BackButton.onClick(goBack);
    } else {
        tg.BackButton.hide();
    }
}


/* =====================================================
   READING TABS
===================================================== */

function switchReadingTab(tab) {
    const full = document.getElementById("full-practice-tab");
    const types = document.getElementById("question-types-tab");
    const fullButton = document.getElementById("tab-full");
    const typesButton = document.getElementById("tab-types");

    if (tab === "full") {
        full.classList.remove("hidden");
        types.classList.add("hidden");
        fullButton.classList.add("active");
        typesButton.classList.remove("active");
    } else {
        full.classList.add("hidden");
        types.classList.remove("hidden");
        fullButton.classList.remove("active");
        typesButton.classList.add("active");
    }
}


/* =====================================================
   PASSAGE COUNT
===================================================== */

function updatePassageCount() {
    const badge = document.getElementById("passage-count");
    if (!badge) return;

    const count = state.bank.passages?.length || 0;
    badge.innerText = `${count} Passage${count === 1 ? "" : "s"} Loaded`;
}


/* =====================================================
   PASSAGE LIST
===================================================== */

function renderPassages() {
    const container = document.getElementById("full-practice-list");
    if (!container) return;

    container.innerHTML = "";
    const passages = state.bank.passages || [];

    if (!passages.length) {
        container.innerHTML = `
            <div class="analytics-card">
                <h3>?? Reading bank empty</h3>
                <p>practise reading papkasiga HTML fayl qo‘shing.</p>
            </div>
        `;
        return;
    }

    passages.forEach((passage, index) => {
        const button = document.createElement("button");
        button.className = "test-btn";

        const types = getPassageQuestionTypes(passage);

        button.innerHTML = `
            <div class="test-info">
                <strong>?? Passage ${index + 1}</strong>
                <br>
                ${escapeHtml(cleanTitle(passage.title))}
                <span class="sub-info">
                    ${passage.question_count || 0} Questions • ${types.join(", ")}
                </span>
            </div>
        `;

        button.onclick = () => {
            openTest(passage.filename, passage.title, "Reading");
        };

        container.appendChild(button);
    });
}


/* =====================================================
   QUESTION TYPES
===================================================== */

function getPassageQuestionTypes(passage) {
    const types = new Set();
    (passage.questions || []).forEach(question => {
        types.add(question.type || "Other");
    });
    return Array.from(types);
}

function renderQuestionTypes() {
    const container = document.getElementById("qtype-grid");
    if (!container) return;

    container.innerHTML = "";
    const typeMap = {};

    (state.bank.passages || []).forEach(passage => {
        (passage.questions || []).forEach(question => {
            const type = question.type || "Other";

            if (!typeMap[type]) {
                typeMap[type] = {
                    total: 0,
                    questions: []
                };
            }

            typeMap[type].total++;
            typeMap[type].questions.push({
                ...question,
                passageTitle: passage.title,
                filename: passage.filename
            });
        });
    });

    const types = Object.keys(typeMap).sort();

    if (!types.length) {
        container.innerHTML = `
            <div class="analytics-card">
                <h3>?? Question Bank bo‘sh</h3>
                <p>Reading material qo‘shing.</p>
            </div>
        `;
        return;
    }

    types.forEach(type => {
        const data = typeMap[type];

        const card = document.createElement("div");
        card.className = "qtype-card";

        card.innerHTML = `
            <h4>?? ${escapeHtml(type)}</h4>
            <p>${data.total} ta savol</p>
            <span class="tag">Practice ›</span>
        `;

        card.onclick = () => {
            openQuestionType(type, data.questions);
        };

        container.appendChild(card);
    });
}


/* =====================================================
   QUESTION TYPE VIEW
===================================================== */

function openQuestionType(type, questions) {
    showSection("qtype-view");

    const title = document.getElementById("qtype-title");
    const description = document.getElementById("qtype-description");
    const list = document.getElementById("qtype-question-list");

    title.innerText = `?? ${type}`;
    description.innerText = `${questions.length} ta savol • AIOS Question Type Bank`;

    list.innerHTML = "";

    questions.forEach(question => {
        const card = document.createElement("div");
        card.className = "test-btn";

        card.innerHTML = `
            <div class="test-info">
                <strong>Q${question.number}</strong>
                <span class="sub-info">${escapeHtml(question.passageTitle)}</span>
                <p style="margin-top:8px; white-space:normal;">
                    ${escapeHtml(question.question || question.instruction || "Question")}
                </p>
            </div>
        `;

        card.onclick = () => {
            openTest(question.filename, question.passageTitle, type);
        };

        list.appendChild(card);
    });
}


/* =====================================================
   TEST OPEN
===================================================== */

function openTest(fileName, title, category) {
    state.currentTest = {
        fileName,
        title,
        category
    };

    showSection("test-view");

    const frame = document.getElementById("test-frame");
    const titleEl = document.getElementById("active-test-title");

    const basePath = "practise reading/";
    const url = basePath + encodeURIComponent(fileName).replace(/%2F/g, "/");

    const currentSrc = frame.getAttribute("src");

    if (currentSrc !== url && !currentSrc.endsWith(url)) {
        frame.src = url;
    }

    titleEl.innerText = `${category}: ${cleanTitle(title)}`;
}


/* =====================================================
   TEST RESULT API
===================================================== */

function recordTestResult(questionResults) {
    if (!Array.isArray(questionResults)) return;

    questionResults.forEach(result => {
        const type = result.type || "Other";

        if (!state.weaknesses[type]) {
            state.weaknesses[type] = {
                errors: 0,
                total: 0
            };
        }

        state.weaknesses[type].total++;

        if (!result.correct) {
            state.weaknesses[type].errors++;
        }
    });

    saveWeaknesses();
    renderAnalytics();
}


/* =====================================================
   RECEIVE RESULT FROM IFRAME
===================================================== */

window.addEventListener("message", event => {
    if (!event.data || event.data.type !== "AIOS_TEST_RESULT") {
        return;
    }

    console.log("AIOS TEST RESULT:", event.data);
    recordTestResult(event.data.results || []);
});


/* =====================================================
   WEAKNESS ANALYTICS
===================================================== */

function renderAnalytics() {
    const list = document.getElementById("weakness-list");
    const badge = document.getElementById("weakness-summary");
    const ai = document.getElementById("ai-recommendation");

    if (!list) return;

    list.innerHTML = "";

    const weaknesses = state.weaknesses || {};
    const types = Object.keys(weaknesses);

    if (!types.length) {
        list.innerHTML = `
            <div class="weakness-item">
                <strong>?? Hozircha statistika yo‘q</strong>
                <p>Reading testini bajaring. Natija savol turi bo‘yicha avtomatik saqlanadi.</p>
            </div>
        `;

        if (badge) badge.innerText = "0 Weak Points";

        if (ai) {
            ai.innerHTML = `
                ?? <strong>AIOS:</strong><br><br>
                Birinchi Reading testini bajaring. Keyin AIOS weaknesslarni aniqlaydi.
            `;
        }

        return;
    }

    let weakCount = 0;

    types.forEach(type => {
        const data = weaknesses[type];
        const errors = Number(data.errors || 0);
        const total = Number(data.total || 0);

        if (!total) return;

        const rate = Math.round((errors / total) * 100);

        if (rate >= 30) {
            weakCount++;
        }

        const item = document.createElement("div");
        item.className = "weakness-item";

        item.innerHTML = `
            <div class="weakness-header">
                <strong>?? ${escapeHtml(type)}</strong>
                <span class="error-rate">${rate}% xato</span>
            </div>

            <div class="progress-bar">
                <div class="progress-fill" style="width:${Math.min(rate, 100)}%"></div>
            </div>

            <p class="weakness-sub">${errors} xato / ${total} savol</p>
        `;

        list.appendChild(item);
    });

    if (badge) {
        badge.innerText = `${weakCount} Weak Points`;
    }

    const weakest = types
        .map(type => {
            const data = weaknesses[type];
            const total = Number(data.total || 0);
            const errors = Number(data.errors || 0);
            return {
                type,
                rate: total ? (errors / total) * 100 : 0
            };
        })
        .sort((a, b) => b.rate - a.rate)[0];

    if (ai && weakest && weakest.rate >= 30) {
        ai.innerHTML = `
            ?? <strong>AIOS Recommendation</strong><br><br>
            Eng katta weakness: <strong>${escapeHtml(weakest.type)}</strong> — ${Math.round(weakest.rate)}% xato.<br><br>
            ?? Keyingi challenge shu question type'ga moslanadi.
        `;
    } else if (ai) {
        ai.innerHTML = `
            ? Hozircha jiddiy weakness aniqlanmadi.<br><br>
            AIOS keyingi testlar orqali statistikani aniqlashtiradi.
        `;
    }
}


/* =====================================================
   HELPERS
===================================================== */

function cleanTitle(title) {
    if (!title) return "IELTS Reading";
    return title.replace(/^IELTS Reading\s*-\s*/i, "").trim();
}

function escapeHtml(text) {
    if (text === undefined || text === null) return "";
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =====================================================
   START
===================================================== */

document.addEventListener("DOMContentLoaded", () => {
    loadWeaknesses();
    loadContentBank();
    renderAnalytics();
    updateBackButton();
});