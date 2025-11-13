package cmd

import (
	"encoding/json"
	"fmt"
	"github.com/olekukonko/tablewriter"
	"github.com/spf13/cobra"
	"gopkg.in/yaml.v3"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

// morio vars
var varsCmd = &cobra.Command{
	Use:   "vars",
	Short: "Manage configuration template variables",
	Long: `The 'morio vars' command allows you to manage
template variables for the Morio client configuration.

The Morio client wraps various beats agents that all have their own
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
	Args:    cobra.ExactArgs(1),
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
	Args:    cobra.ExactArgs(1),
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
	Args:    cobra.ExactArgs(1),
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
		fmt.Print(GetVarsAsJson())
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
	Args:    cobra.ExactArgs(1),
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

// morio vars list
var listCmd = &cobra.Command{
	Use:     "list",
	Short:   "List all vars",
	Long:    "Lists all template variables and their values",
	Example: "  morio vars list",
	Run: func(cmd *cobra.Command, args []string) {
		allVars := GetVars()
		// Get sorted keys
		sortedKeys := SortedVarsOrder(allVars)

		// Get the table flag value from the command
		tableOutput, _ := cmd.Flags().GetBool("table")
		if tableOutput {
			// Table output
			table := tablewriter.NewWriter(os.Stdout)
			table.SetHeader([]string{"Variable", "Value"})
			table.SetBorders(tablewriter.Border{Left: true, Top: false, Right: true, Bottom: false})
			table.SetCenterSeparator("|")
			table.SetAutoWrapText(false)

			for _, key := range sortedKeys {
				val := allVars[key]
				var valueStr string
				if strings.HasSuffix(key, "SECRET") {
					valueStr = "~~~ MASKED ~~~"
				} else {
					valueStr = fmt.Sprintf("%v", val)
				}
				table.Append([]string{key, valueStr})
			}

			table.Render()
		} else {
			// Original text output
			for _, key := range sortedKeys {
				val := allVars[key]
				// Do not print secrets on the console when listing vars
				if strings.HasSuffix(key, "SECRET") {
					fmt.Printf("%s: ~~~ MASKED ~~~\n", key)
				} else {
					fmt.Printf("%s: %v\n", key, val)
				}
			}
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
set the var to an empty string. Note that you cannot remove default variables,
but you can override them.`,
	Args: cobra.ExactArgs(1),
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
	Args:    cobra.ExactArgs(2),
	Run: func(cmd *cobra.Command, args []string) {
		SetVar(args[0], args[1])
	},
}

func init() {
	// Add boolean flag to list command
	var table bool
	listCmd.Flags().BoolVarP(&table, "table", "t", false, "Display output as a markdown table")

	RootCmd.AddCommand(varsCmd)
	varsCmd.AddCommand(clearCmd)
	varsCmd.AddCommand(disableCmd)
	varsCmd.AddCommand(enableCmd)
	varsCmd.AddCommand(exportCmd)
	varsCmd.AddCommand(getCmd)
	varsCmd.AddCommand(importCmd)
	varsCmd.AddCommand(listCmd)
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

// Read the value of a variable (always returns a string)
func GetVar(key string) string {
	// Read entire file in one gulp
	value, err := os.ReadFile(CustomVarFolder + "/" + key)

	if err != nil {
		value, err = os.ReadFile(DefaultVarFolder + "/" + key)
		if err != nil {
			return ""
		}
	}

	return strings.TrimSpace(string(value))
}

// Read the value of all variables
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
			// Skip files that start with a .
			if len(name) > 0 && name[0] != '.' {
				found[name] = GetVar(name)
			}
		}
	}
	for _, file := range customs {
		if !file.IsDir() {
			name := file.Name()
			// Skip files that start with a .
			if len(name) > 0 && name[0] != '.' {
				found[name] = GetVar(name)
			}
		}
	}

	return found
}

// Get all variables as properly typed data
func GetTypedVars() map[string]interface{} {
	stringVars := GetVars()
	typedVars := make(map[string]interface{})
	for key, val := range stringVars {
		typedVars[key], _ = parseYAMLValue(val)
	}

	return typedVars
}

// Get all variables as properly typed data
func GetVarsAsJson() string {
	typedVarsAsJson, err := json.MarshalIndent(GetTypedVars(), "", "  ")
	if err != nil {
		fmt.Println("export failed JSON")
	}

	return string(typedVarsAsJson)
}

func SortedVarsOrder(keys map[string]string) []string {
	// Create a slice to hold all the keys
	sorted := make([]string, 0, len(keys))
	for key := range keys {
		sorted = append(sorted, key)
	}
	// Sort the slice of keys alphabetically
	sort.Strings(sorted)

	return sorted
}

// Takes a string and parses it as YAML
func parseYAMLValue(input string) (interface{}, error) {
	var result interface{}
	err := yaml.Unmarshal([]byte(input), &result)
	if err != nil {
		return nil, err
	}
	return result, nil
}

// Write a value to a variable
func SetVar(key string, value string) {
	// Open file with 0600 permissions (read/write for owner only)
	file, err := os.OpenFile(CustomVarFolder+"/"+key, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, 0600)
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

// Remove all (custom) variables
func ClearVars() error {
	/*
	 * The vars named MORIO_ are needed for the join/rejoin flow
	 * so we do not remove them
	 */
	matches, err := filepath.Glob(CustomVarFolder + "/*")
	if err != nil {
		return err
	}

	for _, match := range matches {
		basename := filepath.Base(match)
		if !strings.HasPrefix(basename, "MORIO_") {
			fmt.Println(basename)
			if err := os.Remove(match); err != nil {
				return err
			}
		}
	}

	return nil
}
