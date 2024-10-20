package cmd

import (
	"bufio"
	"fmt"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
	"os"
	"os/exec"
)

// morio audit
var auditCmd = &cobra.Command{
	Use:   "audit",
	Short: "Invoke the audit agent",
	Long: `Invokes the audit agent.
Any parameters after this command will be passed to auditbeat.`,
	Args: cobra.ArbitraryArgs,
	Run: func(cmd *cobra.Command, args []string) {
		// Get path to auditbeat from config (and make sure it is set)
		EnsureBeatPath("auditbeat", "audit")
		path := viper.GetString("agents.audit")

		// Pass all arguments (after audit) to the auditbeat binary
		// but also add the location of the Morio-specific config
		configFlag := []string{"-c", "/etc/morio/audit/config.yaml"}
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
var logsCmd = &cobra.Command{
	Use:   "logs",
	Short: "Invoke the logs agent",
	Long: `Invokes the logs agent.
Any parameters after this command will be passed to filebeat.`,
	Args: cobra.ArbitraryArgs,
	Run: func(cmd *cobra.Command, args []string) {
		// Get path to filebeat from config (and make sure it is set)
		EnsureBeatPath("filebeat", "logs")
		path := viper.GetString("agents.logs")

		// Pass all arguments (after logs) to the filebeat binary
		// but also add the location of the Morio-specific config
		configFlag := []string{"-c", "/etc/morio/logs/config.yaml"}
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
		// Get path to metricbeat from config (and make sure it is set)
		EnsureBeatPath("metricbeat", "metrics")
		path := viper.GetString("agents.metrics")

		// Pass all arguments (after logs) to the metricbeat binary
		// but also add the location of the Morio-specific config
		configFlag := []string{"-c", "/etc/morio/metrics/config.yaml"}
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
	logsCmd.DisableFlagParsing = true
	metricsCmd.DisableFlagParsing = true

	// Add the commands
	rootCmd.AddCommand(auditCmd)
	rootCmd.AddCommand(logsCmd)
	rootCmd.AddCommand(metricsCmd)
}

// Makes sure that the path to the agent is set in the config
func EnsureBeatPath(beat string, dataType string) {
	key := "agents." + dataType
	if !viper.IsSet(key) {
		// Not set, prompt the user for the path
		reader := bufio.NewReader(os.Stdin)
		fmt.Print("Please provide the path to " + beat + ": ")
		path, _ := reader.ReadString('\n')

		// Trim newline characters from the input
		path = path[:len(path)-1]

		// Set the value in Viper
		viper.Set(key, path)

		// Save the updated configuration to the file
		if err := viper.WriteConfig(); err != nil {
			if _, ok := err.(viper.ConfigFileNotFoundError); ok {
				// If no config file exists, create one
				if err := viper.SafeWriteConfig(); err != nil {
					fmt.Println("Failed to create config file:", err)
					os.Exit(1)
				}
			} else {
				fmt.Println("Failed to write to config file:", err)
				os.Exit(1)
			}
		}
	}
}
