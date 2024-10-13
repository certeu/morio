package cmd

import (
  "bufio"
	"fmt"
  "os"
  "os/exec"
	"github.com/spf13/cobra"
  "github.com/spf13/viper"
)

// This command passes everythig to auditbeat
// It will also make sure that the location to auditbeat
// is set in the config, and prompt for it if not
var auditCmd = &cobra.Command{
	Use:   "audit",
	Short: "Invoke auditbeat agent",
	Long: `Invokes the auditbeat agent preconfigured for Morio.
Any parameters after this command will be passed to auditbeat.`,
  Args: cobra.ArbitraryArgs,
	Run: func(cmd *cobra.Command, args []string) {
    // Get path to auditbeat from config (and make sure it is set)
    ensureAuditbeatPath()
    path := viper.GetString("paths.auditbeat")

    // Pass all arguments (after audit) to the auditbeat binary
		auditbeat := exec.Command(path, args...)

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

func init() {
  // Disable Cobra's flag parsing for what we pass to auditbeat
	auditCmd.DisableFlagParsing = true

  // Add the command
	rootCmd.AddCommand(auditCmd)
}

// Makes sure that paths.auditbeat is set in the config
func ensureAuditbeatPath() {
	if !viper.IsSet("paths.auditbeat") {
		// Not set, prompt the user for the path
		reader := bufio.NewReader(os.Stdin)
		fmt.Print("Please provide the path to auditbeat: ")
		auditbeat, _ := reader.ReadString('\n')

		// Trim newline characters from the input
		auditbeat = auditbeat[:len(auditbeat)-1]

		// Set the value in Viper
		viper.Set("paths.auditbeat", auditbeat)

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

