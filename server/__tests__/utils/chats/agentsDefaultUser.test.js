jest.mock("../../../models/workspaceAgentInvocation", () => ({
  WorkspaceAgentInvocation: {
    parseAgents: jest.fn((message) =>
      message.startsWith("@agent") ? ["@agent"] : []
    ),
    new: jest.fn(async () => ({ invocation: { uuid: "invocation-uuid" } })),
  },
}));
jest.mock("../../../models/workspace", () => ({
  Workspace: { supportsNativeToolCalling: jest.fn(async () => true) },
}));

const { grepAgents } = require("../../../utils/chats/agents");
const {
  WorkspaceAgentInvocation,
} = require("../../../models/workspaceAgentInvocation");
const {
  AGENTS_ENV_KEY,
  AGENTS_BLOCKED_MESSAGE,
} = require("../../../utils/middleware/defaultUserAgents");

const employee = { id: 3, role: "default" };
const manager = { id: 2, role: "manager" };

function multiUserResponse() {
  return { write: jest.fn(), locals: { multiUserMode: true } };
}

function writtenChunks(response) {
  return response.write.mock.calls.map(([raw]) =>
    JSON.parse(String(raw).replace(/^data: /, ""))
  );
}

describe("grepAgents with DISABLE_DEFAULT_USER_AGENTS", () => {
  const hadValue = AGENTS_ENV_KEY in process.env;
  const originalValue = process.env[AGENTS_ENV_KEY];

  beforeEach(() => {
    process.env[AGENTS_ENV_KEY] = "1";
    jest.clearAllMocks();
  });

  afterAll(() => {
    if (hadValue) process.env[AGENTS_ENV_KEY] = originalValue;
    else delete process.env[AGENTS_ENV_KEY];
  });

  test("refuses an explicit @agent call from a default user", async () => {
    const response = multiUserResponse();

    const handled = await grepAgents({
      uuid: "chat-uuid",
      response,
      message: "@agent search the web",
      workspace: { chatMode: "chat" },
      user: employee,
    });

    expect(handled).toBe(true);
    expect(WorkspaceAgentInvocation.new).not.toHaveBeenCalled();
    const [chunk] = writtenChunks(response);
    expect(chunk.type).toBe("statusResponse");
    expect(chunk.textResponse).toBe(AGENTS_BLOCKED_MESSAGE);
    expect(chunk.close).toBe(true);
  });

  test("keeps a default user in regular chat when the workspace is automatic", async () => {
    const response = multiUserResponse();

    const handled = await grepAgents({
      uuid: "chat-uuid",
      response,
      message: "¿qué talle me llevo?",
      workspace: { chatMode: "automatic" },
      user: employee,
    });

    expect(handled).toBe(false);
    expect(WorkspaceAgentInvocation.new).not.toHaveBeenCalled();
    expect(response.write).not.toHaveBeenCalled();
  });

  test("still lets a manager start an agent", async () => {
    const response = multiUserResponse();

    const handled = await grepAgents({
      uuid: "chat-uuid",
      response,
      message: "@agent search the web",
      workspace: { chatMode: "chat" },
      user: manager,
    });

    expect(handled).toBe(true);
    expect(WorkspaceAgentInvocation.new).toHaveBeenCalledTimes(1);
  });
});
