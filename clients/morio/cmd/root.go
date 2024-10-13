package cmd

import (
  "os"
  "github.com/spf13/cobra"
  "github.com/spf13/viper"
)

var configFile string

// This is the root command which will show the help
// Other comands will add themselves as children of the root
var rootCmd = &cobra.Command{
	Use:   "morio",
  Version: "0.1",
	Short: "The morio client",
  Long: `morio: The Morio client

This wraps the various local agents that gather
observability data and ship it to a Morio instance.

Use this to manage the various agents and their configuration.`,
}

// Execute adds all child commands to the root command and sets flags appropriately.
// This is called by main.main(). It only needs to happen once to the rootCmd.
func Execute() {
	err := rootCmd.Execute()
	if err != nil {
		os.Exit(1)
	}
}

// When starting up, initialize the config file
func init() {
  cobra.OnInitialize(initConfig)
}

// Set up viper to manage the config file
func initConfig() {
  viper.SetEnvPrefix("morio")
  viper.AddConfigPath("/etc/morio/")
  viper.SetConfigType("yaml")
  viper.SetConfigName("morio")
  viper.AutomaticEnv()
  viper.ReadInConfig()
}

