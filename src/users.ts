/**
 * @summary adds a User to Mailchimp
 * @param {Mailchimp.Users.AddUserParams} options
 * @return {boolean}
 */
const addUser = ({
  settings = getSettings(),
}: Mailchimp.Users.AddUserParams): boolean => {
  try {
    throw new Error("method not implemented yet, sorry");

    return true;
  } catch (error) {
    return false;
  }
};
