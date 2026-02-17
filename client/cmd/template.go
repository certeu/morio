package cmd

import (
	"fmt"
	"github.com/cbroglie/mustache"
	"github.com/spf13/cobra"
	"gopkg.in/yaml.v3"
	"io/ioutil"
	"os"
	"path/filepath"
	"runtime"
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
		TemplateConfig()
	},
}

func init() {
	RootCmd.AddCommand(templateCmd)
}

func EnsureTemplateVars() {
	EnsureTemplateFolderVars(filepath.Join("audit", "module-templates.d"))
	EnsureTemplateFolderVars(filepath.Join("metrics", "module-templates.d"))
	EnsureTemplateFolderVars(filepath.Join("logs", "module-templates.d"))
	EnsureTemplateFolderVars(filepath.Join("logs", "input-templates.d"))
	if runtime.GOOS == "windows" {
		EnsureTemplateFolderVars(filepath.Join("eventlogs", "module-templates.d"))
	}
}

func TemplateConfig() {
	// First ensure all vars are present
	EnsureTemplateVars()
	// Then load the vars
	context := GetVars()

	// Audit
	TemplateOutConfigFile(filepath.Join("audit", "config-template.yml"), filepath.Join("audit", "config.yml"), context)
	TemplateOutInputFolder(filepath.Join("audit", "module-templates.d"), filepath.Join("audit", "modules.d"), context)
	TemplateOutConfigFolder(filepath.Join("audit", "rule-templates.d"), filepath.Join("audit", "rules.d"), context)

	// Metrics
	TemplateOutConfigFile(filepath.Join("metrics", "config-template.yml"), filepath.Join("metrics", "config.yml"), context)
	TemplateOutInputFolder(filepath.Join("metrics", "module-templates.d"), filepath.Join("metrics", "modules.d"), context)

	// Logs
	TemplateOutConfigFile(filepath.Join("logs", "config-template.yml"), filepath.Join("logs", "config.yml"), context)
	TemplateOutInputFolder(filepath.Join("logs", "module-templates.d"), filepath.Join("logs", "modules.d"), context)
	TemplateOutInputFolder(filepath.Join("logs", "input-templates.d"), filepath.Join("logs", "inputs.d"), context)

	// Eventlogs (windows only)
	if runtime.GOOS == "windows" {
		TemplateOutInputFolder(filepath.Join("eventlogs", "module-templates.d"), filepath.Join("eventlogs", "modules.d"), context)
		// Winlogbeat does not support modules like filebeat and metricbeat do
		// Instead, the config needs to go in the main file
		// We emulate the module support in the Morio client by
		// loading the various modules files and then injecting them
		// into the main winlogbeat config file
		context["MORIO_WINLOGBEAT_TEMPLATED_MODULES"] = LoadWinlogbeatModules(filepath.Join("eventlogs", "modules.d"))
		TemplateOutConfigFile(filepath.Join("eventlogs", "config-template.yml"), filepath.Join("eventlogs", "config.yml"), context)
	}
}

func EnsureTemplateFolderVars(folder string) {
	for _, file := range TemplateList(folder) {
		EnsureTemplateFileVars(filepath.Join(folder, file))
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
	// Read the template from disk
	template, err := os.ReadFile(GetConfigFilePath(from))
	if err != nil {
		fmt.Printf("Failed to read config file: %v\n", err)
		panic(err)
	}

	// Inject run-time vars
	context["MORIO_TEMPLATE_SOURCE_FILE"] = GetConfigFilePath(from)

	// Render with mustache
	output, err := mustache.Render("{{={| |}=}}"+string(template), context)
	if err != nil {
		fmt.Printf("Failed to render config file from %s: %v\n", from, err)
		panic(err)
	}

	// Open file
	file, err := os.Create(GetConfigFilePath(to))
	check(err)
	defer file.Close()

	// Write value
	_, err = file.WriteString(output)
	if err != nil {
		fmt.Println("Failed to write to " + to)
		panic(err)
	} else {
		fmt.Println("Templating config file: " + to)
	}

	// Sync
	file.Sync()
}

func TemplateOutInputFile(from string, to string, context map[string]string) {
	// Read the template from disk
	template, err := os.ReadFile(GetConfigFilePath(from))
	if err != nil {
		fmt.Printf("Failed to read template file: %v\n", err)
		panic(err)
	}

	// Inject run-time vars
	context["MORIO_TEMPLATE_SOURCE_FILE"] = GetConfigFilePath(from)
	context["MORIO_MODULE_NAME"] = ModuleNameFromFile(from)

	// Render with mustache
	templated, err := mustache.Render("{{={| |}=}}"+string(template), context)
	if err != nil {
		fmt.Printf("Failed to render input file from %s: %v\n", from, err)
		panic(err)
	}

	// Convert back to Yaml
	var result []map[string]interface{}
	yaml.Unmarshal([]byte(templated), &result)
	if err != nil {
		fmt.Println("Failed to parse templated YAML data. Bailing out.")
		panic(err)
	}

	// Filter out moriodata
	var inputs = AddDefaultProcessorsToInputs(StripMoriodataFromInputs(result), from)

	// Convert back to a YAML string
	yamlData, err := yaml.Marshal(inputs)
	if err != nil {
		fmt.Println("Unable to parse YAML inputs from template file. Bailing out.")
		panic(err)
	}

	// Open file
	file, err := os.Create(GetConfigFilePath(to))
	check(err)
	defer file.Close()

	// Write to disk
	_, err = file.WriteString(string(yamlData))
	if err != nil {
		fmt.Println("Failed to write to " + GetConfigFilePath(to))
		panic(err)
	}

	// Sync
	file.Sync()
}

func TemplateOutConfigFolder(from string, to string, context map[string]string) {
	ClearFolder(to)
	for _, file := range TemplateList(from) {
		TemplateOutConfigFile(filepath.Join(from, file), filepath.Join(to, file), context)
	}
}

func TemplateOutInputFolder(from string, to string, context map[string]string) {
	ClearFolder(to)
	for _, file := range TemplateList(from) {
		TemplateOutInputFile(filepath.Join(from, file), filepath.Join(to, file), context)
	}
}

func ClearFolder(folder string) {
	path := GetConfigFilePath(folder)
	files, err := os.ReadDir(path)
	if err != nil {
		// Gracefully handle missing directories (e.g., audit on macOS)
		return
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
	// Grab the templates from disk
	path := GetConfigFilePath(folder)
	templates, err := ioutil.ReadDir(path)
	if err != nil {
		// Just return an empty list if we cannot find them
		return files
	}

	// Now build our list of template files
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

func TemplateDocsAsYaml(path string) map[string]interface{} {
	template, err := os.ReadFile(GetConfigFilePath(path))
	if err != nil {
		fmt.Println("Cannot read template file. Bailing out.")
		panic(err)
	}

	// Render with mustache because the tags make for invalid YAML
	// and we are only interested in extracting the moriodata
	context := GetVars()
	cleanTemplate, err := mustache.Render("{{={| |}=}}"+string(template), context)
	if err != nil {
		fmt.Printf("Failed to render file from %s: %v\n", path, err)
		panic(err)
	}

	// Now parse the cleaned template as YAML
	var result []map[string]interface{}
	yaml.Unmarshal([]byte(cleanTemplate), &result)
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

func AddDefaultProcessorsToInputs(inputs []map[string]interface{}, from string) []map[string]interface{} {
	// These are processors that we add to every input
	// This way, we keep the boilerplate to a minimum
	defaultProcessors := []map[string]interface{}{
		{
			"add_fields": map[string]interface{}{
				"target": "host",
				"fields": map[string]interface{}{
					"id": GetVar("MORIO_CLIENT_UUID"),
				},
				"when": map[string]interface{}{
					"not": map[string]interface{}{
						"has_fields": []string{"host.id"},
					},
				},
			},
		},
		{
			"add_labels": map[string]interface{}{
				"labels": map[string]interface{}{
					"morio.module": ModuleNameFromFile(from),
				},
				"when": map[string]interface{}{
					"not": map[string]interface{}{
						"has_fields": []string{"labels.morio.module"},
					},
				},
			},
		},
		{
			"add_id": map[string]string{
				"target_field": "@metadata._id",
			},
		},
	}

	// If there's no processors key, that makes it easy
	for i := range inputs {
		processors, exists := inputs[i]["processors"]
		if !exists {
			inputs[i]["processors"] = defaultProcessors
			continue
		}

		// If there is a processors key, we need to add to it
		// This takes some more work as this comes from parsed YAML
		// So we cannot be certain about the structure
		var existingProcessors []map[string]interface{}

		switch p := processors.(type) {
		case []map[string]interface{}:
			existingProcessors = p
		case []interface{}:
			// Convert []interface{} to []map[string]interface{}
			existingProcessors = make([]map[string]interface{}, len(p))
			for j, item := range p {
				if m, ok := item.(map[string]interface{}); ok {
					existingProcessors[j] = m
				}
			}
		default:
			// If it's neither type, replace with default processors
			inputs[i]["processors"] = defaultProcessors
			continue
		}

		inputs[i]["processors"] = append(existingProcessors, defaultProcessors...)
	}

	return inputs
}

// GetConfigFilePath returns the full path to a config file/folder
func GetConfigFilePath(parts ...string) string {
	return filepath.Join(append([]string{GetMorioConfigDir()}, parts...)...)
}

// WriteConfigFile writes content to a file in the config directory
func WriteConfigFile(filename string, content string) error {
	// Open file
	file, err := os.Create(GetConfigFilePath(filename))
	check(err)
	defer file.Close()

	// Write value
	_, err = file.WriteString(content)
	if err != nil {
		fmt.Println("Failed to write to " + GetConfigFilePath(filename))
		panic(err)
	}

	// Sync
	file.Sync()

	return err
}

// Windows is the bane of my existence
func LoadWinlogbeatModules(folder string) string {
	var allEventLogs []map[string]interface{}

	// Process the list of (already templated) module files
	files := TemplateList(folder)
	for _, file := range files {
		// Read file
		filePath := GetConfigFilePath(filepath.Join(folder, file))
		content, err := os.ReadFile(filePath)
		if err != nil {
			fmt.Printf("Failed to read winlogbeat module file %s: %v\n", file, err)
			continue
		}

		// Parse YAML array
		var modules []map[string]interface{}
		err = yaml.Unmarshal(content, &modules)
		if err != nil {
			fmt.Printf("Failed to parse YAML in winlogbeat module file %s: %v\n", file, err)
			continue
		}

		// Process each entry in the module
		for _, module := range modules {
			// Convert event_id array to comma-separated string
			if eventID, hasEventID := module["event_id"]; hasEventID {
				if eventIDArray, ok := eventID.([]interface{}); ok {
					var eventIDStrings []string
					for _, id := range eventIDArray {
						eventIDStrings = append(eventIDStrings, fmt.Sprintf("%v", id))
					}
					// Replace array with comma-separated string
					module["event_id"] = strings.Join(eventIDStrings, ", ")
				}
			}

			// Check if this entry has a dataset property
			if dataset, hasDataset := module["dataset"]; hasDataset {
				// Extract dataset value as string
				datasetStr := fmt.Sprintf("%v", dataset)

				// Find and modify the add_labels processor to include morio.dataset
				if processors, hasProcessors := module["processors"]; hasProcessors {
					if processorsList, ok := processors.([]interface{}); ok {
						for _, proc := range processorsList {
							if procMap, ok := proc.(map[string]interface{}); ok {
								// Look for add_labels processor
								if addLabels, hasAddLabels := procMap["add_labels"]; hasAddLabels {
									if addLabelsMap, ok := addLabels.(map[string]interface{}); ok {
										if labels, hasLabels := addLabelsMap["labels"]; hasLabels {
											if labelsMap, ok := labels.(map[string]interface{}); ok {
												// Add the morio.dataset label
												labelsMap["morio.dataset"] = datasetStr
											}
										}
									}
								}
							}
						}
					}
				}

				// Remove the dataset property from the entry
				delete(module, "dataset")
			}

			// Add to collection
			allEventLogs = append(allEventLogs, module)
		}
	}

	// If no event logs found, return empty string
	// This will cause the mustache conditional to not render
	if len(allEventLogs) == 0 {
		return ""
	}

	// Marshal back to YAML
	yamlData, err := yaml.Marshal(allEventLogs)
	if err != nil {
		fmt.Printf("Failed to marshal winlogbeat event_logs to YAML: %v\n", err)
		panic(err)
	}

	return string(yamlData)
}
