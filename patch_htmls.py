import os
import re

READING_DIR = os.path.join(os.path.dirname(__file__), "practise reading")

# Universal JS Handler (HTML fayl tugashidan oldin qo'shiladi)
UNIVERSAL_SCRIPT = """
<script>
(function() {
    // Original submitTest funksiyasini ushlab olish
    const originalSubmit = window.submitTest;
    
    if (typeof originalSubmit === 'function') {
        window.submitTest = function() {
            // Avval original test tekshiruvini yurgizamiz
            const res = originalSubmit.apply(this, arguments);
            
            // Natijalarni yig'ib olish
            try {
                let resultsToSend = [];
                
                if (typeof questionResults !== 'undefined' && Array.isArray(questionResults)) {
                    resultsToSend = questionResults;
                } else if (typeof userAnswers !== 'undefined' && typeof correctAnswers !== 'undefined') {
                    // Agar questionResults bo'lmasa, o'zimiz yasaymiz
                    Object.keys(correctAnswers).forEach(qNum => {
                        const userAns = (userAnswers[qNum] || "").trim().toLowerCase();
                        const correctAns = (correctAnswers[qNum] || "").trim().toLowerCase();
                        
                        // Question Type aniqlash
                        let qType = "Other";
                        if (typeof questionTypes !== 'undefined' && questionTypes[qNum]) {
                            qType = questionTypes[qNum];
                        }
                        
                        resultsToSend.push({
                            number: qNum,
                            type: qType,
                            correct: userAns === correctAns
                        });
                    });
                }

                if (window.parent && resultsToSend.length > 0) {
                    window.parent.postMessage({
                        type: "AIOS_TEST_RESULT",
                        results: resultsToSend
                    }, "*");
                    console.log("? AIOS: Test natijalari uzatildi:", resultsToSend);
                }
            } catch (err) {
                console.error("? AIOS Integration Error:", err);
            }

            return res;
        };
    }
})();
</script>
"""

def patch_file(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Eskisini tozalash va yangi universal scriptni qo'shish
    if "AIOS_TEST_RESULT" in content:
        # Eski koda ega bo'lsa ham ustidan tozalab yangilaymiz
        content = re.sub(r'<script>\s*\(function\(\)\s*\{\s*// Original submitTest[\s\S]*?</script>', '', content)

    if "</body>" in content:
        content = content.replace("</body>", UNIVERSAL_SCRIPT + "\n</body>")
    else:
        content += UNIVERSAL_SCRIPT

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
        
    print(f"? Patch qilindi: {os.path.basename(filepath)}")

def main():
    if not os.path.exists(READING_DIR):
        print(f"Papkasi topilmadi: {READING_DIR}")
        return

    print("?? HTML fayllarga universal AIOS handler ulanmoqda...\n")
    for root, _, files in os.walk(READING_DIR):
        for file in files:
            if file.endswith(".html"):
                patch_file(os.path.join(root, file))

    print("\n?? Tayyor! Barcha HTML fayllar yangilandi.")

if __name__ == "__main__":
    main()