type ObjectUnionOptions = {
    target: object;
    sources?: { [x: string]: unknown }[];
};

/**
 * @summary makes a union of object
 */
const union = ({ target, sources = [] }: ObjectUnionOptions) => {
    const union: Record<string, unknown> = { ...target };

    const assignedKeys: { [x: string]: number } = {};

    for (const source of sources) {
        for (const key in source) {
            if (key in assignedKeys || key in union) continue;
            assignedKeys[key] |= 1;
            union[key] = source[key];
        }
    }

    return union;
};

type DeepCopyOptions<T extends object> = {
    skip?: string[];
    source: T;
};

/**
 * @summary performs a deep copy of an object
 */
const deepCopy = <T extends Record<string, unknown> | unknown[]>({
    source,
    skip = [],
}: DeepCopyOptions<T>): T => {
    const output = (Array.isArray(source) ? [] : {}) as T;

    Object.entries(source).forEach(([key, val]) => {
        if (skip.includes(key)) return;

        const isObj = typeof val === "object" && val;
        //@ts-expect-error
        output[key] = isObj ? deepCopy({ source: val as T, skip }) : val;
    });

    return output;
};

/**
 * @summary performs a deep assign on an object
 */
const deepAssign = <T extends object>(tgt: T, ...src: object[]) => {
    src.forEach((source) => {
        Object.entries(source).forEach(([key, val]) => {
            const tgtVal = tgt[key as keyof T];

            if (
                typeof tgtVal === "object" &&
                tgtVal &&
                typeof val === "object" &&
                val
            )
                return deepAssign(tgtVal as unknown as T, val);

            tgt[key as keyof T] = val;
            return;
        });
    });

    return tgt;
};

/**
 * @summary converts a date-like value to ISO 8601 timestamp
 */
const toISO8601Timestamp = (
    date: number | string | Date = Date.now()
): string => {
    const parsed = new Date(date);

    const MIN_IN_HOUR = 60;

    const hours = parsed.getTimezoneOffset() / MIN_IN_HOUR;

    const fraction = (hours - Math.trunc(hours)) * MIN_IN_HOUR;

    const sign = hours < 0 ? "-" : "+";

    const offset = `${sign}${`${Math.abs(hours)}`.padStart(
        2,
        "0"
    )}:${`${fraction}`.padEnd(2, "0")}`;

    return parsed.toISOString().slice(0, -5) + offset;
};

type QueryToValidate = {
    count?: number;
    fields?: { exclude: string[] };
    offset?: number;
    since?: number | string | Date;
    sort?: { field: string; direction: Mailchimp.Lists.ListSortDirection };
    status?: Mailchimp.Members.MemberStatus;
};

type MailchimpQuery = {
    count?: number;
    sort_dir?: Mailchimp.Lists.ListSortDirection;
    sort_field?: string;
    status?: Mailchimp.Members.MemberStatus;
    since_timestamp_opt?: string;
    exclude_fields?: string[];
};

/**
 * @summary validates query parameters for the API
 */
const validateMailchimpQuery = (
    type: "lists" | "members",
    query: {
        count?: number;
        fields?: { exclude: string[] };
        offset?: number;
        since?: number | string | Date;
        sort?: { field: string; direction: "ASC" | "DESC" };
        status?: Mailchimp.Members.MemberStatus;
    }
): MailchimpQuery => {
    const { count, fields, since, sort, status } = query;

    const validated: MailchimpQuery = {};

    if (count !== undefined) {
        validated.count = count > 1e3 ? 1e3 : count < 10 ? 10 : count;
    }

    if (sort !== undefined) {
        const { sort: { field, direction = "DESC" } = {} } = query;

        const directions = ["ASC", "DESC"];

        const fields: Map<
            "members" | "lists",
            { [x: string]: string | undefined }
        > = new Map([
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

        const ucased =
            direction.toUpperCase() as Mailchimp.Lists.ListSortDirection;

        validated.sort_dir = directions.includes(ucased) ? ucased : "DESC";

        const fieldMap = fields.get(type);

        if (fieldMap && field)
            validated.sort_field =
                fieldMap[field] || Object.values(fieldMap)[0];
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
        ...validated,
    });
};

/**
 * @summary converts to hash accepted by Mailchimpt API
 */
const toMD5lowercase = (email: string): string => {
    const digest = Utilities.computeDigest(
        Utilities.DigestAlgorithm.MD5,
        email.toLowerCase(),
        Utilities.Charset.UTF_8
    );

    return digest
        .map((b) => (b < 0 ? b + 256 : b).toString(16).padStart(2, "0"))
        .join("");
};

type ChunkifyConfig = { size?: number; limits?: number[] };

/**
 * @summary splits an array into chunks
 */
const chunkify = <T extends unknown[]>(
    source: T,
    { limits = [], size }: ChunkifyConfig = {}
): T[] => {
    const output: T[] = [];

    if (size) {
        const { length } = source;

        const maxNumChunks = Math.ceil((length || 1) / size);
        let numChunksLeft = maxNumChunks;

        while (numChunksLeft) {
            const chunksProcessed = maxNumChunks - numChunksLeft;
            const elemsProcessed = chunksProcessed * size;
            output.push(
                source.slice(elemsProcessed, elemsProcessed + size) as T
            );
            numChunksLeft--;
        }

        return output;
    }

    const { length } = limits;

    if (!length) return [[...source]] as T[];

    let lastSlicedElem = 0;

    limits.forEach((limit, i) => {
        const limitPosition = lastSlicedElem + limit;
        output[i] = source.slice(lastSlicedElem, limitPosition) as T;
        lastSlicedElem = limitPosition;
    });

    const lastChunk = source.slice(lastSlicedElem) as T;
    lastChunk.length && output.push(lastChunk);

    return output;
};

/**
 * @summary Fetches the API and handles the response
 */
const processRequests = ({
    paramsList,
    successOn,
    failureOn,
}: Mailchimp.RequestProcessingParams): boolean => {
    const commonParams = { muteHttpExceptions: true };

    const requests = paramsList.map((params) => ({
        ...commonParams,
        ...params,
    }));

    const responses = UrlFetchApp.fetchAll(requests);

    return responses.every((response) =>
        FetchApp.isSuccess({ response, successOn, failureOn })
    );
};
