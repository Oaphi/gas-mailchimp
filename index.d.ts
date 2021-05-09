declare namespace Mailchimp {
  type MAX_CONNECTIONS = 10;
  type MIN_COUNT = 10;
  type MAX_COUNT = 1e3;

  /**
   * @summary required settings for requesting Mailchimp API
   */
  interface MailchimpSettings {
    api_key: string;
    domain: string;
    listName: string;
    server: string;
    version: string;
  }

  namespace Lists {
    type ListSortDirection = "ASC" | "DESC";

    interface APIResponse {
      lists?: List[];
    }

    interface CommonListParams extends CommonParams {
      count?: number;
      fields?: {
        exclude: string[];
      };
      offset?: number;
      sort?: {
        field: string;
        direction: Lists.ListSortDirection;
      };
      before?: string | number | Date;
      since?: string | number | Date;
    }

    interface GetListsParams extends CommonListParams {
      after?: Date;
      before?: Date;
      email?: string;
      name: string;
      settings: MailchimpSettings;
    }

    interface List {
      has_welcome: boolean;
      id: string;
      list_rating: number;
      name: string;
      notify_on_unsubscribe: string;
    }
  }

  interface CommonParams {
    settings?: MailchimpSettings;
    onError?: (err: Error) => void;
  }

  interface RequestProcessingParams {
    paramsList: ({ url: string } & object)[];
    successOn?: number[];
    failureOn?: number[];
  }

  namespace Members {
    type MemberStatus =
      | "subscribed"
      | "unsubscribed"
      | "cleaned"
      | "pending"
      | "transactional"
      | "archived"
      | "any";

    interface CommonMemberParams extends CommonParams {
      listId: string;
      email?: string;
      status: MemberStatus;
    }

    interface MemberManageParams extends CommonMemberParams {
      isVIP?: boolean;
      type?: "html" | "text";
    }

    interface BatchMemberParam extends MemberManageParams {
      email: string;
      status: MemberStatus;
    }

    interface BatchMemberParams extends CommonParams {
      members: BatchMemberParam[];
      listId: string;
    }

    interface MemberDeleteParams extends CommonMemberParams {
      permanent?: boolean;
    }

    interface MemberListParams
      extends Lists.CommonListParams,
        CommonMemberParams {}

    interface Member {
      id: string;
      email_address: string;
      email_client: string;
      status: MemberStatus;
      timestamp_signup: string;
    }
  }

  namespace Users {
    interface CommonUserParams extends CommonParams {}

    interface AddUserParams extends CommonUserParams {}

    interface User {}
  }

  namespace Webhooks {
    interface CommonWebhookParams extends CommonParams {
      listId: string;
      settings?: MailchimpSettings;
    }

    interface Webhook {}
  }

  /**
   * @summary service wrapping Mailchimp API requests
   */
  namespace MailchimpApp {
    /**
     * @summary gets Mailchimp API settings
     */
    interface getSettings {
      (): MailchimpSettings;
    }

    /**
     * @summary updates Mailchimp API settings
     */
    interface setSettings {
      (settings: MailchimpSettings): boolean;
    }

    /**
     * @summary lists Members from a list
     */
    interface getMembers {
      (params: Mailchimp.Members.MemberListParams): Mailchimp.Members.Member[];
    }

    /**
     * @summary adds a Member to subscribers list
     */
    interface addMember {
      (params: Mailchimp.Members.MemberManageParams): boolean;
    }

    interface addMembers {
      (params: Mailchimp.Members.BatchMemberParams): boolean;
    }
  }

  interface MailchimpApp {
    MAX_CONNECTIONS: MAX_CONNECTIONS;
    MIN_COUNT: MIN_COUNT;
    MAX_COUNT: MAX_COUNT;
    addMember: MailchimpApp.addMember;
    addMembers: MailchimpApp.addMembers;
    getMembers: MailchimpApp.getMembers;
    getSettings: MailchimpApp.getSettings;
    setSettings: MailchimpApp.setSettings;
  }
}

declare const MailchimpApp: Mailchimp.MailchimpApp;
