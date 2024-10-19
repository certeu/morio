package cmd

import (
	"encoding/json"
	"fmt"
	"github.com/spf13/cobra"
	"io/ioutil"
	"log"
	"os"
  "strings"
)

// morio vars
var varsCmd = &cobra.Command{
	Use:   "vars",
	Short: "Manage configuration template variables",
	Long: `The 'morio vars' command allows you to manage
template variables for the Morio client configuration.

The morio client wraps various beats agents that all have their own
configuration and modules to manage. Morio ships these as templates
that take various variables (vars). This command allows you to manage
these vars.

To combine the configuration templates and your vars into an actual
configuration, run 'morio template'.`,
}

// morio vars clear
var clearCmd = &cobra.Command{
	Use:   "clear NAME",
	Short: "Set a var to an empty string",
	Long: `Stores an empty string as a new value for a template variable,
This will always write a custom template variable.`,
	Example: "  morio vars clear WARP_DRIVE",
	Run: func(cmd *cobra.Command, args []string) {
		SetVar(args[0], "false")
	},
}

// morio vars disable
var disableCmd = &cobra.Command{
	Use:   "disable NAME",
	Short: "Set a var to false",
	Long: `Stores 'false' as a new value for a template variable,
This will always write a custom template variable.`,
	Example: "  morio vars disable WARP_DRIVE",
	Run: func(cmd *cobra.Command, args []string) {
		SetVar(args[0], "false")
	},
}

// morio vars enable
var enableCmd = &cobra.Command{
	Use:   "enable NAME",
	Short: "Set a var to true",
	Long: `Stores 'true' as a new value for a template variable,
This will always write a custom template variable.`,
	Example: "  morio vars enable WARP_DRIVE",
	Run: func(cmd *cobra.Command, args []string) {
		SetVar(args[0], "true")
	},
}

// morio vars export
var exportCmd = &cobra.Command{
	Use:   "export",
	Short: "Exports vars to JSON",
	Long: `Exports all template variables and their values",
This will always write a custom template variable.`,
	Example: "  morio vars export",
	Run: func(cmd *cobra.Command, args []string) {
		allVarsAsJson, err := json.MarshalIndent(GetVars(), "", "  ")
		if err != nil {
			fmt.Println("export failed JSON")
		}
		fmt.Print(string(allVarsAsJson))
	},
}

// morio vars get
var getCmd = &cobra.Command{
	Use:   "get NAME",
	Short: "Get the value of a var",
	Long: `This returns the value of template variable (var) NAME.
If var NAME is not set, this will return an empty string.
A custom NAME var has precedence over a default NAME var.`,
	Example: "  morio vars get WARP_DRIVE",
	Run: func(cmd *cobra.Command, args []string) {
		value := GetVar(args[0])
		fmt.Print(string(value))
	},
}

// morio vars import
var importCmd = &cobra.Command{
	Args:    cobra.ExactArgs(1),
	Example: "  morio vars import ~/morio_vars.json",
	Use:     "import [file_path]",
	Short:   "Import vars from a JSON file",
	Long: `Imports vars from a JSON file.
Run 'morio vars export' to see the JSON structure`,
	Run: func(cmd *cobra.Command, args []string) {
		// Read data from file
		jsonData, err := os.ReadFile(args[0])
		if err != nil {
			log.Fatalf("Failed to open file: %v", err)
		}

		// Parse the JSON data
		var data map[string]string
		err = json.Unmarshal(jsonData, &data)
		if err != nil {
			log.Fatalf("Failed to parse JSON: %v", err)
		}

		// Iterate over the keys and values in the map
		for key, value := range data {
			SetVar(key, value)
		}
	},
}

// morio vars rm
var rmCmd = &cobra.Command{
	Use:     "rm NAME",
	Example: "  morio vars rm WARP_DRIVE",
	Short:   "Remove a (custom) variable",
	Long: `This will remove a variable, in practice
removing the file holding the custom template variable value.
If a default variable with the same name exists, this will restore
the default value.

If you want the variable gone altogether, use 'morio vars clear' to
set the var to an empty string and you cannot remove default variables,
but you can override them.`,
	Run: func(cmd *cobra.Command, args []string) {
    RmVar(args[0])
	},
}

// morio vars set
var setCmd = &cobra.Command{
	Use:   "set NAME value",
	Short: "Set the value of a var",
	Long: `Stores a new value for a template variable,
This will always write a custom template variable.`,
	Example: "  morio vars set WARP_DRIVE 9",
	Run: func(cmd *cobra.Command, args []string) {
		SetVar(args[0], args[1])
	},
}

func init() {
	rootCmd.AddCommand(varsCmd)
	varsCmd.AddCommand(clearCmd)
	varsCmd.AddCommand(disableCmd)
	varsCmd.AddCommand(enableCmd)
	varsCmd.AddCommand(exportCmd)
	varsCmd.AddCommand(getCmd)
	varsCmd.AddCommand(importCmd)
	varsCmd.AddCommand(rmCmd)
	varsCmd.AddCommand(setCmd)
}

// Location of the variables files
const CustomVarFolder string = "/etc/morio/vars.d"
const DefaultVarFolder string = "/etc/morio/default.vars.d"

// Helper for panic on error
func check(e error) {
	if e != nil {
    panic(e)
	}
}

// Read the value of a variable
func GetVar(key string) string {
	// Read entire file in one gulp
	value, err := os.ReadFile(CustomVarFolder + "/" + key)

	if err != nil {
		value, err = os.ReadFile(DefaultVarFolder + "/" + key)
		if err != nil {
			return ""
		}
	}

	return string(value)
}

// Read the value of a variable
func GetVars() map[string]string {
	// Create the map
	found := make(map[string]string)

	defaults, err := ioutil.ReadDir(DefaultVarFolder)
	check(err)
	customs, err := ioutil.ReadDir(CustomVarFolder)
	check(err)

	// Iterate over the files
	for _, file := range defaults {
		if !file.IsDir() {
			name := file.Name()
			found[name] = GetVar(name)
		}
	}
	for _, file := range customs {
		if !file.IsDir() {
			name := file.Name()
			found[name] = GetVar(name)
		}
	}

	return found
}

// Write a value to a variable
func SetVar(key string, value string) {
	// Open file
	file, err := os.Create(CustomVarFolder + "/" + key)
	check(err)
	defer file.Close()

	// Write value
	_, err = file.WriteString(value)
	check(err)

	// Sync
	file.Sync()
}

// Write a value to a default variable
func SetDefaultVar(key string, value string) {
	// Open file
	file, err := os.Create(DefaultVarFolder + "/" + key)
	check(err)
	defer file.Close()

	// Write value
	_, err = file.WriteString(value)
	check(err)

	// Sync
	file.Sync()
}

// Remove a (custom) variable
func RmVar(key string) {
	// Remove file
	err := os.Remove(CustomVarFolder + "/" + key)
  // Swallow errors if the file does not exist
	if err != nil && !strings.Contains(err.Error(), "no such file or directory") {
    check(err)
  }
}
