# About

This is a client library for Google Apps Script for interacting with [Mailchimp API](https://mailchimp.com/developer/marketing/api/list-members/list-members-info/)

# Installing

Add the library to your project with the following sript ID:

> 1VoL3BQ-cJyqYAul4wFwbJGjBCgmhnKCvkLFCKY7Q1pPWEiMwdLQ88bFa

# Using

By default, the library exposes a `MailchimpApp` global variable with the following list of methods:

## Settings

The library uses a settings object of the following structure:

```typescript
interface MailchimpSettings {
    api_key: string;
    domain: string;
    listName: string;
    server: string;
    version: string;
}
```

Settings can be retrieved and updated via the following methods:

| Method        | Description                         | Accepts             | Returns             |
| ------------- | ----------------------------------- | ------------------- | ------------------- |
| `getDefaults` | Gets default library settings       | -                   | `MailchimpSettings` |
| `getSettings` | Gets the current settings           | -                   | `MailchimpSettings` |
| `setSettings` | Sets settings (via partial updates) | `MailchimpSettings` | `boolean`           |
| `useSettings` | Overrides settings completely       | `MailchimpSettings` | `boolean`           |

## Lists

| Method     | Description                                      | Returns  |
| ---------- | ------------------------------------------------ | -------- |
| `getLists` | Gets a list of `List` objects (subscriber lists) | `List[]` |

## Members

| Method         | Description                                        | Returns          |
| -------------- | -------------------------------------------------- | ---------------- |
| `addMember`    | Adds a new `Member` to a subscriber list           | `boolean`        |
| `deleteMember` | Deletes a `Member` from a subscriber list          | `boolean`        |
| `getMember`    | Gets a `Member` from a subscriber list             | `Member \| null` |
| `getMembers`   | Gets a list of `Member` objects by list ID         | `Member[]`       |
| `hasMember`    | Checks if there is a `Member` with a given `email` | `boolean`        |

## Batch methods

Some actions can be batched - the library exposes the following batch methods:

| Method       | Description                    | Returns   |
| ------------ | ------------------------------ | --------- |
| `addMembers` | Adds several `Member`s at once | `boolean` |
