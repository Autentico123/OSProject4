class OperatingSystem {
  constructor() {
    this.fileSystem = null;
    this.commandInterpreter = null;
    this.processManager = null;
    this.ioManager = null;
    this.running = false;
  }

  boot() {
    console.log("Booting OS...");

    this.fileSystem = new FileSystem();
    this.processManager = new ProcessManager();
    this.ioManager = new IOManager(this);
    this.commandInterpreter = new CommandInterpreter(this);

    this.setupEventListeners();

    this.fileSystem.createFolder("/", "home");
    this.fileSystem.createFolder("/home", "user");
    this.fileSystem.createFile(
      "/home/user",
      "welcome.txt",
      'Welcome to OS Simulation!\nType "help" to see available commands.'
    );

    this.fileSystem.displayFiles();

    this.running = true;

    this.commandInterpreter.displayOutput("OS Simulation v1.0");
    this.commandInterpreter.displayOutput(
      "Type 'help' for available commands."
    );
    this.commandInterpreter.displayPrompt();
  }

  setupEventListeners() {
    const terminalInput = document.getElementById("terminalInput");
    terminalInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const command = terminalInput.value;
        this.commandInterpreter.processCommand(command);
        terminalInput.value = "";
      }
    });

    document
      .getElementById("createFileBtn")
      .addEventListener("click", () => this.showCreateItemModal("file"));
    document
      .getElementById("createFolderBtn")
      .addEventListener("click", () => this.showCreateItemModal("folder"));
    document
      .getElementById("saveItemBtn")
      .addEventListener("click", () => this.saveNewItem());

    document
      .getElementById("printBtn")
      .addEventListener("click", () => this.ioManager.usePrinter());
    document
      .getElementById("networkBtn")
      .addEventListener("click", () => this.ioManager.simulateNetworkTraffic());
  }

  showCreateItemModal(type) {
    const modal = new bootstrap.Modal(
      document.getElementById("createItemModal")
    );
    document.getElementById("createItemTitle").textContent =
      type === "file" ? "Create New File" : "Create New Folder";
    document.getElementById("fileContentGroup").style.display =
      type === "file" ? "block" : "none";

    document.getElementById("saveItemBtn").dataset.type = type;

    modal.show();
  }

  saveNewItem() {
    const name = document.getElementById("itemName").value;
    const type = document.getElementById("saveItemBtn").dataset.type;
    const currentPath = this.fileSystem.currentPath;

    if (!name) {
      alert("Please enter a name");
      return;
    }

    if (type === "file") {
      const content = document.getElementById("fileContent").value;
      this.fileSystem.createFile(currentPath, name, content);
    } else {
      this.fileSystem.createFolder(currentPath, name);
    }

    const modal = bootstrap.Modal.getInstance(
      document.getElementById("createItemModal")
    );
    modal.hide();
    document.getElementById("itemName").value = "";
    document.getElementById("fileContent").value = "";

    this.fileSystem.displayFiles();
  }

  shutdown() {
    this.running = false;
    this.processManager.killAllProcesses();
    this.commandInterpreter.displayOutput("System shutting down...");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.os = new OperatingSystem();
  window.os.boot();
});
