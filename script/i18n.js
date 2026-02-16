async function loadLanguage(lang) {
    const response = await fetch(`locales/${lang}.json`);
    const translations = await response.json();

    applyTranslations(translations);
}

function applyTranslations(translations) {
    const elements = document.querySelectorAll("[data-i18n]");

    elements.forEach(element => {
        const key = element.getAttribute("data-i18n");
        const value = getNestedValue(translations, key);

        if (value) {
            element.innerHTML = value;
        }
    });
}

function getNestedValue(obj, key) {
    return key.split(".").reduce((o, i) => o?.[i], obj);
}

document.addEventListener("DOMContentLoaded", () => {
    loadLanguage("english"); // Load English by default
});
