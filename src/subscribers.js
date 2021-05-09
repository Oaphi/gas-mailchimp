/**
 * @summary gets a list of members from subscriber list
 * @param {Mailchimp.Members.MemberListParams}
 * @returns {Mailchimp.Members.Member[]} 
 */
var getMembers = ({
    count = 10,
    fields = {
        exclude: []
    },
    listId,
    offset = 0,
    settings = getSettings(),
    sort = {
        field: "created",
        direction: "DESC"
    },
    since,
    status = "any",
    onError = console.warn
} = {}) => {

    try {

        if (!listId) {
            throw new Error(CONFIG.errors.members.unknownList);
        }

        const { api_key, domain, server, version } = validateMailchimpSettings(settings);

        const query = validateMailchimpQuery("members", { 
            count, fields, offset, status, sort, since 
        });

        const config = FetchApp.getConfig({
            domain,
            paths: [version, "lists", listId, "members"],
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

        const responseStatus = FetchApp.isSuccess({ response });
        if (!responseStatus) { return []; }

        /** @type {{ members: Member[] }} */
        const { members = [] } = FetchApp.extractJSON({ response });

        return members;

    } catch (error) {
        onError(error);
        return [];
    }

};

/**
 * @summary checks if a Member is in subscribers list
 * @param {Mailchimp.Members.CommonMemberParams} 
 * @returns {boolean}
 */
var hasMember = ({
    email,
    listId,
    settings = getSettings(),
    onError = console.warn
} = {}) => {

    try {

        if (!listId) {
            throw new Error(CONFIG.errors.members.unknownList);
        }

        if (!email) {
            throw new Error(CONFIG.errors.members.unknownEmail);
        }

        const { api_key, domain, server, version } = validateMailchimpSettings(settings);

        const config = FetchApp.getConfig({
            domain,
            subdomains: [server, "api"],
            paths: [version, "lists", listId, "members", toMD5lowercase(email)]
        });

        config.addHeader("Authorization", `Basic ${api_key}`);

        const params = config.json({
            "redirect": "followRedirects"
        }, {
            include: ["url", "headers"]
        });

        const requests = [Object.assign({
            muteHttpExceptions: true
        }, params)];

        const [response] = UrlFetchApp.fetchAll(requests);

        return FetchApp.isSuccess({ response, failureOn: [404] });

    } catch (error) {
        onError(error);
        return false;
    }

};

/**
 * @type {Mailchimp.MailchimpApp.addMember}
 */
var addMember = ({
    type = "html",
    email,
    isVIP = false,
    listId,
    settings = getSettings(),
    status = "subscribed",
    onError = console.warn
}) => {

    try {

        const { api_key, domain, server, version } = validateMailchimpSettings(settings);

        const payload = {
            email_address: email,
            email_type: type,
            vip: isVIP,
            status
        };

        const config = FetchApp.getConfig({
            domain,
            subdomains: [server, "api"],
            paths: [version, "lists", listId, "members"],
            method: "POST",
            payload
        });

        config.addHeader("Authorization", `Basic ${api_key}`);

        const params = config.json({
            "redirect": "followRedirects"
        }, {
            include: ["url", "headers", "method", "payload"]
        });

        return processRequests({
            paramsList: [params]
        });

    } catch (error) {
        onError(error);
        return false;
    }
};

/**
 * @type {Mailchimp.MailchimpApp.addMembers}
 */
var addMembers = ({ 
    listId, 
    members, 
    onError = console.warn, 
    settings 
}) => {

    try {

        const { limits: { connections: { concurrent } } } = CONFIG;

        /** @type {Mailchimp.Members.BatchMemberParam[][]} */
        const paramChunks = chunkify(members, { size: concurrent });

        paramChunks.forEach(chunk => {
            chunk.forEach((param) => {
                addMember(
                    Object.assign(param, { settings, onError, listId })
                );
            });
        });

    } catch (error) {
        onError(error);
        return false;
    }

};

/**
 * @summary deletes a Member from subscribers list
 * @param {Mailchimp.Members.MemberDeleteParams}
 * @returns {boolean} 
 */
var deleteMember = ({
    email,
    listId,
    permanent = false,
    settings = getSettings(),
    onError = console.warn
} = {}) => {

    try {

        if (!email) {
            throw new Error(CONFIG.errors.members.unknownEmail);
        }

        const { api_key, domain, server, version } = validateMailchimpSettings(settings);

        const hash = toMD5lowercase(email);

        const config = FetchApp.getConfig({
            domain,
            subdomains: [server, "api"],
            method: "DELETE",
            paths: [version, "lists", listId, "members", hash],
        });

        if (permanent) {
            config.addPaths("actions", "delete-permanent");
            config.method = "POST";
        }

        config.addHeader("Authorization", `Basic ${api_key}`);

        const params = config.json({
            "redirect": "followRedirects"
        }, {
            include: ["url", "headers", "method"]
        });

        console.log(params);

        const requests = [Object.assign({
            muteHttpExceptions: true
        }, params)];

        const [response] = UrlFetchApp.fetchAll(requests);

        return FetchApp.isSuccess({
            response, successOn: [
                CONFIG.statusCodes.members.delete.success
            ]
        });

    } catch (error) {
        onError(error);
        return false;
    }

};