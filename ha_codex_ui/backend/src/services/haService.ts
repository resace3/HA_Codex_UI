import YAML from "yaml";

export type HaStatus = {
  supervisorTokenPresent: boolean;
  coreReachable: boolean | null;
  message: string;
};

export class HaService {
  public async status(): Promise<HaStatus> {
    const supervisorTokenPresent = Boolean(process.env.SUPERVISOR_TOKEN);
    if (!supervisorTokenPresent) {
      return {
        supervisorTokenPresent,
        coreReachable: null,
        message: "Supervisor token is not available. Home Assistant API checks are limited.",
      };
    }
    try {
      const response = await fetch("http://supervisor/core/info", {
        headers: { Authorization: `Bearer ${process.env.SUPERVISOR_TOKEN}` },
      });
      return {
        supervisorTokenPresent,
        coreReachable: response.ok,
        message: response.ok ? "Home Assistant Core info endpoint responded." : "Home Assistant Core info endpoint did not return ok.",
      };
    } catch {
      return {
        supervisorTokenPresent,
        coreReachable: false,
        message: "Home Assistant Core API was not reachable from this add-on context.",
      };
    }
  }

  public async checkYaml(fileName: string, contents: string): Promise<{ valid: boolean; fileName: string; message: string }> {
    try {
      YAML.parse(contents);
      return { valid: true, fileName, message: "YAML parsed successfully." };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid YAML.";
      return { valid: false, fileName, message };
    }
  }

  public async checkConfig(): Promise<{ supported: boolean; valid: boolean | null; message: string }> {
    if (!process.env.SUPERVISOR_TOKEN) {
      return {
        supported: false,
        valid: null,
        message: "Full Home Assistant config checks require a safe supported API or command. None is available in this context.",
      };
    }
    return {
      supported: false,
      valid: null,
      message: "Full Home Assistant config checks are not executed unless a safe supported Supervisor endpoint is available.",
    };
  }
}
