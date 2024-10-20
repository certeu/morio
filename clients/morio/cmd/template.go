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
	// "strings"
)

// morio template
var templateCmd = &cobra.Command{
	Use:     "template",
	Short:   "Template out the agents configuration",
	Example: "  morio template",
	Long:    `Templates out the configuration for the different agents.`,
	Run: func(cmd *cobra.Command, args []string) {
		context := GetVars()
		// Audit
		TemplateOutFile("audit/config.yaml.mustache", "audit/config.yaml", context)
		TemplateOutFolder("audit/module-templates.d", "audit/modules.d", context)
		TemplateOutFolder("audit/rule-templates.d", "audit/rules.d", context)
		// metrics
		TemplateOutFile("metrics/config.yaml.mustache", "metrics/config.yaml", context)
		TemplateOutFolder("metrics/module-templates.d", "metrics/modules.d", context)
		// logs
		TemplateOutFile("logs/config.yaml.mustache", "logs/config.yaml", context)
		TemplateOutFolder("logs/module-templates.d", "logs/modules.d", context)
		TemplateOutFolder("logs/input-templates.d", "logs/inputs.d", context)
		// global vars
		WriteGlobalVars()
	},
}

func init() {
	rootCmd.AddCommand(templateCmd)
}

func TemplateOutFile(from string, to string, context map[string]string) {
	// Open file
	file, err := os.Create(GetConfigPath(to))
	check(err)
	defer file.Close()

	// Inject source template file location
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

	// Also extract the default vars and write them to disk
	defaults := ExtractTemplateDefaultVars(from)
	for key, value := range defaults {
		SetDefaultVar(key, value)
	}
}

func TemplateOutFolder(from string, to string, context map[string]string) {
	ClearFolder(to)
	for _, file := range TemplateList(from) {
		TemplateOutFile(from+"/"+file, to+"/"+file, context)
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
		if !file.IsDir() && (suffix == ".yaml" || suffix == ".disabled" || suffix == ".rules") {
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
		if !template.IsDir() && suffix == ".yaml" {
			files = append(files, template.Name())
		}
	}

	return files
}

func ExtractTemplateDefaultVars(from string) map[string]string {
	docs := TemplateDocsAsYaml(from)

	// Access the nested map at "keys.defaults"
	nested, ok := docs["vars"].(map[string]interface{})
	if !ok {
		return map[string]string{}
	}
	defaults, ok := nested["defaults"].(map[string]interface{})
	if !ok {
		return map[string]string{}
	}

	// Convert all values to strings in "defaults"
	convertedData := make(map[string]string)
	for key, value := range defaults {
		switch v := value.(type) {
		case string:
			convertedData[key] = v
		case bool:
			convertedData[key] = strconv.FormatBool(v)
		case int:
			convertedData[key] = strconv.Itoa(v)
		case float64:
			convertedData[key] = strconv.FormatFloat(v, 'f', -1, 64)
		default:
			convertedData[key] = fmt.Sprintf("%v", v)
		}
	}

	return convertedData
}

func isString(val interface{}) bool {
	_, ok := val.(string)
	return ok
}

func TemplateDocsAsYaml(path string) map[string]interface{} {
	// First render the template with MORIO_DOCS as true
	context := map[string]bool{"MORIO_DOCS": true}
	template, err := mustache.RenderFile(GetConfigPath(path), context)
	if err != nil {
		panic(err)
	}

	// Now parse the result as YAML
	var result map[string]interface{}
	// Parse the YAML string
	yaml.Unmarshal([]byte(template), &result)

	return result
}

// FIXME: Make this platform agnostic
func LoadGlobalVars() map[string]interface{} {
	data, err := os.ReadFile("/etc/morio/global-vars.yaml")
	if err != nil {
		fmt.Println("Cannot read global variables file. Bailing out.")
		panic(err)
	}

	var result map[string]interface{}
	yaml.Unmarshal([]byte(data), &result)

	return result
}

// FIXME: Make this platform agnostic
func WriteGlobalVars() {
	globals := LoadGlobalVars()
	for key, nested := range globals {
		entry, ok := nested.(map[string]interface{})
		if ok {
			val, _ := entry["default"]
			switch v := val.(type) {
			case string:
				SetDefaultVar(key, v)
			case bool:
				SetDefaultVar(key, strconv.FormatBool(v))
			case int:
				SetDefaultVar(key, strconv.Itoa(v))
			case float64:
				SetDefaultVar(key, strconv.FormatFloat(v, 'f', -1, 64))
			default:
				SetDefaultVar(key, fmt.Sprintf("%v", v))
			}
		}
	}
}

// FIXME: Make this platform agnostic
func GetConfigPath(parts ...string) string {
	return filepath.Join(append([]string{"/etc", "morio"}, parts...)...)
}
