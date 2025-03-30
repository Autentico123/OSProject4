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

  deleteItem(path) {
    if (path === "/") return false;

    const parentPath = this.getParentPath(path);
    const itemName = path
      .split("/")
      .filter((p) => p)
      .pop();
    const parent = this.navigateTo(parentPath);

    if (!parent || !parent.children[itemName]) return false;

    delete parent.children[itemName];
    parent.modified = new Date();
    this.displayFiles();
    return true;
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

  displayFiles() {
    this.fileExplorer.innerHTML = "";

    const buildFileTree = (node, element, indent = 0) => {
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

        if (item.type === "folder") {
          itemEl.addEventListener("click", (e) => {
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

        element.appendChild(itemEl);
      }
    };

    if (this.currentPath !== "/") {
      const backEl = document.createElement("div");
      backEl.className = "file-item folder";
      backEl.innerHTML =
        '<span class="icon"><i class="bi bi-arrow-up-circle"></i></span> ..';
      backEl.addEventListener("click", () => {
        this.changeDirectory("..");
        this.displayFiles();
      });
      this.fileExplorer.appendChild(backEl);
    }

    const pathEl = document.createElement("div");
    pathEl.className = "current-path mb-2";
    pathEl.innerHTML = `<i class="bi bi-folder2-open"></i> ${this.currentPath}`;
    this.fileExplorer.appendChild(pathEl);

    const currentNode = this.navigateTo(this.currentPath);
    buildFileTree(currentNode, this.fileExplorer);
  }
}
