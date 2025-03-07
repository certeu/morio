package cmd

import (
	"fmt"
	"github.com/spf13/cobra"
)

func init() {
	RootCmd.AddCommand(pullCmd)
}

var pullCmd = &cobra.Command{
	Use:   "pull",
	Short: "Pull client configuation (fetch + template)",
	Long:  `Pull the client configuration from the Morio cluster.`,
	Args:  cobra.ExactArgs(0),
	RunE: func(cmd *cobra.Command, args []string) error {
		PullConfig()
		return nil
	},
}

func PullConfig() error {
	fetchErr := FetchConfig()
	if fetchErr != nil {
		fmt.Println("Failed to fetch config")
		return fetchErr
	}

	TemplateConfig()
	//templateErr := TemplateConfig()
	//if templateErr != nil {
	//  fmt.Println("Failed to template config")
	//  return templateErr
	//}

	return nil
}
