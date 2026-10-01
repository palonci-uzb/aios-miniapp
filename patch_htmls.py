import os
import re

# Reading HTML fayllari joylashgan papka
READING_DIR = os.path.join(os.path.dirname(__file__), "practise reading")

# submitTest oxiriga qo'shiladigan AIOS postMessage kodi
POSTMESSAGE_SNIPPET = """
    // AIOS Weakness Analytics Integration
    try {
        if (window.parent && typeof questionResults !== 'undefined') {
            window.parent.postMessage({
                type: "AIOS_TEST_RESULT",
                results: questionResults
            }, "*");
            console.log("AIOS_TEST_RESULT sent to parent:", questionResults);
        }
    } catch (e) {
        console.error("AIOS postMessage error:", e);
    }
"""

def patch_file(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Agar allaqachon patch qilingan bo'lsa, o'tkazib yuboramiz
    if "AIOS_TEST_RESULT" in content:
        print(f"?? Allaqachon ulangan: {os.path.basename(filepath)}")
        return

    # submitTest funksiyasining oxirgi qavsidan oldin joylashtirish
    if "function submitTest(" in content or "function submitTest (" in content:
        # submitTest funksiyasini topish va uning ichiga inject qilish
        # showModal yoki modal ko'rsatilishidan oldin yoki funksiya tugashidan oldin
        patched = False
        
        if "showModal(" in content:
            content = content.replace("showModal(", POSTMESSAGE_SNIPPET + "\n    showModal(", 1)
            patched = True
        elif "alert(" in content:
            content = content.replace("alert(", POSTMESSAGE_SNIPPET + "\n    alert(", 1)
            patched = True
        else:
            # Funksiya oxiridagi return yoki yakunlovchi joyga qo'shish
            pattern = r"(function\s+submitTest\s*\([\s\S]*?)(\}\s*$|\}\s*</script>)"
            if re.search(pattern, content):
                content = re.sub(pattern, r"\1" + POSTMESSAGE_SNIPPET + r"\n\2", content, count=1)
                patched = True

        if patched:
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"? Muvaffaqiyatli ulandi: {os.path.basename(filepath)}")
        else:
            print(f"?? submitTest strukturasi mos kelmadi: {os.path.basename(filepath)}")
    else:
        print(f"? submitTest topilmadi: {os.path.basename(filepath)}")


def main():
    if not os.path.exists(READING_DIR):
        print(f"Papkasi topilmadi: {READING_DIR}")
        return

    print("?? Reading HTML fayllarga AIOS integration ulanmoqda...\n")
    for root, _, files in os.walk(READING_DIR):
        for file in files:
            if file.endswith(".html"):
                patch_file(os.path.join(root, file))

    print("\n?? Tayyor! Barcha HTML fayllar avtomatik patch qilindi.")

if __name__ == "__main__":
    main()