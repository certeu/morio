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

	// Here you will define your flags and configuration settings.

	// Cobra supports Persistent Flags which will work for this command
	// and all subcommands, e.g.:
	// versionCmd.PersistentFlags().String("foo", "", "A help for foo")

	// Cobra supports local flags which will only run when this command
	// is called directly, e.g.:
	// versionCmd.Flags().BoolP("toggle", "t", false, "Help message for toggle")
}
