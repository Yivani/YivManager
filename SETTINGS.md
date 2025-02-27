# YivManager Settings & Customization

## Available Settings

You can customize YivManager through VS Code's settings. To access these settings, go to:

- File > Preferences > Settings (on Windows/Linux)
- Code > Preferences > Settings (on macOS)
- Or use the keyboard shortcut: `Ctrl+,` (`Cmd+,` on macOS)

Then search for "YivManager" or "projectManager".

### General Settings

| Setting                       | Description                                                                                         | Default |
| ----------------------------- | --------------------------------------------------------------------------------------------------- | ------- |
| `projectManager.targetFolder` | Specifies the default folder where projects will be copied to when using the "Copy Project" command | `""`    |

## Keyboard Shortcuts

YivManager comes with the following default keyboard shortcuts:

| Command       | Windows/Linux | macOS       | Description                     |
| ------------- | ------------- | ----------- | ------------------------------- |
| Open Project  | `Ctrl+Alt+P`  | `Cmd+Alt+P` | Opens the project selector      |
| Add Project   | `Ctrl+Alt+A`  | `Cmd+Alt+A` | Adds current folder to projects |
| Copy Project  | `Ctrl+Alt+C`  | `Cmd+Alt+C` | Copies current project          |
| Select Target | `Ctrl+Alt+T`  | `Cmd+Alt+T` | Select target folder for copies |

### Customizing Keyboard Shortcuts

You can customize these shortcuts by:

1. Opening Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
2. Type "Preferences: Open Keyboard Shortcuts"
3. Search for "YivManager" or the specific command you want to modify
4. Click on the pencil icon to edit the shortcut
5. Enter your preferred key combination (e.g., `Ctrl+Alt+F4`)
6. Press Enter to save

You can also edit the keybindings.json file directly:

1. Open Command Palette
2. Type "Preferences: Open Keyboard Shortcuts (JSON)"
3. Add your custom keybinding:

```json
{
  "key": "ctrl+alt+f4",
  "command": "projectManager.openProject",
  "when": "editorFocus"
}
```

## Available Commands

YivManager provides the following commands:

| Command              | Command ID                          | Description                                                 |
| -------------------- | ----------------------------------- | ----------------------------------------------------------- |
| Add Current Project  | `projectManager.addProject`         | Adds the currently open folder to your project list         |
| Open Project         | `projectManager.openProject`        | Opens the project selector to switch between saved projects |
| Copy Project         | `projectManager.copyProject`        | Creates a copy of the current project in the target folder  |
| Select Target Folder | `projectManager.selectTargetFolder` | Sets the default folder for copying projects                |

## Status Bar Item

The extension adds a status bar item with a folder icon that provides quick access to your projects. Click it to open the project selector.
