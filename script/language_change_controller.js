/**
 * Language Change Controller  
 * Handles loading and apply translation to the page
 * 
 * This modules:
 * - Fetches translation JSOn files from the /localse folder
 * - find all the elements with `data-i18n` attribute and replaces their innerHTML with the corresponding translation value
 */


/**
 * asynchronously loads the language file and applies the translations to the page
 * @param {string} lang - language code
 * @returns {Promise<void>} - resolves when the tranlation are loaded and applied to the page 
 */
async function loadLanguage(lang) {
    // Fetch the translation files for the requested language
    // `await` is used to wait for the fetch to complete before proceeding to the next line of code
    const response = await fetch(`locales/${lang}.json`);

    // convert the response to JSON format, which is a JavaScript object that can be easily manipulated
    const translations = await response.json();

    // calling function to apply the translations to the page 
    applyTranslations(translations);
}

/** 
 * Apply the translation to all the element with the `data-i18n` attribute
 * @param {Object} translations - the translation object loaded from the JSON file, it contains key-value pairs where the key is the translation key and the value is the translated string
 */
function applyTranslations(translations) {
    // Select all the elements with the `data-i18n` attribute
    const elements = document.querySelectorAll("[data-i18n]");

    // Loop through each element and replace its innerHTML with the corresponding translation value
    elements.forEach(element => {
        // get the translation key from the `data-i18n` attribute of the element
        const key = element.getAttribute("data-i18n");

        // get the translate value by calling the `getNestedValue` function
        // will return the value of the translalation key
        const value = getNestedValue(translations, key);

        // if value is found
        if (value) {
            // replace the innerHTML of the element with the translation value
            element.innerHTML = value;
        }
    });
}

/**
 * Get thee nested value from an object using a dot notation separation key
 * @param {*} obj - the translation object loaded from the JSON file
 * @param {*} key - the translation key from thne html attribute 
 * @returns 
 */
function getNestedValue(obj, key) {
    // key.split(".") is used to split array of keys. Example "home.title" will be split into ["home", "title"]
    // reduce is used to iterate through the array of keys and access the nested value in the translation object.
    // return the final value of the translation key, or undefined if the key does not exist
    return key.split(".").reduce((o, i) => o?.[i], obj);
}

/**
 * function to initialise the language selection menu
 * setup click event listner for each language button
 */
function initialLanguageButton() {
    // get all language buttons
    // will return a NodeList of all the elements ()collection of elements) 
    const languageButtons = document.querySelectorAll(".language-button");

    // loop through each language button
    languageButtons.forEach(button => {
        // attach click event listener to each button, when a button is clicked, 
        // after the click, there will be 3 event listener total (one per button)
        button.addEventListener('click', function(){
            // get the language code from the data-lang attribute
            const selectedLang = this.getAttribute('data-lang');

            // Remove active class from all buttons
            languageButtons.forEach(button => button.classList.remove('active'));

            // add active class to the clicked button
            this.classList.add('active');

            // Load the selected language
            loadLanguage(selectedLang)
        });
    });
}

/**
 * Event listener to change the language when the DOM is loaded, it will load the default language (English) when the page is first loaded
 */
document.addEventListener("DOMContentLoaded", () => {
    initialLanguageButton();

    // load english as the default language on page load
    loadLanguage("english"); // Load English by default
});
