// The StudyBuddy MCP server for the connection test (increment 3): one practice card shown
// inside the chat, an app-only tool that checks and saves the answer, and a file-test tool.
import { randomUUID } from "node:crypto";
import {
  RESOURCE_MIME_TYPE,
  registerAppResource,
  registerAppTool,
} from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/server";
import { makeId, type Question } from "@studybuddy/core";
import { PRACTICE_CARD, buildScreen } from "@studybuddy/screens";
import { z } from "zod";
import type { AnswerStore } from "./answer-store.ts";
import { describeFile, summarizeReport } from "./file-report.ts";
import { gradeOptionAnswer, toPracticeResult, toPublicQuestion } from "./practice.ts";

export const PRACTICE_CARD_URI = "ui://studybuddy/practice-card.html";

export interface ServerOptions {
  readonly store: AnswerStore;
  readonly question: Question;
  /** The current time as an ISO date-time; replaceable in tests. */
  readonly now?: () => string;
  /** The page shown inside the chat; built from the screens package unless a test supplies one. */
  readonly practiceCardHtml?: () => string;
}

const OWNER_ID = makeId("Learner", "owner");
const SESSION_ID = makeId("Session", "connection-test");

export function createStudyBuddyServer(options: ServerOptions): McpServer {
  const { store, question } = options;
  const now = options.now ?? (() => new Date().toISOString());
  let cardHtml: string | undefined;
  const practiceCardHtml =
    options.practiceCardHtml ?? (() => (cardHtml ??= buildScreen(PRACTICE_CARD)));

  const server = new McpServer({ name: "studybuddy", version: "0.1.0" });

  registerAppTool(
    server,
    "show_practice_question",
    {
      title: "Show a StudyBuddy practice question",
      description:
        "Shows a StudyBuddy practice question as an interactive card in the chat. The learner answers on the card. Don't reveal, hint at or guess the answer.",
      _meta: { ui: { resourceUri: PRACTICE_CARD_URI } },
    },
    () => {
      const saved = store.latestAnswer(question.id);
      const card = {
        ...toPublicQuestion(question),
        ...(saved === undefined ? {} : { savedResult: toPracticeResult(question, saved) }),
      };
      return {
        content: [{ type: "text", text: "Showing a StudyBuddy practice question card." }],
        structuredContent: card,
      };
    },
  );

  registerAppTool(
    server,
    "submit_practice_answer",
    {
      title: "Check and save a practice answer",
      description: "Used by the practice card to check and save the learner's answer.",
      inputSchema: z.object({
        questionId: z.string(),
        option: z.enum(["A", "B", "C", "D", "E"]),
      }),
      _meta: { ui: { resourceUri: PRACTICE_CARD_URI, visibility: ["app"] } },
    },
    ({ questionId, option }) => {
      if (questionId !== question.id) {
        return {
          isError: true,
          content: [{ type: "text", text: `Unknown question "${questionId}".` }],
        };
      }
      const answer = gradeOptionAnswer(question, option, {
        ownerId: OWNER_ID,
        sessionId: SESSION_ID,
        answerId: randomUUID(),
        submittedAt: now(),
      });
      store.saveAnswer(answer);
      const result = toPracticeResult(question, answer);
      return {
        content: [{ type: "text", text: result.correct ? "Answered correctly." : "Answered." }],
        structuredContent: result,
      };
    },
  );

  registerAppResource(
    server,
    "StudyBuddy practice card",
    PRACTICE_CARD_URI,
    { description: "The interactive practice question card." },
    () => ({
      contents: [
        { uri: PRACTICE_CARD_URI, mimeType: RESOURCE_MIME_TYPE, text: practiceCardHtml() },
      ],
    }),
  );

  server.registerTool(
    "send_file_to_studybuddy",
    {
      title: "Send a file to StudyBuddy (file test)",
      description:
        "File test. When the learner attaches a file and asks to send it to StudyBuddy, pass what you actually have of it: the original bytes as base64 if you have them, otherwise the text you can read. Use the note to say honestly which it is. Don't invent content.",
      inputSchema: z.object({
        fileName: z.string(),
        mimeType: z.string().optional(),
        text: z.string().optional(),
        base64: z.string().optional(),
        note: z.string().optional(),
      }),
    },
    (input) => {
      const report = describeFile(input, now());
      store.saveFileReport(report);
      return { content: [{ type: "text", text: summarizeReport(report) }] };
    },
  );

  return server;
}
