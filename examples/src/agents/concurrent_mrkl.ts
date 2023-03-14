import { OpenAI } from "langchain";
import { initializeAgentExecutor } from "langchain/agents";
import { SerpAPI, Calculator } from "langchain/tools";
import process from "process";
import {
  CallbackManager,
  LangChainTracer,
  ConsoleCallbackHandler,
} from "langchain/callbacks";

export const run = async () => {
  process.env.LANGCHAIN_HANDLER = "langchain";
  const model = new OpenAI({ temperature: 0 });
  const tools = [new SerpAPI(), new Calculator()];

  const executor = await initializeAgentExecutor(
    tools,
    model,
    "zero-shot-react-description",
    true
  );
  console.log("Loaded agent.");

  const input = `Who is Olivia Wilde's boyfriend? What is his current age raised to the 0.23 power?`;

  console.log(`Executing with input "${input}"...`);

  // This will result in a lot of errors, because the shared Tracer is not concurrency-safe.
  const [resultA, resultB, resultC] = await Promise.all([
    executor.call({ input }),
    executor.call({ input }),
    executor.call({ input }),
  ]);

  console.log(`Got output ${resultA.output}`);
  console.log(`Got output ${resultB.output}`);
  console.log(`Got output ${resultC.output}`);

  // This will work, because each executor has its own Tracer, avoiding concurrency issues.
  console.log("---Now with concurrency-safe tracing---");

  const executors = [];
  for (let i = 0; i < 3; i += 1) {
    const callbackManager = new CallbackManager();
    callbackManager.addHandler(new ConsoleCallbackHandler());
    callbackManager.addHandler(new LangChainTracer());

    const model = new OpenAI({ temperature: 0, callbackManager });
    const tools = [new SerpAPI(), new Calculator()];
    for (const tool of tools) {
      tool.callbackManager = callbackManager;
    }
    const executor = await initializeAgentExecutor(
      tools,
      model,
      "zero-shot-react-description",
      true,
      callbackManager
    );
    executor.agent.llmChain.callbackManager = callbackManager;
    executors.push(executor);
  }

  const results = await Promise.all(
    executors.map((executor) => executor.call({ input }))
  );
  for (const result of results) {
    console.log(`Got output ${result.output}`);
  }
};
