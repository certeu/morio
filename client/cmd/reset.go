package cmd

import (
	//"encoding/json"
	//"fmt"
	//"github.com/olekukonko/tablewriter"
	"github.com/spf13/cobra"
	//"gopkg.in/yaml.v3"
	//"io/ioutil"
	//"log"
	//"os"
	//"sort"
	//"strings"
)

func init() {
	RootCmd.AddCommand(resetCmd)
	resetCmd.AddCommand(resetVarsCmd)
	resetCmd.AddCommand(resetModulesCmd)
	resetCmd.AddCommand(resetJoinCmd)
	resetCmd.AddCommand(resetAllCmd)
}

var resetCmd = &cobra.Command{
	Use:   "reset",
	Short: "Reset the client configuration",
	Long: `The 'morio reset' command allows you to reset
all, or certain aspects of, the Morio client configuration.`,
}

// morio reset vars
var resetVarsCmd = &cobra.Command{
	Use:     "vars",
	Short:   "Removes all (custom) client variables",
	Long:    `This will remove all local custom variables.`,
	Example: "  morio reset vars",
	Run: func(cmd *cobra.Command, args []string) {
		ClearVars()
	},
}

// morio reset modules
var resetModulesCmd = &cobra.Command{
	Use:     "modules",
	Short:   "Removes all module templates",
	Long:    `This will remove all the module templates.`,
	Example: "  morio reset modules",
	Run: func(cmd *cobra.Command, args []string) {
		ClearModules()
	},
}

// morio reset join
var resetJoinCmd = &cobra.Command{
	Use:     "join",
	Short:   "Removes the cluster-specific configuration",
	Long:    `This removes teh configuration created by joining the client to a Morio cluster.`,
	Example: "  morio reset join",
	Run: func(cmd *cobra.Command, args []string) {
		ClearJoin()
	},
}

// morio reset all
var resetAllCmd = &cobra.Command{
	Use:     "all",
	Short:   "Removes all local configuration",
	Long:    `This removes all local client configuration.`,
	Example: "  morio reset all",
	Run: func(cmd *cobra.Command, args []string) {
		ClearVars()
		ClearModules()
		ClearJoin()
	},
}
