export type Workspace = {
  id: string;
  name: string;
  root: string;
  readable: boolean;
  writable: boolean;
  sensitive: boolean;
  reason?: string;
};

export type WorkspaceCreateRequest = {
  root: string;
  name?: string;
};

export type WorkspaceSelection = {
  workspaceId: string;
};
