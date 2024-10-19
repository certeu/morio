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
	Use:   "template",
	Short: "Template out the agents configuration",
  Example: "  morio template",
	Long:  `Templates out the configuration for the different agents.`,
	Run: func(cmd *cobra.Command, args []string) {
		context := GetVars()
    // The main config file for each agent
    TemplateOutFile("audit/config.yaml.mustache", "audit/config.yaml", context)
    TemplateOutFile("metrics/config.yaml.mustache", "metrics/config.yaml", context)
    TemplateOutFile("logs/config.yaml.mustache", "logs/config.yaml", context)
    // All templates for each agent
    TemplateOutFolder("audit/module-templates.d", "audit/modules.d", context)
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
  for source, dest := range TemplateList(from) {
    TemplateOutFile(from + "/" + source, to + "/" + dest, context)
  }
}

func TemplateList(folder string) map[string]string {
	// Create the map
	found := make(map[string]string)
  suffix := ".mustache"
  path := filepath.Join([]string{ "/etc", "morio", folder }...)
	templates, err := ioutil.ReadDir(path)
  if err != nil {
    fmt.Println("Unable to load template list from " + path)
		panic(err)
  }

	for _, template := range templates {
		if !template.IsDir() && filepath.Ext(template.Name()) == suffix  {
			found[template.Name()] = strings.TrimSuffix(template.Name(), suffix)
		}
	}

  return found
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
  context := map[string]bool{ "MORIO_DOCS": true }
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

func StoreTemplateDefaultVars(list map[string]string) {
}


// FIXME: Make this platform agnostic
func GetConfigPath(parts ...string) string {
  return filepath.Join(append([]string{ "/etc", "morio" }, parts...)...)
}


