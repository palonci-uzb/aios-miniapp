// AIOS Mini App sozlamasi.
// Mini App backend (main.py) bilan BIR XIL manzildan ochilsa (PUBLIC_URL), API_BASE bo'sh qoladi.
// Agar Mini App'ni GitHub Pages'da hostlasangiz, bu yerga backend'ning public HTTPS manzilini yozing, masalan:
//   API_BASE: "https://heat-background-called-governance.trycloudflare.com"
// MUHIM: bu yerga hech qachon token yoki API key yozmang!
window.AIOS_CONFIG = {
  API_BASE: ""
};
