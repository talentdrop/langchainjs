import {
  HumanChatMessage,
  AIChatMessage,
  BaseChatMessage,
} from "../schema/index.js";
import {
  BaseMemory,
  InputValues,
  OutputValues,
  getInputValue,
} from "./base.js";

export class ChatMessageHistory {
  messages: BaseChatMessage[] = [];

  constructor(messages?: BaseChatMessage[]) {
    this.messages = messages ?? [];
  }

  addUserMessage(message: string): void {
    this.messages.push(new HumanChatMessage(message));
  }

  addAIChatMessage(message: string): void {
    this.messages.push(new AIChatMessage(message));
  }
}

export interface BaseMemoryInput {
  chatHistory: ChatMessageHistory;
  returnMessages: boolean;
  inputKey?: string;
  outputKey?: string;
}

export abstract class BaseChatMemory extends BaseMemory {
  chatHistory: ChatMessageHistory;

  returnMessages = false;

  inputKey?: string;

  outputKey?: string;

  constructor(fields?: Partial<BaseMemoryInput>) {
    super();
    this.chatHistory = fields?.chatHistory ?? new ChatMessageHistory();
    this.returnMessages = fields?.returnMessages ?? this.returnMessages;
    this.inputKey = fields?.inputKey ?? this.inputKey;
    this.outputKey = fields?.outputKey ?? this.outputKey;
  }

  async saveContext(
    inputValues: InputValues,
    outputValues: OutputValues
  ): Promise<void> {
    this.chatHistory.addUserMessage(getInputValue(inputValues, this.inputKey));
    this.chatHistory.addAIChatMessage(
      getInputValue(outputValues, this.outputKey)
    );
  }
}
