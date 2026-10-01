import os
import re

READING_DIR = os.path.join(os.path.dirname(__file__), "practise reading")

# Toza va qisqa integration scripti
BRIDGE_SCRIPT = """
<script>
(function() {
    const originalSubmit = window.submitTest;
    if (typeof originalSubmit === 'function' && !window.__aios_patched__) {
        window.__aios_patched__ = true;
        window.submitTest = function() {
            const res = originalSubmit.apply(this, arguments);
            try {
                if (typeof questionResults !== 'undefined' && Array.isArray(questionResults)) {
                    if (window.parent) {
                        window.parent.postMessage({
                            type: "AIOS_TEST_RESULT",
                            results: questionResults
                        }, "*");
                    }
                }
            } catch (e) {
                console.error("AIOS bridge error:", e);
            }
            return res;
        };
    }
})();
</script>
"""

def process_file(filepath):
    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()

    # Eski buzilgan skriptlarni olib tashlash
    content = re.sub(r'<script>\s*\(function\(\)\s*\{\s*// Original submitTest[\s\S]*?</script>', '', content)
    content = re.sub(r'<script>\s*\(function\(\)\s*\{\s*const originalSubmit[\s\S]*?</script>', '', content)

    # Yangi xavfsiz skriptni ulash
    if "</body>" in content:
        content = content.replace("</body>", BRIDGE_SCRIPT + "\n</body>")
    else:
        content += BRIDGE_SCRIPT

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"? Tozalandi va yangilandi: {os.path.basename(filepath)}")

def main():
    if not os.path.exists(READING_DIR):
        print(f"Papka topilmadi: {READING_DIR}")
        return

    for root, _, files in os.walk(READING_DIR):
        for file in files:
            if file.endswith(".html"):
                process_file(os.path.join(root, file))

    print("\n?? Barcha Reading HTML fayllari toza holatda yangilandi!")

if __name__ == "__main__":
    main()