package agents

import (
  "os"
  "github.com/spf13/cobra"
  "github.com/spf13/viper"
)

// Make sure we only take valid input
type BeatType string
const (
  Metricbeat BeatType = "metricbeat"
  Filebeat   BeatType = "filebeat"
  Auditbeat  BeatType = "auditbeat"
)

// Makes sure that paths.auditbeat is set in the config
func EnsureBeatPath() {
	if !viper.IsSet("paths.auditbeat") {
		// Not set, prompt the user for the path
		reader := bufio.NewReader(os.Stdin)
		fmt.Print("Please provide the path to auditbeat: ")
		auditbeat, _ := reader.ReadString('\n')

		// Trim newline characters from the input
		auditbeat = auditbeat[:len(auditbeat)-1]

		// Set the value in Viper
		viper.Set("paths.auditbeat", auditbeat)

		// Save the updated configuration to the file
		if err := viper.WriteConfig(); err != nil {
			if _, ok := err.(viper.ConfigFileNotFoundError); ok {
				// If no config file exists, create one
				if err := viper.SafeWriteConfig(); err != nil {
					fmt.Println("Failed to create config file:", err)
					os.Exit(1)
				}
			} else {
				fmt.Println("Failed to write to config file:", err)
				os.Exit(1)
			}
		}
	}
}

