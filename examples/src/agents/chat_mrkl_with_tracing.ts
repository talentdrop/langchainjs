import { ChatOpenAI } from "langchain/chat_models";
import { initializeAgentExecutor } from "langchain/agents";
import { SerpAPI, Calculator } from "langchain/tools";

export const run = async () => {
  process.env.LANGCHAIN_HANDLER = "langchain";
  const model = new ChatOpenAI({ temperature: 0 });
  const tools = [new SerpAPI(), new Calculator()];

  const executor = await initializeAgentExecutor(
    tools,
    model,
    "chat-zero-shot-react-description",
    true
  );
  console.log("Loaded agent.");

  const input = `Who is Olivia Wilde's boyfriend? What is his current age raised to the 0.23 power?`;

  console.log(`Executing with input "${input}"...`);

  const result = await executor.call({ input });

  console.log(`Got output ${result.output}`);

  console.log(
    `Got intermediate steps ${JSON.stringify(
      result.intermediateSteps,
      null,
      2
    )}`
  );
};
