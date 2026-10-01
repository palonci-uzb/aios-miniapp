// Telegram WebApp boshlang'ich sozlamalari
const tg = window.Telegram?.WebApp;
if (tg) {
    tg.expand(); // Mini App'ni ekranni to'liq egallashiga ruxsat berish
    tg.ready();
}

function showDashboard() {
    document.getElementById('main-dashboard').classList.remove('hidden');
    document.getElementById('reading-list').classList.add('hidden');
    document.getElementById('test-view').classList.add('hidden');
}

function showReadingList() {
    document.getElementById('main-dashboard').classList.add('hidden');
    document.getElementById('reading-list').classList.remove('hidden');
    document.getElementById('test-view').classList.add('hidden');
}

function openTest(filePath) {
    document.getElementById('reading-list').classList.add('hidden');
    document.getElementById('test-view').classList.remove('hidden');
    
    // iframe ichida HTML testni ochish
    const frame = document.getElementById('test-frame');
    frame.src = filePath;
}