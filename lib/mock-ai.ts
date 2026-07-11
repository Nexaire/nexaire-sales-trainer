import { getMockClientReply } from "./getMockClientReply";
import { evaluateMockDialog } from "./scoreDialog";
import type { ChatMessage, ClientState, EvaluationResult, Scenario } from "./types";

function getLastManagerMessage(messages: ChatMessage[]) {
  return [...messages].reverse().find((message) => message.role === "manager");
}

export function mockClientReply(
  scenario: Scenario,
  messages: ChatMessage[],
  state: ClientState = scenario.initialState
): { content: string; nextState: ClientState } {
  const lastManagerMessage = getLastManagerMessage(messages);

  if (!lastManagerMessage) {
    return { content: scenario.openingMessage, nextState: scenario.initialState };
  }

  const result = getMockClientReply({
    scenario,
    state,
    managerText: lastManagerMessage.content
  });

  return { content: result.message, nextState: result.nextState };
}

export function mockEvaluation(scenario: Scenario, messages: ChatMessage[]): EvaluationResult {
  return evaluateMockDialog(scenario, messages);
}
