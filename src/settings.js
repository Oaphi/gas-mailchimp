/**
 * @type {Mailchimp.MailchimpApp.getSettings}
 */
var getSettings = () => {

    const defaults = {
        api_key: "",
        listName: "",
        server: ""
    };

    try {
        const { property, domain, version } = CONFIG;

        const store = PropertiesService.getUserProperties();

        const settings = JSON.parse(store.getProperty(property) || "{}");

        const overrides = Object.assign({ domain, version }, defaults, settings);

        return overrides;

    } catch (error) {
        console.warn(error);
        return defaults;
    }
};

/**
 * @type {Mailchimp.MailchimpApp.setSettings}
 */
var setSettings = (settings) => {

    try {

        const { property } = CONFIG;

        const store = PropertiesService.getUserProperties();

        store.setProperty(property, JSON.stringify(settings));

        return true;

    } catch (error) {
        console.warn(error);
        return false;
    }

};

/**
 * @summary validates Mailchimp API settings
 * @param {MailchimpSettings} [settings]
 * @returns {MailchimpSettings}
 * 
 * @throws {Error} if settings are invalid
 */
const validateMailchimpSettings = (settings = {}) => {

    const { errors: { settings: settingsErrors }, version: defaultVersion } = CONFIG;

    const { api_key, server, version = defaultVersion } = settings;

    if (!api_key) {
        throw new Error(settingsErrors.api_key);
    }

    if (!server) {
        throw new Error(settingsErrors.server);
    }

    return Object.assign(settings, { version });
};