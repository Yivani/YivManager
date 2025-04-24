import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

interface KeyboardShortcuts {
  openProject: string;
  addProject: string;
  copyProject: string;
  selectTargetFolder: string;
}

export class KeybindingManager {
  private static readonly KEYBINDINGS_FILE = path.join(os.homedir(), '.config', 'Code', 'User', 'keybindings.json');
  private static readonly WIN_KEYBINDINGS_FILE = path.join(os.homedir(), 'AppData', 'Roaming', 'Code', 'User', 'keybindings.json');

  /**
   * Updates the VS Code keybindings.json file with our custom shortcuts
   */
  public static async updateKeybindings() {
    const keybindingsPath = os.platform() === 'win32' ?
      this.WIN_KEYBINDINGS_FILE :
      this.KEYBINDINGS_FILE;

    // Create directory structure if it doesn't exist
    const keybindingsDir = path.dirname(keybindingsPath);
    if (!fs.existsSync(keybindingsDir)) {
      fs.mkdirSync(keybindingsDir, { recursive: true });
    }

    // Read current keybindings or create empty array
    let keybindings = [];
    try {
      if (fs.existsSync(keybindingsPath)) {
        const content = fs.readFileSync(keybindingsPath, 'utf8');
        keybindings = JSON.parse(content);
      }
    } catch (err) {
      console.error('Error reading keybindings file:', err);
      // If there's an error parsing, start fresh
      keybindings = [];
    }

    // Get our custom shortcuts from settings
    const config = vscode.workspace.getConfiguration('projectManager');
    const shortcuts = config.get<KeyboardShortcuts>('keyboardShortcuts');

    if (!shortcuts) return;

    // Remove any existing bindings for our commands
    keybindings = keybindings.filter((kb: any) =>
      !kb.command || !kb.command.startsWith('projectManager.')
    );

    // Add our commands with updated shortcuts
    const commandMap = {
      'openProject': 'projectManager.openProject',
      'addProject': 'projectManager.addProject',
      'copyProject': 'projectManager.copyProject',
      'selectTargetFolder': 'projectManager.selectTargetFolder'
    };

    for (const [key, value] of Object.entries(shortcuts)) {
      if (value && value.trim() !== '') {
        const command = commandMap[key as keyof typeof commandMap];
        if (command) {
          // Convert our format (Ctrl+Alt+P) to VS Code format (ctrl+alt+p)
          const formattedKey = this.formatKeyBinding(value);

          keybindings.push({
            key: formattedKey,
            command: command,
            when: "editorFocus || sideBarFocus || terminalFocus"
          });
        }
      }
    }

    // Save the updated keybindings back to the file
    try {
      fs.writeFileSync(keybindingsPath, JSON.stringify(keybindings, null, 2), 'utf8');
      vscode.window.showInformationMessage('Keyboard shortcuts updated! You may need to restart VS Code for all changes to take effect.');
    } catch (err) {
      console.error('Error updating keybindings file:', err);
      vscode.window.showErrorMessage('Failed to update keyboard shortcuts. See console for details.');
    }
  }

  /**
   * Converts our shortcut format to VS Code format
   */
  private static formatKeyBinding(binding: string): string {
    return binding.toLowerCase()
      .replace(/\s+/g, '') // Remove spaces
      .replace('ctrl', 'ctrl')
      .replace('cmd', 'cmd')
      .replace('alt', 'alt')
      .replace('shift', 'shift');
  }
}
