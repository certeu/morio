package cmd

import (
	"fmt"
	"github.com/cbroglie/mustache"
	"github.com/spf13/cobra"
	"gopkg.in/yaml.v3"
	"io/ioutil"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

// morio template
var templateCmd = &cobra.Command{
	Use:     "template",
	Short:   "Template out the agents configuration",
	Example: "  morio template",
	Long:    `Templates out the configuration for the different agents.`,
	Run: func(cmd *cobra.Command, args []string) {
		// First ensure all vars are present
		EnsureTemplateVars()
		// Then load the vars
		context := GetVars()
		// Audit
		TemplateOutConfigFile("audit/config-template.yml", "audit/config.yml", context)
		TemplateOutInputFolder("audit/module-templates.d", "audit/modules.d", context)
		TemplateOutConfigFolder("audit/rule-templates.d", "audit/rules.d", context)
		// metrics
		TemplateOutConfigFile("metrics/config-template.yml", "metrics/config.yml", context)
		TemplateOutInputFolder("metrics/module-templates.d", "metrics/modules.d", context)
		// logs
		TemplateOutConfigFile("logs/config-template.yml", "logs/config.yml", context)
		TemplateOutInputFolder("logs/module-templates.d", "logs/modules.d", context)
		TemplateOutInputFolder("logs/input-templates.d", "logs/inputs.d", context)
	},
}

func init() {
	RootCmd.AddCommand(templateCmd)
}

func EnsureTemplateVars() {
	EnsureGlobalVars()
	EnsureTemplateFolderVars("audit/module-templates.d")
	EnsureTemplateFolderVars("metrics/module-templates.d")
	EnsureTemplateFolderVars("logs/module-templates.d")
	EnsureTemplateFolderVars("logs/input-templates.d")
}

// FIXME: make this platform agnostic
func EnsureTemplateFolderVars(folder string) {
	for _, file := range TemplateList(folder) {
		EnsureTemplateFileVars(folder + "/" + file)
	}
}

func EnsureTemplateFileVars(file string) {
	// Load defaults from template file
	defaults := ExtractTemplateDefaultVars(file)
	// Iterate over them an write them to disk
	for key, val := range defaults {
		SetDefaultVar(key, val)
	}
}

func TemplateOutConfigFile(from string, to string, context map[string]string) {
	// Open file
	file, err := os.Create(GetConfigPath(to))
	check(err)
	defer file.Close()

	// Inject run-time vars
	context["MORIO_TEMPLATE_SOURCE_FILE"] = GetConfigPath(from)

	// Write value
	output, err := mustache.RenderFileInLayout(GetConfigPath(from), GetConfigPath("template-layout.mustache"), context)
	if err != nil {
		fmt.Println("Failed to render " + GetConfigPath(from))
		panic(err)
	}

	_, err = file.WriteString(output)
	if err != nil {
		fmt.Println("Failed to write to " + GetConfigPath(to))
		panic(err)
	} else {
		fmt.Println(GetConfigPath(to))
	}

	// Sync
	file.Sync()
}

func TemplateOutInputFile(from string, to string, context map[string]string) {
	// Read the template from disk
	template, err := os.ReadFile(GetConfigPath(from))
	if err != nil {
		fmt.Printf("Failed to read template: %v\n", err)
		panic(err)
	}

	// Inject run-time vars
	context["MORIO_TEMPLATE_SOURCE_FILE"] = GetConfigPath(from)
	context["MORIO_MODULE_NAME"] = ModuleNameFromFile(from)

	// Render with mustache
	templated, err := mustache.Render(string(template), context)

	// Convert back to Yaml
	var result []map[string]interface{}
	yaml.Unmarshal([]byte(templated), &result)
	if err != nil {
		fmt.Println("Failed to parse templated YAML data. Bailing out.")
		panic(err)
	}

	// Filter out moriodata
	var inputs = StripMoriodataFromInputs(result)

	// Convert back to a YAML string
	yamlData, err := yaml.Marshal(inputs)
	if err != nil {
		fmt.Println("Unable to parse YAML inputs from template file. Bailing out.")
		panic(err)
	}

	// Open file
	file, err := os.Create(GetConfigPath(to))
	check(err)
	defer file.Close()

	// Write to disk
	_, err = file.WriteString(string(yamlData))
	if err != nil {
		fmt.Println("Failed to write to " + GetConfigPath(to))
		panic(err)
	} else {
		fmt.Println(GetConfigPath(to))
	}

	// Sync
	file.Sync()
}

func TemplateOutConfigFolder(from string, to string, context map[string]string) {
	ClearFolder(to)
	for _, file := range TemplateList(from) {
		TemplateOutConfigFile(from+"/"+file, to+"/"+file, context)
	}
}

func TemplateOutInputFolder(from string, to string, context map[string]string) {
	ClearFolder(to)
	for _, file := range TemplateList(from) {
		TemplateOutInputFile(from+"/"+file, to+"/"+file, context)
	}
}

func ClearFolder(folder string) {
	path := GetConfigPath(folder)
	files, err := os.ReadDir(path)
	if err != nil {
		fmt.Println("Unable to read files from folder at " + path)
		panic(err)
	}

	for _, file := range files {
		filePath := filepath.Join(path, file.Name())
		suffix := filepath.Ext(file.Name())
		if !file.IsDir() && (suffix == ".yml" || suffix == ".disabled" || suffix == ".rules") {
			if err := os.Remove(filePath); err != nil {
				fmt.Println("Failed to remove file " + filePath)
				fmt.Print(err)
			}
		}
	}
}

func TemplateList(folder string) []string {
	var files []string
	path := filepath.Join([]string{"/etc", "morio", folder}...)
	templates, err := ioutil.ReadDir(path)
	if err != nil {
		fmt.Println("Unable to load template list from " + path)
		panic(err)
	}

	for _, template := range templates {
		suffix := filepath.Ext(template.Name())
		if !template.IsDir() && suffix == ".yml" {
			files = append(files, template.Name())
		}
	}

	return files
}

func ExtractTemplateDefaultVars(from string) map[string]string {
	// Get the moriodata from the template
	moriodata := TemplateDocsAsYaml(from)

	// Prepare a map to hold our defaults
	// Note that they will all be converted to strings
	defaults := make(map[string]string)

	// Access the nested map at "moriodata.vars"
	vars, hasVars := moriodata["vars"].(map[string]interface{})
	if !hasVars {
		return defaults
	}

	// Iterate over the vars map
	for key, value := range vars {
		// Type assert value to map[string]interface{}
		if varMap, ok := value.(map[string]interface{}); ok {
			// Extract the "dflt" value if it exists
			// and then convert it to string, depending on its type
			if dflt, exists := varMap["dflt"]; exists {
				switch v := dflt.(type) {
				case string:
					defaults[key] = v
				case bool:
					defaults[key] = strconv.FormatBool(v)
				case int:
					defaults[key] = strconv.Itoa(v)
				case float64:
					defaults[key] = strconv.FormatFloat(v, 'f', -1, 64)
				case []interface{}:
					// Handle arrays
					var elements []string
					for _, item := range v {
						// Convert each element to a string
						elements = append(elements, fmt.Sprintf("%q", item))
					}
					// Join elements with commas
					defaults[key] = "[ " + strings.Join(elements, ",") + " ]"
				default:
					defaults[key] = fmt.Sprintf("%v", v)
				}
			}
		}
	}

	return defaults
}

func ExtractDefaultsFromVars(vars map[string]interface{}) map[string]string {
	// Prepare a map to hold our defaults
	// Note that they will all be converted to strings
	defaults := make(map[string]string)

	// Iterate over the vars map
	for key, value := range vars {
		// Type assert value to map[string]interface{}
		if varMap, ok := value.(map[string]interface{}); ok {
			// Extract the "dflt" value if it exists
			// and then convert it to string, depending on its type
			if dflt, exists := varMap["dflt"]; exists {
				switch v := dflt.(type) {
				case string:
					defaults[key] = v
				case bool:
					defaults[key] = strconv.FormatBool(v)
				case int:
					defaults[key] = strconv.Itoa(v)
				case float64:
					defaults[key] = strconv.FormatFloat(v, 'f', -1, 64)
				case []interface{}:
					// Handle arrays
					var elements []string
					for _, item := range v {
						// Convert each element to a string
						elements = append(elements, fmt.Sprintf("%v", item))
					}
					// Join elements with commas
					defaults[key] = "[ " + strings.Join(elements, ",") + " ]"
				default:
					defaults[key] = fmt.Sprintf("%v", v)
				}
			}
		}
	}

	return defaults
}

func isString(val interface{}) bool {
	_, ok := val.(string)
	return ok
}

// FIXME: Make this platform agnostic
func TemplateDocsAsYaml(path string) map[string]interface{} {
	template, err := os.ReadFile(GetConfigPath(path))
	if err != nil {
		fmt.Println("Cannot read template file. Bailing out.")
		panic(err)
	}

	// Now parse the result as YAML
	var result []map[string]interface{}
	yaml.Unmarshal(template, &result)
	if err != nil {
		fmt.Println("Failed to parse YAML data in template. Bailing out.")
		panic(err)
	}

	// Find and return the moriodata value
	for _, item := range result {
		if moriodata, hasMoriodata := item["moriodata"]; hasMoriodata {
			if moriodataMap, ok := moriodata.(map[string]interface{}); ok {
				return moriodataMap
			}
			fmt.Println("Moriodata value is not a map. Bailing out.")
			panic("Invalid moriodata structure")
		}
	}

	return nil
}

func StripMoriodataFromInputs(inputs []map[string]interface{}) []map[string]interface{} {
	filteredInputs := make([]map[string]interface{}, 0)
	for _, input := range inputs {
		if _, hasMoriodata := input["moriodata"]; !hasMoriodata {
			filteredInputs = append(filteredInputs, input)
		}
	}

	return filteredInputs
}

// FIXME: Make this platform agnostic
func EnsureGlobalVars() map[string]string {
	// Read the file from disk
	data, err := os.ReadFile("/etc/morio/global-vars.yml")
	if err != nil {
		fmt.Println("Cannot read global variables file. Bailing out.")
		panic(err)
	}

	// Parse as YAML into vars
	var vars map[string]interface{}
	yaml.Unmarshal([]byte(data), &vars)

	// Parse for default values and store then as strings
	defaults := ExtractDefaultsFromVars(vars)

	// Iterate over them an write them to disk
	for key, val := range defaults {
		SetDefaultVar(key, val)
	}

	return defaults
}

// FIXME: Make this platform agnostic
func GetConfigPath(parts ...string) string {
	return filepath.Join(append([]string{"/etc", "morio"}, parts...)...)
}
