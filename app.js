const tg = window.Telegram?.WebApp;

if (tg) {
    tg.expand();
    tg.ready();
}


/* =====================================================
   AIOS CONTENT ENGINE
===================================================== */

const state = {

    bank: {
        version: 0,
        updated_at: "",
        passages: []
    },

    weaknesses: {}

};


/* =====================================================
   LOAD CONTENT BANK
===================================================== */

async function loadContentBank() {

    try {

        const response = await fetch(
            "content_bank.json?t=" + Date.now()
        );

        if (!response.ok) {
            throw new Error(
                "content_bank.json topilmadi"
            );
        }

        state.bank = await response.json();

        console.log(
            "AIOS Content Bank loaded:",
            state.bank
        );

        renderPassages();
        renderQuestionTypes();

        updatePassageCount();

    }

    catch (error) {

        console.error(
            "Content Engine Error:",
            error
        );

        const list =
            document.getElementById(
                "full-practice-list"
            );

        if (list) {

            list.innerHTML = `
                <div class="analytics-card">
                    <h3>? Content Bank Error</h3>
                    <p>
                        content_bank.json yuklanmadi.
                    </p>
                    <p>
                        GitHub Pages'ga
                        <b>content_bank.json</b>
                        faylini ham push qiling.
                    </p>
                </div>
            `;

        }

    }

}


/* =====================================================
   NAVIGATION
===================================================== */

function showSection(sectionId) {

    const sections = [
        "main-dashboard",
        "reading-hub",
        "qtype-view",
        "weakness-analytics",
        "test-view"
    ];

    sections.forEach(id => {

        const element =
            document.getElementById(id);

        if (!element) return;

        if (id === sectionId) {
            element.classList.remove("hidden");
        } else {
            element.classList.add("hidden");
        }

    });

    if (sectionId === "weakness-analytics") {
        renderAnalytics();
    }

}


/* =====================================================
   READING TABS
===================================================== */

function switchReadingTab(tab) {

    const fullTab =
        document.getElementById(
            "full-practice-tab"
        );

    const typesTab =
        document.getElementById(
            "question-types-tab"
        );

    const btnFull =
        document.getElementById(
            "tab-full"
        );

    const btnTypes =
        document.getElementById(
            "tab-types"
        );


    if (tab === "full") {

        fullTab.classList.remove("hidden");
        typesTab.classList.add("hidden");

        btnFull.classList.add("active");
        btnTypes.classList.remove("active");

    }

    else {

        fullTab.classList.add("hidden");
        typesTab.classList.remove("hidden");

        btnFull.classList.remove("active");
        btnTypes.classList.add("active");

    }

}


/* =====================================================
   PASSAGE COUNT
===================================================== */

function updatePassageCount() {

    const badge =
        document.getElementById(
            "passage-count"
        );

    if (!badge) return;

    const count =
        state.bank.passages.length;

    badge.innerText =
        `${count} Passage${count === 1 ? "" : "s"} Loaded`;

}


/* =====================================================
   FULL PRACTICE LIST
===================================================== */

function renderPassages() {

    const container =
        document.getElementById(
            "full-practice-list"
        );

    if (!container) return;

    container.innerHTML = "";

    const passages =
        state.bank.passages || [];


    if (!passages.length) {

        container.innerHTML = `
            <div class="analytics-card">
                <h3>?? Reading bank empty</h3>
                <p>
                    practise reading papkasiga
                    HTML fayl qo'shing.
                </p>
            </div>
        `;

        return;
    }


    passages.forEach((passage, index) => {

        const button =
            document.createElement("button");

        button.className = "test-btn";


        const questionTypes =
            getPassageQuestionTypes(
                passage
            );


        button.innerHTML = `
            <div class="test-info">

                <strong>
                    ?? Passage ${index + 1}:
                </strong>

                ${escapeHtml(
                    cleanTitle(
                        passage.title
                    )
                )}

                <span class="sub-info">

                    ${passage.question_count || 0}
                    Questions

                    •
                    ${questionTypes.join(", ")}

                </span>

            </div>
        `;


        button.onclick = () => {

            openTest(
                passage.filename,
                passage.title,
                "Reading"
            );

        };


        container.appendChild(button);

    });

}


/* =====================================================
   PASSAGE QUESTION TYPES
===================================================== */

function getPassageQuestionTypes(
    passage
) {

    const types = new Set();

    (passage.questions || []).forEach(
        question => {

            if (question.type) {
                types.add(question.type);
            }

        }
    );

    return Array.from(types);

}


/* =====================================================
   QUESTION TYPE BANK
===================================================== */

function renderQuestionTypes() {

    const container =
        document.getElementById(
            "qtype-grid"
        );

    if (!container) return;

    container.innerHTML = "";


    const typeMap = {};


    state.bank.passages.forEach(
        passage => {

            (passage.questions || [])
                .forEach(question => {

                    const type =
                        question.type ||
                        "Other";

                    if (!typeMap[type]) {

                        typeMap[type] = {
                            total: 0,
                            questions: []
                        };

                    }

                    typeMap[type].total++;

                    typeMap[type]
                        .questions
                        .push({
                            ...question,
                            passageTitle:
                                passage.title,
                            filename:
                                passage.filename
                        });

                });

        }
    );


    const types =
        Object.keys(typeMap)
            .sort();


    if (!types.length) {

        container.innerHTML =
            "<p>Question bank empty.</p>";

        return;
    }


    types.forEach(type => {

        const data =
            typeMap[type];


        const card =
            document.createElement("div");

        card.className =
            "qtype-card";


        card.innerHTML = `

            <h4>
                ?? ${escapeHtml(type)}
            </h4>

            <p>
                ${data.total} ta savol
            </p>

            <span class="tag">
                Practice
            </span>

        `;


        card.onclick = () => {

            openQuestionType(
                type,
                data.questions
            );

        };


        container.appendChild(card);

    });

}


/* =====================================================
   QUESTION TYPE PRACTICE
===================================================== */

function openQuestionType(
    type,
    questions
) {

    showSection("qtype-view");


    const title =
        document.getElementById(
            "qtype-title"
        );

    const description =
        document.getElementById(
            "qtype-description"
        );

    const list =
        document.getElementById(
            "qtype-question-list"
        );


    title.innerText =
        `?? ${type}`;


    description.innerText =
        `${questions.length} ta savol • `
        + `AIOS Reading Question Type Bank`;


    list.innerHTML = "";


    questions.forEach(
        question => {

            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "test-btn";


            card.innerHTML = `

                <div class="test-info">

                    <strong>
                        Q${question.number}
                    </strong>

                    <span class="sub-info">

                        ${escapeHtml(
                            question.passageTitle
                        )}

                    </span>

                    <p style="
                        margin-top:8px;
                        white-space:normal;
                    ">

                        ${escapeHtml(
                            question.question ||
                            question.instruction ||
                            "Question"
                        )}

                    </p>

                </div>

            `;


            card.onclick = () => {

                openTest(
                    question.filename,
                    question.passageTitle,
                    type
                );

            };


            list.appendChild(card);

        }
    );

}


/* =====================================================
   OPEN ORIGINAL IELTS TEST
===================================================== */

function openTest(
    fileName,
    title,
    category
) {

    showSection("test-view");


    const frame =
        document.getElementById(
            "test-frame"
        );


    const titleEl =
        document.getElementById(
            "active-test-title"
        );


    const basePath =
        "practise reading/";


    const url =
        basePath +
        encodeURIComponent(fileName)
            .replace(/%2F/g, "/");


    frame.src = url;


    titleEl.innerText =
        `${category}: ${cleanTitle(title)}`;

}


/* =====================================================
   ANALYTICS
===================================================== */

function renderAnalytics() {

    const listEl =
        document.getElementById(
            "weakness-list"
        );

    const aiEl =
        document.getElementById(
            "ai-recommendation"
        );

    const summaryBadge =
        document.getElementById(
            "weakness-summary"
        );


    if (!listEl) return;


    listEl.innerHTML = "";


    const weaknesses =
        state.weaknesses;


    const keys =
        Object.keys(weaknesses);


    if (!keys.length) {

        listEl.innerHTML = `
            <div class="weakness-item">

                <strong>
                    ?? Hozircha weakness yo'q
                </strong>

                <p>
                    Reading testini bajarganingizdan
                    keyin AIOS real statistikani
                    ko'rsatadi.
                </p>

            </div>
        `;


        if (summaryBadge) {
            summaryBadge.innerText =
                "0 Weak Points";
        }


        if (aiEl) {

            aiEl.innerHTML = `
                <strong>
                    ?? AIOS:
                </strong>

                <br><br>

                Birinchi Reading testini
                bajaring. Keyin AIOS
                xatolarni savol turi bo'yicha
                tahlil qiladi.
            `;

        }

        return;

    }


    let weaknessCount = 0;


    keys.forEach(type => {

        const data =
            weaknesses[type];


        const rate =
            data.total > 0
                ? Math.round(
                    data.errors /
                    data.total *
                    100
                )
                : 0;


        if (rate < 30) return;


        weaknessCount++;


        const item =
            document.createElement(
                "div"
            );


        item.className =
            "weakness-item";


        item.innerHTML = `

            <div class="weakness-header">

                <strong>
                    ${escapeHtml(type)}
                </strong>

                <span class="error-rate">
                    ${rate}% Error Rate
                </span>

            </div>

            <div class="progress-bar">

                <div
                    class="progress-fill"
                    style="width:${rate}%">
                </div>

            </div>

            <p class="weakness-sub">

                ${data.errors}
                /
                ${data.total}
                ta xato

            </p>

        `;


        listEl.appendChild(item);

    });


    if (summaryBadge) {

        summaryBadge.innerText =
            `${weaknessCount} Weak Points`;

    }


    if (aiEl && weaknessCount) {

        aiEl.innerHTML = `
            <strong>
                ?? AIOS aniqladi:
            </strong>

            <br><br>

            Sizda ayrim Reading question
            type'larida xatolar yuqori.

            <br><br>

            ?? AIOS keyingi bosqichda
            aynan shu savol turlariga
            mos challenge beradi.
        `;

    }

}


/* =====================================================
   HELPERS
===================================================== */

function cleanTitle(title) {

    if (!title) return "IELTS Reading";

    return title
        .replace(/^IELTS Reading\s*-\s*/i, "")
        .trim();

}


function escapeHtml(text) {

    if (text === undefined ||
        text === null) {
        return "";
    }

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

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadContentBank();

        renderAnalytics();

    }
);