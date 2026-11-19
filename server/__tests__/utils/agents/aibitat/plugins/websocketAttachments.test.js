/* eslint-env jest */
jest.mock("../../../../../models/telemetry", () => ({
  Telemetry: { sendTelemetry: jest.fn() },
}));
jest.mock("../../../../../models/systemSettings", () => ({
  SystemSettings: { isMultiUserMode: jest.fn() },
}));
jest.mock("../../../../../models/user", () => ({
  User: { get: jest.fn() },
}));

const { SystemSettings } = require("../../../../../models/systemSettings");
const { User } = require("../../../../../models/user");
const {
  permittedAgentAttachments,
} = require("../../../../../utils/agents/aibitat/plugins/websocket.js");

const ENV_KEY = "DISABLE_DEFAULT_USER_ATTACHMENTS";
const image = { name: "foto.png", mime: "image/png", contentString: "x" };

describe("permittedAgentAttachments", () => {
  const hadValue = ENV_KEY in process.env;
  const originalValue = process.env[ENV_KEY];

  afterEach(() => {
    jest.clearAllMocks();
    if (hadValue) process.env[ENV_KEY] = originalValue;
    else delete process.env[ENV_KEY];
  });

  it("returns attachments untouched and skips lookups when not enabled", async () => {
    delete process.env[ENV_KEY];
    const attachments = [image];

    const result = await permittedAgentAttachments(3, attachments);

    expect(result).toBe(attachments);
    expect(SystemSettings.isMultiUserMode).not.toHaveBeenCalled();
    expect(User.get).not.toHaveBeenCalled();
  });

  it("drops attachments from a default user in multi-user mode", async () => {
    process.env[ENV_KEY] = "1";
    SystemSettings.isMultiUserMode.mockResolvedValue(true);
    User.get.mockResolvedValue({ id: 3, role: "default" });

    await expect(permittedAgentAttachments(3, [image])).resolves.toEqual([]);
    expect(User.get).toHaveBeenCalledWith({ id: 3 });
  });

  it("keeps attachments from an admin in multi-user mode", async () => {
    process.env[ENV_KEY] = "1";
    SystemSettings.isMultiUserMode.mockResolvedValue(true);
    User.get.mockResolvedValue({ id: 1, role: "admin" });

    await expect(permittedAgentAttachments(1, [image])).resolves.toEqual([
      image,
    ]);
  });

  it("keeps attachments in single-user mode", async () => {
    process.env[ENV_KEY] = "1";
    SystemSettings.isMultiUserMode.mockResolvedValue(false);

    await expect(permittedAgentAttachments(null, [image])).resolves.toEqual([
      image,
    ]);
  });
});
