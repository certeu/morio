package cmd

import (
	"fmt"
  "morio/agents"
  "os"
  "os/exec"
	"github.com/spf13/cobra"
  "github.com/spf13/viper"
)

// This command passes everythig to metricbeat
// It will also make sure that the location to metricbeat
// is set in the config, and prompt for it if not
var metricsCmd = &cobra.Command{
	Use:   "metrics",
	Short: "Invoke metricbeat agent",
	Long: `Invokes the metricbeat agent preconfigured for Morio.
Any parameters after this command will be passed to metricbeat.`,
  Args: cobra.ArbitraryArgs,
	Run: func(cmd *cobra.Command, args []string) {
    // Get path to metricbeat from config (and make sure it is set)
    agents.EnsureBeatPath("metricbeat")
    path := viper.GetString("paths.metricbeat")

    // Pass all arguments (after logs) to the metricbeat binary
		// but also add the location of the Morio-specific config
    configFlag := []string{"-c", "/etc/morio/metrics/config.yml"}
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
  // Disable Cobra's flag parsing for what we pass to metricbeat
	metricsCmd.DisableFlagParsing = true

  // Add the command
	rootCmd.AddCommand(metricsCmd)
}

