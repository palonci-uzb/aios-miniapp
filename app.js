// AIOS Mini App Engine
let contentBank = null;

// Page Load
document.addEventListener('DOMContentLoaded', () => {
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
    }
    loadContentBank();
});

// Load content_bank.json
async function loadContentBank() {
    try {
        const response = await fetch('content_bank.json');
        if (response.ok) {
            contentBank = await response.json();
            console.log('Content Bank Loaded:', contentBank);
            updateDashboardStats();
        }
    } catch (e) {
        console.warn('content_bank.json topilmadi yoki standart rejim:', e);
    }
}

// Navigation
function showSection(sectionId) {
    document.querySelectorAll('.container').forEach(el => el.classList.add('hidden'));
    const target = document.getElementById(sectionId);
    if (target) target.classList.remove('hidden');
}

// Switch Reading Tabs
function switchReadingTab(tab) {
    const fullTab = document.getElementById('full-practice-tab');
    const typeTab = document.getElementById('question-types-tab');
    const btnFull = document.getElementById('tab-full');
    const btnTypes = document.getElementById('tab-types');

    if (tab === 'full') {
        fullTab.classList.remove('hidden');
        typeTab.classList.add('hidden');
        btnFull.classList.add('active');
        btnTypes.classList.remove('active');
    } else {
        fullTab.classList.add('hidden');
        typeTab.classList.remove('hidden');
        btnFull.classList.remove('active');
        btnTypes.classList.add('active');
    }
}

// Open Test in Iframe
function openTest(url, title, type) {
    const frame = document.getElementById('test-frame');
    const titleEl = document.getElementById('active-test-title');
    
    if (frame && titleEl) {
        frame.src = url;
        titleEl.innerText = `${title} (${type})`;
        showSection('test-view');
    }
}

// Filter Questions by Type
function filterByQType(qType) {
    if (!contentBank) {
        alert("Content Bank yuklanmagan. Iltimos, serverni tekshiring.");
        return;
    }

    let foundQuestions = [];
    contentBank.passages.forEach(p => {
        p.questions.forEach(q => {
            if (q.type === qType || (qType === 'Completion' && q.type.includes('Completion'))) {
                foundQuestions.push({ passageTitle: p.title, ...q });
            }
        });
    });

    alert(`${qType} bo'yicha jami ${foundQuestions.length} ta savol topildi!`);
}

// Dashboard Stats Update
function updateDashboardStats() {
    if (!contentBank) return;
    const totalQ = contentBank.passages.reduce((sum, p) => sum + p.question_count, 0);
    const summaryEl = document.getElementById('weakness-summary');
    if (summaryEl) {
        summaryEl.innerText = `${totalQ} Questions Ready`;
        summaryEl.classList.remove('alert');
    }
}