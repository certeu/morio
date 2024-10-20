package cmd

import (
	"fmt"
	"github.com/google/uuid"
	"github.com/spf13/cobra"
)

// initCmd represents the init command
var initCmd = &cobra.Command{
	Use:   "init",
	Short: "Initialize the Morio client",
	Long: `This will initialize a new Morio client installation
by generating a unique UUID for the client and run some other
housekeeping chores.

This command is idempotent. In other words, you can run it more
than once without side-effects.`,
	Run: func(cmd *cobra.Command, args []string) {
		client := GetVar("MORIO_CLIENT_UUID")
		if client == "" {
			fmt.Println("Initializing Morio client.")
			client = uuid.New().String()
			SetDefaultVar("MORIO_CLIENT_UUID", client)
			fmt.Println("Morio client initialized with UUID " + client)
		} else {
			fmt.Println("This Morio client is already initialized.")
			fmt.Println("Its UUID is " + client)
		}
		fmt.Println("\nAgent status:")
		ShowStatus()
	},
}

func init() {
	rootCmd.AddCommand(initCmd)
}
