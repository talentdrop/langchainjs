import { DEFAULT_SQL_DATABASE_PROMPT } from "./sql_db_prompt.js";
import { BaseChain } from "../base.js";
import { BaseMemory } from "../../memory/index.js";
import { BaseLLM, SerializedLLM } from "../../llms/index.js";
import { LLMChain } from "../llm_chain.js";
import { SqlDatabase } from "../../sql_db.js";
import { resolveConfigFromFile } from "../../util/index.js";
import { SerializedSqlDatabase } from "../../util/sql_utils.js";
import { ChainValues } from "../../schema/index.js";

export type SerializedSqlDatabaseChain = {
  sql_database: SerializedSqlDatabase;
  _type: "sql_database_chain";
  llm: SerializedLLM;
  sql_database_chain_path?: string;
};

export class SqlDatabaseChain extends BaseChain {
  // LLM wrapper to use
  llm: BaseLLM;

  // SQL Database to connect to.
  database: SqlDatabase;

  // Prompt to use to translate natural language to SQL.
  prompt = DEFAULT_SQL_DATABASE_PROMPT;

  // Number of results to return from the query
  topK = 5;

  inputKey = "query";

  outputKey = "result";

  // Whether to return the result of querying the SQL table directly.
  returnDirect = false;

  constructor(fields: {
    llm: BaseLLM;
    database: SqlDatabase;
    inputKey?: string;
    outputKey?: string;
    memory?: BaseMemory;
  }) {
    const { memory } = fields;
    super(memory);
    this.llm = fields.llm;
    this.database = fields.database;
    this.inputKey = fields.inputKey ?? this.inputKey;
    this.outputKey = fields.outputKey ?? this.outputKey;
  }

  async _call(values: ChainValues): Promise<ChainValues> {
    const lLMChain = new LLMChain({
      prompt: this.prompt,
      llm: this.llm,
      outputKey: this.outputKey,
      memory: this.memory,
    });
    if (!(this.inputKey in values)) {
      throw new Error(`Question key ${this.inputKey} not found.`);
    }
    const question: string = values[this.inputKey];
    let inputText = `${question}\nSQLQuery:`;
    const tablesToUse = values.table_names_to_use;
    const tableInfo = await this.database.getTableInfo(tablesToUse);

    const llmInputs = {
      input: inputText,
      top_k: this.topK,
      dialect: this.database.appDataSourceOptions.type,
      table_info: tableInfo,
      stop: ["\nSQLResult:"],
    };

    const intermediateStep = [];
    const sqlCommand = await lLMChain.predict(llmInputs);
    intermediateStep.push(sqlCommand);
    let queryResult = "";
    try {
      queryResult = await this.database.appDataSource.query(sqlCommand);
      intermediateStep.push(queryResult);
    } catch (error) {
      console.error(error);
    }

    let finalResult;
    if (this.returnDirect) {
      finalResult = { result: queryResult };
    } else {
      inputText += `${+sqlCommand}\nSQLResult: ${JSON.stringify(
        queryResult
      )}\nAnswer:`;
      llmInputs.input = inputText;
      finalResult = { result: await lLMChain.predict(llmInputs) };
    }

    return finalResult;
  }

  _chainType() {
    return "sql_database_chain" as const;
  }

  get inputKeys(): string[] {
    return [this.inputKey];
  }

  static async deserialize(data: SerializedSqlDatabaseChain) {
    const serializedLLM = await resolveConfigFromFile<"llm", SerializedLLM>(
      "llm",
      data
    );
    const llm = await BaseLLM.deserialize(serializedLLM);
    const serializedDatabase = await resolveConfigFromFile<
      "sql_database",
      SerializedSqlDatabase
    >("sql_database", data);

    const sqlDataBase = await SqlDatabase.fromOptionsParams(serializedDatabase);

    return new SqlDatabaseChain({
      llm,
      database: sqlDataBase,
    });
  }

  serialize(): SerializedSqlDatabaseChain {
    return {
      _type: this._chainType(),
      llm: this.llm.serialize(),
      sql_database: this.database.serialize(),
    };
  }
}
