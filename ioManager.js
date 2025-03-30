class IOManager {
  constructor(os) {
    this.os = os;
    this.devices = {
      printer: {
        status: "idle",
        progress: 0,
        queue: [],
      },
      disk: {
        capacity: 1000,
        used: 250,
        files: 0,
      },
      network: {
        status: "connected",
        activity: 0,
        trafficRate: 0,
      },
    };

    this.monitorInterval = setInterval(() => this.monitorDevices(), 500);
    this.updateDeviceUI();
  }

  monitorDevices() {
    if (!window.os || !window.os.running) {
      clearInterval(this.monitorInterval);
      return;
    }

    if (this.devices.printer.status === "printing") {
      this.devices.printer.progress += 5;

      if (this.devices.printer.progress >= 100) {
        this.devices.printer.progress = 0;
        this.devices.printer.status = "idle";

        if (this.devices.printer.queue.length > 0) {
          setTimeout(() => this.startPrinting(), 1000);
        } else {
          this.os.commandInterpreter.displayOutput(
            "Printer: Print job completed."
          );
        }
      }
    }

    if (this.devices.network.activity > 0) {
      this.devices.network.activity -= 2;
      if (this.devices.network.activity <= 0) {
        this.devices.network.activity = 0;
        this.devices.network.trafficRate = 0;
      }
    }

    if (Math.random() < 0.05) {
      const change = Math.random() * 10 - 5;
      this.devices.disk.used = Math.max(
        0,
        Math.min(this.devices.disk.capacity, this.devices.disk.used + change)
      );
    }

    this.updateDeviceUI();
  }

  updateDeviceUI() {
    const printerBar = document.getElementById("printerStatus");
    printerBar.style.width = `${this.devices.printer.progress}%`;
    printerBar.textContent =
      this.devices.printer.status === "printing"
        ? `${this.devices.printer.progress}%`
        : "";

    printerBar.className = "progress-bar";

    if (this.devices.printer.status === "printing") {
      printerBar.classList.add(
        "bg-primary",
        "progress-bar-striped",
        "progress-bar-animated"
      );

      document.getElementById("printBtn").disabled = true;
      document.getElementById("printBtn").innerHTML =
        '<i class="bi bi-hourglass-split"></i> Printing...';
    } else {
      document.getElementById("printBtn").disabled = false;
      document.getElementById("printBtn").innerHTML =
        '<i class="bi bi-file-earmark-text"></i> Print Document';
    }

    const diskBar = document.getElementById("diskStatus");
    const diskPercentage =
      (this.devices.disk.used / this.devices.disk.capacity) * 100;
    diskBar.style.width = `${diskPercentage}%`;
    diskBar.textContent = `${Math.round(diskPercentage)}%`;

    if (diskPercentage > 80) {
      diskBar.className = "progress-bar bg-danger";
    } else if (diskPercentage > 60) {
      diskBar.className = "progress-bar bg-warning";
    } else {
      diskBar.className = "progress-bar bg-info";
    }

    const diskInfoElement = document.querySelector(".device-item:nth-child(2)");
    if (diskInfoElement && !diskInfoElement.querySelector(".disk-info")) {
      const diskInfo = document.createElement("div");
      diskInfo.className = "disk-info mt-2 small";
      diskInfoElement.appendChild(diskInfo);
    }

    const diskInfo = document.querySelector(".disk-info");
    if (diskInfo) {
      diskInfo.innerHTML = `
        <div class="d-flex justify-content-between">
          <span>Used: ${Math.round(this.devices.disk.used)} MB</span>
          <span>Free: ${Math.round(
            this.devices.disk.capacity - this.devices.disk.used
          )} MB</span>
        </div>
      `;
    }

    const networkBar = document.getElementById("networkStatus");
    networkBar.style.width = `${this.devices.network.activity}%`;

    if (this.devices.network.activity > 0) {
      networkBar.textContent = `${this.devices.network.trafficRate} KB/s`;
      networkBar.className =
        "progress-bar bg-success progress-bar-striped progress-bar-animated";

      document.getElementById("networkBtn").disabled = true;
      document.getElementById("networkBtn").innerHTML =
        '<i class="bi bi-arrow-repeat spinning"></i> Transferring...';
    } else {
      networkBar.textContent = "";
      networkBar.className = "progress-bar bg-success";

      document.getElementById("networkBtn").disabled = false;
      document.getElementById("networkBtn").innerHTML =
        '<i class="bi bi-cloud-arrow-up-down"></i> Simulate Traffic';
    }
  }

  usePrinter() {
    if (this.devices.printer.status === "printing") {
      this.devices.printer.queue.push({
        name: `Document-${Math.floor(Math.random() * 1000)}`,
        pages: Math.floor(Math.random() * 10) + 1,
      });

      this.os.commandInterpreter.displayOutput(
        "Printer: Document added to print queue."
      );
    } else {
      this.startPrinting();
    }
  }

  startPrinting() {
    this.devices.printer.status = "printing";
    this.devices.printer.progress = 0;

    this.os.processManager.startProcess("print_job", []);

    this.os.commandInterpreter.displayOutput(
      "Printer: Started printing document."
    );
  }

  simulateNetworkTraffic() {
    this.devices.network.activity = Math.min(
      100,
      this.devices.network.activity + 30
    );
    this.devices.network.trafficRate = Math.floor(Math.random() * 500) + 100;

    const proc = this.os.processManager.startProcess("network", ["transfer"]);

    this.os.commandInterpreter.displayOutput(
      `Network: Data transfer initiated (${this.devices.network.trafficRate} KB/s)`
    );

    setTimeout(() => {
      this.os.processManager.killProcess(proc.pid);
    }, 8000);
  }

  readDisk(fileSize = 10) {
    const proc = this.os.processManager.startProcess("disk_read", [
      `size=${fileSize}`,
    ]);

    this.os.commandInterpreter.displayOutput(
      `Disk: Reading ${fileSize}MB of data...`
    );

    const diskBar = document.getElementById("diskStatus");
    diskBar.classList.add("progress-bar-striped", "progress-bar-animated");

    setTimeout(() => {
      diskBar.classList.remove("progress-bar-striped", "progress-bar-animated");
      this.os.commandInterpreter.displayOutput(
        `Disk: Completed reading ${fileSize}MB of data.`
      );
      this.os.processManager.killProcess(proc.pid);
    }, fileSize * 200);

    return true;
  }

  writeDisk(fileSize = 10) {
    if (this.devices.disk.used + fileSize > this.devices.disk.capacity) {
      this.os.commandInterpreter.displayOutput(
        "Disk: Insufficient space for write operation."
      );
      return false;
    }

    const proc = this.os.processManager.startProcess("disk_write", [
      `size=${fileSize}`,
    ]);

    this.os.commandInterpreter.displayOutput(
      `Disk: Writing ${fileSize}MB of data...`
    );

    const diskBar = document.getElementById("diskStatus");
    diskBar.classList.add("progress-bar-striped", "progress-bar-animated");

    setTimeout(() => {
      this.devices.disk.used += fileSize;
      this.devices.disk.files++;

      this.updateDeviceUI();
      diskBar.classList.remove("progress-bar-striped", "progress-bar-animated");

      this.os.commandInterpreter.displayOutput(
        `Disk: Completed writing ${fileSize}MB of data.`
      );
      this.os.processManager.killProcess(proc.pid);
    }, fileSize * 300);

    return true;
  }
}
