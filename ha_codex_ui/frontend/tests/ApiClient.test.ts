import { api } from "../src/api/client";

describe("api client", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockResolvedValue({
      json: async () => ({ ok: true, data: {} }),
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it("builds requests for the supported API surface", async () => {
    await api.health();
    await api.workspaces();
    await api.tree("workspace", ".");
    await api.readFile("workspace", "file.yaml");
    await api.writeFile("workspace", "file.yaml", "name: ok\n", true);
    await api.mkdir("workspace", "folder", true);
    await api.delete("workspace", "folder", true);
    await api.rename("workspace", "old.txt", "new.txt", true);
    await api.upload("workspace", ".", new File(["hello"], "hello.txt"), true, true);
    await api.terminals();
    await api.createTerminal({ type: "shell", workspaceId: "workspace", name: "Shell", confirmed: true });
    await api.stopTerminal("terminal");
    await api.deleteTerminal("terminal");
    await api.codexStatus();
    await api.codexAuth();
    await api.diagnostics();
    await api.diffStatus("workspace");
    await api.diffFile("workspace", "file.yaml");
    await api.snapshot("workspace");
    await api.settings();
    await api.haStatus();
    await api.checkYaml("configuration.yaml", "name: ok\n");

    expect(fetchMock).toHaveBeenCalledWith("/api/health", expect.objectContaining({ headers: expect.any(Object) }));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/files/tree?workspaceId=workspace&path=.",
      expect.objectContaining({ headers: expect.any(Object) }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/files/upload?workspaceId=workspace&path=.&overwrite=true&confirmed=true",
      expect.objectContaining({ method: "POST", body: expect.any(FormData) }),
    );
  });

  it("raises safe API errors", async () => {
    fetchMock.mockResolvedValueOnce({
      json: async () => ({ ok: false, error: { code: "NOPE", message: "Request failed safely." } }),
    });
    await expect(api.health()).rejects.toThrow("Request failed safely.");
  });
});
