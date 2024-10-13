package cmd

import (
  "bufio"
	"fmt"
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
    ensureMetricbeatPath()
    path := viper.GetString("paths.metricbeat")

    // Pass all arguments (after metrics) to the metricbeat binary
		metricbeat := exec.Command(path, args...)

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

// Makes sure that paths.metricbeat is set in the config
func ensureMetricbeatPath() {
	if !viper.IsSet("paths.metricbeat") {
		// Not set, prompt the user for the path
		reader := bufio.NewReader(os.Stdin)
		fmt.Print("Please provide the path to metricbeat: ")
		metricbeat, _ := reader.ReadString('\n')

		// Trim newline characters from the input
		metricbeat = metricbeat[:len(metricbeat)-1]

		// Set the value in Viper
		viper.Set("paths.metricbeat", metricbeat)

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

