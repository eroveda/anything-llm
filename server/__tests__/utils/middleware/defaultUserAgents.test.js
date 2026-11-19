const {
  AGENTS_ENV_KEY,
  agentsBlockedForUser,
} = require("../../../utils/middleware/defaultUserAgents");

const admin = { id: 1, role: "admin" };
const manager = { id: 2, role: "manager" };
const employee = { id: 3, role: "default" };

describe("agentsBlockedForUser", () => {
  const hadValue = AGENTS_ENV_KEY in process.env;
  const originalValue = process.env[AGENTS_ENV_KEY];

  afterEach(() => {
    if (hadValue) process.env[AGENTS_ENV_KEY] = originalValue;
    else delete process.env[AGENTS_ENV_KEY];
  });

  it("uses DISABLE_DEFAULT_USER_AGENTS as the switch", () => {
    expect(AGENTS_ENV_KEY).toBe("DISABLE_DEFAULT_USER_AGENTS");
  });

  it("never blocks when the env var is not set", () => {
    delete process.env[AGENTS_ENV_KEY];
    expect(agentsBlockedForUser(employee, true)).toBe(false);
  });

  it("never blocks in single-user mode", () => {
    process.env[AGENTS_ENV_KEY] = "1";
    expect(agentsBlockedForUser(null, false)).toBe(false);
  });

  it("blocks default and unknown users in multi-user mode", () => {
    process.env[AGENTS_ENV_KEY] = "1";
    expect(agentsBlockedForUser(employee, true)).toBe(true);
    expect(agentsBlockedForUser(null, true)).toBe(true);
  });

  it("allows admins and managers", () => {
    process.env[AGENTS_ENV_KEY] = "1";
    expect(agentsBlockedForUser(admin, true)).toBe(false);
    expect(agentsBlockedForUser(manager, true)).toBe(false);
  });
});
