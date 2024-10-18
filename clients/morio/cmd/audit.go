package cmd

import (
	"fmt"
  "morio/agents"
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
    agents.EnsureBeatPath("auditbeat")
    path := viper.GetString("paths.auditbeat")

    // Pass all arguments (after audit) to the auditbeat binary
		// but also add the location of the Morio-specific config
    configFlag := []string{"-c", "/etc/morio/audit/config.yml"}
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

func init() {
  // Disable Cobra's flag parsing for what we pass to auditbeat
	auditCmd.DisableFlagParsing = true

  // Add the command
	rootCmd.AddCommand(auditCmd)
}

