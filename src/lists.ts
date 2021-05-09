/**
 * @summary Gets subscriber Lists
 * @param {Mailchimp.Lists.GetListsParams} options
 * @return {Mailchimp.Lists.List[]}
 */
const getLists = ({
  count = 10,
  email,
  fields = {
    exclude: [],
  },
  name,
  offset = 0,
  settings = getSettings(),
  sort = {
    field: "created",
    direction: "DESC",
  },
  onError = console.warn,
}: Mailchimp.Lists.GetListsParams): Mailchimp.Lists.List[] => {
  try {
    const { api_key, domain, server, version } = validateMailchimpSettings(
      settings
    );

    const query: object & { email?: string } = validateMailchimpQuery("lists", {
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

    const status = FetchApp.isSuccess({ response });

    if (!status) return [];

    const { lists = [] }: Mailchimp.Lists.APIResponse = FetchApp.extractJSON({
      response,
    });

    return lists.filter(({ name: listName }) =>
      name ? listName === name : true
    );
  } catch (error) {
    onError(error);
    return [];
  }
};
