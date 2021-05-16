const testAll_ = () => {
  const settings = getSettings();

  const { listName } = settings;

  const exclude = ["_links"];

  const [{ id: listId }] = getLists({
    settings,
    name: listName,
    fields: { exclude },
  });

  const members = getMembers({ settings, listId, fields: { exclude } });

  const email = "example@gmail.com";

  const created = addMember({
    email,
    isVIP: true,
    listId,
    settings,
    status: "subscribed",
    type: "text",
  });

  const deleted = deleteMember({
    email,
    listId,
    settings,
    permanent: true,
  });

  console.log({ deleted, created });
};
