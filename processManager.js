class ProcessManager {
  constructor() {
    this.processes = [];
    this.nextPid = 1;
    this.processTable = document.getElementById("processTable");

    this.schedulerInterval = setInterval(() => this.scheduler(), 1000);

    this.startSystemProcesses();
  }

  startProcess(name, args = []) {
    const pid = this.nextPid++;
    const process = {
      pid: pid,
      name: name,
      status: "running",
      priority: 1,
      cpu: Math.floor(Math.random() * 20) + 5,
      memory: Math.floor(Math.random() * 100) + 20,
      startTime: new Date(),
      args: args,
      runtime: 0,
    };

    this.processes.push(process);
    this.updateProcessTable();

    return process;
  }

  killProcess(pid) {
    const index = this.processes.findIndex((p) => p.pid === pid);
    if (index === -1) return false;

    if (pid < 10) {
      return false;
    }

    this.processes[index].status = "terminated";

    setTimeout(() => {
      this.processes = this.processes.filter((p) => p.pid !== pid);
      this.updateProcessTable();
    }, 2000);

    this.updateProcessTable();
    return true;
  }

  killAllProcesses() {
    const userProcesses = this.processes.filter((p) => p.pid >= 10);
    userProcesses.forEach((p) => this.killProcess(p.pid));
  }

  listProcesses() {
    return [...this.processes];
  }

  scheduler() {
    if (!window.os || !window.os.running) {
      clearInterval(this.schedulerInterval);
      return;
    }

    this.processes.forEach((process) => {
      if (process.status === "running") {
        process.runtime += 1;

        process.cpu = Math.min(
          100,
          Math.max(1, process.cpu + (Math.random() * 10 - 5))
        );
        process.memory = Math.max(5, process.memory + (Math.random() * 6 - 3));

        if (Math.random() < 0.1 && process.pid >= 10) {
          process.status = "sleeping";
          setTimeout(() => {
            if (this.processes.includes(process)) {
              process.status = "running";
              this.updateProcessTable();
            }
          }, Math.random() * 5000 + 2000);
        }
      }
    });

    this.updateProcessTable();
  }

  startSystemProcesses() {
    const systemProcesses = [
      { name: "system", args: [] },
      { name: "init", args: [] },
      { name: "kernel", args: [] },
      { name: "scheduler", args: [] },
    ];

    systemProcesses.forEach((proc) => {
      this.startProcess(proc.name, proc.args);
    });
  }

  updateProcessTable() {
    this.processTable.innerHTML = "";

    this.processes.forEach((process) => {
      const row = document.createElement("tr");

      if (process.status === "running") {
        row.classList.add("process-running");
      } else if (process.status === "sleeping") {
        row.classList.add("process-sleeping");
      } else if (process.status === "terminated") {
        row.classList.add("process-terminated");
      }

      const pidCell = document.createElement("td");
      pidCell.textContent = process.pid;

      const nameCell = document.createElement("td");

      let processIcon = "bi-cpu";
      if (process.name === "system" || process.name === "kernel") {
        processIcon = "bi-gear";
      } else if (process.name === "print_job") {
        processIcon = "bi-printer";
      } else if (process.name === "network") {
        processIcon = "bi-wifi";
      } else if (process.name.includes("disk")) {
        processIcon = "bi-hdd";
      }

      nameCell.innerHTML = `<i class="bi ${processIcon}"></i> ${process.name}`;

      const statusCell = document.createElement("td");
      let statusIcon = "";

      if (process.status === "running") {
        statusIcon = '<i class="bi bi-play-fill text-success"></i> ';
      } else if (process.status === "sleeping") {
        statusIcon = '<i class="bi bi-pause-fill text-warning"></i> ';
      } else if (process.status === "terminated") {
        statusIcon = '<i class="bi bi-stop-fill text-danger"></i> ';
      }

      statusCell.innerHTML = statusIcon + process.status;

      const cpuCell = document.createElement("td");
      const cpuPercentage = Math.round(process.cpu);
      cpuCell.innerHTML = `
        <div class="progress" style="height: 6px; width: 60px;">
          <div class="progress-bar ${
            cpuPercentage > 70
              ? "bg-danger"
              : cpuPercentage > 40
              ? "bg-warning"
              : "bg-success"
          }" 
              style="width: ${cpuPercentage}%"></div>
        </div>
        <small>${cpuPercentage}%</small>
      `;

      const actionsCell = document.createElement("td");

      if (process.pid >= 10) {
        const killBtn = document.createElement("button");
        killBtn.className = "btn btn-sm btn-danger";
        killBtn.innerHTML = '<i class="bi bi-x-octagon"></i>';
        killBtn.title = "Terminate process";
        killBtn.addEventListener("click", () => {
          this.killProcess(process.pid);
        });
        actionsCell.appendChild(killBtn);
      } else {
        actionsCell.innerHTML =
          '<span class="badge bg-secondary">System</span>';
      }

      row.appendChild(pidCell);
      row.appendChild(nameCell);
      row.appendChild(statusCell);
      row.appendChild(cpuCell);
      row.appendChild(actionsCell);

      this.processTable.appendChild(row);
    });
  }
}
