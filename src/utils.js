/**
 * @summary makes a union of object
 * @param {object} target 
 * @param  {...object} sources 
 * @returns {object}
 */
const union = (target, ...sources) => {

    const union = Object.assign({}, target);

    const assignedKeys = {};

    for (const source of sources) {
        for (const key in source) {
            if (!assignedKeys[key] && !(key in union)) {
                assignedKeys[key] |= 1;
                union[key] = source[key];
            }
        }
    }

    return union;
};

const deepCopy = ({ source = {}, skip = [] }) => {

    const output = Array.isArray(source) ? [] : {};

    Object.entries(source).forEach(([key, val]) => {

        if (skip.includes(key)) { return; }

        const isObj = typeof val === "object" && val;
        output[key] = isObj ? deepCopy({ source: val, skip }) : val;
    });

    return output;
};

/**
 * @summary converts a date-like value to ISO 8601 timestamp
 * @param {number|string|Date} [date] 
 * @returns {string}
 */
const toISO8601Timestamp = (date = Date.now()) => {
    const parsed = new Date(date);

    const MIN_IN_HOUR = 60;

    const hours = parsed.getTimezoneOffset() / MIN_IN_HOUR;

    const fraction = (hours - Number.parseInt(hours)) * MIN_IN_HOUR;

    const sign = hours < 0 ? "-" : "+";

    const offset = `${sign}${`${Math.abs(hours)}`.padStart(2, "0")}:${`${fraction}`.padEnd(2, "0")}`;

    return parsed.toISOString().slice(0, -5) + offset;
};


/**
 * @summary validates query parameters for the API
 * 
 * @param {("lists"|"members")} type 
 * @param {{ 
 *  count? : number, 
 *  fields : { exclude : string[] }, 
 *  offset? : number,
 *  since? : number | string | Date,
 *  sort?,
 *  status? : Mailchimp.Members.MemberStatus
 * }} query 
 * 
 * @returns {object}
 */
const validateMailchimpQuery = (type, query = {}) => {

    const { count, fields, since, sort, status } = query;

    const validated = {};

    if (count !== undefined) {
        validated.count = count > 1e3 ? 1e3 : count < 10 ? 10 : count;
    }

    if (sort !== undefined) {
        const { sort: { field, direction } } = query;

        const directions = ["ASC", "DESC"];

        const fields = new Map([
            ["members", {
                opted: "timestamp_opt",
                signup: "timestamp_signup",
                changed: "last_changed"
            }],
            ["lists", {
                created: "date_created"
            }]
        ]);

        const ucased = direction.toUpperCase();

        validated.sort_dir = directions.includes(ucased) ? ucased : "DESC";

        const fieldMap = fields.get(type);

        validated.sort_field = fieldMap[field] || Object.values(fieldMap)[0];
    }

    if (status !== undefined && status !== "any") {
        const validStatuses = new Set([
            "subscribed", "unsubscribed", "cleaned",
            "pending", "transactional", "archived"
        ]);

        validStatuses.has(status) && (validated.status = status);
    }

    if (since !== undefined) {
        validated.since_timestamp_opt = toISO8601Timestamp(since);
    }

    if (fields !== undefined) {
        const { fields: { exclude = [] } } = query;

        validated.exclude_fields = exclude.map(ex => `${type}.${ex}`);
    }

    const queryCopy = deepCopy({ 
        source: query, 
        skip: ["fields", "sort", "status"] 
    });

    return Object.assign({}, queryCopy, validated);
};

/**
 * @summary converts to hash accepted by Mailchimpt API
 * @param {string} email 
 * @returns {string}
 */
const toMD5lowercase = (email) => {

    const digest = Utilities.computeDigest(
        Utilities.DigestAlgorithm.MD5,
        email.toLowerCase(),
        Utilities.Charset.UTF_8
    );

    return digest.map((b) => (b < 0 ? b + 256 : b).toString(16).padStart(2, "0")).join("");
};

/**
 * @typedef {object} ChunkifyConfig
 * @property {number} [size]
 * @property {number[]} [limits]
 * 
 * @summary splits an array into chunks
 * @param {any[]} source 
 * @param {ChunkifyConfig}
 * @returns {any[][]}
 */
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

    if (!length) {
        return [Object.assign([], source)];
    }

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

const processRequests = ({ paramsList, successOn, failureOn }) => {

    const commonParams = { muteHttpExceptions: true };

    const requests = paramsList.map(
        params => Object.assign({}, commonParams, params)
    );

    const responses = UrlFetchApp.fetchAll(requests);

    return responses.every(
        response => FetchApp.isSuccess({ response, successOn, failureOn })
    );
};