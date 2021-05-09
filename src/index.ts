const CONFIG = {
    domain: "mailchimp.com",
    version: "3.0",
    property: "mailchimp_settings",
    errors: {
        lists: {

        },
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
        lists : {
            members : 1e3,
        },
        connections : {
            concurrent : 10
        }
    }
};

Object.defineProperty(this, "MAX_COUNT", {
    enumerable : true,
    configurable : false,
    writable : false,
    value : CONFIG.limits.lists.members
});