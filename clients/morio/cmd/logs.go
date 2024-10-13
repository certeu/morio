package cmd

import (
  "bufio"
	"fmt"
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
    ensureFilebeatPath()
    path := viper.GetString("paths.filebeat")

    // Pass all arguments (after logs) to the filebeat binary
		filebeat := exec.Command(path, args...)

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

// Makes sure that paths.filebeat is set in the config
func ensureFilebeatPath() {
	if !viper.IsSet("paths.filebeat") {
		// Not set, prompt the user for the path
		reader := bufio.NewReader(os.Stdin)
		fmt.Print("Please provide the path to filebeat: ")
		filebeat, _ := reader.ReadString('\n')

		// Trim newline characters from the input
		filebeat = filebeat[:len(filebeat)-1]

		// Set the value in Viper
		viper.Set("paths.filebeat", filebeat)

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

