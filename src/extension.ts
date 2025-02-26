import * as vscode from "vscode";
import { ProjectManager } from "./ProjectManager";

let projectManager: ProjectManager;

export function activate(context: vscode.ExtensionContext) {
  projectManager = new ProjectManager(context);

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
    projectManager
  );
}

export function deactivate() {
  if (projectManager) {
    projectManager.dispose();
  }
}
