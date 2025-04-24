/**
 * ProjectManager.ts - Core Project Management Functionality
 * ======================================================
 *
 * @copyright Copyright (c) 2023-2024 Yivani
 * @license GPL-3.0
 * @author Yivani
 *
 * This module implements the core functionality of YivManager including project
 * storage, loading, adding, switching, and copying. It handles the interface
 * between the extension's project data and VS Code.
 *
 * This program is part of YivManager and is governed by its license terms.
 */

import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as fse from "fs-extra";

interface Project {
  name: string;
  path: string;
}

export class ProjectManager {
  private projectsFile: string;
  private statusBarItem: vscode.StatusBarItem;

  constructor(context: vscode.ExtensionContext) {
    this.projectsFile = path.join(
      context.globalStorageUri.fsPath,
      "projects.json"
    );
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left
    );
    this.statusBarItem.command = "projectManager.openProject";
    this.statusBarItem.text = "$(file-directory) Projects";
    this.statusBarItem.tooltip = "Switch Project";
    this.statusBarItem.show();
    this.ensureStorageExists();
  }

  private ensureStorageExists(): void {
    try {
      const dir = path.dirname(this.projectsFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      if (!fs.existsSync(this.projectsFile)) {
        fs.writeFileSync(this.projectsFile, "[]", "utf8");
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to initialize storage: ${error}`);
    }
  }

  private loadProjects(): Project[] {
    try {
      const content = fs.readFileSync(this.projectsFile, "utf8");
      console.log("Loading projects file:", content);
      const projects = JSON.parse(content);

      if (!Array.isArray(projects)) {
        console.log("Invalid projects data:", projects);
        return [];
      }

      return projects.filter((p) => fs.existsSync(p.path));
    } catch (error) {
      console.error("Error loading projects:", error);
      vscode.window.showErrorMessage(`Failed to load projects: ${error}`);
      return [];
    }
  }

  private saveProjects(projects: Project[]): void {
    try {
      fs.writeFileSync(this.projectsFile, JSON.stringify(projects, null, 2));
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to save projects: ${error}`);
    }
  }

  async addProject(): Promise<void> {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders) {
      vscode.window.showErrorMessage("No folder is currently open");
      return;
    }

    const projectPath = folders[0].uri.fsPath;
    const name = await vscode.window.showInputBox({
      prompt: "Enter project name",
      value: path.basename(projectPath),
    });

    if (!name) return;

    const projects = this.loadProjects();
    if (projects.some((p) => p.name === name)) {
      vscode.window.showErrorMessage("A project with this name already exists");
      return;
    }

    projects.push({ name, path: projectPath });
    this.saveProjects(projects);
    vscode.window.showInformationMessage(`Project "${name}" has been saved`);
  }

  async copyProject(): Promise<void> {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders) {
      vscode.window.showErrorMessage("No folder is currently open");
      return;
    }

    const sourcePath = folders[0].uri.fsPath;
    const targetBase = vscode.workspace
      .getConfiguration("projectManager")
      .get<string>("targetFolder");

    if (!targetBase) {
      vscode.window.showErrorMessage(
        "Please select a target folder first (Use 'Select Target Folder' command)"
      );
      return;
    }

    const suggestedName = path.basename(sourcePath);
    const name = await vscode.window.showInputBox({
      prompt: "Enter name for the copied project",
      value: suggestedName,
    });

    if (!name) return;

    try {
      const targetPath = path.join(targetBase, name);

      if (fs.existsSync(targetPath)) {
        vscode.window.showErrorMessage(
          `Folder "${name}" already exists in target location`
        );
        return;
      }

      await fse.copy(sourcePath, targetPath, {
        filter: (src: string) => {
          return !src.includes("node_modules") && !src.includes(".git");
        },
      });

      const projects = this.loadProjects();
      projects.push({ name, path: targetPath });
      this.saveProjects(projects);

      vscode.window.showInformationMessage(`Project copied to ${targetPath}`);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to copy project: ${error}`);
    }
  }

  async selectTargetFolder(): Promise<void> {
    const result = await vscode.window.showOpenDialog({
      canSelectFiles: false,
      canSelectFolders: true,
      canSelectMany: false,
      title: "Select Target Folder for Copied Projects",
    });

    if (result && result[0]) {
      await vscode.workspace
        .getConfiguration()
        .update(
          "projectManager.targetFolder",
          result[0].fsPath,
          vscode.ConfigurationTarget.Global
        );
      vscode.window.showInformationMessage(
        `Target folder set to: ${result[0].fsPath}`
      );
    }
  }

  async openProject(): Promise<void> {
    try {
      const projects = this.loadProjects();
      if (projects.length === 0) {
        vscode.window.showInformationMessage(
          "No projects added yet. Use 'Add Current Project' to add one."
        );
        return;
      }

      const selection = await vscode.window.showQuickPick(
        projects.map((p) => ({
          label: p.name,
          description: p.path,
        })),
        {
          placeHolder: "Select a project to open",
          title: "Your Added Projects",
        }
      );

      if (!selection) return;

      const project = projects.find((p) => p.name === selection.label);
      if (project) {
        await vscode.commands.executeCommand(
          "vscode.openFolder",
          vscode.Uri.file(project.path)
        );
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to open project: ${error}`);
    }
  }

  dispose() {
    this.statusBarItem.dispose();
  }
}
