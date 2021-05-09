/**
 * 
 * @param {{
 *  after : (Date|undefined),
 *  before : (Date|undefined),
 *  email : (string|undefined),
 *  name : string,
 *  settings : MailchimpSettings
 * } | CommonListParams} 
 * 
 * @typedef {{
 *  has_welcome : boolean,
 *  id : string,
 *  list_rating : number,
 *  name : string,
 *  notify_on_unsubscribe : string
 * }} List
 * 
 * @returns {List[]}
 */
var getLists = ({

    after,
    before,
    count = 10,
    email,
    fields = {
        exclude: []
    },
    name,
    offset = 0,
    settings = getSettings(),
    sort = {
        field: "created",
        direction: "DESC"
    },
    onError = console.warn
} = {}) => {

    try {

        const { api_key, domain, server, version } = validateMailchimpSettings(settings);

        const query = validateMailchimpQuery("lists", { count, offset, sort, fields });

        email && (query.email = email);

        const config = FetchApp.getConfig({
            domain,
            paths: [version, "lists"],
            subdomains: [server, "api"],
            query
        });

        config.addHeader("Authorization", `Basic ${api_key}`);

        const params = config.json({
            "redirect": "followRedirects"
        }, {
            include: ["url", "headers"]
        });

        const requests = [Object.assign({ muteHttpExceptions: true }, params)];

        const [response] = UrlFetchApp.fetchAll(requests);

        const status = FetchApp.isSuccess({ response });

        if (!status) { return []; }

        /** @type {{ lists : List[] }} */
        const { lists = [] } = FetchApp.extractJSON({ response });

        const filtered = lists.filter(({ name: listName }) => {
            const nameValid = name ? listName === name : true;

            return nameValid;
        });

        return filtered;

    } catch (error) {
        onError(error);
        return [];
    }

};