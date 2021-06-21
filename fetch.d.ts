declare namespace Fetch {
    namespace Enums {
        enum ContentTypes {
            FORM = "application/x-www-form-urlencoded",
            JSON = "application/json",
            TEXT = "text/plain",
        }
        enum RedirectTypes {
            FOLLOW = "follow",
            MANUAL = "manual",
        }
        enum AllowedMethods {
            GET = "GET",
            PATCH = "PATCH",
            POST = "POST",
            PUT = "PUT",
            DELETE = "DELETE",
            OPTIONS = "OPTIONS",
        }
    }

    interface FetchSettings {
        contentType?: string;
        domain: string;
        method?: Enums.AllowedMethods;
        mute?: boolean;
        redirect?: Enums.RedirectTypes;
        paths?: string[];
        payload?: object;
        subdomains?: string[];
        token?: string;
        query?: object;
    }

    interface JSONmapper {
        headers?: string;
        method?: string;
        redirect?: string;
        url?: string;
        [x: string]: string | undefined;
    }

    class FetchConfigurer {
        readonly base: string;
        readonly domain: string;
        readonly headers: object;
        readonly path: string;
        readonly paths: string[];
        readonly search: string;
        readonly subdomains: string[];
        readonly url: string;

        method: Enums.AllowedMethods;
        payload: string | object | null;
        type: string;

        addHeader(name: string, value: string): FetchConfigurer;
        addParam(name: string, value: any): FetchConfigurer;
        addPaths(...paths: string[]): FetchConfigurer;
        getJSONPayload(): string;
        getUrlPayload(): string;
        json<T extends JSONmapper>(
            mapper?: T,
            options?: OptionsJSON
        ): Omit<GoogleAppsScript.URL_Fetch.URLFetchRequest, keyof T> &
            {
                [P in T[keyof T]] ?: GoogleAppsScript.URL_Fetch.URLFetchRequest[keyof {
                    [K in keyof T as P extends T[K] ? K : never]: any;
                }];
            };
        json(): GoogleAppsScript.URL_Fetch.URLFetchRequest;
        mute(): FetchConfigurer;
        unmute(): FetchConfigurer;
        removeHeader(name: string): FetchConfigurer;

        /**
         * @summary sets OAuth token to config
         * @description
         *  Upon calling will set "Authorization" header to "Bearer \<token\>"
         */
        setOAuthToken(token?: string): FetchConfigurer;
    }

    type ConfigKey = keyof FetchConfigurer;

    interface OptionsJSON {
        exclude?: Array<ConfigKey>;
        include?: Array<ConfigKey>;
    }

    interface FetchConfig {
        preferences?: Preferences;
        (settings: FetchSettings): FetchConfigurer;
        toQuery?(json: object, options?: Preferences): string;
        union?(tgt: object, ...src: object[]): object;
    }

    interface extractJSON {
        (config: {
            response: GoogleAppsScript.URL_Fetch.HTTPResponse;
            onError?: (err: Error) => any;
        }): object;
    }

    interface getConfig {
        (settings: FetchSettings): FetchConfigurer;
    }

    interface isSuccess {
        (settings: {
            response: GoogleAppsScript.URL_Fetch.HTTPResponse;
            failureOn?: number[];
            successOn?: number[];
            onFailure?: (code: number, content: string) => any;
        }): boolean;
    }

    namespace Preferences {
        type ArrayNotations = "comma" | "bracket" | "empty_bracket";
    }

    interface Preferences {
        arrayNotation?: Preferences.ArrayNotations;
    }

    interface setPreferences {
        (preferences: Preferences): void;
    }

    interface setToQuery {
        (jsonToQueryUtil: (json: object, options?: object) => string): void;
    }

    interface setUnionizer {
        (unionizer: (tgt: object, ...src: object[]) => object): void;
    }

    interface FetchApp {
        AllowedMethods: typeof Enums.AllowedMethods;
        extractJSON: extractJSON;
        getConfig: getConfig;
        isSuccess: isSuccess;
        setPreferences: setPreferences;
        setToQuery: setToQuery;
        setUnionizer: setUnionizer;
    }
}

declare const FetchApp: Fetch.FetchApp;
