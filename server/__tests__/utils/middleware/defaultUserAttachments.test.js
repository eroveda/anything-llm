const {
  ENV_KEY,
  attachmentsBlockedForUser,
  allowedAttachments,
  blockDefaultUserAttachments,
} = require("../../../utils/middleware/defaultUserAttachments");

const admin = { id: 1, role: "admin" };
const manager = { id: 2, role: "manager" };
const employee = { id: 3, role: "default" };
const image = { name: "foto.png", mime: "image/png", contentString: "x" };

function mockResponse(locals = {}) {
  return {
    locals,
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
}

describe("defaultUserAttachments", () => {
  const hadValue = ENV_KEY in process.env;
  const originalValue = process.env[ENV_KEY];

  afterEach(() => {
    if (hadValue) process.env[ENV_KEY] = originalValue;
    else delete process.env[ENV_KEY];
  });

  describe("attachmentsBlockedForUser", () => {
    it("never blocks when the env var is not set", () => {
      delete process.env[ENV_KEY];
      expect(attachmentsBlockedForUser(employee, true)).toBe(false);
    });

    it("never blocks in single-user mode", () => {
      process.env[ENV_KEY] = "1";
      expect(attachmentsBlockedForUser(null, false)).toBe(false);
    });

    it("blocks default users in multi-user mode when the env var is set", () => {
      process.env[ENV_KEY] = "1";
      expect(attachmentsBlockedForUser(employee, true)).toBe(true);
    });

    it("blocks when the user is unknown in multi-user mode", () => {
      process.env[ENV_KEY] = "1";
      expect(attachmentsBlockedForUser(null, true)).toBe(true);
    });

    it("allows admins and managers", () => {
      process.env[ENV_KEY] = "1";
      expect(attachmentsBlockedForUser(admin, true)).toBe(false);
      expect(attachmentsBlockedForUser(manager, true)).toBe(false);
    });
  });

  describe("allowedAttachments", () => {
    it("drops attachments for blocked users", () => {
      process.env[ENV_KEY] = "1";
      expect(allowedAttachments([image], employee, true)).toEqual([]);
    });

    it("keeps attachments for allowed users", () => {
      process.env[ENV_KEY] = "1";
      expect(allowedAttachments([image], admin, true)).toEqual([image]);
    });

    it("returns an empty array for invalid input", () => {
      delete process.env[ENV_KEY];
      expect(allowedAttachments("nope", admin, true)).toEqual([]);
    });
  });

  describe("blockDefaultUserAttachments middleware", () => {
    it("calls next when attachments are allowed", () => {
      delete process.env[ENV_KEY];
      const next = jest.fn();
      const response = mockResponse({ multiUserMode: true, user: employee });

      blockDefaultUserAttachments({}, response, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(response.status).not.toHaveBeenCalled();
    });

    it("returns 403 for a default user when blocked", () => {
      process.env[ENV_KEY] = "1";
      const next = jest.fn();
      const response = mockResponse({ multiUserMode: true, user: employee });

      blockDefaultUserAttachments({}, response, next);

      expect(next).not.toHaveBeenCalled();
      expect(response.status).toHaveBeenCalledWith(403);
      expect(response.json).toHaveBeenCalledWith({
        success: false,
        error:
          "Attaching files is disabled for your account by the system administrator.",
      });
    });

    it("lets a manager through when blocked for default users", () => {
      process.env[ENV_KEY] = "1";
      const next = jest.fn();
      const response = mockResponse({ multiUserMode: true, user: manager });

      blockDefaultUserAttachments({}, response, next);

      expect(next).toHaveBeenCalledTimes(1);
    });
  });
});
