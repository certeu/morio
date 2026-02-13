package cmd

import (
	"fmt"
	"github.com/spf13/cobra"
	"os"
	"os/exec"
	"runtime"
)

// morio audit
var auditCmd = &cobra.Command{
	Use:   "audit",
	Short: "Invoke the audit agent",
	Long: `Invokes the audit agent.
Any parameters after this command will be passed to auditbeat.`,
	Args: cobra.ArbitraryArgs,
	Run: func(cmd *cobra.Command, args []string) {
		// Get path to the auditbeat binary
		path := GetBeatsBinDir() + "/auditbeat"

		// Pass all arguments (after audit) to the auditbeat binary
		// but also add the location of the Morio-specific config
		configFlag := []string{"-c", GetMorioConfigDir() + "/audit/config.yml"}
		auditbeat := exec.Command(path, append(configFlag, args...)...)

		// Re-use I/O streams
		auditbeat.Stdout = os.Stdout
		auditbeat.Stderr = os.Stderr
		auditbeat.Stdin = os.Stdin

		// Run the command and capture any error
		if err := auditbeat.Run(); err != nil {
			fmt.Fprintf(os.Stderr, "Error: %v\n", err)
			os.Exit(1)
		}
	},
}

// morio logs
var eventlogsCmd = &cobra.Command{
	Use:   "eventlogs",
	Short: "Invoke the eventlogs agent",
	Long: `Invokes the eventlogs agent.
Any parameters after this command will be passed to winlogbeat.`,
	Args: cobra.ArbitraryArgs,
	Run: func(cmd *cobra.Command, args []string) {
		// Get path to the wiblogbeat binary
		path := GetBeatsBinDir() + "/winlogbeat"

		// Pass all arguments (after eventlogs) to the winlogbeat binary
		// but also add the location of the Morio-specific config
		configFlag := []string{"-c", GetMorioConfigDir() + "/eventlogs/config.yml"}
		winlogbeat := exec.Command(path, append(configFlag, args...)...)

		// Re-use I/O streams
		winlogbeat.Stdout = os.Stdout
		winlogbeat.Stderr = os.Stderr
		winlogbeat.Stdin = os.Stdin

		// Run the command and capture any error
		if err := winlogbeat.Run(); err != nil {
			fmt.Fprintf(os.Stderr, "Error: %v\n", err)
			os.Exit(1)
		}
	},
}

// morio logs
var logsCmd = &cobra.Command{
	Use:   "logs",
	Short: "Invoke the logs agent",
	Long: `Invokes the logs agent.
Any parameters after this command will be passed to filebeat.`,
	Args: cobra.ArbitraryArgs,
	Run: func(cmd *cobra.Command, args []string) {
		// Get path to the filebeat binary
		path := GetBeatsBinDir() + "/filebeat"

		// Pass all arguments (after logs) to the filebeat binary
		// but also add the location of the Morio-specific config
		configFlag := []string{"-c", GetMorioConfigDir() + "/logs/config.yml"}
		filebeat := exec.Command(path, append(configFlag, args...)...)

		// Re-use I/O streams
		filebeat.Stdout = os.Stdout
		filebeat.Stderr = os.Stderr
		filebeat.Stdin = os.Stdin

		// Run the command and capture any error
		if err := filebeat.Run(); err != nil {
			fmt.Fprintf(os.Stderr, "Error: %v\n", err)
			os.Exit(1)
		}
	},
}

// morio metrics
var metricsCmd = &cobra.Command{
	Use:   "metrics",
	Short: "Invoke the metrics agent",
	Long: `Invokes the metrics agent.
Any parameters after this command will be passed to metricbeat.`,
	Args: cobra.ArbitraryArgs,
	Run: func(cmd *cobra.Command, args []string) {
		// Get path to the metricbeat binary
		path := GetBeatsBinDir() + "/metricbeat"

		// Pass all arguments (after logs) to the metricbeat binary
		// but also add the location of the Morio-specific config
		configFlag := []string{"-c", GetMorioConfigDir() + "/metrics/config.yml"}
		metricbeat := exec.Command(path, append(configFlag, args...)...)

		// Re-use I/O streams
		metricbeat.Stdout = os.Stdout
		metricbeat.Stderr = os.Stderr
		metricbeat.Stdin = os.Stdin

		// Run the command and capture any error
		if err := metricbeat.Run(); err != nil {
			fmt.Fprintf(os.Stderr, "Error: %v\n", err)
			os.Exit(1)
		}
	},
}

func init() {
	// Disable Cobra's flag parsing for what we pass to the agent
	auditCmd.DisableFlagParsing = true
	if runtime.GOOS == "windows" {
	  eventlogsCmd.DisableFlagParsing = true
  }
	logsCmd.DisableFlagParsing = true
	metricsCmd.DisableFlagParsing = true

	// Add the commands
	RootCmd.AddCommand(auditCmd)
	if runtime.GOOS == "windows" {
	  RootCmd.AddCommand(eventlogsCmd)
  }
	RootCmd.AddCommand(logsCmd)
	RootCmd.AddCommand(metricsCmd)
}
