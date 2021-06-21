/**
 * @summary gets a list of members from subscriber list
 * @param {Mailchimp.Members.MemberListParams} options
 * @return {Mailchimp.Members.Member[]}
 */
const getMembers = ({
    count = 10,
    fields = {
        exclude: [],
    },
    listId,
    offset = 0,
    settings = getSettings(),
    sort = {
        field: "created",
        direction: "DESC",
    },
    since,
    status = "any",
    onError = console.warn,
}: Mailchimp.Members.MemberListParams): Mailchimp.Members.Member[] => {
    try {
        if (!listId) throw new Error(CONFIG.errors.members.unknownList);

        const { api_key, domain, server, version } =
            validateMailchimpSettings(settings);

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

        const params = config.json(
            {
                redirect: "followRedirects",
            },
            {
                include: ["url", "headers"],
            }
        );

        const requests = [{ muteHttpExceptions: true, ...params }];

        const [response] = UrlFetchApp.fetchAll(requests);

        const responseStatus = FetchApp.isSuccess({ response });

        if (!responseStatus) return [];

        const { members = [] }: Mailchimp.Members.APIResponse =
            FetchApp.extractJSON({
                response,
            });

        return members;
    } catch (error) {
        onError(error);
        return [];
    }
};

/**
 * @summary gets a member from subscriber list
 * @return {Mailchimp.Members.Member|null}
 */
const getMember = ({
    email,
    fields = {
        exclude: [],
    },
    listId,
    settings = getSettings(),
    since,
    status = "any",
    onError = console.warn,
}: Mailchimp.Members.MemberGetParams): Mailchimp.Members.Member | null => {
    try {
        if (!email) throw new Error(CONFIG.errors.members.unknownEmail);
        if (!listId) throw new Error(CONFIG.errors.members.unknownList);

        const members = getMembers({
            fields,
            listId,
            email,
            settings,
            since,
            status,
            onError,
        });

        const [member] = members;
        return member || null;
    } catch (error) {
        onError(error);
        return null;
    }
};

/**
 * @summary checks if a Member is in subscribers list
 * @param {Mailchimp.Members.CommonMemberParams} options
 * @return {boolean}
 */
const hasMember = ({
    email,
    listId,
    settings = getSettings(),
    onError = console.warn,
}: Mailchimp.Members.CommonMemberParams): boolean => {
    try {
        if (!listId) throw new Error(CONFIG.errors.members.unknownList);
        if (!email) throw new Error(CONFIG.errors.members.unknownEmail);

        const { api_key, domain, server, version } =
            validateMailchimpSettings(settings);

        const config = FetchApp.getConfig({
            domain,
            subdomains: [server, "api"],
            paths: [version, "lists", listId, "members", toMD5lowercase(email)],
        });

        config.addHeader("Authorization", `Basic ${api_key}`);

        const params = config.json(
            {
                redirect: "followRedirects",
            },
            {
                include: ["url", "headers"],
            }
        );

        const requests = [
            {
                muteHttpExceptions: true,
                ...params,
            },
        ];

        const [response] = UrlFetchApp.fetchAll(requests);

        return FetchApp.isSuccess({ response, failureOn: [404] });
    } catch (error) {
        onError(error);
        return false;
    }
};

/**
 * @summary Adds a Member to subscriber list
 * @param {Mailchimp.Members.AddMemberParams} options
 * @return {boolean}
 */
const addMember: Mailchimp.MailchimpApp["addMember"] = ({
    type = "html",
    email,
    isVIP = false,
    listId,
    merges = {},
    settings = getSettings(),
    status = "subscribed",
    onError = console.warn,
}) => {
    try {
        if (!email) throw new Error(CONFIG.errors.members.unknownEmail);

        const { api_key, domain, server, version } =
            validateMailchimpSettings(settings);

        const payload = {
            merge_fields: merges,
            email_address: email,
            email_type: type,
            vip: isVIP,
            status,
        };

        const config = FetchApp.getConfig({
            domain,
            subdomains: [server, "api"],
            paths: [version, "lists", listId, "members"],
            method: FetchApp.AllowedMethods.POST,
            payload,
        });

        config.addHeader("Authorization", `Basic ${api_key}`);

        const params = config.json(
            {
                redirect: "followRedirects",
            },
            {
                include: ["url", "headers", "method", "payload"],
            }
        );

        return processRequests({
            paramsList: [params],
        });
    } catch (error) {
        onError(error);
        return false;
    }
};

const updateMember: Mailchimp.MailchimpApp["updateMember"] = ({
    type = "html",
    email,
    isVIP = false,
    listId,
    merges = {},
    settings = getSettings(),
    status = "subscribed",
    onError = console.warn,
    unsafe = false,
}) => {
    try {
        if (!email) throw new Error(CONFIG.errors.members.unknownEmail);

        const { api_key, domain, server, version } =
            validateMailchimpSettings(settings);

        const query = { skip_merge_validation: unsafe };

        const payload = {
            merge_fields: merges,
            email_address: email,
            email_type: type,
            // language: "en",
            vip: isVIP,
            status,
            query,
        };

        const config = FetchApp.getConfig({
            domain,
            subdomains: [server, "api"],
            paths: [version, "lists", listId, "members"],
            method: FetchApp.AllowedMethods.PATCH,
            payload,
        });

        config.addHeader("Authorization", `Basic ${api_key}`);

        const params = config.json(
            {
                redirect: "followRedirects",
            },
            {
                include: ["url", "headers", "method", "payload"],
            }
        );

        return processRequests({
            paramsList: [params],
        });
    } catch (error) {
        onError(error);
        return false;
    }
};

/**
 * @summary Batch adds members to subscriber list
 * @param {Mailchimp.Members.AddMemberParams} options
 * @return {boolean}
 */
const addMembers: Mailchimp.MailchimpApp["addMembers"] = ({
    listId,
    members,
    onError = console.warn,
    settings,
}) => {
    try {
        const {
            limits: {
                connections: { concurrent },
            },
        } = CONFIG;

        const paramChunks: Mailchimp.Members.BatchMemberParam[][] = chunkify(
            members,
            { size: concurrent }
        );

        //TODO: check if we can use batch endpoints
        return paramChunks.every((chunk) =>
            chunk.every((param) =>
                addMember({ ...param, settings, onError, listId })
            )
        );
    } catch (error) {
        onError(error);
        return false;
    }
};

/**
 * @summary deletes a Member from subscribers list
 * @param {Mailchimp.Members.MemberDeleteParams} options
 * @return {boolean}
 */
const deleteMember = ({
    email,
    listId,
    permanent = false,
    settings = getSettings(),
    onError = console.warn,
}: Mailchimp.Members.MemberDeleteParams): boolean => {
    try {
        if (!email) throw new Error(CONFIG.errors.members.unknownEmail);

        const { api_key, domain, server, version } =
            validateMailchimpSettings(settings);

        const hash = toMD5lowercase(email);

        const config = FetchApp.getConfig({
            domain,
            subdomains: [server, "api"],
            method: FetchApp.AllowedMethods.DELETE,
            paths: [version, "lists", listId, "members", hash],
        });

        if (permanent) {
            config.addPaths("actions", "delete-permanent");
            config.method = FetchApp.AllowedMethods.POST;
        }

        config.addHeader("Authorization", `Basic ${api_key}`);

        const params = config.json(
            {
                redirect: "followRedirects",
            },
            {
                include: ["url", "headers", "method"],
            }
        );

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
    } catch (error) {
        onError(error);
        return false;
    }
};
