# OS Simulation Documentation

## Overview

This project is a web-based Operating System simulation that demonstrates the core concepts of an operating system through an interactive interface. It simulates file management, process management, command interpretation, and I/O device operations in a graphical user interface.

## System Architecture

The OS Simulation is built using HTML, CSS, and JavaScript with Bootstrap for UI components. The architecture follows a modular design with separate components for each major OS subsystem:

```
┌─────────────────────────────────┐
│          OperatingSystem        │ (Main Controller)
└───────────┬───────┬──────┬──────┘
            │       │      │
┌───────────▼┐ ┌────▼───┐ ┌▼────────┐ ┌───────────┐
│ FileSystem │ │Process │ │CommandInt│ │ IOManager │
│  Manager   │ │Manager │ │erpreter  │ │           │
└───────────┬┘ └────────┘ └──────────┘ └────┬──────┘
            │                                │
            │                                │
   ┌────────▼────────┐             ┌────────▼────────┐
   │   Virtual Disk  │             │   I/O Devices   │
   │  & File Storage │             │ (Printer, Network)
   └─────────────────┘             └─────────────────┘
```

## Components

### 1. Operating System (os.js)

The main controller that initializes and coordinates all other components. It:

- Boots up the system
- Provides a central point of control
- Handles system-wide events
- Manages the user interface interactions

### 2. File System (fileSystem.js)

Manages files and directories in a virtual file system. Features:

- Hierarchical directory structure
- File operations: create, read, write, delete
- Directory navigation
- Path resolution for absolute and relative paths
- Visual file explorer

### 3. Command Interpreter (commandInterpreter.js)

Provides a terminal interface for interacting with the system. Features:

- Command parsing and execution
- Command history with up/down arrows
- Tab completion for commands and paths
- Rich output formatting with colors
- Comprehensive command set including:
  - File management: `ls`, `cd`, `cat`, `mkdir`, `touch`, `rm`, `echo`
  - Process management: `ps`, `kill`, `run`
  - System utilities: `help`, `clear`, `mem`, `disk`, `date`, `whoami`, `find`

### 4. Process Manager (processManager.js)

Handles the creation, execution, and termination of processes. Features:

- Process scheduling
- Process states: running, sleeping, terminated
- System and user processes
- Resource usage tracking (CPU, memory)
- Process table visualization

### 5. I/O Device Manager (ioManager.js)

Simulates hardware devices and their operations. Devices include:

- Printer with queuing and print jobs
- Disk with storage capacity and read/write operations
- Network with data transfer simulation

## User Interface

The user interface is divided into four main sections:

1. **File System Panel**: Displays the current directory structure with files and folders that can be navigated through clicking.

2. **Terminal**: Accepts commands from the user and displays their output. Supports a wide range of commands for interacting with all aspects of the system.

3. **Process Manager**: Shows a table of currently running processes with their status, resource usage, and controls to terminate them.

4. **I/O Devices**: Displays the status of system devices and provides controls to interact with them.

## Command Reference

### File Management

| Command                | Description                | Example                     |
| ---------------------- | -------------------------- | --------------------------- |
| `ls [path]`            | List directory contents    | `ls /home`                  |
| `cd <path>`            | Change directory           | `cd /home/user`             |
| `cat <file>`           | Display file contents      | `cat welcome.txt`           |
| `mkdir <name>`         | Create a directory         | `mkdir documents`           |
| `touch <name>`         | Create a file              | `touch notes.txt`           |
| `rm <name>`            | Remove a file or directory | `rm old_file.txt`           |
| `echo <text> > <file>` | Write text to a file       | `echo Hello > greeting.txt` |
| `find <pattern>`       | Search for files           | `find .txt`                 |

### Process Management

| Command      | Description            | Example       |
| ------------ | ---------------------- | ------------- |
| `ps`         | List running processes | `ps`          |
| `kill <pid>` | Terminate a process    | `kill 15`     |
| `run <name>` | Start a new process    | `run browser` |

### System Utilities

| Command             | Description                   | Example         |
| ------------------- | ----------------------------- | --------------- |
| `help`              | Display help information      | `help`          |
| `clear`             | Clear the terminal            | `clear`         |
| `mem`               | Display memory usage          | `mem`           |
| `disk`              | Display disk usage            | `disk`          |
| `disk read <size>`  | Test disk read                | `disk read 100` |
| `disk write <size>` | Test disk write               | `disk write 50` |
| `whoami`            | Display current user          | `whoami`        |
| `date`              | Display current date and time | `date`          |
| `shutdown`          | Shutdown the system           | `shutdown`      |

## Features

### 1. Command History and Tab Completion

- Use the up and down arrow keys to navigate through previously entered commands
- Press Tab to complete commands and file paths
- Shows suggestions for multiple matches

### 2. Visual File System

- Graphical representation of files and folders
- Click to navigate and open files
- File icons based on file type

### 3. Real-time Process Monitoring

- Visual indication of process status (running, sleeping, terminated)
- CPU usage display with mini progress bars
- Process termination with kill button

### 4. Simulated I/O Operations

- Printer operations with progress indicator
- Disk usage monitoring
- Network traffic visualization

## Implementation Details

### Virtual File System

The file system is implemented as a tree structure in memory:

- Each node represents either a file or a folder
- Files store content, size, and metadata
- Folders contain child nodes (files or other folders)
- Paths are resolved by traversing the tree

### Process Scheduling

Processes are scheduled using JavaScript's `setInterval`:

- Updates process states and resource usage periodically
- Simulates CPU time-sharing by randomly adjusting CPU usage
- Handles process state transitions (running, sleeping, terminated)

### Command Processing

Commands are processed through a command registry pattern:

- Each command is registered with a handler function
- Input is parsed to extract command and arguments
- The appropriate handler is invoked with the arguments

### I/O Device Simulation

I/O operations are simulated using timers and progress indicators:

- Print jobs take time proportional to job size
- Disk operations have read/write delays based on data size
- Network operations show bandwidth utilization

## Getting Started

To run the OS Simulation:

1. Open `index.html` in a modern web browser
2. The system will automatically boot and present the interface
3. Use the terminal to enter commands or interact with the graphical elements
4. Try running basic commands like `help` to learn about available features

## Example Usage Scenarios

### Creating and Editing Files

```
mkdir documents
cd documents
touch notes.txt
echo This is a test file > notes.txt
cat notes.txt
```

### Managing Processes

```
run browser
ps
kill 15
```

### Checking System Status

```
mem
disk
date
```

## Design Choices

1. **Modular Architecture**: Each component is self-contained with clear responsibilities, allowing for easy maintenance and extension.

2. **Rich Terminal Interface**: Provides a familiar command-line experience with modern enhancements like tab completion and command history.

3. **Visual Feedback**: All operations provide immediate visual feedback, making the abstract concepts of OS operations more concrete and understandable.

4. **Realistic Simulations**: Processes and I/O operations take time to complete, simulating real-world constraints and demonstrating concepts like queuing and scheduling.

## Future Enhancements

Potential areas for future development:

1. **User Accounts and Permissions**: Implement user authentication and file permissions
2. **Networking**: Add more sophisticated network simulation with protocols and services
3. **Package Management**: Create a simulated package system for installing applications
4. **Graphical Applications**: Implement windowed applications that run as processes
5. **File System Persistence**: Save the file system state between sessions
