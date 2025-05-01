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

interface Template {
  name: string;
  description: string;
  sourcePath: string;
  dateCreated: string;
  excludePatterns: string[];
}

export class ProjectManager {
  private projectsFile: string;
  private templatesFile: string;
  private statusBarItem: vscode.StatusBarItem;

  constructor(context: vscode.ExtensionContext) {
    this.projectsFile = path.join(
      context.globalStorageUri.fsPath,
      "projects.json"
    );
    this.templatesFile = path.join(
      context.globalStorageUri.fsPath,
      "templates.json"
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
      if (!fs.existsSync(this.templatesFile)) {
        fs.writeFileSync(this.templatesFile, "[]", "utf8");
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to initialize storage: ${error}`);
    }
  }

  private async loadProjects(): Promise<Project[]> {
    try {
      const content = await fs.promises.readFile(this.projectsFile, "utf8");
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

    const projects = await this.loadProjects();
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

      const projects = await this.loadProjects();
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
      const projects = await this.loadProjects();
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

  // Template Management Functions

  private async loadTemplates(): Promise<Template[]> {
    try {
      const content = await fs.promises.readFile(this.templatesFile, "utf8");
      const templates = JSON.parse(content);

      if (!Array.isArray(templates)) {
        console.log("Invalid templates data:", templates);
        return [];
      }

      return templates;
    } catch (error) {
      console.error("Error loading templates:", error);
      vscode.window.showErrorMessage(`Failed to load templates: ${error}`);
      return [];
    }
  }

  private saveTemplates(templates: Template[]): void {
    try {
      fs.writeFileSync(this.templatesFile, JSON.stringify(templates, null, 2));
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to save templates: ${error}`);
    }
  }

  async saveAsTemplate(): Promise<void> {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders) {
      vscode.window.showErrorMessage("No folder is currently open");
      return;
    }

    const sourcePath = folders[0].uri.fsPath;

    // Get template name
    const name = await vscode.window.showInputBox({
      prompt: "Enter template name",
      value: path.basename(sourcePath) + "-template",
    });

    if (!name) return;

    // Get template description
    const description = await vscode.window.showInputBox({
      prompt: "Enter template description",
      value: "Project template created from " + path.basename(sourcePath),
    });

    if (!description) return;

    // Ask for exclude patterns
    const excludePatternsInput = await vscode.window.showInputBox({
      prompt: "Enter patterns to exclude (comma separated)",
      value: "node_modules,.git,dist,build,out",
      placeHolder: "e.g.: node_modules,.git,dist"
    });

    const excludePatterns = excludePatternsInput ?
      excludePatternsInput.split(',').map(p => p.trim()) :
      ["node_modules", ".git"];

    const templates = await this.loadTemplates();
    if (templates.some((t) => t.name === name)) {
      const overwrite = await vscode.window.showQuickPick(["Yes", "No"], {
        placeHolder: "A template with this name already exists. Overwrite?",
      });

      if (overwrite !== "Yes") {
        return;
      }

      // Remove existing template with the same name
      const index = templates.findIndex((t) => t.name === name);
      if (index !== -1) {
        templates.splice(index, 1);
      }
    }

    templates.push({
      name,
      description,
      sourcePath,
      dateCreated: new Date().toISOString(),
      excludePatterns,
    });

    this.saveTemplates(templates);
    vscode.window.showInformationMessage(`Template "${name}" has been saved`);
  }

  async createFromTemplate(): Promise<void> {
    const templates = await this.loadTemplates();
    if (templates.length === 0) {
      vscode.window.showInformationMessage(
        "No templates found. Use 'Save as Template' to create one."
      );
      return;
    }

    // Select a template
    const selectedTemplate = await vscode.window.showQuickPick(
      templates.map((t) => ({
        label: t.name,
        description: t.description,
        detail: `Created from: ${path.basename(t.sourcePath)}`,
      })),
      {
        placeHolder: "Select a template",
      }
    );

    if (!selectedTemplate) return;

    const template = templates.find((t) => t.name === selectedTemplate.label);
    if (!template) return;

    // Get target base folder
    const targetBase = vscode.workspace
      .getConfiguration("projectManager")
      .get<string>("targetFolder");

    if (!targetBase) {
      const result = await vscode.window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        title: "Select Target Location for New Project",
      });

      if (!result || !result[0]) return;

      await vscode.workspace
        .getConfiguration()
        .update(
          "projectManager.targetFolder",
          result[0].fsPath,
          vscode.ConfigurationTarget.Global
        );
    }

    // Get new project name
    const suggestedName = path.basename(template.sourcePath) + "-clone";
    const projectName = await vscode.window.showInputBox({
      prompt: "Enter name for the new project",
      value: suggestedName,
    });

    if (!projectName) return;

    const updatedTargetBase = vscode.workspace
      .getConfiguration("projectManager")
      .get<string>("targetFolder");

    if (!updatedTargetBase) {
      vscode.window.showErrorMessage("No target folder selected");
      return;
    }

    const targetPath = path.join(updatedTargetBase, projectName);

    try {
      // Check if target is a subdirectory of source
      if (this.isSubdirectory(template.sourcePath, targetPath)) {
        vscode.window.showErrorMessage(
          `Cannot create project in a subdirectory of the template source (${template.sourcePath}). Please choose a different location.`
        );
        return;
      }

      if (fs.existsSync(targetPath)) {
        vscode.window.showErrorMessage(
          `Folder "${projectName}" already exists in target location`
        );
        return;
      }

      // Copy project from template
      await fse.copy(template.sourcePath, targetPath, {
        filter: (src: string) => {
          // Filter out excluded patterns
          return !template.excludePatterns.some(pattern =>
            src.includes(pattern)
          );
        },
      });

      // Add as project
      const projects = await this.loadProjects();
      projects.push({ name: projectName, path: targetPath });
      this.saveProjects(projects);

      vscode.window.showInformationMessage(
        `Project created from template at ${targetPath}`
      );

      // Prompt to open new project
      const openNow = await vscode.window.showQuickPick(["Yes", "No"], {
        placeHolder: "Open the new project now?",
      });

      if (openNow === "Yes") {
        await vscode.commands.executeCommand(
          "vscode.openFolder",
          vscode.Uri.file(targetPath)
        );
      }
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to create project from template: ${error}`
      );
    }
  }

  // Helper method to check if a path is a subdirectory of another path
  private isSubdirectory(parentPath: string, childPath: string): boolean {
    const relativePath = path.relative(parentPath, childPath);
    return relativePath !== '' &&
           !relativePath.startsWith('..') &&
           !path.isAbsolute(relativePath);
  }

  async manageTemplates(): Promise<void> {
    const templates = await this.loadTemplates();
    if (templates.length === 0) {
      vscode.window.showInformationMessage(
        "No templates found. Use 'Save as Template' to create one."
      );
      return;
    }

    const items = templates.map((t) => ({
      label: t.name,
      description: t.description,
      detail: `Created: ${new Date(t.dateCreated).toLocaleString()}`,
    }));

    items.push({
      label: "$(trash) Delete a template",
      description: "Remove a template from the list",
      detail: "Select this option to delete a template",
    });

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: "Select a template to view or delete",
    });

    if (!selected) return;

    if (selected.label.includes("Delete")) {
      // Delete a template
      const templateToDelete = await vscode.window.showQuickPick(
        templates.map((t) => ({
          label: t.name,
          description: t.description,
        })),
        {
          placeHolder: "Select a template to delete",
        }
      );

      if (!templateToDelete) return;

      const confirmed = await vscode.window.showQuickPick(["Yes", "No"], {
        placeHolder: `Are you sure you want to delete template "${templateToDelete.label}"?`,
      });

      if (confirmed !== "Yes") return;

      const newTemplates = templates.filter(
        (t) => t.name !== templateToDelete.label
      );
      this.saveTemplates(newTemplates);
      vscode.window.showInformationMessage(
        `Template "${templateToDelete.label}" has been deleted`
      );
    } else {
      // View template details
      const template = templates.find((t) => t.name === selected.label);
      if (template) {
        const details = `
Name: ${template.name}
Description: ${template.description}
Source: ${template.sourcePath}
Created: ${new Date(template.dateCreated).toLocaleString()}
Excluded: ${template.excludePatterns.join(", ")}
        `;

        const md = new vscode.MarkdownString(details);
        md.supportHtml = true;

        vscode.window.showInformationMessage(
          `Template details for "${template.name}"`,
          { modal: true, detail: details }
        );
      }
    }
  }

  dispose() {
    this.statusBarItem.dispose();
  }
}
