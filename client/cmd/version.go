package cmd

import (
	"fmt"
	"github.com/spf13/cobra"
	"morio/version"
)

// versionCmd represents the version command
var versionCmd = &cobra.Command{
	Use:   "version",
	Short: "Morio client version",
	Long:  `Shows the Morio client version`,
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Println("Morio client v" + version.Version)
	},
}

func init() {
	RootCmd.AddCommand(versionCmd)
}
