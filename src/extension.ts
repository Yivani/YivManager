/**
 * YivManager - VS Code Project Management Extension
 * ================================================
 *
 * @version 1.2.0
 * @copyright Copyright (c) 2023-2024 Yivani
 * @license GPL-3.0
 *
 * Project management extension for organizing, duplicating, and switching
 * between coding projects with template support.
 */

import * as vscode from "vscode";
import { ProjectManager } from "./ProjectManager";
import { SettingsWebview } from "./SettingsWebview";
import { SidebarProvider } from "./SidebarProvider";

// Singleton instances
let projectManager: ProjectManager | null = null;
let settingsWebview: SettingsWebview | null = null;
let sidebarProvider: SidebarProvider | null = null;

// Lazy initialization functions to improve startup performance
function getProjectManager(context: vscode.ExtensionContext): ProjectManager {
  if (!projectManager) {
    console.log("Lazily initializing ProjectManager");
    projectManager = new ProjectManager(context);
  }
  return projectManager;
}

function getSettingsWebview(context: vscode.ExtensionContext): SettingsWebview {
  if (!settingsWebview) {
    console.log("Lazily initializing SettingsWebview");
    settingsWebview = new SettingsWebview(context);
  }
  return settingsWebview;
}

function getSidebarProvider(context: vscode.ExtensionContext): SidebarProvider {
  if (!sidebarProvider) {
    console.log("Lazily initializing SidebarProvider");
    sidebarProvider = new SidebarProvider(context.extensionUri);
  }
  return sidebarProvider;
}

export function activate(context: vscode.ExtensionContext) {
  // Register project management commands
  context.subscriptions.push(
    vscode.commands.registerCommand("projectManager.addProject", () =>
      getProjectManager(context).addProject()
    ),

    vscode.commands.registerCommand("projectManager.openProject", () =>
      getProjectManager(context).openProject()
    ),

    vscode.commands.registerCommand("projectManager.copyProject", () =>
      getProjectManager(context).copyProject()
    ),

    vscode.commands.registerCommand("projectManager.selectTargetFolder", () =>
      getProjectManager(context).selectTargetFolder()
    ),

    // Open settings panel
    vscode.commands.registerCommand("projectManager.openSettings", () => {
      getSettingsWebview(context).show();
    }),

    // Template management commands
    vscode.commands.registerCommand("projectManager.saveAsTemplate", () =>
      getProjectManager(context).saveAsTemplate()
    ),

    vscode.commands.registerCommand("projectManager.createFromTemplate", () =>
      getProjectManager(context).createFromTemplate()
    ),

    vscode.commands.registerCommand("projectManager.manageTemplates", () =>
      getProjectManager(context).manageTemplates()
    )
  );

  // Register sidebar UI
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      SidebarProvider.viewType,
      getSidebarProvider(context)
    )
  );

  // Add resource cleanup
  context.subscriptions.push({
    dispose: () => {
      if (projectManager) {
        projectManager.dispose();
      }
      if (sidebarProvider && typeof sidebarProvider.dispose === 'function') {
        sidebarProvider.dispose();
      }
    }
  });
}

export function deactivate() {
  // Clean up resources when extension is deactivated
  if (projectManager) {
    projectManager.dispose();
    projectManager = null;
  }

  if (sidebarProvider && typeof sidebarProvider.dispose === 'function') {
    sidebarProvider.dispose();
    sidebarProvider = null;
  }

  settingsWebview = null;
}
