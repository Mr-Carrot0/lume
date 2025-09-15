import { merge } from "../core/utils/object.ts";

import type Site from "../core/site.ts";

type Rule = Partial<{
  /** User-agent */
  userAgent: string | string[];
  /** Crawl-delay */
  crawlDelay: string;
  /** Disallow */
  disallow: string | string[];
  /** Disavow */
  disavow: string; // no idea what that is tbh :p
  /** Allow */
  allow: string | string[];
  /** Host */
  host: string;
  /** Sitemap */
  sitemap: string;
  /**
   * Clean-param
   * @see https://yandex.com/support/webmaster/en/robot-workings/clean-param
   */
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
  allow?: string | string[];

  /** User-agent to disallow */
  disallow?: string | string[];

  /** Custom rules */
  rules?: Rule[];
}

export const defaults: Options = {
  filename: "/robots.txt",
  allow: "*",
};

/**
 * A plugin to generate a robots.txt after build
 * @see https://lume.land/plugins/robots/
 */
export function robots(userOptions?: Partial<Options>) {
  const options: Options = merge(defaults, userOptions);
  return (site: Site) => {
    site.process(async function () {
      const rules: Rule[] = [];

      // There's a lot of repetition in the original. idk if this improves anything 
      [options.allow, options.disallow]
        .map((value) => typeof value === "string" ? [value] : value)
        .forEach((_llow, i) => {
          _llow?.forEach((userAgent) => {
            rules.push({ userAgent, [["allow", "disallow"][i]]: "/" });
          });
        });

      // const allow = typeof options.allow === "string"
      //   ? [options.allow]
      //   : options.allow;
      // const disallow = typeof options.disallow === "string"
      //   ? [options.disallow]
      //   : options.disallow;

      // allow?.forEach((userAgent) =>
      //   rules.push({
      //     userAgent,
      //     allow: "/",
      //   })
      // );

      // disallow?.forEach((userAgent) =>
      //   rules.push({
      //     userAgent,
      //     disallow: "/",
      //   })
      // );

      rules.push(...options.rules ?? []);

      // Create the robots.txt page
      const robotFile = await site.getOrCreatePage(options.filename);

      // sometimes content returned an Unit8Array
      let rawContent = robotFile.content;
      if (rawContent && typeof rawContent === "object") {
        rawContent = new TextDecoder().decode(rawContent);
      }
      const existingContent = rawContent ? `${rawContent}` : "";

      const robotKey = (key: string) =>
        `${key.charAt(0).toUpperCase()}${
          key.slice(1)
            .replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()
        }`;

      const newContent = rules.map((rule) =>
        Object.entries(rule).sort(([keyA], [KeyB]) =>
          ruleSort.indexOf(keyA) - ruleSort.indexOf(KeyB)
        ).map(([k, value]) => {
          const key = robotKey(k);
          if (typeof value === "object") {
            // typeof value === UserAgent[]
            return value.map((val) => `${key}: ${val}`).join("\n");
          } else {
            // anything else
            return `${key}: ${value}`;
          }
        }).join("\n")
      ).join("\n\n");

      robotFile.content = newContent + "\n\n" + existingContent;
    });
  };
}

export default robots;
