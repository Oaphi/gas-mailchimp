"use strict";
const CONFIG = {
    domain: "mailchimp.com",
    version: "3.0",
    property: "mailchimp_settings",
    errors: {
        lists: {},
        members: {
            unknownList: "Members can be fetched only by list id or name",
            unknownEmail: "You must specifiy an email address"
        },
        settings: {
            api_key: "Missing API key",
            server: "Missing server (i.e. us3)"
        }
    },
    statusCodes: {
        members: {
            delete: {
                success: 204
            }
        }
    },
    limits: {
        lists: {
            members: 1e3,
        },
        connections: {
            concurrent: 10
        }
    }
};
Object.defineProperty(this, "MAX_COUNT", {
    enumerable: true,
    configurable: false,
    writable: false,
    value: CONFIG.limits.lists.members
});
const getLists = ({ count = 10, email, fields = {
    exclude: [],
}, name, offset = 0, settings = getSettings(), sort = {
    field: "created",
    direction: "DESC",
}, onError = console.warn, }) => {
    try {
        const { api_key, domain, server, version } = validateMailchimpSettings(settings);
        const query = validateMailchimpQuery("lists", {
            count,
            offset,
            sort,
            fields,
        });
        email && (query.email = email);
        const config = FetchApp.getConfig({
            domain,
            paths: [version, "lists"],
            subdomains: [server, "api"],
            query,
        });
        config.addHeader("Authorization", `Basic ${api_key}`);
        const params = config.json({
            redirect: "followRedirects",
        }, {
            include: ["url", "headers"],
        });
        const requests = [{ muteHttpExceptions: true, ...params }];
        const [response] = UrlFetchApp.fetchAll(requests);
        const status = FetchApp.isSuccess({ response });
        if (!status)
            return [];
        const { lists = [] } = FetchApp.extractJSON({
            response,
        });
        return lists.filter(({ name: listName }) => name ? listName === name : true);
    }
    catch (error) {
        onError(error);
        return [];
    }
};
const getMembers = ({ count = 10, fields = {
    exclude: [],
}, listId, offset = 0, settings = getSettings(), sort = {
    field: "created",
    direction: "DESC",
}, since, status = "any", onError = console.warn, }) => {
    try {
        if (!listId)
            throw new Error(CONFIG.errors.members.unknownList);
        const { api_key, domain, server, version } = validateMailchimpSettings(settings);
        const query = validateMailchimpQuery("members", {
            count,
            fields,
            offset,
            status,
            sort,
            since,
        });
        const config = FetchApp.getConfig({
            domain,
            paths: [version, "lists", listId, "members"],
            subdomains: [server, "api"],
            query,
        });
        config.addHeader("Authorization", `Basic ${api_key}`);
        const params = config.json({
            redirect: "followRedirects",
        }, {
            include: ["url", "headers"],
        });
        const requests = [{ muteHttpExceptions: true, ...params }];
        const [response] = UrlFetchApp.fetchAll(requests);
        const responseStatus = FetchApp.isSuccess({ response });
        if (!responseStatus)
            return [];
        const { members = [] } = FetchApp.extractJSON({
            response,
        });
        return members;
    }
    catch (error) {
        onError(error);
        return [];
    }
};
const hasMember = ({ email, listId, settings = getSettings(), onError = console.warn, }) => {
    try {
        if (!listId)
            throw new Error(CONFIG.errors.members.unknownList);
        if (!email)
            throw new Error(CONFIG.errors.members.unknownEmail);
        const { api_key, domain, server, version } = validateMailchimpSettings(settings);
        const config = FetchApp.getConfig({
            domain,
            subdomains: [server, "api"],
            paths: [version, "lists", listId, "members", toMD5lowercase(email)],
        });
        config.addHeader("Authorization", `Basic ${api_key}`);
        const params = config.json({
            redirect: "followRedirects",
        }, {
            include: ["url", "headers"],
        });
        const requests = [
            {
                muteHttpExceptions: true,
                ...params,
            },
        ];
        const [response] = UrlFetchApp.fetchAll(requests);
        return FetchApp.isSuccess({ response, failureOn: [404] });
    }
    catch (error) {
        onError(error);
        return false;
    }
};
const addMember = ({ type = "html", email, isVIP = false, listId, settings = getSettings(), status = "subscribed", onError = console.warn, }) => {
    try {
        const { api_key, domain, server, version } = validateMailchimpSettings(settings);
        const payload = {
            email_address: email,
            email_type: type,
            vip: isVIP,
            status,
        };
        const config = FetchApp.getConfig({
            domain,
            subdomains: [server, "api"],
            paths: [version, "lists", listId, "members"],
            method: "POST",
            payload,
        });
        config.addHeader("Authorization", `Basic ${api_key}`);
        const params = config.json({
            redirect: "followRedirects",
        }, {
            include: ["url", "headers", "method", "payload"],
        });
        return processRequests({
            paramsList: [params],
        });
    }
    catch (error) {
        onError(error);
        return false;
    }
};
const addMembers = ({ listId, members, onError = console.warn, settings, }) => {
    try {
        const { limits: { connections: { concurrent }, }, } = CONFIG;
        const paramChunks = chunkify(members, { size: concurrent });
        return paramChunks.every((chunk) => chunk.every((param) => addMember({ ...param, settings, onError, listId })));
    }
    catch (error) {
        onError(error);
        return false;
    }
};
const deleteMember = ({ email, listId, permanent = false, settings = getSettings(), onError = console.warn, }) => {
    try {
        if (!email)
            throw new Error(CONFIG.errors.members.unknownEmail);
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
            redirect: "followRedirects",
        }, {
            include: ["url", "headers", "method"],
        });
        const requests = [
            {
                muteHttpExceptions: true,
                ...params,
            },
        ];
        const [response] = UrlFetchApp.fetchAll(requests);
        return FetchApp.isSuccess({
            response,
            successOn: [CONFIG.statusCodes.members.delete.success],
        });
    }
    catch (error) {
        onError(error);
        return false;
    }
};
const getDefaults = () => ({
    version: CONFIG.version,
    domain: CONFIG.domain,
    api_key: "",
    listName: "",
    server: "",
});
const getSettings = () => {
    const defaults = {
        version: CONFIG.version,
        domain: CONFIG.domain,
        api_key: "",
        listName: "",
        server: "",
    };
    try {
        const { property } = CONFIG;
        const store = PropertiesService.getUserProperties();
        const settings = JSON.parse(store.getProperty(property) || "{}");
        return { ...defaults, ...settings };
    }
    catch (error) {
        console.warn(error);
        return defaults;
    }
};
const setSettings = (settings) => {
    try {
        const { property } = CONFIG;
        const store = PropertiesService.getUserProperties();
        const oldSettings = getSettings();
        store.setProperty(property, JSON.stringify({ ...oldSettings, ...settings }));
        return true;
    }
    catch (error) {
        console.warn(error);
        return false;
    }
};
const validateMailchimpSettings = (settings) => {
    const { errors: { settings: settingsErrors }, version: defaultVersion, } = CONFIG;
    const { api_key, server, version = defaultVersion } = settings;
    if (!api_key)
        throw new Error(settingsErrors.api_key);
    if (!server)
        throw new Error(settingsErrors.server);
    return Object.assign(settings, { version });
};
const addUser = ({ settings = getSettings(), }) => {
    try {
        throw new Error("method not implemented yet, sorry");
        return true;
    }
    catch (error) {
        return false;
    }
};
const union = ({ target, sources = [] }) => {
    const union = { ...target };
    const assignedKeys = {};
    for (const source of sources) {
        for (const key in source) {
            if (key in assignedKeys || key in union)
                continue;
            assignedKeys[key] |= 1;
            union[key] = source[key];
        }
    }
    return union;
};
const deepCopy = ({ source, skip = [], }) => {
    const output = (Array.isArray(source) ? [] : {});
    Object.entries(source).forEach(([key, val]) => {
        if (skip.includes(key))
            return;
        const isObj = typeof val === "object" && val;
        output[key] = isObj ? deepCopy({ source: val, skip }) : val;
    });
    return output;
};
const toISO8601Timestamp = (date = Date.now()) => {
    const parsed = new Date(date);
    const MIN_IN_HOUR = 60;
    const hours = parsed.getTimezoneOffset() / MIN_IN_HOUR;
    const fraction = (hours - Math.trunc(hours)) * MIN_IN_HOUR;
    const sign = hours < 0 ? "-" : "+";
    const offset = `${sign}${`${Math.abs(hours)}`.padStart(2, "0")}:${`${fraction}`.padEnd(2, "0")}`;
    return parsed.toISOString().slice(0, -5) + offset;
};
const validateMailchimpQuery = (type, query) => {
    const { count, fields, since, sort, status } = query;
    const validated = {};
    if (count !== undefined) {
        validated.count = count > 1e3 ? 1e3 : count < 10 ? 10 : count;
    }
    if (sort !== undefined) {
        const { sort: { field, direction = "DESC" } = {} } = query;
        const directions = ["ASC", "DESC"];
        const fields = new Map([
            [
                "members",
                {
                    opted: "timestamp_opt",
                    signup: "timestamp_signup",
                    changed: "last_changed",
                },
            ],
            [
                "lists",
                {
                    created: "date_created",
                },
            ],
        ]);
        const ucased = direction.toUpperCase();
        validated.sort_dir = directions.includes(ucased) ? ucased : "DESC";
        const fieldMap = fields.get(type);
        if (fieldMap && field)
            validated.sort_field = fieldMap[field] || Object.values(fieldMap)[0];
    }
    if (status !== undefined && status !== "any") {
        const validStatuses = new Set([
            "subscribed",
            "unsubscribed",
            "cleaned",
            "pending",
            "transactional",
            "archived",
        ]);
        validStatuses.has(status) && (validated.status = status);
    }
    if (since !== undefined) {
        validated.since_timestamp_opt = toISO8601Timestamp(since);
    }
    if (fields !== undefined) {
        const { fields: { exclude = [] } = {} } = query;
        validated.exclude_fields = exclude.map((ex) => `${type}.${ex}`);
    }
    return deepCopy({
        source: query,
        skip: ["fields", "sort", "status"],
        ...validated,
    });
};
const toMD5lowercase = (email) => {
    const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, email.toLowerCase(), Utilities.Charset.UTF_8);
    return digest
        .map((b) => (b < 0 ? b + 256 : b).toString(16).padStart(2, "0"))
        .join("");
};
const chunkify = (source, { limits = [], size } = {}) => {
    const output = [];
    if (size) {
        const { length } = source;
        const maxNumChunks = Math.ceil((length || 1) / size);
        let numChunksLeft = maxNumChunks;
        while (numChunksLeft) {
            const chunksProcessed = maxNumChunks - numChunksLeft;
            const elemsProcessed = chunksProcessed * size;
            output.push(source.slice(elemsProcessed, elemsProcessed + size));
            numChunksLeft--;
        }
        return output;
    }
    const { length } = limits;
    if (!length)
        return [[...source]];
    let lastSlicedElem = 0;
    limits.forEach((limit, i) => {
        const limitPosition = lastSlicedElem + limit;
        output[i] = source.slice(lastSlicedElem, limitPosition);
        lastSlicedElem = limitPosition;
    });
    const lastChunk = source.slice(lastSlicedElem);
    lastChunk.length && output.push(lastChunk);
    return output;
};
const processRequests = ({ paramsList, successOn, failureOn, }) => {
    const commonParams = { muteHttpExceptions: true };
    const requests = paramsList.map((params) => ({ ...commonParams, ...params }));
    const responses = UrlFetchApp.fetchAll(requests);
    return responses.every((response) => FetchApp.isSuccess({ response, successOn, failureOn }));
};
const addWebhook = ({ settings = getSettings(), listId, }) => {
    throw new Error("method not implemented yet, sorry");
};
