package cmd

import (
	"fmt"
  "morio/agents"
  "os"
  "os/exec"
	"github.com/spf13/cobra"
  "github.com/spf13/viper"
)

// This command passes everythig to filebeat
// It will also make sure that the location to filebeat
// is set in the config, and prompt for it if not
var logsCmd = &cobra.Command{
	Use:   "logs",
	Short: "Invoke filebeat agent",
	Long: `Invokes the filebeat agent preconfigured for Morio.
Any parameters after this command will be passed to filebeat.`,
  Args: cobra.ArbitraryArgs,
	Run: func(cmd *cobra.Command, args []string) {
    // Get path to filebeat from config (and make sure it is set)
    agents.EnsureBeatPath("metricbeat")
    path := viper.GetString("paths.filebeat")

    // Pass all arguments (after logs) to the filebeat binary
		// but also add the location of the Morio-specific config
    configFlag := []string{"-c", "/etc/morio/logs/config.yml"}
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

func init() {
  // Disable Cobra's flag parsing for what we pass to filebeat
	logsCmd.DisableFlagParsing = true

  // Add the command
	rootCmd.AddCommand(logsCmd)
}

