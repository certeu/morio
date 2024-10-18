package vars

import (
    "bufio"
    "fmt"
    "io"
    "os"
)

func check(e error) {
    if e != nil {
        panic(e)
    }
}

// Makes sure that paths.auditbeat is set in the config
func EnsureBeatPath(beat string) {
  key := "paths." + beat
	if !viper.IsSet(key) {
		// Not set, prompt the user for the path
		reader := bufio.NewReader(os.Stdin)
		fmt.Print("Please provide the path to " + beat + ": ")
		path, _ := reader.ReadString('\n')

		// Trim newline characters from the input
		path = path[:len(path)-1]

		// Set the value in Viper
		viper.Set(key, path)

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

