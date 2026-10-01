import os

READING_DIR = os.path.join(os.path.dirname(__file__), "practise reading")

def fix_html_file(filepath):
    try:
        # Faylni xavfsiz o'qish va kodirovkasini to'g'rilash
        with open(filepath, "rb") as f:
            raw_data = f.read()

        # UTF-8 decode qilamiz
        content = raw_data.decode("utf-8", errors="ignore")

        # Agar so'roq belgilari qo'shilib qolgan eski AIOS skriptlari bo'lsa, ularni tozalaymiz
        clean_content = content
        if "UNIVERSAL_SCRIPT" in clean_content or "AIOS_TEST_RESULT" in clean_content:
            lines = clean_content.splitlines()
            filtered_lines = [line for line in lines if "AIOS" not in line and "questionResults" not in line]
            clean_content = "\n".join(filtered_lines)

        with open(filepath, "w", encoding="utf-8") as f:
            f.write(clean_content)

        print(f"? Kodirovka to'g'rilandi: {os.path.basename(filepath)}")
    except Exception as e:
        print(f"? Xato: {filepath} - {e}")

def main():
    if not os.path.exists(READING_DIR):
        print(f"Papka topilmadi: {READING_DIR}")
        return

    print("?? HTML fayllar tozalanmoqda va kodirovka tiklanmoqda...\n")
    for root, _, files in os.walk(READING_DIR):
        for file in files:
            if file.endswith(".html"):
                fix_html_file(os.path.join(root, file))

    print("\n?? Barcha HTML fayllar toza UTF-8 formatiga o'tkazildi!")

if __name__ == "__main__":
    main()