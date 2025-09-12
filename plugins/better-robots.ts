import { merge } from "lume/core/utils/object.ts";

import type Site from "lume/core/site.ts";

type optArr<T> = T | T[];

type Rule = Partial<{
    /** User-agent */
    userAgent: optArr<string>;
    /** Crawl-delay */
    crawlDelay?: string;
    /** Disallow */
    disallow: optArr<string>;
    /** Disavow */
    disavow: string; // no idea what that is tbh :p
    /** Allow */
    allow: optArr<string>;
    /** Host */
    host: string;
    /** Sitemap */
    sitemap: string;
    /** Clean-param */
    cleanParam: string;
}>;

const ruleSort = [
    "userAgent",
    "crawlDelay",
    "disallow",
    "disavow",
    "allow",
    "host",
    "sitemap",
    "cleanParam",
];

export interface Options {
    /** The robots.txt file name */
    filename: string;

    /** User-agent to allow */
    allow?: optArr<string>;

    /** User-agent to disallow */
    disallow?: optArr<string>;

    /** Custom rules */
    rules?: Rule[];
}

export const defaults: Options = {
    filename: "/robots.txt",
    allow: "*",
};

export function brobots(userOptions?: Partial<Options>) {
    const options: Options = merge(defaults, userOptions);
    return (site: Site) => {
        site.process(async function () {
            const rules: Rule[] = [];
            const allow = typeof options.allow === "string"
                ? [options.allow]
                : options.allow;
            const disallow = typeof options.disallow === "string"
                ? [options.disallow]
                : options.disallow;

            [allow, disallow].forEach((_llow, i) => {
                _llow?.forEach((userAgent) => {
                    rules.push({
                        userAgent,
                        [["allow", "disallow"][i]]: "/",
                    });
                });
            });

            rules.push(...options.rules ?? []);

            const robotFile = await site.getOrCreatePage(options.filename);
            let rawContent = robotFile.content
            if (rawContent && typeof rawContent === "object") {
                rawContent = new TextDecoder().decode(rawContent);
            }
            const existingContent = rawContent ? `${rawContent}` : "";

            const robotify = (key: string) =>
                `${key.charAt(0).toUpperCase()}${key.slice(1).replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()
                }`;

            const newContent = rules.map((rule) =>
                Object.entries(rule).sort(([keyA], [KeyB]) =>
                    ruleSort.indexOf(keyA) - ruleSort.indexOf(KeyB)
                ).map(([k, value]) => {
                    const key = robotify(k);
                    if (typeof value === "object") {
                        // UserAgent Array
                        return value.map((val) => `${key}: ${val}`).join("\n");
                    } else {
                        // anything else
                        return `${key}: ${value}`;
                    }
                }).join("\n")
            ).join("\n\n");

            robotFile.content = newContent +"\n\n"+ existingContent;
        });
    };
}

export default brobots;
