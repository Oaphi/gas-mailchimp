"use strict";
var CONFIG = {
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
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var getLists = function (_a) {
    var _b = _a.count, count = _b === void 0 ? 10 : _b, email = _a.email, _c = _a.fields, fields = _c === void 0 ? {
        exclude: [],
    } : _c, name = _a.name, _d = _a.offset, offset = _d === void 0 ? 0 : _d, _e = _a.settings, settings = _e === void 0 ? getSettings() : _e, _f = _a.sort, sort = _f === void 0 ? {
        field: "created",
        direction: "DESC",
    } : _f, _g = _a.onError, onError = _g === void 0 ? console.warn : _g;
    try {
        var _h = validateMailchimpSettings(settings), api_key = _h.api_key, domain = _h.domain, server = _h.server, version = _h.version;
        var query = validateMailchimpQuery("lists", {
            count: count,
            offset: offset,
            sort: sort,
            fields: fields,
        });
        email && (query.email = email);
        var config = FetchApp.getConfig({
            domain: domain,
            paths: [version, "lists"],
            subdomains: [server, "api"],
            query: query,
        });
        config.addHeader("Authorization", "Basic " + api_key);
        var params = config.json({
            redirect: "followRedirects",
        }, {
            include: ["url", "headers"],
        });
        var requests = [__assign({ muteHttpExceptions: true }, params)];
        var response = UrlFetchApp.fetchAll(requests)[0];
        var status = FetchApp.isSuccess({ response: response });
        if (!status)
            return [];
        var _j = FetchApp.extractJSON({
            response: response,
        }).lists, lists = _j === void 0 ? [] : _j;
        return lists.filter(function (_a) {
            var listName = _a.name;
            return name ? listName === name : true;
        });
    }
    catch (error) {
        onError(error);
        return [];
    }
};
var getMembers = function (_a) {
    var _b = _a.count, count = _b === void 0 ? 10 : _b, _c = _a.fields, fields = _c === void 0 ? {
        exclude: [],
    } : _c, listId = _a.listId, _d = _a.offset, offset = _d === void 0 ? 0 : _d, _e = _a.settings, settings = _e === void 0 ? getSettings() : _e, _f = _a.sort, sort = _f === void 0 ? {
        field: "created",
        direction: "DESC",
    } : _f, since = _a.since, _g = _a.status, status = _g === void 0 ? "any" : _g, _h = _a.onError, onError = _h === void 0 ? console.warn : _h;
    try {
        if (!listId)
            throw new Error(CONFIG.errors.members.unknownList);
        var _j = validateMailchimpSettings(settings), api_key = _j.api_key, domain = _j.domain, server = _j.server, version = _j.version;
        var query = validateMailchimpQuery("members", {
            count: count,
            fields: fields,
            offset: offset,
            status: status,
            sort: sort,
            since: since,
        });
        var config = FetchApp.getConfig({
            domain: domain,
            paths: [version, "lists", listId, "members"],
            subdomains: [server, "api"],
            query: query,
        });
        config.addHeader("Authorization", "Basic " + api_key);
        var params = config.json({
            redirect: "followRedirects",
        }, {
            include: ["url", "headers"],
        });
        var requests = [__assign({ muteHttpExceptions: true }, params)];
        var response = UrlFetchApp.fetchAll(requests)[0];
        var responseStatus = FetchApp.isSuccess({ response: response });
        if (!responseStatus)
            return [];
        var _k = FetchApp.extractJSON({
            response: response,
        }).members, members = _k === void 0 ? [] : _k;
        return members;
    }
    catch (error) {
        onError(error);
        return [];
    }
};
var hasMember = function (_a) {
    var email = _a.email, listId = _a.listId, _b = _a.settings, settings = _b === void 0 ? getSettings() : _b, _c = _a.onError, onError = _c === void 0 ? console.warn : _c;
    try {
        if (!listId)
            throw new Error(CONFIG.errors.members.unknownList);
        if (!email)
            throw new Error(CONFIG.errors.members.unknownEmail);
        var _d = validateMailchimpSettings(settings), api_key = _d.api_key, domain = _d.domain, server = _d.server, version = _d.version;
        var config = FetchApp.getConfig({
            domain: domain,
            subdomains: [server, "api"],
            paths: [version, "lists", listId, "members", toMD5lowercase(email)],
        });
        config.addHeader("Authorization", "Basic " + api_key);
        var params = config.json({
            redirect: "followRedirects",
        }, {
            include: ["url", "headers"],
        });
        var requests = [
            __assign({ muteHttpExceptions: true }, params),
        ];
        var response = UrlFetchApp.fetchAll(requests)[0];
        return FetchApp.isSuccess({ response: response, failureOn: [404] });
    }
    catch (error) {
        onError(error);
        return false;
    }
};
var addMember = function (_a) {
    var _b = _a.type, type = _b === void 0 ? "html" : _b, email = _a.email, _c = _a.isVIP, isVIP = _c === void 0 ? false : _c, listId = _a.listId, _d = _a.settings, settings = _d === void 0 ? getSettings() : _d, _e = _a.status, status = _e === void 0 ? "subscribed" : _e, _f = _a.onError, onError = _f === void 0 ? console.warn : _f;
    try {
        var _g = validateMailchimpSettings(settings), api_key = _g.api_key, domain = _g.domain, server = _g.server, version = _g.version;
        var payload = {
            email_address: email,
            email_type: type,
            vip: isVIP,
            status: status,
        };
        var config = FetchApp.getConfig({
            domain: domain,
            subdomains: [server, "api"],
            paths: [version, "lists", listId, "members"],
            method: "POST",
            payload: payload,
        });
        config.addHeader("Authorization", "Basic " + api_key);
        var params = config.json({
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
var addMembers = function (_a) {
    var listId = _a.listId, members = _a.members, _b = _a.onError, onError = _b === void 0 ? console.warn : _b, settings = _a.settings;
    try {
        var concurrent = CONFIG.limits.connections.concurrent;
        var paramChunks = chunkify(members, { size: concurrent });
        return paramChunks.every(function (chunk) {
            return chunk.every(function (param) { return addMember(__assign(__assign({}, param), { settings: settings, onError: onError, listId: listId })); });
        });
    }
    catch (error) {
        onError(error);
        return false;
    }
};
var deleteMember = function (_a) {
    var email = _a.email, listId = _a.listId, _b = _a.permanent, permanent = _b === void 0 ? false : _b, _c = _a.settings, settings = _c === void 0 ? getSettings() : _c, _d = _a.onError, onError = _d === void 0 ? console.warn : _d;
    try {
        if (!email)
            throw new Error(CONFIG.errors.members.unknownEmail);
        var _e = validateMailchimpSettings(settings), api_key = _e.api_key, domain = _e.domain, server = _e.server, version = _e.version;
        var hash = toMD5lowercase(email);
        var config = FetchApp.getConfig({
            domain: domain,
            subdomains: [server, "api"],
            method: "DELETE",
            paths: [version, "lists", listId, "members", hash],
        });
        if (permanent) {
            config.addPaths("actions", "delete-permanent");
            config.method = "POST";
        }
        config.addHeader("Authorization", "Basic " + api_key);
        var params = config.json({
            redirect: "followRedirects",
        }, {
            include: ["url", "headers", "method"],
        });
        var requests = [
            __assign({ muteHttpExceptions: true }, params),
        ];
        var response = UrlFetchApp.fetchAll(requests)[0];
        return FetchApp.isSuccess({
            response: response,
            successOn: [CONFIG.statusCodes.members.delete.success],
        });
    }
    catch (error) {
        onError(error);
        return false;
    }
};
var getDefaults = function () { return ({
    version: CONFIG.version,
    domain: CONFIG.domain,
    api_key: "",
    listName: "",
    server: "",
}); };
var getSettings = function () {
    var defaults = {
        version: CONFIG.version,
        domain: CONFIG.domain,
        api_key: "",
        listName: "",
        server: "",
    };
    try {
        var property = CONFIG.property;
        var store = PropertiesService.getUserProperties();
        var settings = JSON.parse(store.getProperty(property) || "{}");
        return __assign(__assign({}, defaults), settings);
    }
    catch (error) {
        console.warn(error);
        return defaults;
    }
};
var setSettings = function (settings) {
    try {
        var property = CONFIG.property;
        var store = PropertiesService.getUserProperties();
        var oldSettings = getSettings();
        store.setProperty(property, JSON.stringify(__assign(__assign({}, oldSettings), settings)));
        return true;
    }
    catch (error) {
        console.warn(error);
        return false;
    }
};
var validateMailchimpSettings = function (settings) {
    var settingsErrors = CONFIG.errors.settings, defaultVersion = CONFIG.version;
    var api_key = settings.api_key, server = settings.server, _a = settings.version, version = _a === void 0 ? defaultVersion : _a;
    if (!api_key)
        throw new Error(settingsErrors.api_key);
    if (!server)
        throw new Error(settingsErrors.server);
    return Object.assign(settings, { version: version });
};
var addUser = function (_a) {
    var _b = _a.settings, settings = _b === void 0 ? getSettings() : _b;
    try {
        throw new Error("method not implemented yet, sorry");
        return true;
    }
    catch (error) {
        return false;
    }
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
var union = function (_a) {
    var target = _a.target, _b = _a.sources, sources = _b === void 0 ? [] : _b;
    var union = __assign({}, target);
    var assignedKeys = {};
    for (var _i = 0, sources_1 = sources; _i < sources_1.length; _i++) {
        var source = sources_1[_i];
        for (var key in source) {
            if (key in assignedKeys || key in union)
                continue;
            assignedKeys[key] |= 1;
            union[key] = source[key];
        }
    }
    return union;
};
var deepCopy = function (_a) {
    var source = _a.source, _b = _a.skip, skip = _b === void 0 ? [] : _b;
    var output = (Array.isArray(source) ? [] : {});
    Object.entries(source).forEach(function (_a) {
        var key = _a[0], val = _a[1];
        if (skip.includes(key))
            return;
        var isObj = typeof val === "object" && val;
        output[key] = isObj ? deepCopy({ source: val, skip: skip }) : val;
    });
    return output;
};
var toISO8601Timestamp = function (date) {
    if (date === void 0) { date = Date.now(); }
    var parsed = new Date(date);
    var MIN_IN_HOUR = 60;
    var hours = parsed.getTimezoneOffset() / MIN_IN_HOUR;
    var fraction = (hours - Math.trunc(hours)) * MIN_IN_HOUR;
    var sign = hours < 0 ? "-" : "+";
    var offset = "" + sign + ("" + Math.abs(hours)).padStart(2, "0") + ":" + ("" + fraction).padEnd(2, "0");
    return parsed.toISOString().slice(0, -5) + offset;
};
var validateMailchimpQuery = function (type, query) {
    var count = query.count, fields = query.fields, since = query.since, sort = query.sort, status = query.status;
    var validated = {};
    if (count !== undefined) {
        validated.count = count > 1e3 ? 1e3 : count < 10 ? 10 : count;
    }
    if (sort !== undefined) {
        var _a = query.sort, _b = _a === void 0 ? {} : _a, field = _b.field, _c = _b.direction, direction = _c === void 0 ? "DESC" : _c;
        var directions = ["ASC", "DESC"];
        var fields_1 = new Map([
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
        var ucased = direction.toUpperCase();
        validated.sort_dir = directions.includes(ucased) ? ucased : "DESC";
        var fieldMap = fields_1.get(type);
        if (fieldMap && field)
            validated.sort_field = fieldMap[field] || Object.values(fieldMap)[0];
    }
    if (status !== undefined && status !== "any") {
        var validStatuses = new Set([
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
        var _d = query.fields, _e = (_d === void 0 ? {} : _d).exclude, exclude = _e === void 0 ? [] : _e;
        validated.exclude_fields = exclude.map(function (ex) { return type + "." + ex; });
    }
    return deepCopy(__assign({ source: query, skip: ["fields", "sort", "status"] }, validated));
};
var toMD5lowercase = function (email) {
    var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, email.toLowerCase(), Utilities.Charset.UTF_8);
    return digest
        .map(function (b) { return (b < 0 ? b + 256 : b).toString(16).padStart(2, "0"); })
        .join("");
};
var chunkify = function (source, _a) {
    var _b = _a === void 0 ? {} : _a, _c = _b.limits, limits = _c === void 0 ? [] : _c, size = _b.size;
    var output = [];
    if (size) {
        var length_1 = source.length;
        var maxNumChunks = Math.ceil((length_1 || 1) / size);
        var numChunksLeft = maxNumChunks;
        while (numChunksLeft) {
            var chunksProcessed = maxNumChunks - numChunksLeft;
            var elemsProcessed = chunksProcessed * size;
            output.push(source.slice(elemsProcessed, elemsProcessed + size));
            numChunksLeft--;
        }
        return output;
    }
    var length = limits.length;
    if (!length)
        return [__spreadArrays(source)];
    var lastSlicedElem = 0;
    limits.forEach(function (limit, i) {
        var limitPosition = lastSlicedElem + limit;
        output[i] = source.slice(lastSlicedElem, limitPosition);
        lastSlicedElem = limitPosition;
    });
    var lastChunk = source.slice(lastSlicedElem);
    lastChunk.length && output.push(lastChunk);
    return output;
};
var processRequests = function (_a) {
    var paramsList = _a.paramsList, successOn = _a.successOn, failureOn = _a.failureOn;
    var commonParams = { muteHttpExceptions: true };
    var requests = paramsList.map(function (params) { return (__assign(__assign({}, commonParams), params)); });
    var responses = UrlFetchApp.fetchAll(requests);
    return responses.every(function (response) {
        return FetchApp.isSuccess({ response: response, successOn: successOn, failureOn: failureOn });
    });
};
var addWebhook = function (_a) {
    var _b = _a.settings, settings = _b === void 0 ? getSettings() : _b, listId = _a.listId;
    throw new Error("method not implemented yet, sorry");
};
