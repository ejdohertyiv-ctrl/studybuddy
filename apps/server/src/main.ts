// Starts the StudyBuddy server for Claude Desktop, talking over standard input and output.
// Nothing may be printed to standard output except the protocol itself; messages go to stderr.
import { fileURLToPath } from "node:url";
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import { sampleCourse } from "@studybuddy/fixtures";
import { AnswerStore } from "./answer-store.ts";
import { createStudyBuddyServer } from "./server.ts";

// The connection test uses the made-up sample course's first question, never real study data.
const question = sampleCourse.questions[0];
if (question === undefined) {
  throw new Error("The sample course has no questions.");
}

// Saved answers live in data/private, which Git never commits, unless a folder is given.
const folder =
  process.env["STUDYBUDDY_DATA_DIR"] ??
  fileURLToPath(new URL("../../../data/private/connection-test", import.meta.url));

const server = createStudyBuddyServer({ store: new AnswerStore(folder), question });
await server.connect(new StdioServerTransport());
process.stderr.write(`StudyBuddy connection-test server running. Saving to ${folder}\n`);
