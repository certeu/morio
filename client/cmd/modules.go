package cmd

import (
	"encoding/json"
	"fmt"
	"github.com/olekukonko/tablewriter"
	"github.com/spf13/cobra"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"slices"
	"sort"
	"strings"
)

type SuccessResponseModules struct {
	Available []string `json:"available"`
	Enabled   []string `json:"enabled"`
}

// morio modules
var modulesCmd = &cobra.Command{
	Use:   "modules",
	Short: "Manage modules",
	Long: `Manages client modules.
This allows you to manage Morio client modules which will be applied to all agents.`,
}

// morio modules list
var modulesListCmd = &cobra.Command{
	Use:     "list",
	Short:   "List local modules",
	Long:    `List client modules.`,
	Example: `  morio module list`,
	Run: func(cmd *cobra.Command, args []string) {
		// Get the verbose flag value from the command
		verbose, _ := cmd.Flags().GetBool("verbose")
		table, _ := cmd.Flags().GetBool("table")
		ShowModulesList(verbose, table)
	},
}

// morio modules enable
var modulesEnableCmd = &cobra.Command{
	Use:     "enable [module-name]",
	Short:   "Enable a local module",
	Long:    `Enables a client module.`,
	Args:    cobra.ExactArgs(1),
	Example: `  morio module enable linux-apache2`,
	Run: func(cmd *cobra.Command, args []string) {
		enableModule(args[0])
		ShowModulesList(false, false)
	},
}

// morio modules disable
var modulesDisableCmd = &cobra.Command{
	Use:     "disable [module-name]",
	Short:   "Disable a local module",
	Long:    `Disables a client module.`,
	Args:    cobra.ExactArgs(1),
	Example: `  morio module disable linux-apache2`,
	Run: func(cmd *cobra.Command, args []string) {
		disableModule(args[0])
		ShowModulesList(false, false)
	},
}

// morio modules info
var modulesInfoCmd = &cobra.Command{
	Use:     "info [module-name]",
	Short:   "Show local module info",
	Long:    `Shows info about a client module.`,
	Args:    cobra.ExactArgs(1),
	Example: `  morio module info linux-system`,
	Run: func(cmd *cobra.Command, args []string) {
		ModuleInfo(args[0])
	},
}

// morio modules list-remote
var modulesListRemoteCmd = &cobra.Command{
	Use:     "list-remote",
	Short:   "List remote modules",
	Long:    `List client modules available on the Morio cluster.`,
	Example: `  morio module list-remote`,
	Run: func(cmd *cobra.Command, args []string) {
		// Get the table flag value from the command
		table, _ := cmd.Flags().GetBool("table")
		ShowRemoteModulesList(table)
	},
}

// morio modules enable-remote
var modulesEnableRemoteCmd = &cobra.Command{
	Use:     "enable-remote [module-name]",
	Short:   "Enable a remote module",
	Long:    `Enables a module for this client on the Morio cluster.`,
	Args:    cobra.ExactArgs(1),
	Example: `  morio module enable-remote linux-apache2`,
	Run: func(cmd *cobra.Command, args []string) {
		EnableRemoteModule(args[0])
	},
}

// morio modules disable-remote
var modulesDisableRemoteCmd = &cobra.Command{
	Use:     "disable-remote [module-name]",
	Short:   "Disable a remote module",
	Long:    `Disables a module for this client on the Morio cluster.`,
	Args:    cobra.ExactArgs(1),
	Example: `  morio module disable-remote linux-apache2`,
	Run: func(cmd *cobra.Command, args []string) {
		DisableRemoteModule(args[0])
	},
}

func init() {
	// Boolean flags for the list command
	var verbose bool
	var table bool
	// Add flags to list command
	modulesListCmd.Flags().BoolVarP(&verbose, "verbose", "v", false, "Verbose output, lists modules per agent")
	modulesListCmd.Flags().BoolVarP(&table, "table", "t", false, "Display output as a markdown table")
	// Add flag to list-remote command
	modulesListRemoteCmd.Flags().BoolVarP(&table, "table", "t", false, "Display output as a markdown table")
	// Add the commands
	RootCmd.AddCommand(modulesCmd)
	modulesCmd.AddCommand(modulesListCmd)
	modulesCmd.AddCommand(modulesEnableCmd)
	modulesCmd.AddCommand(modulesDisableCmd)
	modulesCmd.AddCommand(modulesInfoCmd)
	modulesCmd.AddCommand(modulesListRemoteCmd)
	modulesCmd.AddCommand(modulesEnableRemoteCmd)
	modulesCmd.AddCommand(modulesDisableRemoteCmd)
}

func ShowModuleList(agent string) {
	enabled, disabled := ModuleList(agent + "/module-templates.d")
	if agent == "logs" {
		enabledInputs, disabledInputs := ModuleList(agent + "/input-templates.d")
		enabled = joinUnique(enabled, enabledInputs)
		disabled = joinUnique(disabled, disabledInputs)
	}
	if len(enabled) == 0 {
		fmt.Println("No " + agent + " modules enabled")
	} else {
		fmt.Println("Enabled " + agent + " modules:")
		for _, name := range enabled {
			fmt.Println(" - " + ModuleNameFromFile(name))
		}
	}
	if len(disabled) == 0 {
		fmt.Println("No " + agent + " modules disabled")
	} else {
		fmt.Println("Disabled " + agent + " modules:")
		for _, name := range disabled {
			fmt.Println(" - " + ModuleNameFromFile(name))
		}
	}
	fmt.Println()
}

func GetEnabledModules() []string {
	// Gather all enabled modules
	enabled, _ := ModuleList("audit/module-templates.d")
	enabledLogs, _ := ModuleList("logs/module-templates.d")
	enabledLogsInputs, _ := ModuleList("logs/input-templates.d")
	enabledMetrics, _ := ModuleList("metrics/module-templates.d")

	// Make them unique
	enabled = joinUnique(enabled, enabledLogs)
	enabled = joinUnique(enabled, enabledLogsInputs)
	enabled = joinUnique(enabled, enabledMetrics)

	// Turn filenames into module names
	list := make([]string, len(enabled))

	for i, val := range enabled {
		list[i] = ModuleNameFromFile(val)
	}

	return list
}

func ShowModuleListSummary(table bool) {
	// Gather all enabled modules
	enabled := GetEnabledModules()

	if len(enabled) == 0 {
		fmt.Println("No modules are currently enabled")
	} else {
		if table {
			// Table output
			table := tablewriter.NewWriter(os.Stdout)
			table.SetHeader([]string{"Module", "Enabled"})
			table.SetBorders(tablewriter.Border{Left: true, Top: false, Right: true, Bottom: false})
			table.SetCenterSeparator("|")
			table.SetAutoWrapText(false)

			for _, name := range enabled {
				table.Append([]string{name, "yes"})
			}

			table.Render()
		} else {
			fmt.Println("Enabled modules:")
			for _, name := range enabled {
				fmt.Println(" - " + ModuleNameFromFile(name))
			}
		}
	}
	fmt.Println()
}

func ShowModulesList(verbose bool, table bool) {
	if verbose {
		ShowModuleListSummary(table)
		ShowModuleList("audit")
		ShowModuleList("logs")
		ShowModuleList("metrics")
	} else {
		ShowModuleListSummary(table)
	}
}

func ModuleList(folder string) ([]string, []string) {
	var enabled []string
	var disabled []string
	path := GetConfigPath(folder)
	templates, err := os.ReadDir(path)
	if err != nil {
		fmt.Println("Unable to load template list from " + path)
		panic(err)
	}

	for _, template := range templates {
		suffix := filepath.Ext(template.Name())
		if !template.IsDir() {
			if suffix == ".yml" {
				enabled = append(enabled, template.Name())
			}
			if suffix == ".disabled" {
				disabled = append(disabled, template.Name())
			}
		}
	}

	return enabled, disabled
}

func enableModule(module string) {
	enableAuditModule(module)
	enableLogsModule(module)
	enableMetricsModule(module)
}

func enableAuditModule(module string) {
	enableModuleFile("audit/module-templates.d", module)
}

func enableLogsModule(module string) {
	enableModuleFile("logs/input-templates.d", module)
	enableModuleFile("logs/module-templates.d", module)
}

func enableMetricsModule(module string) {
	enableModuleFile("metrics/module-templates.d", module)
}

func enableModuleFile(base, module string) {
	_, disabled := ModuleList(base)
	for _, name := range disabled {
		moduleName := ModuleNameFromFile(name)
		if moduleName == module {
			os.Rename(GetConfigPath(base+"/"+name), GetConfigPath(base+"/"+moduleName+".yml"))
		}
	}
}

func disableModule(module string) {
	disableAuditModule(module)
	disableLogsModule(module)
	disableMetricsModule(module)
}

func disableAuditModule(module string) {
	disableModuleFile("audit/module-templates.d", module)
}

func disableLogsModule(module string) {
	disableModuleFile("logs/input-templates.d", module)
	disableModuleFile("logs/module-templates.d", module)
}

func disableMetricsModule(module string) {
	disableModuleFile("metrics/module-templates.d", module)
}

func disableModuleFile(base, module string) {
	enabled, _ := ModuleList(base)
	for _, name := range enabled {
		moduleName := ModuleNameFromFile(name)
		if moduleName == module {
			os.Rename(GetConfigPath(base+"/"+moduleName+".yml"), GetConfigPath(base+"/"+moduleName+".yml.disabled"))
		}
	}
}

func ModuleNameFromFile(file string) string {
	baseFile := filepath.Base(file)
	base := baseFile[:len(baseFile)-len(filepath.Ext(baseFile))]
	// Disabled modules have a double extension
	if strings.HasSuffix(base, ".yml") {
		return base[:len(base)-len(filepath.Ext(base))]
	} else {
		return base
	}
}

func ModuleInfo(module string) {
	AuditModuleInfo(module, true)
	LogsModuleInfo(module, false)
	MetricsModuleInfo(module, false)
}

func AuditModuleInfo(module string, printHeader bool) {
	ModuleFileInfo("audit", "module-templates.d", module, printHeader)
}

func LogsModuleInfo(module string, printHeader bool) {
	ModuleFileInfo("logs", "module-templates.d", module, printHeader)
	ModuleFileInfo("logs", "input-templates.d", module, false)
}

func MetricsModuleInfo(module string, printHeader bool) {
	ModuleFileInfo("metrics", "module-templates.d", module, printHeader)
}

func ModuleFileInfo(agent, folder, module string, printHeader bool) {
	enabled, disabled := ModuleList(agent + "/" + folder)
	for _, name := range enabled {
		moduleName := ModuleNameFromFile(name)
		if moduleName == module {
			if printHeader == true {
				PrintModuleInfoHeader(module, "enabled")
			}
			PrintModuleInfoData(agent, folder, name)
		}
	}
	for _, name := range disabled {
		moduleName := ModuleNameFromFile(name)
		if moduleName == module {
			if printHeader == true {
				PrintModuleInfoHeader(module, "disabled")
			}
			PrintModuleInfoData(agent, folder, name)
		}
	}
}

func PrintModuleInfoHeader(module, status string) {
	fmt.Print()
	fmt.Println("Module: " + module)
	fmt.Println("Status: " + status)
	fmt.Print()
}

func PrintModuleInfoData(agent, folder, file string) {
	moriodata := TemplateDocsAsYaml(agent + "/" + folder + "/" + file)

	// We want this in alphabetical order
	sorted := make([]string, 0, len(moriodata))
	for k := range moriodata {
		sorted = append(sorted, k)
	}
	sort.Strings(sorted)

	if len(moriodata) > 0 {
		fmt.Print("  [ " + agent + " ]")
	}
	for _, key := range sorted {
		val := moriodata[key]
		if key == "href" {
			fmt.Print("\n    See: ")
			fmt.Print(val)
		}
		if key == "info" {
			fmt.Print("\n    Info: ")
			fmt.Print(val)
		}
		if key == "version" {
			fmt.Print("\n    Version: ")
			fmt.Println(val)
		}
		if key == "vars" {
			fmt.Print("\n    Vars:")
			vars, ok := moriodata["vars"].(map[string]interface{})
			if ok {
				for varKey, _ := range vars {
					fmt.Print("\n      " + varKey + ": ")
					nested, ok := vars[varKey].(map[string]interface{})
					if ok {
						if docs, ok := nested["info"].(string); ok {
							if ok {
								fmt.Print(docs)
							}
						}
					}
				}
			}
		}
	}
}

func joinUnique(slice1, slice2 []string) []string {
	uniqueMap := make(map[string]bool)
	for _, item := range slice1 {
		uniqueMap[item] = true
	}
	for _, item := range slice2 {
		uniqueMap[item] = true
	}
	result := make([]string, 0, len(uniqueMap))
	for key := range uniqueMap {
		result = append(result, key)
	}

	return result
}

func ClearModules() {
	ClearModuleFiles("audit/module-templates.d")
	ClearModuleFiles("audit/rule-templates.d")
	ClearModuleFiles("logs/module-templates.d")
	ClearModuleFiles("logs/input-templates.d")
	ClearModuleFiles("metrics/module-templates.d")
}

// FIXME: Make this platform agnostic
func ClearModuleFiles(folder string) error {
	matches, err := filepath.Glob(GetConfigPath(folder) + "/*")
	if err != nil {
		return err
	}

	for _, match := range matches {
		if err := os.Remove(match); err != nil {
			return err
		}
	}

	return nil
}

func ShowRemoteModulesList(table bool) {
	available, enabled, _ := FetchModules()

	ShowRemoteModuleListSummary(available, enabled, table)
}

func FetchModules() ([]string, []string, error) {
	// Grab the cluste,r client UUID, and API key secret (if they exist)
	uuid := GetVar("MORIO_CLIENT_UUID")
	secret := GetVar("MORIO_APIKEY_SECRET")
	cluster := GetVar("MORIO_CLUSTER")

	if uuid == "" {
		return nil, nil, fmt.Errorf("No client UUID found. Did you join this client to a Morio cluster?")
	}
	if secret == "" {
		return nil, nil, fmt.Errorf("No API key found. Did you join this client to a Morio cluster?")
	}
	if cluster == "" {
		return nil, nil, fmt.Errorf("No cluster name found. Did you join this client to a Morio cluster?")
	}

	// Create HTTP client
	client, err := CreateHttpClient()
	if err != nil {
		return nil, nil, fmt.Errorf("Error creating HTTP client: %v", err)
	}

	// API endpoint
	apiURL := fmt.Sprintf("https://%s/-/api/clients/modules", cluster)

	// Create request
	req, err := http.NewRequest("GET", apiURL, nil)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Set authentication header
	req.SetBasicAuth(uuid, secret)

	// Send request
	resp, err := client.Do(req)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	// Read response body
	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to read response body: %w", err)
	}

	// Handle different response types based on status code
	if resp.StatusCode != http.StatusOK {
		// Parse error response (RFC7807)
		var errResp ErrorResponse
		if err := json.Unmarshal(respBody, &errResp); err != nil {
			return nil, nil, fmt.Errorf("failed to parse error response: %w", err)
		}

		// Log the error and exit
		PrintErrorResponse(errResp)
		return nil, nil, fmt.Errorf("\nRequest failed with status code: %d", resp.StatusCode)
	}

	// Parse success response
	var successResp SuccessResponseModules
	if err := json.Unmarshal(respBody, &successResp); err != nil {
		return nil, nil, fmt.Errorf("failed to parse success response: %w", err)
	}

	return successResp.Available, successResp.Enabled, nil
}

func ShowRemoteModuleListSummary(available []string, enabled []string, table bool) {
	if len(available) == 0 {
		fmt.Println("No modules are currently available on the cluster")
	} else {
		if table {
			// Table output
			table := tablewriter.NewWriter(os.Stdout)
			table.SetHeader([]string{"Module", "Enabled"})
			table.SetBorders(tablewriter.Border{Left: true, Top: false, Right: true, Bottom: false})
			table.SetCenterSeparator("|")
			table.SetAutoWrapText(false)

			for _, name := range available {
				on := "No"
				if slices.Contains(enabled, name) {
					on = "Yes"
				}
				table.Append([]string{name, on})
			}

			table.Render()
		} else {
			fmt.Println("Remote modules:")
			for _, name := range available {
				on := " - "
				if slices.Contains(enabled, name) {
					on = " + "
				}
				fmt.Println(on + name)
			}
		}
	}
	fmt.Println()
}

func EnableRemoteModule(module string) error {
	return ChangeRemoteModuleStatus(module, "enable")
}

func DisableRemoteModule(module string) error {
	return ChangeRemoteModuleStatus(module, "disable")
}

func ChangeRemoteModuleStatus(module string, state string) error {
	// Grab the cluste,r client UUID, and API key secret (if they exist)
	uuid := GetVar("MORIO_CLIENT_UUID")
	secret := GetVar("MORIO_APIKEY_SECRET")
	cluster := GetVar("MORIO_CLUSTER")

	if uuid == "" {
		return fmt.Errorf("No client UUID found. Did you join this client to a Morio cluster?")
	}
	if secret == "" {
		return fmt.Errorf("No API key found. Did you join this client to a Morio cluster?")
	}
	if cluster == "" {
		return fmt.Errorf("No cluster name found. Did you join this client to a Morio cluster?")
	}

	// Create HTTP client
	client, err := CreateHttpClient()
	if err != nil {
		return fmt.Errorf("Error creating HTTP client: %v", err)
	}

	// API endpoint
	apiURL := fmt.Sprintf("https://%s/-/api/clients/modules/%s/%s", cluster, state, module)

	// Create request
	req, err := http.NewRequest("PUT", apiURL, nil)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	// Set authentication header
	req.SetBasicAuth(uuid, secret)

	// Send request
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	// Read response body
	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read response body: %w", err)
	}

	// Handle different response types based on status code
	if resp.StatusCode != http.StatusNoContent {
		// Parse error response (RFC7807)
		var errResp ErrorResponse
		if err := json.Unmarshal(respBody, &errResp); err != nil {
			return fmt.Errorf("failed to parse error response: %w", err)
		}

		// Log the error and exit
		PrintErrorResponse(errResp)
		return fmt.Errorf("\nRequest failed with status code: %d", resp.StatusCode)
	}

	// All good, let the people know
	fmt.Printf("Module %s is now %sd for this client in the inventory.\n", module, state)
	if state == "enable" {
		fmt.Println("Use 'morio pull' to update the local configuration.")
	} else {
		fmt.Println("Use 'morio reset modules' followed by 'morio pull' to update the local configuration.")
	}

	return nil
}
