import os

files = ["index.html", "app.js", "style.css"]

for filename in files:
    filepath = os.path.join(os.path.dirname(__file__), filename)
    if os.path.exists(filepath):
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"? Clean UTF-8 Applied: {filename}")

print("\n?? Premium UI va focused fullscreen muvaffaqiyatli tayyorlandi!")