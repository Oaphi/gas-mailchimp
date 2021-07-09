import { readFile } from "fs/promises";
import { transpile, TranspileOptions } from "typescript";
import { createContext, runInContext } from "vm";

describe("MailchimpApp", () => {
    describe("E2E test", () => {
        before(async () => {
            const [utils, members, tsconf] = await Promise.all(
                ["./src/utils.ts", "./src/members.ts", "./tsconfig.json"].map(
                    (p) => readFile(p, { encoding: "utf-8" })
                )
            );

            const { compilerOptions }: TranspileOptions = JSON.parse(tsconf);

            const jsConf = transpile(members, compilerOptions);
            const jsUtil = transpile(utils, compilerOptions);

            const ctxt = createContext({});
            runInContext(jsUtil, ctxt);
            runInContext(jsConf, ctxt);

            // Object.assign(this, { MailchimpApp: ctxt });
        });

        it.skip("", () => {
            //    const settings = getSettings();
            //    const { listName } = settings;
            //    const exclude = ["_links"];
            //    const [{ id: listId }] = getLists({
            //        settings,
            //        name: listName,
            //        fields: { exclude },
            //    });
            //    const members = getMembers({
            //        settings,
            //        listId,
            //        fields: { exclude },
            //    });
            //    const email = "example@gmail.com";
            //    const created = addMember({
            //        email,
            //        isVIP: true,
            //        listId,
            //        settings,
            //        status: "subscribed",
            //        type: "text",
            //    });
            //    const deleted = deleteMember({
            //        email,
            //        listId,
            //        settings,
            //        permanent: true,
            //    });
            //    console.log({ deleted, created });
        });
    });
});
