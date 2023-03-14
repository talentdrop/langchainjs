import { csvParse } from "d3-dsv";

import { TextLoader } from "./text.js";

/**
 * Loads a CSV file into a list of documents.
 * Each document represents one row of the CSV file.
 *
 * When `column` is not specified, each row is converted into a key/value pair
 * with each key/value pair outputted to a new line in the document's pageContent.
 *
 * @example
 * // CSV file:
 * // id,html
 * // 1,<i>Corruption discovered at the core of the Banking Clan!</i>
 * // 2,<i>Corruption discovered at the core of the Banking Clan!</i>
 *
 * const loader = new CSVLoader("path/to/file.csv");
 * const docs = await loader.load();
 *
 * // docs[0].pageContent:
 * // id: 1
 * // html: <i>Corruption discovered at the core of the Banking Clan!</i>
 *
 * When `column` is specified, one document is created for each row, and the
 * value of the specified column is used as the document's pageContent.
 *
 * @example
 * // CSV file:
 * // id,html
 * // 1,<i>Corruption discovered at the core of the Banking Clan!</i>
 * // 2,<i>Corruption discovered at the core of the Banking Clan!</i>
 *
 * const loader = new CSVLoader("path/to/file.csv", "html");
 * const docs = await loader.load();
 *
 * // docs[0].pageContent:
 * // <i>Corruption discovered at the core of the Banking Clan!</i>
 */
export class CSVLoader extends TextLoader {
  constructor(filePath: string, public column?: string) {
    super(filePath);
  }

  protected async parse(raw: string): Promise<string[]> {
    const parsed = csvParse(raw.trim());
    const { column } = this;

    if (column !== undefined) {
      if (!parsed.columns.includes(column)) {
        throw new Error(`Column ${column} not found in CSV file.`);
      }

      // Note TextLoader will raise an exception if the value is null.
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return parsed.map((row) => row[column]!);
    }

    return parsed.map((row) =>
      Object.keys(row)
        .map((key) => `${key.trim()}: ${row[key]?.trim()}`)
        .join("\n")
    );
  }
}
