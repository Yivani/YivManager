/**
 * YivManager - VS Code Project Management Extension
 * ================================================
 *
 * @copyright Copyright (c) 2023-2024 Yivani
 * @license GPL-3.0
 * @author Yivani
 * @version 1.0.0
 *
 * This extension helps you organize, copy, and switch between coding projects with ease.
 * Features include project switching, organization, and smart copying/cloning.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import * as vscode from "vscode";
import { ProjectManager } from "./ProjectManager";
import { SettingsWebview } from "./SettingsWebview";
import { SidebarProvider } from "./SidebarProvider";

let projectManager: ProjectManager;
let settingsWebview: SettingsWebview;

export function activate(context: vscode.ExtensionContext) {
  projectManager = new ProjectManager(context);
  settingsWebview = new SettingsWebview(context);

  // Initialize sidebar provider
  const sidebarProvider = new SidebarProvider(context.extensionUri);

  // Register commands
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
    // Register sidebar webview
    vscode.window.registerWebviewViewProvider(
      SidebarProvider.viewType,
      sidebarProvider
    ),
    projectManager
  );
}

export function deactivate() {
  if (projectManager) {
    projectManager.dispose();
  }
}
