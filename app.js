// Telegram WebApp integratsiyasi
const tg = window.Telegram?.WebApp;
if (tg) {
    tg.expand();
    tg.ready();
}

// Global State
const state = {
    weaknesses: {
        'TFNG': { total: 12, errors: 7, rate: 58 },
        'Matching Headings': { total: 10, errors: 6, rate: 60 },
        'MCQ': { total: 15, errors: 2, rate: 13 },
        'Completion': { total: 8, errors: 2, rate: 25 }
    }
};

// Section Switching
function showSection(sectionId) {
    const sections = ['main-dashboard', 'reading-hub', 'weakness-analytics', 'test-view'];
    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (id === sectionId) {
                el.classList.remove('hidden');
            } else {
                el.classList.add('hidden');
            }
        }
    });

    if (sectionId === 'weakness-analytics') {
        renderAnalytics();
    }
}

// Reading Tab Switching
function switchReadingTab(tab) {
    const fullTab = document.getElementById('full-practice-tab');
    const typesTab = document.getElementById('question-types-tab');
    const btnFull = document.getElementById('tab-full');
    const btnTypes = document.getElementById('tab-types');

    if (tab === 'full') {
        fullTab.classList.remove('hidden');
        typesTab.classList.add('hidden');
        btnFull.classList.add('active');
        btnTypes.classList.remove('active');
    } else {
        fullTab.classList.add('hidden');
        typesTab.classList.remove('hidden');
        btnFull.classList.remove('active');
        btnTypes.classList.add('active');
    }
}

// Test View Player
function openTest(filePath, title, category) {
    showSection('test-view');
    const frame = document.getElementById('test-frame');
    const titleEl = document.getElementById('active-test-title');
    
    if (frame) frame.src = filePath;
    if (titleEl) titleEl.innerText = `${category}: ${title}`;
}

// Question Type Filter
function filterByQType(type) {
    alert(`?? "${type}" bo'yicha ajratilgan savollar banki yuklanmoqda...\nAIOS Content Engine barcha passage'lardan ushbu turga oid savollarni avtomatik yig'ib beradi.`);
}

// Render Weakness Analytics
function renderAnalytics() {
    const listEl = document.getElementById('weakness-list');
    const aiEl = document.getElementById('ai-recommendation');
    const summaryBadge = document.getElementById('weakness-summary');

    if (!listEl) return;

    listEl.innerHTML = '';
    let weaknessCount = 0;
    let criticalTypes = [];

    Object.keys(state.weaknesses).forEach(type => {
        const data = state.weaknesses[type];
        if (data.rate > 40) { // 40% dan yuqori xatolik zaif nuqta
            weaknessCount++;
            criticalTypes.push(type);

            const item = document.createElement('div');
            item.className = 'weakness-item';
            item.innerHTML = `
                <div class="weakness-header">
                    <strong>${type}</strong>
                    <span class="error-rate">${data.rate}% Error Rate</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${data.rate}%"></div>
                </div>
                <p class="weakness-sub">${data.errors} / ${data.total} ta xato savol</p>
            `;
            listEl.appendChild(item);
        }
    });

    if (summaryBadge) {
        summaryBadge.innerText = `${weaknessCount} Weak Points`;
    }

    if (aiEl) {
        if (criticalTypes.length > 0) {
            aiEl.innerHTML = `
                <strong>?? AI Engine Aniqladi:</strong><br>
                Oxirgi testlarda <strong>${criticalTypes.join(' va ')}</strong> savol turlarida xatolar yuqori.<br><br>
                ?? <strong>Tavsiya:</strong> Bugungi mashqni aynan <u>Question Types ? ${criticalTypes[0]}</u> bo'limidan boshlang.
            `;
        } else {
            aiEl.innerText = "?? Barcha savol turlari bo'yicha ko'rsatkichlaringiz a'lo darajada!";
        }
    }
}

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
    renderAnalytics();
});