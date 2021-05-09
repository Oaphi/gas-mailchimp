declare namespace Fetch {
  namespace Enums {
    enum ContentTypes {
      FORM = "application/x-www-form-urlencoded",
      JSON = "application/json",
      TEXT = "text/plain",
    }
    enum FetchMethods {
      GET = "GET",
      POST = "POST",
      PUT = "PUT",
      DELETE = "DELETE",
      OPTIONS = "OPTIONS",
    }
  }

  const enum ContentTypes {
    FORM = Fetch.Enums.ContentTypes.FORM,
    JSON = Fetch.Enums.ContentTypes.JSON,
    TEXT = Fetch.Enums.ContentTypes.TEXT,
  }

  const enum FetchMethods {
    GET = Fetch.Enums.FetchMethods.GET,
    POST = Fetch.Enums.FetchMethods.POST,
    PUT = Fetch.Enums.FetchMethods.PUT,
    DELETE = Fetch.Enums.FetchMethods.DELETE,
    OPTIONS = Fetch.Enums.FetchMethods.OPTIONS,
  }

  interface JSONmapper {
    headers?: string;
    method?: string;
    redirect?: string;
    url?: string;
  }

  interface FetchSettings {
    contentType?: string;
    domain: string;
    method?: keyof typeof FetchMethods;
    redirect?: boolean;
    paths?: string[];
    payload?: object;
    subdomains?: string[];
    query?: object;
  }

  interface FetchConfigurer {
    readonly base: string;
    readonly domain: string;
    readonly path: string;
    readonly paths: string[];
    readonly search: string;
    readonly subdomains: string[];
    readonly url: string;

    method: string;
    payload?: string | object;
    type: string;

    addHeader(name: string, value: string): FetchConfigurer;
    addParam(name: string, value: any): FetchConfigurer;
    addPaths(...paths: string[]): FetchConfigurer;
    getJSONPayload(): string;
    getUrlPayload(): string;
    json(mapper?: JSONmapper, options?: OptionsJSON): any;
    removeHeader(name: string): FetchConfigurer;
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

  type CommonOptions = {
    onError?: (err: Error) => any;
  };

  type extractJSONOptions = CommonOptions & {
    response: GoogleAppsScript.URL_Fetch.HTTPResponse;
  };

  type extractJSON<T extends object = object> = (
    config: extractJSONOptions
  ) => T;

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
    extractJSON: extractJSON;
    getConfig: getConfig;
    isSuccess: isSuccess;
    setPreferences: setPreferences;
    setToQuery: setToQuery;
    setUnionizer: setUnionizer;
  }
}

declare const FetchApp: Fetch.FetchApp;
