class CommandInterpreter {
  constructor(os) {
    this.os = os;
    this.terminal = document.getElementById("terminalOutput");
    this.commandHistory = [];
    this.historyIndex = -1;
    this.commandSuggestions = [];
    this.suggestionIndex = -1;
    this.currentInput = "";

    this.supportedCommands = {
      help: this.helpCommand.bind(this),
      ls: this.listCommand.bind(this),
      cd: this.changeDirectoryCommand.bind(this),
      cat: this.catCommand.bind(this),
      mkdir: this.makeDirectoryCommand.bind(this),
      touch: this.touchCommand.bind(this),
      rm: this.removeCommand.bind(this),
      echo: this.echoCommand.bind(this),
      ps: this.processCommand.bind(this),
      kill: this.killCommand.bind(this),
      run: this.runCommand.bind(this),
      clear: this.clearCommand.bind(this),
      shutdown: this.shutdownCommand.bind(this),
      mem: this.memoryCommand.bind(this),
      disk: this.diskCommand.bind(this),
      whoami: this.whoamiCommand.bind(this),
      date: this.dateCommand.bind(this),
      find: this.findCommand.bind(this),
    };

    this.setupTerminalKeyEvents();
  }

  setupTerminalKeyEvents() {
    const terminalInput = document.getElementById("terminalInput");

    terminalInput.addEventListener("keydown", (e) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        this.navigateHistory("up");
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        this.navigateHistory("down");
      } else if (e.key === "Tab") {
        e.preventDefault();
        this.tabComplete();
      } else if (e.key === "Enter") {
        const command = terminalInput.value;
        if (command.trim()) {
          this.addToHistory(command);
        }
        this.processCommand(command);
        terminalInput.value = "";
        this.historyIndex = -1;
      }
    });
  }

  navigateHistory(direction) {
    const terminalInput = document.getElementById("terminalInput");

    if (this.commandHistory.length === 0) return;

    if (direction === "up") {
      if (this.historyIndex === -1) {
        this.currentInput = terminalInput.value;
      }

      this.historyIndex = Math.min(
        this.commandHistory.length - 1,
        this.historyIndex + 1
      );
    } else {
      this.historyIndex = Math.max(-1, this.historyIndex - 1);
    }

    if (this.historyIndex === -1) {
      terminalInput.value = this.currentInput;
    } else {
      terminalInput.value = this.commandHistory[this.historyIndex];
    }

    setTimeout(() => {
      terminalInput.selectionStart = terminalInput.selectionEnd =
        terminalInput.value.length;
    }, 0);
  }

  addToHistory(command) {
    if (this.commandHistory[0] !== command) {
      this.commandHistory.unshift(command);
      if (this.commandHistory.length > 50) {
        this.commandHistory.pop();
      }
    }
  }

  tabComplete() {
    const terminalInput = document.getElementById("terminalInput");
    const input = terminalInput.value;

    const parts = input.trim().split(/\s+/);
    const lastPart = parts[parts.length - 1];

    if (parts.length === 1) {
      const suggestions = Object.keys(this.supportedCommands).filter((cmd) =>
        cmd.startsWith(lastPart)
      );

      if (suggestions.length === 1) {
        terminalInput.value = suggestions[0] + " ";
      } else if (suggestions.length > 1) {
        this.displayOutput(suggestions.join("  "));
        const commonPrefix = this.findCommonPrefix(suggestions);
        if (commonPrefix.length > lastPart.length) {
          terminalInput.value = commonPrefix;
        }
      }
    } else if (["cd", "ls", "cat", "rm"].includes(parts[0])) {
      this.suggestPaths(parts, lastPart, terminalInput);
    }
  }

  suggestPaths(parts, lastPart, terminalInput) {
    const currentDir = this.os.fileSystem.currentPath;
    const isAbsolute = lastPart.startsWith("/");

    let targetDir;
    let prefix;

    if (isAbsolute) {
      const lastSlashIndex = lastPart.lastIndexOf("/");
      const dirPath = lastPart.substring(0, Math.max(1, lastSlashIndex));
      prefix = lastPart.substring(lastSlashIndex + 1);
      targetDir = this.os.fileSystem.navigateTo(dirPath);
    } else {
      const lastSlashIndex = lastPart.lastIndexOf("/");
      if (lastSlashIndex === -1) {
        targetDir = this.os.fileSystem.navigateTo(currentDir);
        prefix = lastPart;
      } else {
        const relDir = lastPart.substring(0, lastSlashIndex);
        prefix = lastPart.substring(lastSlashIndex + 1);
        const fullPath =
          currentDir === "/" ? "/" + relDir : currentDir + "/" + relDir;
        targetDir = this.os.fileSystem.navigateTo(fullPath);
      }
    }

    if (!targetDir) return;

    const matches = Object.keys(targetDir.children).filter((name) =>
      name.startsWith(prefix)
    );

    if (matches.length === 1) {
      const match = matches[0];
      const isDir = targetDir.children[match].type === "folder";

      let completed;
      if (isAbsolute) {
        const dirPath = lastPart.substring(0, lastPart.lastIndexOf("/") + 1);
        completed = dirPath + match + (isDir ? "/" : "");
      } else {
        const lastSlashIndex = lastPart.lastIndexOf("/");
        if (lastSlashIndex === -1) {
          completed = match + (isDir ? "/" : "");
        } else {
          const relDir = lastPart.substring(0, lastSlashIndex + 1);
          completed = relDir + match + (isDir ? "/" : "");
        }
      }

      parts[parts.length - 1] = completed;
      terminalInput.value = parts.join(" ");
    } else if (matches.length > 1) {
      this.displayOutput(matches.join("  "));

      const commonPrefix = this.findCommonPrefix(matches);
      if (commonPrefix.length > prefix.length) {
        const lastSlashIndex = lastPart.lastIndexOf("/");
        if (lastSlashIndex === -1) {
          parts[parts.length - 1] = commonPrefix;
        } else {
          parts[parts.length - 1] =
            lastPart.substring(0, lastSlashIndex + 1) + commonPrefix;
        }
        terminalInput.value = parts.join(" ");
      }
    }
  }

  findCommonPrefix(strings) {
    if (strings.length === 0) return "";
    if (strings.length === 1) return strings[0];

    let prefix = strings[0];
    for (let i = 1; i < strings.length; i++) {
      let j = 0;
      while (
        j < prefix.length &&
        j < strings[i].length &&
        prefix[j] === strings[i][j]
      ) {
        j++;
      }
      prefix = prefix.substring(0, j);
      if (prefix === "") return "";
    }

    return prefix;
  }

  processCommand(commandString) {
    this.displayOutput(
      `<span class="prompt-text">user@os$</span> <span class="command-text">${commandString}</span>`
    );

    const parts = commandString.trim().split(/\s+/);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    if (command in this.supportedCommands) {
      this.supportedCommands[command](args);
    } else if (command) {
      this.displayOutput(
        `<span class="error-text">Command not found: ${command}. Type 'help' for available commands.</span>`
      );
    }

    this.displayPrompt();
  }

  displayOutput(text, isHtml = false) {
    const outputLine = document.createElement("div");
    if (isHtml || text.includes("<span")) {
      outputLine.innerHTML = text;
    } else {
      outputLine.textContent = text;
    }
    this.terminal.appendChild(outputLine);
    this.terminal.scrollTop = this.terminal.scrollHeight;
  }

  displayPrompt() {
    document.getElementById("terminalInput").focus();
  }

  helpCommand() {
    this.displayOutput(
      '<span class="heading-text">Available commands:</span>',
      true
    );
    this.displayOutput('<span class="command-group">File System:</span>', true);
    this.displayOutput(
      '  <span class="command-name">ls</span> [path]            - List directory contents',
      true
    );
    this.displayOutput(
      '  <span class="command-name">cd</span> <path>            - Change directory',
      true
    );
    this.displayOutput(
      '  <span class="command-name">cat</span> <file>           - Display file contents',
      true
    );
    this.displayOutput(
      '  <span class="command-name">mkdir</span> <name>         - Create a directory',
      true
    );
    this.displayOutput(
      '  <span class="command-name">touch</span> <name>         - Create a file',
      true
    );
    this.displayOutput(
      '  <span class="command-name">rm</span> <name>            - Remove a file or directory',
      true
    );
    this.displayOutput(
      '  <span class="command-name">echo</span> <text> > <file> - Write text to a file',
      true
    );
    this.displayOutput(
      '  <span class="command-name">find</span> <pattern>       - Search for files',
      true
    );

    this.displayOutput(
      '<span class="command-group">Process Management:</span>',
      true
    );
    this.displayOutput(
      '  <span class="command-name">ps</span>                   - List running processes',
      true
    );
    this.displayOutput(
      '  <span class="command-name">kill</span> <pid>           - Terminate a process',
      true
    );
    this.displayOutput(
      '  <span class="command-name">run</span> <name>           - Start a new process',
      true
    );

    this.displayOutput(
      '<span class="command-group">System Info & Utilities:</span>',
      true
    );
    this.displayOutput(
      '  <span class="command-name">help</span>                 - Display this help information',
      true
    );
    this.displayOutput(
      '  <span class="command-name">clear</span>                - Clear the terminal',
      true
    );
    this.displayOutput(
      '  <span class="command-name">mem</span>                  - Display memory usage',
      true
    );
    this.displayOutput(
      '  <span class="command-name">disk</span>                 - Display disk usage',
      true
    );
    this.displayOutput(
      '  <span class="command-name">whoami</span>               - Display current user',
      true
    );
    this.displayOutput(
      '  <span class="command-name">date</span>                 - Display current date and time',
      true
    );
    this.displayOutput(
      '  <span class="command-name">shutdown</span>             - Shutdown the system',
      true
    );
  }

  listCommand(args) {
    const path = args.length > 0 ? args[0] : null;
    let items;

    if (path) {
      const targetPath = path.startsWith("/")
        ? path
        : this.os.fileSystem.currentPath === "/"
        ? "/" + path
        : this.os.fileSystem.currentPath + "/" + path;

      const targetDir = this.os.fileSystem.navigateTo(targetPath);
      if (!targetDir || targetDir.type !== "folder") {
        this.displayOutput(
          `<span class="error-text">ls: cannot access '${path}': No such directory</span>`,
          true
        );
        return;
      }

      items = Object.values(targetDir.children);
    } else {
      items = this.os.fileSystem.listDirectory();
    }

    if (!items || items.length === 0) {
      this.displayOutput("No files or directories");
      return;
    }

    const displayPath = path || this.os.fileSystem.currentPath;
    this.displayOutput(
      `<span class="heading-text">Contents of ${displayPath}:</span>`,
      true
    );

    let tableHtml = '<div class="ls-table">';
    tableHtml += '<div class="ls-header">';
    tableHtml += '<span class="ls-name">Name</span>';
    tableHtml += '<span class="ls-type">Type</span>';
    tableHtml += '<span class="ls-size">Size</span>';
    tableHtml += '<span class="ls-modified">Modified</span>';
    tableHtml += "</div>";

    items.forEach((item) => {
      tableHtml += '<div class="ls-row">';

      const icon = item.type === "folder" ? "📁" : "📄";
      const color = item.type === "folder" ? "folder-text" : "file-text";
      tableHtml += `<span class="ls-name ${color}">${icon} ${item.name}</span>`;

      tableHtml += `<span class="ls-type">${item.type}</span>`;

      const size = item.type === "folder" ? "-" : `${item.size} bytes`;
      tableHtml += `<span class="ls-size">${size}</span>`;

      const date = item.modified.toLocaleString();
      tableHtml += `<span class="ls-modified">${date}</span>`;

      tableHtml += "</div>";
    });

    tableHtml += "</div>";
    this.displayOutput(tableHtml, true);
  }

  changeDirectoryCommand(args) {
    if (args.length === 0) {
      this.displayOutput(
        `Current directory: ${this.os.fileSystem.currentPath}`
      );
      return;
    }

    const path = args[0];
    const success = this.os.fileSystem.changeDirectory(path);

    if (!success) {
      this.displayOutput(`cd: cannot change to '${path}': No such directory`);
    } else {
      this.os.fileSystem.displayFiles();
    }
  }

  catCommand(args) {
    if (args.length === 0) {
      this.displayOutput("cat: missing file operand");
      return;
    }

    const fileName = args[0];
    const path = fileName.startsWith("/")
      ? fileName
      : this.os.fileSystem.currentPath === "/"
      ? "/" + fileName
      : this.os.fileSystem.currentPath + "/" + fileName;

    const content = this.os.fileSystem.readFile(path);

    if (content === null) {
      this.displayOutput(`cat: ${fileName}: No such file`);
    } else {
      this.displayOutput(content);
    }
  }

  makeDirectoryCommand(args) {
    if (args.length === 0) {
      this.displayOutput("mkdir: missing operand");
      return;
    }

    const dirName = args[0];
    const success = this.os.fileSystem.createFolder(
      this.os.fileSystem.currentPath,
      dirName
    );

    if (!success) {
      this.displayOutput(
        `mkdir: cannot create directory '${dirName}': Already exists`
      );
    }
  }

  touchCommand(args) {
    if (args.length === 0) {
      this.displayOutput("touch: missing operand");
      return;
    }

    const fileName = args[0];
    const success = this.os.fileSystem.createFile(
      this.os.fileSystem.currentPath,
      fileName
    );

    if (!success) {
      this.displayOutput(
        `touch: cannot create file '${fileName}': Already exists`
      );
    }
  }

  removeCommand(args) {
    if (args.length === 0) {
      this.displayOutput("rm: missing operand");
      return;
    }

    const name = args[0];
    const path =
      this.os.fileSystem.currentPath === "/"
        ? "/" + name
        : this.os.fileSystem.currentPath + "/" + name;

    const success = this.os.fileSystem.deleteItem(path);

    if (!success) {
      this.displayOutput(
        `rm: cannot remove '${name}': No such file or directory`
      );
    }
  }

  echoCommand(args) {
    if (args.length === 0) {
      this.displayOutput("");
      return;
    }

    const redirectIndex = args.indexOf(">");

    if (redirectIndex === -1) {
      this.displayOutput(args.join(" "));
    } else {
      const text = args.slice(0, redirectIndex).join(" ");
      const fileName = args[redirectIndex + 1];

      if (!fileName) {
        this.displayOutput("echo: missing file operand after '>'");
        return;
      }

      const path =
        this.os.fileSystem.currentPath === "/"
          ? "/" + fileName
          : this.os.fileSystem.currentPath + "/" + fileName;

      if (this.os.fileSystem.readFile(path) === null) {
        const dirPath = this.os.fileSystem.getParentPath(path);
        const name = path.split("/").pop();
        this.os.fileSystem.createFile(dirPath, name, text);
      } else {
        this.os.fileSystem.writeFile(path, text);
      }
    }
  }

  processCommand() {
    const processes = this.os.processManager.listProcesses();

    if (processes.length === 0) {
      this.displayOutput("No running processes.");
      return;
    }

    this.displayOutput("PID\tName\t\tStatus\t\tCPU\tMemory\tStarted");
    this.displayOutput(
      "--------------------------------------------------------------------"
    );

    processes.forEach((proc) => {
      const started = proc.startTime.toLocaleTimeString();
      this.displayOutput(
        `${proc.pid}\t${proc.name}\t\t${proc.status}\t\t${proc.cpu}%\t${proc.memory}MB\t${started}`
      );
    });
  }

  killCommand(args) {
    if (args.length === 0) {
      this.displayOutput("kill: missing PID");
      return;
    }

    const pid = parseInt(args[0]);

    if (isNaN(pid)) {
      this.displayOutput(`kill: invalid PID: ${args[0]}`);
      return;
    }

    const success = this.os.processManager.killProcess(pid);

    if (!success) {
      this.displayOutput(`kill: process with PID ${pid} does not exist`);
    } else {
      this.displayOutput(`Process ${pid} terminated`);
    }
  }

  runCommand(args) {
    if (args.length === 0) {
      this.displayOutput("run: missing application name");
      return;
    }

    const name = args[0];
    const proc = this.os.processManager.startProcess(name, args.slice(1));

    if (proc) {
      this.displayOutput(`Started ${name} with PID ${proc.pid}`);
    } else {
      this.displayOutput(`run: failed to start '${name}'`);
    }
  }

  clearCommand() {
    this.terminal.innerHTML = "";
  }

  shutdownCommand() {
    this.displayOutput("Initiating system shutdown...");
    setTimeout(() => {
      this.os.shutdown();
    }, 1000);
  }

  memoryCommand() {
    const totalMemory = 8192;
    const usedMemory = Math.floor(Math.random() * 4000) + 2000;
    const freeMemory = totalMemory - usedMemory;
    const usedPercentage = Math.floor((usedMemory / totalMemory) * 100);

    this.displayOutput('<span class="heading-text">Memory Usage:</span>', true);
    this.displayOutput(
      `<div class="mem-bar">
      <div class="mem-used" style="width: ${usedPercentage}%">${usedPercentage}%</div>
    </div>`,
      true
    );
    this.displayOutput(`Total: ${totalMemory}MB`);
    this.displayOutput(
      `Used: <span class="warning-text">${usedMemory}MB</span>`,
      true
    );
    this.displayOutput(
      `Free: <span class="success-text">${freeMemory}MB</span>`,
      true
    );

    this.displayOutput(
      '<span class="heading-text">Top Memory Processes:</span>',
      true
    );

    const topProcs = this.os.processManager
      .listProcesses()
      .sort((a, b) => b.memory - a.memory)
      .slice(0, 5);

    topProcs.forEach((proc) => {
      const memPercentage = Math.floor((proc.memory / totalMemory) * 1000) / 10;
      this.displayOutput(
        `${proc.pid.toString().padStart(4)}: ${proc.name.padEnd(
          15
        )} <span class="warning-text">${
          proc.memory
        }MB</span> (${memPercentage}%)`,
        true
      );
    });
  }

  diskCommand() {
    const diskInfo = this.os.ioManager.devices.disk;
    const usedPercentage = Math.floor(
      (diskInfo.used / diskInfo.capacity) * 100
    );

    this.displayOutput('<span class="heading-text">Disk Usage:</span>', true);
    this.displayOutput(
      `<div class="disk-bar">
      <div class="disk-used" style="width: ${usedPercentage}%">${usedPercentage}%</div>
    </div>`,
      true
    );
    this.displayOutput(`Total: ${diskInfo.capacity}MB`);
    this.displayOutput(
      `Used: <span class="warning-text">${Math.floor(diskInfo.used)}MB</span>`,
      true
    );
    this.displayOutput(
      `Free: <span class="success-text">${Math.floor(
        diskInfo.capacity - diskInfo.used
      )}MB</span>`,
      true
    );

    this.displayOutput("");
    this.displayOutput("To test disk performance:");
    this.displayOutput(
      '  <span class="command-text">disk read <size></span> - Read test (e.g. disk read 100)',
      true
    );
    this.displayOutput(
      '  <span class="command-text">disk write <size></span> - Write test (e.g. disk write 50)',
      true
    );

    if (arguments[0] && arguments[0].length >= 1) {
      const subCommand = arguments[0][0];
      const size = parseInt(arguments[0][1]) || 10;

      if (subCommand === "read") {
        this.os.ioManager.readDisk(size);
      } else if (subCommand === "write") {
        this.os.ioManager.writeDisk(size);
      }
    }
  }

  whoamiCommand() {
    this.displayOutput('<span class="success-text">user</span>', true);
  }

  dateCommand() {
    const now = new Date();
    this.displayOutput(
      `<span class="heading-text">${now.toLocaleString()}</span>`,
      true
    );
  }

  findCommand(args) {
    if (args.length === 0) {
      this.displayOutput(
        '<span class="error-text">find: missing pattern</span>',
        true
      );
      this.displayOutput("Usage: find <pattern> [path]");
      return;
    }

    const pattern = args[0];
    const startPath = args[1] || this.os.fileSystem.currentPath;

    this.displayOutput(`Searching for "${pattern}" in ${startPath}...`);

    const searchResults = [];
    this.findFiles(startPath, pattern, searchResults);

    if (searchResults.length === 0) {
      this.displayOutput("No matching files found.");
    } else {
      this.displayOutput(
        `<span class="heading-text">Found ${searchResults.length} results:</span>`,
        true
      );
      searchResults.forEach((path) => {
        this.displayOutput(`<span class="file-text">${path}</span>`, true);
      });
    }
  }

  findFiles(currentPath, pattern, results) {
    const dir = this.os.fileSystem.navigateTo(currentPath);
    if (!dir) return;

    Object.entries(dir.children).forEach(([name, item]) => {
      const fullPath =
        currentPath === "/" ? `/${name}` : `${currentPath}/${name}`;

      if (name.includes(pattern)) {
        results.push(fullPath);
      }

      if (
        item.type === "file" &&
        item.content &&
        item.content.includes(pattern)
      ) {
        if (!results.includes(fullPath)) {
          results.push(fullPath + " (content match)");
        }
      }

      if (item.type === "folder") {
        this.findFiles(fullPath, pattern, results);
      }
    });
  }
}
