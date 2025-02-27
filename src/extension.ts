import * as vscode from "vscode";
import { ProjectManager } from "./ProjectManager";
import { SettingsWebview } from "./SettingsWebview";

let projectManager: ProjectManager;
let settingsWebview: SettingsWebview;

export function activate(context: vscode.ExtensionContext) {
  projectManager = new ProjectManager(context);
  settingsWebview = new SettingsWebview(context);

  context.subscriptions.push(
    vscode.commands.registerCommand("projectManager.addProject", () =>
      projectManager.addProject()
    ),
    vscode.commands.registerCommand("projectManager.openProject", () =>
      projectManager.openProject()
    ),
    vscode.commands.registerCommand("projectManager.copyProject", () =>
      projectManager.copyProject()
    ),
    vscode.commands.registerCommand("projectManager.selectTargetFolder", () =>
      projectManager.selectTargetFolder()
    ),
    vscode.commands.registerCommand("projectManager.openSettings", () => {
      settingsWebview.show();
    }),
    projectManager
  );
}

export function deactivate() {
  if (projectManager) {
    projectManager.dispose();
  }
}
