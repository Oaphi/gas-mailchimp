const overrides: {
    settings: Partial<Mailchimp.MailchimpSettings>;
    used: boolean;
} = {
    used: false,
    settings: {},
};

/**
 * @summary gets Mailchimp defaults for settings
 * @return {Mailchimp.MailchimpSettings}
 */
const getDefaults: Mailchimp.MailchimpApp["getDefaults"] = () => ({
    version: CONFIG.version,
    domain: CONFIG.domain,
    api_key: "",
    listName: "",
    server: "",
});

/**
 * @summary gets Mailchimp settings from user properties
 * @return {Mailchimp.MailchimpSettings}
 */
const getSettings: Mailchimp.MailchimpApp["getSettings"] = () => {
    const defaults = {
        version: CONFIG.version,
        domain: CONFIG.domain,
        api_key: "",
        listName: "",
        server: "",
    };

    const { used, settings } = overrides;
    if (used) return settings;

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
 * @param {Partial<Mailchimp.MailchimpSettings>} settings
 * @return {boolean}
 */
const setSettings: Mailchimp.MailchimpApp["setSettings"] = (
    settings: Partial<Mailchimp.MailchimpSettings>
) => {
    try {
        const { property } = CONFIG;

        const store = PropertiesService.getUserProperties();

        const oldSettings = getSettings();

        const updated = deepAssign(oldSettings, settings);

        store.setProperty(property, JSON.stringify(updated));

        return true;
    } catch (error) {
        console.warn(error);
        return false;
    }
};

/**
 * @summary bypass PropertyService and use the settings passed in
 * @param {Partial<Mailchimp.MailchimpSettings>} settings
 * @return {boolean}
 */
const useSettings: Mailchimp.MailchimpApp["useSettings"] = (
    settings: Partial<Mailchimp.MailchimpSettings>
) => {
    try {
        deepAssign(overrides.settings, getDefaults(), settings);
        overrides.used = true;
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
const validateMailchimpSettings = (
    settings: Mailchimp.MailchimpSettings
): Mailchimp.MailchimpSettings => {
    const {
        errors: { settings: settingsErrors },
        version: defaultVersion,
    } = CONFIG;

    const { api_key, server, version = defaultVersion } = settings;

    if (!api_key) throw new Error(settingsErrors.api_key);
    if (!server) throw new Error(settingsErrors.server);

    return Object.assign(settings, { version });
};

Object.assign(this, {
    overrides,
    getDefaults,
    getSettings,
    setSettings,
    validateMailchimpSettings,
});
