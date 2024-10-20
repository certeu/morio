/*
Copyright © 2024 NAME HERE <EMAIL ADDRESS>
*/
package cmd

import (
	"fmt"
	"github.com/spf13/cobra"
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
		ChangeAgentState("audit", "start")
		ChangeAgentState("metrics", "start")
		ChangeAgentState("logs", "start")
		ShowStatus()
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
		ChangeAgentState("audit", "stop")
		ChangeAgentState("metrics", "stop")
		ChangeAgentState("logs", "stop")
		ShowStatus()
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
		ChangeAgentState("audit", "restart")
		ChangeAgentState("metrics", "restart")
		ChangeAgentState("logs", "restart")
		ShowStatus()
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
		if args[0] == "audit" {
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
	rootCmd.AddCommand(restartCmd)
	rootCmd.AddCommand(startCmd)
	rootCmd.AddCommand(stopCmd)
	rootCmd.AddCommand(statusCmd)
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
		switch action {
		case "start":
			cmd = exec.Command("launchctl", "load", serviceName)
		case "stop":
			cmd = exec.Command("launchctl", "unload", serviceName)
		case "restart":
			if err := exec.Command("launchctl", "unload", serviceName).Run(); err != nil {
				return fmt.Errorf("failed to stop service: %v", err)
			}
			cmd = exec.Command("launchctl", "load", serviceName)
		default:
			return fmt.Errorf("unsupported action for macOS: %s", action)
		}
	case "windows":
		cmd = exec.Command("sc", action, serviceName)
	default:
		return fmt.Errorf("unsupported platform: %s", runtime.GOOS)
	}

	return cmd.Run()
}

// One method to check service status on various platforms
func IsAgentRunning(agent string) (bool, error) {
	var cmd *exec.Cmd
	serviceName := agentServiceName(agent)

	switch runtime.GOOS {
	case "linux":
		cmd = exec.Command("systemctl", "is-active", serviceName)
	case "darwin":
		cmd = exec.Command("launchctl", "list")
	case "windows":
		cmd = exec.Command("sc", "query", serviceName)
	default:
		return false, fmt.Errorf("unsupported platform: %s", runtime.GOOS)
	}

	output, err := cmd.Output()
	if err != nil {
		// If the command fails, we assume the service is not running
		return false, nil
	}

	switch runtime.GOOS {
	case "linux":
		// Check if the output contains "active"
		return strings.Contains(string(output), "active"), nil
	case "darwin":
		// On macOS, check if the service name is in the output
		return strings.Contains(string(output), serviceName), nil
	case "windows":
		// On Windows, check if the output contains "RUNNING"
		return strings.Contains(string(output), "RUNNING"), nil
	}

	return false, nil
}

func PrintAgentStatus(agent string) {
	emoji := "!"
	status := "stopped"
	running, err := IsAgentRunning(agent)
	check(err)
	if running {
		emoji = " "
		status = "running"
	}
	fmt.Printf("%s %s %s\n", emoji, fmt.Sprintf("%-8s", agent), fmt.Sprintf("%-14s", status))
}

func ShowStatus() {
	PrintAgentStatus("audit")
	PrintAgentStatus("metrics")
	PrintAgentStatus("logs")
}
