class FileSystem {
  constructor() {
    this.root = {
      name: "/",
      type: "folder",
      children: {},
      created: new Date(),
      modified: new Date(),
    };

    this.currentPath = "/";
    this.fileExplorer = document.getElementById("fileExplorer");
  }

  navigateTo(path) {
    if (path === "/") return this.root;

    const parts = path.split("/").filter((p) => p);
    let current = this.root;

    for (const part of parts) {
      if (!current.children[part] || current.children[part].type !== "folder") {
        return null;
      }
      current = current.children[part];
    }

    return current;
  }

  createFolder(parentPath, name) {
    const parent = this.navigateTo(parentPath);
    if (!parent) return false;

    if (parent.children[name]) return false;

    parent.children[name] = {
      name: name,
      type: "folder",
      children: {},
      created: new Date(),
      modified: new Date(),
      parent: parent,
    };

    parent.modified = new Date();
    this.displayFiles();
    return true;
  }

  createFile(parentPath, name, content = "") {
    const parent = this.navigateTo(parentPath);
    if (!parent) return false;

    if (parent.children[name]) return false;

    parent.children[name] = {
      name: name,
      type: "file",
      content: content,
      size: content.length,
      created: new Date(),
      modified: new Date(),
      parent: parent,
    };

    parent.modified = new Date();
    this.displayFiles();
    return true;
  }

  // Enhanced delete item with UI feedback
  deleteItem(path) {
    if (path === "/") return false;

    const parentPath = this.getParentPath(path);
    const itemName = path
      .split("/")
      .filter((p) => p)
      .pop();
    const parent = this.navigateTo(parentPath);

    if (!parent || !parent.children[itemName]) return false;

    // Get type for feedback
    const type = parent.children[itemName].type;

    delete parent.children[itemName];
    parent.modified = new Date();
    this.displayFiles();

    return { success: true, type: type };
  }

  readFile(path) {
    const parentPath = this.getParentPath(path);
    const fileName = path
      .split("/")
      .filter((p) => p)
      .pop();
    const parent = this.navigateTo(parentPath);

    if (
      !parent ||
      !parent.children[fileName] ||
      parent.children[fileName].type !== "file"
    ) {
      return null;
    }

    return parent.children[fileName].content;
  }

  writeFile(path, content) {
    const parentPath = this.getParentPath(path);
    const fileName = path
      .split("/")
      .filter((p) => p)
      .pop();
    const parent = this.navigateTo(parentPath);

    if (
      !parent ||
      !parent.children[fileName] ||
      parent.children[fileName].type !== "file"
    ) {
      return false;
    }

    parent.children[fileName].content = content;
    parent.children[fileName].modified = new Date();
    parent.children[fileName].size = content.length;

    return true;
  }

  getParentPath(path) {
    const parts = path.split("/").filter((p) => p);
    if (parts.length === 0) return "/";
    parts.pop();
    return "/" + parts.join("/");
  }

  changeDirectory(path) {
    let targetPath;

    if (path.startsWith("/")) {
      targetPath = path;
    } else if (path === "..") {
      targetPath = this.getParentPath(this.currentPath);
    } else {
      targetPath =
        this.currentPath === "/" ? "/" + path : this.currentPath + "/" + path;
    }

    const target = this.navigateTo(targetPath);
    if (!target || target.type !== "folder") {
      return false;
    }

    this.currentPath = targetPath;
    if (this.currentPath !== "/" && this.currentPath.endsWith("/")) {
      this.currentPath = this.currentPath.slice(0, -1);
    }

    return true;
  }

  listDirectory(path = null) {
    const targetPath = path || this.currentPath;
    const directory = this.navigateTo(targetPath);

    if (!directory) return null;

    return Object.values(directory.children).map((item) => ({
      name: item.name,
      type: item.type,
      size: item.type === "file" ? item.size : null,
      created: item.created,
      modified: item.modified,
    }));
  }

  // Enhanced displayFiles to support right-click context menu
  displayFiles() {
    this.fileExplorer.innerHTML = "";

    // Add "back" option if not at root (fix for parent directory navigation)
    if (this.currentPath !== "/") {
      const backEl = document.createElement("div");
      backEl.className = "file-item folder";
      backEl.innerHTML =
        '<span class="icon"><i class="bi bi-arrow-up-circle"></i></span> ..';
      backEl.addEventListener("click", () => {
        this.changeDirectory("..");
        this.displayFiles();
      });

      // Don't add context menu to parent directory navigation
      this.fileExplorer.appendChild(backEl);
    }

    // Show current path at the top
    const pathEl = document.createElement("div");
    pathEl.className = "current-path mb-2";
    pathEl.innerHTML = `<i class="bi bi-folder2-open"></i> ${this.currentPath}`;
    this.fileExplorer.appendChild(pathEl);

    const currentNode = this.navigateTo(this.currentPath);
    if (!currentNode) {
      // Handle case where the current path is invalid
      this.currentPath = "/";
      this.displayFiles();
      return;
    }

    this.buildFileTree(currentNode, this.fileExplorer);

    // Add direct click handler to the container to close any open context menus
    document.addEventListener("click", (e) => {
      const contextMenu = document.querySelector(".context-menu");
      if (contextMenu && !contextMenu.contains(e.target)) {
        contextMenu.remove();
      }
    });
  }

  // Extract buildFileTree to a separate method for cleaner code
  buildFileTree(node, element, indent = 0) {
    const items = Object.values(node.children).sort((a, b) => {
      if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    for (const item of items) {
      const itemEl = document.createElement("div");
      itemEl.className = "file-item";

      if (indent > 0) {
        itemEl.classList.add("indented");
        itemEl.style.marginLeft = `${indent * 20}px`;
      }

      const iconSpan = document.createElement("span");
      iconSpan.className = "icon";

      if (item.type === "folder") {
        iconSpan.innerHTML = '<i class="bi bi-folder-fill"></i> ';
        itemEl.classList.add("folder");
      } else {
        const extension = item.name.split(".").pop().toLowerCase();
        let icon = "bi-file-earmark";

        if (["txt", "md"].includes(extension)) {
          icon = "bi-file-earmark-text";
        } else if (["jpg", "png", "gif"].includes(extension)) {
          icon = "bi-file-earmark-image";
        } else if (["pdf"].includes(extension)) {
          icon = "bi-file-earmark-pdf";
        } else if (["js", "html", "css", "py"].includes(extension)) {
          icon = "bi-file-earmark-code";
        }

        iconSpan.innerHTML = `<i class="bi ${icon}"></i> `;
        itemEl.classList.add("file");
      }

      itemEl.appendChild(iconSpan);
      itemEl.appendChild(document.createTextNode(item.name));

      // Add actions menu directly in the item
      const actionsSpan = document.createElement("span");
      actionsSpan.className = "file-actions";
      actionsSpan.innerHTML = "•••";
      itemEl.appendChild(actionsSpan);

      // Add the primary click actions
      if (item.type === "folder") {
        itemEl.addEventListener("click", (e) => {
          if (e.target === actionsSpan || actionsSpan.contains(e.target)) {
            // If clicking on the actions button, don't navigate
            e.stopPropagation();
            return;
          }

          e.stopPropagation();
          const path =
            this.currentPath === "/"
              ? "/" + item.name
              : this.currentPath + "/" + item.name;
          this.changeDirectory(path);
          this.displayFiles();
        });
      } else {
        itemEl.addEventListener("click", (e) => {
          if (e.target === actionsSpan || actionsSpan.contains(e.target)) {
            // If clicking on the actions button, don't open file
            e.stopPropagation();
            return;
          }

          e.stopPropagation();
          const path =
            this.currentPath === "/"
              ? "/" + item.name
              : this.currentPath + "/" + item.name;
          const content = this.readFile(path);
          window.os.commandInterpreter.displayOutput(
            `<span class="heading-text">Content of ${item.name}:</span>\n${content}`,
            true
          );
        });
      }

      // Add actions menu click handler
      actionsSpan.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Remove any existing context menus
        const existingMenu = document.querySelector(".context-menu");
        if (existingMenu) existingMenu.remove();

        const path =
          this.currentPath === "/"
            ? "/" + item.name
            : this.currentPath + "/" + item.name;

        // Calculate position relative to the actions menu
        const rect = actionsSpan.getBoundingClientRect();
        this.showContextMenu(rect.right, rect.top, path, item.type, item.name);
      });

      // Add context menu for right-click operations
      itemEl.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Remove any existing context menus
        const existingMenu = document.querySelector(".context-menu");
        if (existingMenu) existingMenu.remove();

        const path =
          this.currentPath === "/"
            ? "/" + item.name
            : this.currentPath + "/" + item.name;

        // Show context menu at the right position
        this.showContextMenu(e.clientX, e.clientY, path, item.type, item.name);
      });

      element.appendChild(itemEl);
    }
  }

  // Rename a file or folder
  renameItem(path, newName) {
    if (path === "/") return false;

    // Get parent path and current item name
    const parentPath = this.getParentPath(path);
    const itemName = path
      .split("/")
      .filter((p) => p)
      .pop();
    const parent = this.navigateTo(parentPath);

    // Check if source exists
    if (!parent || !parent.children[itemName]) return false;

    // Check if target name already exists in the same directory
    if (parent.children[newName]) return false;

    // Get the item to rename
    const item = parent.children[itemName];

    // Create a copy with the new name
    parent.children[newName] = {
      ...item,
      name: newName,
      modified: new Date(),
    };

    // Delete the old entry
    delete parent.children[itemName];

    // Update parent modified time
    parent.modified = new Date();

    // Update UI
    this.displayFiles();
    return true;
  }

  // Improved context menu for file operations
  showContextMenu(x, y, path, type, name) {
    // Close any existing menus
    const existingMenu = document.querySelector(".context-menu");
    if (existingMenu) existingMenu.remove();

    const menu = document.createElement("div");
    menu.className = "context-menu";

    // Create menu items
    const rename = document.createElement("div");
    rename.className = "context-menu-item";
    rename.innerHTML = '<i class="bi bi-pencil"></i> Rename';

    const deleteItem = document.createElement("div");
    deleteItem.className = "context-menu-item";
    deleteItem.innerHTML = '<i class="bi bi-trash"></i> Delete';

    // Add event handlers
    rename.onclick = (e) => {
      e.stopPropagation();
      const newName = prompt(`Rename ${type}:`, name);
      if (newName && newName.trim() && newName.trim() !== name) {
        const success = this.renameItem(path, newName.trim());
        if (!success) {
          alert(
            `Cannot rename: item with name "${newName}" already exists or source not found.`
          );
        }
      }
      menu.remove();
    };

    deleteItem.onclick = (e) => {
      e.stopPropagation();
      if (confirm(`Are you sure you want to delete this ${type}?`)) {
        const result = this.deleteItem(path);
        if (!result.success) {
          alert(`Could not delete ${type}.`);
        }
      }
      menu.remove();
    };

    // Build menu
    menu.appendChild(rename);
    menu.appendChild(deleteItem);
    document.body.appendChild(menu);

    // Set position
    menu.style.top = `${y}px`;
    menu.style.left = `${x}px`;

    // Improve context menu positioning if it goes outside the window
    const menuRect = menu.getBoundingClientRect();
    if (menuRect.right > window.innerWidth) {
      menu.style.left = `${x - menuRect.width}px`;
    }
    if (menuRect.bottom > window.innerHeight) {
      menu.style.top = `${y - menuRect.height}px`;
    }

    // Close menu when clicking outside
    setTimeout(() => {
      document.addEventListener("click", function closeMenu(e) {
        if (!menu.contains(e.target)) {
          menu.remove();
          document.removeEventListener("click", closeMenu);
        }
      });
    }, 0);
  }
}
