"use strict";
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
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
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
        var _j = __read(UrlFetchApp.fetchAll(requests), 1), response = _j[0];
        var status = FetchApp.isSuccess({ response: response });
        if (!status)
            return [];
        var _k = FetchApp.extractJSON({
            response: response,
        }).lists, lists = _k === void 0 ? [] : _k;
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
        var _k = __read(UrlFetchApp.fetchAll(requests), 1), response = _k[0];
        var responseStatus = FetchApp.isSuccess({ response: response });
        if (!responseStatus)
            return [];
        var _l = FetchApp.extractJSON({
            response: response,
        }).members, members = _l === void 0 ? [] : _l;
        return members;
    }
    catch (error) {
        onError(error);
        return [];
    }
};
var getMember = function (_a) {
    var email = _a.email, _b = _a.fields, fields = _b === void 0 ? {
        exclude: [],
    } : _b, listId = _a.listId, _c = _a.settings, settings = _c === void 0 ? getSettings() : _c, since = _a.since, _d = _a.status, status = _d === void 0 ? "any" : _d, _e = _a.onError, onError = _e === void 0 ? console.warn : _e;
    try {
        if (!email)
            throw new Error(CONFIG.errors.members.unknownEmail);
        if (!listId)
            throw new Error(CONFIG.errors.members.unknownList);
        var members = getMembers({
            fields: fields,
            listId: listId,
            email: email,
            settings: settings,
            since: since,
            status: status,
            onError: onError,
        });
        var _f = __read(members, 1), member = _f[0];
        return member || null;
    }
    catch (error) {
        onError(error);
        return null;
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
        var _e = __read(UrlFetchApp.fetchAll(requests), 1), response = _e[0];
        return FetchApp.isSuccess({ response: response, failureOn: [404] });
    }
    catch (error) {
        onError(error);
        return false;
    }
};
var addMember = function (_a) {
    var _b = _a.type, type = _b === void 0 ? "html" : _b, email = _a.email, _c = _a.isVIP, isVIP = _c === void 0 ? false : _c, listId = _a.listId, _d = _a.merges, merges = _d === void 0 ? {} : _d, _e = _a.settings, settings = _e === void 0 ? getSettings() : _e, _f = _a.status, status = _f === void 0 ? "subscribed" : _f, _g = _a.onError, onError = _g === void 0 ? console.warn : _g;
    try {
        if (!email)
            throw new Error(CONFIG.errors.members.unknownEmail);
        var _h = validateMailchimpSettings(settings), api_key = _h.api_key, domain = _h.domain, server = _h.server, version = _h.version;
        var payload = {
            merge_fields: merges,
            email_address: email,
            email_type: type,
            vip: isVIP,
            status: status,
        };
        var config = FetchApp.getConfig({
            domain: domain,
            subdomains: [server, "api"],
            paths: [version, "lists", listId, "members"],
            method: FetchApp.AllowedMethods.POST,
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
var updateMember = function (_a) {
    var _b = _a.type, type = _b === void 0 ? "html" : _b, email = _a.email, _c = _a.isVIP, isVIP = _c === void 0 ? false : _c, listId = _a.listId, _d = _a.merges, merges = _d === void 0 ? {} : _d, _e = _a.settings, settings = _e === void 0 ? getSettings() : _e, _f = _a.status, status = _f === void 0 ? "subscribed" : _f, _g = _a.onError, onError = _g === void 0 ? console.warn : _g, _h = _a.unsafe, unsafe = _h === void 0 ? false : _h;
    try {
        if (!email)
            throw new Error(CONFIG.errors.members.unknownEmail);
        var _j = validateMailchimpSettings(settings), api_key = _j.api_key, domain = _j.domain, server = _j.server, version = _j.version;
        var query = { skip_merge_validation: unsafe };
        var payload = {
            merge_fields: merges,
            email_address: email,
            email_type: type,
            vip: isVIP,
            status: status,
            query: query,
        };
        var config = FetchApp.getConfig({
            domain: domain,
            subdomains: [server, "api"],
            paths: [version, "lists", listId, "members", toMD5lowercase(email)],
            method: FetchApp.AllowedMethods.PATCH,
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
            return chunk.every(function (param) {
                return addMember(__assign(__assign({}, param), { settings: settings, onError: onError, listId: listId }));
            });
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
            method: FetchApp.AllowedMethods.DELETE,
            paths: [version, "lists", listId, "members", hash],
        });
        if (permanent) {
            config.addPaths("actions", "delete-permanent");
            config.method = FetchApp.AllowedMethods.POST;
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
        var _f = __read(UrlFetchApp.fetchAll(requests), 1), response = _f[0];
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
Object.assign(this, {
    addMember: addMember,
    deleteMember: deleteMember,
    getMember: getMember,
    getMembers: getMembers,
    hasMember: hasMember,
    updateMember: updateMember,
});
var overrides = {
    used: false,
    settings: {},
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
    var used = overrides.used, settings = overrides.settings;
    if (used)
        return settings;
    try {
        var property = CONFIG.property;
        var store = PropertiesService.getUserProperties();
        var settings_1 = JSON.parse(store.getProperty(property) || "{}");
        return __assign(__assign({}, defaults), settings_1);
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
        var updated = deepAssign(oldSettings, settings);
        store.setProperty(property, JSON.stringify(updated));
        return true;
    }
    catch (error) {
        console.warn(error);
        return false;
    }
};
var useSettings = function (settings) {
    try {
        deepAssign(overrides.settings, getDefaults(), settings);
        overrides.used = true;
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
Object.assign(this, {
    overrides: overrides,
    getDefaults: getDefaults,
    getSettings: getSettings,
    setSettings: setSettings,
    validateMailchimpSettings: validateMailchimpSettings,
});
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
var union = function (_a) {
    var e_1, _b;
    var target = _a.target, _c = _a.sources, sources = _c === void 0 ? [] : _c;
    var union = __assign({}, target);
    var assignedKeys = {};
    try {
        for (var sources_1 = __values(sources), sources_1_1 = sources_1.next(); !sources_1_1.done; sources_1_1 = sources_1.next()) {
            var source = sources_1_1.value;
            for (var key in source) {
                if (key in assignedKeys || key in union)
                    continue;
                assignedKeys[key] |= 1;
                union[key] = source[key];
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (sources_1_1 && !sources_1_1.done && (_b = sources_1.return)) _b.call(sources_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    return union;
};
var deepCopy = function (_a) {
    var source = _a.source, _b = _a.skip, skip = _b === void 0 ? [] : _b;
    var output = (Array.isArray(source) ? [] : {});
    Object.entries(source).forEach(function (_a) {
        var _b = __read(_a, 2), key = _b[0], val = _b[1];
        if (skip.includes(key))
            return;
        var isObj = typeof val === "object" && val;
        output[key] = isObj ? deepCopy({ source: val, skip: skip }) : val;
    });
    return output;
};
var deepAssign = function (tgt) {
    var src = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        src[_i - 1] = arguments[_i];
    }
    src.forEach(function (source) {
        Object.entries(source).forEach(function (_a) {
            var _b = __read(_a, 2), key = _b[0], val = _b[1];
            var tgtVal = tgt[key];
            if (typeof tgtVal === "object" &&
                tgtVal &&
                typeof val === "object" &&
                val)
                return deepAssign(tgtVal, val);
            tgt[key] = val;
            return;
        });
    });
    return tgt;
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
    var count = query.count, fields = query.fields, since = query.since, sort = query.sort, status = query.status, rest = __rest(query, ["count", "fields", "since", "sort", "status"]);
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
            validated.sort_field =
                fieldMap[field] || Object.values(fieldMap)[0];
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
        var _d = query.fields, _e = _d === void 0 ? {} : _d, _f = _e.exclude, exclude = _f === void 0 ? [] : _f;
        validated.exclude_fields = exclude.map(function (ex) { return type + "." + ex; });
    }
    return __assign(__assign({}, rest), validated);
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
        return [__spreadArray([], __read(source))];
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
