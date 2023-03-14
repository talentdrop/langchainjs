import { BaseOutputParser } from "./base.js";

export type SerializedCommaSeparatedListOutputParser = {
  _type: "comma_separated_list";
};
/**
 * Class to parse the output of an LLM call to a list.
 * @augments BaseOutputParser
 */
export abstract class ListOutputParser extends BaseOutputParser {
  abstract parse(text: string): string[];
}

/**
 * Class to parse the output of an LLM call as a comma-separated list.
 * @augments ListOutputParser
 */
export class CommaSeparatedListOutputParser extends ListOutputParser {
  parse(text: string): string[] {
    return text
      .trim()
      .split(",")
      .map((s) => s.trim());
  }

  getFormatInstructions(): string {
    return `Your response should be a list of comma separated values, eg: \`foo, bar, baz\``;
  }

  serialize(): SerializedCommaSeparatedListOutputParser {
    return {
      _type: "comma_separated_list",
    };
  }

  static async deserialize(
    _: SerializedCommaSeparatedListOutputParser
  ): Promise<CommaSeparatedListOutputParser> {
    return new CommaSeparatedListOutputParser();
  }
}
