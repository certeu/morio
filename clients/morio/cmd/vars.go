/*
Copyright © 2024 NAME HERE <EMAIL ADDRESS>

*/
package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
)
    //echo "  Manage template variables for the Morio beats agents configuration."
    //echo ""
    //echo "Usage:"
    //echo "  morio vars [options]"
    //echo "  morio vars [commamd]"
    //echo ""
    //echo "Available Commands:"
    //echo "  dump    List the current morio vars and their values"
    //echo "  edit    Opens an editor to edit a morio variable"
    //echo "  ls      List the current morio vars"
    //echo "  set     Set the value of a morio variable"
    //echo "  rm      Remove a morio variable"
    //echo "  wipe    Removes all morio variables"
    //echo ""
    //echo "Options:"
    //echo "  -h, --help       Display this help message"
    //echo ""
    //echo "Use \"morio vars [command] --help\" for more information about a vars command."

// varsCmd represents the vars command
var varsCmd = &cobra.Command{
	Use:   "vars",
	Short: "Manage template variables for the Morio client configuration",
	Long: `The 'morio vars' command allows you to manage
template variables for the Morio client configuration.

The morio client wraps various beats agents that all have their own
configuration and modules to manage. Morio ships these as templates
that take various variables (vars). This command allows you to manage
these vars.

To combine the configuration templates and your vars into an actual
configuration, run 'morio template'.`,
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Println("vars called")
	},
}

func init() {
	rootCmd.AddCommand(varsCmd)

	// Here you will define your flags and configuration settings.

	// Cobra supports Persistent Flags which will work for this command
	// and all subcommands, e.g.:
	// varsCmd.PersistentFlags().String("foo", "", "A help for foo")

	// Cobra supports local flags which will only run when this command
	// is called directly, e.g.:
	// varsCmd.Flags().BoolP("toggle", "t", false, "Help message for toggle")
}
