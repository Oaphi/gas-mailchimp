/**
 * @summary gets Mailchimp settings from user properties
 * @type {Mailchimp.MailchimpApp.getSettings}
 */
const getSettings = () => {

    const defaults = {
        version: CONFIG.version,
        domain: CONFIG.domain,
        api_key: "",
        listName: "",
        server: ""
    };

    try {
        const { property } = CONFIG;

        const store = PropertiesService.getUserProperties();

        const settings = JSON.parse(store.getProperty(property) || "{}");

        return { ...defaults, ...settings };

    } catch (error) {
        console.warn(error);
        return defaults;
    }
};

/**
 * @summary sets Mailchimp settings to user properties
 * @type {Mailchimp.MailchimpApp.setSettings}
 */
const setSettings = (settings) => {

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
 * @param {Mailchimp.MailchimpSettings} settings
 * @return {Mailchimp.MailchimpSettings}
 *
 * @throws {Error} if settings are invalid
 */
const validateMailchimpSettings = (settings) => {

    const { errors: { settings: settingsErrors }, version: defaultVersion } = CONFIG;

    const { api_key, server, version = defaultVersion } = settings;

    if (!api_key) throw new Error(settingsErrors.api_key);
    if (!server) throw new Error(settingsErrors.server);

    return Object.assign(settings, { version });
};