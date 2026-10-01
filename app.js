const tg = window.Telegram?.WebApp;

if (tg) {
    tg.expand();
    tg.ready();
}

const state = {
    bank: { version: 0, updated_at: "", passages: [] },
    navigation: [],
    currentTest: { fileName: null, title: null, category: null }
};

async function loadContentBank() {
    try {
        const response = await fetch("content_bank.json?t=" + Date.now());
        if (!response.ok) throw new Error("content_bank.json topilmadi");
        state.bank = await response.json();

        renderPassages();
        updatePassageCount();
    } catch (error) {
        const list = document.getElementById("full-practice-list");
        if (list) {
            list.innerHTML = `
                <div class="test-card">
                    <div class="test-details">
                        <h3>? Content Bank yuklanmadi</h3>
                        <p>content_bank.json faylini tekshiring.</p>
                    </div>
                </div>
            `;
        }
    }
}

function showSection(sectionId) {
    const sections = ["main-dashboard", "test-view"];

    sections.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        if (id === sectionId) el.classList.remove("hidden");
        else el.classList.add("hidden");
    });

    updateBackButton();
}

function goBack() {
    showSection("main-dashboard");
}

function updateBackButton() {
    document.querySelectorAll(".back-btn").forEach(button => {
        button.onclick = goBack;
    });

    if (!tg) return;

    const testView = document.getElementById("test-view");
    if (testView && !testView.classList.contains("hidden")) {
        tg.BackButton.show();
        tg.BackButton.offClick(goBack);
        tg.BackButton.onClick(goBack);
    } else {
        tg.BackButton.hide();
    }
}

function updatePassageCount() {
    const badge = document.getElementById("passage-count");
    if (!badge) return;
    const count = state.bank.passages?.length || 0;
    badge.innerText = `${count} Passage${count === 1 ? "" : "s"}`;
}

function renderPassages() {
    const container = document.getElementById("full-practice-list");
    if (!container) return;
    container.innerHTML = "";

    const passages = state.bank.passages || [];

    if (!passages.length) {
        container.innerHTML = `
            <div class="test-card">
                <div class="test-details">
                    <h3>?? Testlar topilmadi</h3>
                    <p>practise reading papkasida HTML test fayllari borligini tekshiring.</p>
                </div>
            </div>
        `;
        return;
    }

    passages.forEach((passage, index) => {
        const card = document.createElement("div");
        card.className = "test-card";

        card.innerHTML = `
            <div class="test-info-left">
                <div class="test-number-tag">P${index + 1}</div>
                <div class="test-details">
                    <h3>${escapeHtml(cleanTitle(passage.title))}</h3>
                    <p>IELTS Reading • Full Test</p>
                </div>
            </div>
            <div class="play-icon">&#9654;</div>
        `;

        card.onclick = () => {
            openTest(passage.filename, passage.title, "Reading");
        };

        container.appendChild(card);
    });
}

function openTest(fileName, title, category) {
    state.currentTest = { fileName, title, category };
    showSection("test-view");

    const frame = document.getElementById("test-frame");
    const titleEl = document.getElementById("active-test-title");

    const basePath = "practise reading/";
    const url = basePath + encodeURIComponent(fileName).replace(/%2F/g, "/") + "?t=" + Date.now();

    frame.src = url;
    titleEl.innerText = cleanTitle(title);
}

function cleanTitle(title) {
    if (!title) return "IELTS Reading";
    return title.replace(/^IELTS Reading\s*-\s*/i, "").trim();
}

function escapeHtml(text) {
    if (!text) return "";
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

document.addEventListener("DOMContentLoaded", () => {
    loadContentBank();
    updateBackButton();
});