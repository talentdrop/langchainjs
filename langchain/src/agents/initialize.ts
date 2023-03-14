import { Tool } from "./tools/index.js";
import { AgentExecutor } from "./executor.js";
import { ZeroShotAgent } from "./mrkl/index.js";
import { ChatAgent } from "./chat/index.js";
import { BaseLanguageModel } from "../base_language/index.js";
import { CallbackManager, getCallbackManager } from "../callbacks/index.js";

export const initializeAgentExecutor = async (
  tools: Tool[],
  llm: BaseLanguageModel,
  agentType = "zero-shot-react-description",
  verbose = false,
  callbackManager: CallbackManager = getCallbackManager()
): Promise<AgentExecutor> => {
  switch (agentType) {
    case "zero-shot-react-description":
      return AgentExecutor.fromAgentAndTools({
        agent: ZeroShotAgent.fromLLMAndTools(llm, tools),
        tools,
        returnIntermediateSteps: true,
        verbose,
        callbackManager,
      });
    case "chat-zero-shot-react-description":
      return AgentExecutor.fromAgentAndTools({
        agent: ChatAgent.fromLLMAndTools(llm, tools),
        tools,
        returnIntermediateSteps: true,
        verbose,
        callbackManager,
      });
    default:
      throw new Error("Unknown agent type");
  }
};
