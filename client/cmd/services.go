package cmd

import (
        "fmt"
        "github.com/spf13/cobra"
        "os"
        "os/exec"
        "runtime"
        "strings"
)

// morio start
var startCmd = &cobra.Command{
        Use:   "start",
        Short: "Start agents",
        Long:  "Starts all beats agents, or the one you pass it",
        Example: `  Start all agents:
    morio start

  Start a specific agent:
    morio start logs`,
        Run: func(cmd *cobra.Command, args []string) {
                if len(args) == 0 {
                        if runtime.GOOS == "linux" {
                                ChangeAgentState("audit", "start")
                        }
                        ChangeAgentState("logs", "start")
                        ChangeAgentState("metrics", "start")
                        ShowStatus()
                } else if args[0] == "audit" {
                        if runtime.GOOS != "linux" {
                                fmt.Println("Audit agent is only available on Linux")
                                return
                        }
                        ChangeAgentState("audit", "start")
                        ShowStatus()
                } else if args[0] == "logs" {
                        ChangeAgentState("logs", "start")
                        ShowStatus()
                } else if args[0] == "metrics" {
                        ChangeAgentState("metrics", "start")
                        ShowStatus()
                } else {
                        _ = cmd.Help()
                }
        },
}

// morio stop
var stopCmd = &cobra.Command{
        Use:   "stop",
        Short: "Stop agents",
        Long:  "Stops all beats agents, or the one you pass it",
        Example: `  Stops all agents:
    morio stop

  Stop a specific agent:
    morio stop logs`,
        Run: func(cmd *cobra.Command, args []string) {
                if len(args) == 0 {
                        if runtime.GOOS == "linux" {
                                ChangeAgentState("audit", "stop")
                        }
                        ChangeAgentState("logs", "stop")
                        ChangeAgentState("metrics", "stop")
                        ShowStatus()
                } else if args[0] == "audit" {
                        if runtime.GOOS != "linux" {
                                fmt.Println("Audit agent is only available on Linux")
                                return
                        }
                        ChangeAgentState("audit", "stop")
                        ShowStatus()
                } else if args[0] == "logs" {
                        ChangeAgentState("logs", "stop")
                        ShowStatus()
                } else if args[0] == "metrics" {
                        ChangeAgentState("metrics", "stop")
                        ShowStatus()
                } else {
                        _ = cmd.Help()
                }
        },
}

// morio restart
var restartCmd = &cobra.Command{
        Use:   "restart",
        Short: "Restart agents",
        Long:  "Restarts all beats agents, or the one you pass it",
        Example: `  Restart all agents:
    morio restart

  Restart a specific agent:
    morio restart logs`,
        Run: func(cmd *cobra.Command, args []string) {
                if len(args) == 0 {
                        if runtime.GOOS == "linux" {
                                ChangeAgentState("audit", "restart")
                        }
                        ChangeAgentState("logs", "restart")
                        ChangeAgentState("metrics", "restart")
                        ShowStatus()
                } else if args[0] == "audit" {
                        if runtime.GOOS != "linux" {
                                fmt.Println("Audit agent is only available on Linux")
                                return
                        }
                        ChangeAgentState("audit", "restart")
                        ShowStatus()
                } else if args[0] == "logs" {
                        ChangeAgentState("logs", "restart")
                        ShowStatus()
                } else if args[0] == "metrics" {
                        ChangeAgentState("metrics", "restart")
                        ShowStatus()
                } else {
                        _ = cmd.Help()
                }
        },
}

// morio status
var statusCmd = &cobra.Command{
        Use:   "status",
        Short: "Shows agents status",
        Long:  "Shows the status of all agents, or the one you pass it",
        Example: `  Show the status of all agents:
    morio status

  Show the status of a specific agent:
    morio status logs`,
        Run: func(cmd *cobra.Command, args []string) {
                if len(args) == 0 {
                        ShowStatus()
                } else if args[0] == "audit" {
                        if runtime.GOOS != "linux" {
                                fmt.Println("Audit agent is only available on Linux")
                                return
                        }
                        PrintAgentStatus("audit")
                } else if args[0] == "metrics" {
                        PrintAgentStatus("metrics")
                } else if args[0] == "logs" {
                        PrintAgentStatus("logs")
                } else {
                        ShowStatus()
                }
        },
}

// morio start audit
var startAuditCmd = &cobra.Command{
        Use:     "audit",
        Short:   "Starts the audit agent (auditbeat)",
        Long:    "This starts the auditbeat service",
        Example: "  morio start audit",
        Run: func(cmd *cobra.Command, args []string) {
                if runtime.GOOS != "linux" {
                        fmt.Println("Audit agent is only available on Linux")
                        return
                }
                ChangeAgentState("audit", "start")
                ShowStatus()
        },
}

// morio start logs
var startLogsCmd = &cobra.Command{
        Use:     "logs",
        Short:   "Starts the logs agent (filebeat)",
        Long:    "This starts the filebeat service",
        Example: "  morio start logs",
        Run: func(cmd *cobra.Command, args []string) {
                ChangeAgentState("logs", "start")
                ShowStatus()
        },
}

// morio start metrics
var startMetricsCmd = &cobra.Command{
        Use:     "metrics",
        Short:   "Starts the metrics agent (metricbeat)",
        Long:    "This starts the metricbeat service",
        Example: "  morio start metrics",
        Run: func(cmd *cobra.Command, args []string) {
                ChangeAgentState("metrics", "start")
                ShowStatus()
        },
}

// morio stop audit
var stopAuditCmd = &cobra.Command{
        Use:     "audit",
        Short:   "Stops the audit agent (auditbeat)",
        Long:    "This stops the auditbeat service",
        Example: "  morio stop audit",
        Run: func(cmd *cobra.Command, args []string) {
                if runtime.GOOS != "linux" {
                        fmt.Println("Audit agent is only available on Linux")
                        return
                }
                ChangeAgentState("audit", "stop")
                ShowStatus()
        },
}

// morio stop logs
var stopLogsCmd = &cobra.Command{
        Use:     "logs",
        Short:   "Stops the logs agent (filebeat)",
        Long:    "This stops the filebeat service",
        Example: "  morio stop logs",
        Run: func(cmd *cobra.Command, args []string) {
                ChangeAgentState("logs", "stop")
                ShowStatus()
        },
}

// morio stop metrics
var stopMetricsCmd = &cobra.Command{
        Use:     "metrics",
        Short:   "Stops the metrics agent (metricbeat)",
        Long:    "This stops the metricbeat service",
        Example: "  morio stop metrics",
        Run: func(cmd *cobra.Command, args []string) {
                ChangeAgentState("metrics", "stop")
                ShowStatus()
        },
}

// morio restart audit
var restartAuditCmd = &cobra.Command{
        Use:     "audit",
        Short:   "Restarts the audit agent (auditbeat)",
        Long:    "This restarts the auditbeat service",
        Example: "  morio restart audit",
        Run: func(cmd *cobra.Command, args []string) {
                if runtime.GOOS != "linux" {
                        fmt.Println("Audit agent is only available on Linux")
                        return
                }
                ChangeAgentState("audit", "restart")
                ShowStatus()
        },
}

// morio restart logs
var restartLogsCmd = &cobra.Command{
        Use:     "logs",
        Short:   "Restarts the logs agent (filebeat)",
        Long:    "This restarts the filebeat service",
        Example: "  morio restart logs",
        Run: func(cmd *cobra.Command, args []string) {
                ChangeAgentState("logs", "restart")
                ShowStatus()
        },
}

// morio restart metrics
var restartMetricsCmd = &cobra.Command{
        Use:     "metrics",
        Short:   "Restarts the metrics agent (metricbeat)",
        Long:    "This restarts the metricbeat service",
        Example: "  morio restart metrics",
        Run: func(cmd *cobra.Command, args []string) {
                ChangeAgentState("metrics", "restart")
                ShowStatus()
        },
}

func init() {
        RootCmd.AddCommand(restartCmd)
        RootCmd.AddCommand(startCmd)
        RootCmd.AddCommand(stopCmd)
        RootCmd.AddCommand(statusCmd)
        restartCmd.AddCommand(restartAuditCmd)
        restartCmd.AddCommand(restartMetricsCmd)
        restartCmd.AddCommand(restartLogsCmd)
        startCmd.AddCommand(startAuditCmd)
        startCmd.AddCommand(startMetricsCmd)
        startCmd.AddCommand(startLogsCmd)
        stopCmd.AddCommand(stopAuditCmd)
        stopCmd.AddCommand(stopMetricsCmd)
        stopCmd.AddCommand(stopLogsCmd)
}

func agentServiceName(agent string) string {
        return "morio-" + agent
}

func agentLaunchDaemonPath(agent string) string {
        return fmt.Sprintf("/Library/LaunchDaemons/com.morio.%s.plist", agent)
}

func agentLaunchDaemonLabel(agent string) string {
        return fmt.Sprintf("com.morio.%s", agent)
}

func agentBeatName(agent string) string {
        if agent == "audit" {
                return "auditbeat"
        }
        if agent == "logs" {
                return "filebeat"
        }
        if agent == "metrics" {
                return "metricbeat"
        }

        return "unknownbeat"
}

// One method to change service state on various platforms
func ChangeAgentState(agent, action string) error {
        var cmd *exec.Cmd
        serviceName := agentServiceName(agent)

        switch runtime.GOOS {
        case "linux":
                cmd = exec.Command("systemctl", action, serviceName)
        case "darwin":
                plistPath := agentLaunchDaemonPath(agent)

                // Check if plist exists first
                if _, err := os.Stat(plistPath); os.IsNotExist(err) {
                        return fmt.Errorf("plist file not found: %s", plistPath)
                }

                switch action {
                case "start":
                        // First try to unload in case it's already loaded (ignore errors)
                        exec.Command("launchctl", "unload", plistPath).Run()
                        // Then load
                        cmd = exec.Command("launchctl", "load", plistPath)
                case "stop":
                        cmd = exec.Command("launchctl", "unload", plistPath)
                case "restart":
                        // Unload (ignore errors if not loaded)
                        exec.Command("launchctl", "unload", plistPath).Run()
                        // Then load
                        cmd = exec.Command("launchctl", "load", plistPath)
                default:
                        return fmt.Errorf("unsupported action for macOS: %s", action)
                }
        case "windows":
                cmd = exec.Command("sc", action, serviceName)
        default:
                return fmt.Errorf("unsupported platform: %s", runtime.GOOS)
        }

        output, err := cmd.CombinedOutput()
        if err != nil {
                return fmt.Errorf("failed to %s %s: %v\nOutput: %s", action, agent, err, string(output))
        }
        return nil
}

// One method to check service status on various platforms
func IsAgentRunning(agent string) (bool, error) {
        var cmd *exec.Cmd
        serviceName := agentServiceName(agent)

        switch runtime.GOOS {
        case "linux":
                cmd = exec.Command("systemctl", "is-active", serviceName)
        case "darwin":
                // Use the label to check if service is loaded
                label := agentLaunchDaemonLabel(agent)
                cmd = exec.Command("launchctl", "list", label)
        case "windows":
                cmd = exec.Command("sc", "query", serviceName)
        default:
                return false, fmt.Errorf("unsupported platform: %s", runtime.GOOS)
        }

        output, err := cmd.Output()

        switch runtime.GOOS {
        case "linux":
                // If command succeeds and output is "active", service is running
                return err == nil && strings.Contains(string(output), "active"), nil
        case "darwin":
                // If launchctl list succeeds, the service is loaded
                if err != nil {
                        return false, nil
                }
                // Look for PID in output - format is: "PID\tStatus\tLabel"
                // If PID is "-", service is loaded but not running
                // If PID is a number, service is running
                lines := strings.Split(string(output), "\n")
                for _, line := range lines {
                        fields := strings.Fields(line)
                        if len(fields) >= 1 {
                                // First field is PID
                                pid := fields[0]
                                // If PID is not "-", the service is running
                                return pid != "-", nil
                        }
                }
                return false, nil
        case "windows":
                return err == nil && strings.Contains(string(output), "RUNNING"), nil
        }

        return false, nil
}

func PrintAgentStatus(agent string) {
        emoji := "✗"
        status := "stopped"
        running, err := IsAgentRunning(agent)
        check(err)
        if running {
                emoji = "✓"
                status = "running"
        }
        fmt.Printf("%s %s %s\n", emoji, fmt.Sprintf("%-8s", agent), fmt.Sprintf("%-14s", status))
}

func ShowStatus() {
        if runtime.GOOS == "linux" {
                PrintAgentStatus("audit")
        }
        PrintAgentStatus("logs")
        PrintAgentStatus("metrics")
}
