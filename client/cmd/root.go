package cmd

import (
	"fmt"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
	"morio/version"
	"os"
	"path/filepath"
	"runtime"
)

var configFile string

// This is the root command which will show the help
// Other comands will add themselves as children of the root
var RootCmd = &cobra.Command{
	Use:     "morio",
	Version: version.Version,
	Short:   "The morio client",
	Long: `morio: The Morio client

This client wraps different agents that each gather one type
of observability data and ship it to a Morio collector.

Use this to manage the various agents and their configuration.`,
}

// Execute adds all child commands to the root command and sets flags appropriately.
// This is called by main.main(). It only needs to happen once to the rootCmd.
func Execute() {
	err := RootCmd.Execute()
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
	viper.AddConfigPath(GetMorioConfigDir())
	viper.SetConfigType("yaml")
	viper.SetConfigName("morio")
	viper.AutomaticEnv()
	viper.ReadInConfig()
}

// Because on windows the install can go in a user-chosen folder
// we need to be able to detect where all relevant folders reside.
// They are:
// - BEATS_HOME_DIR: The home folder under which each beat keep its state
// - BEATS_DATA_DIR: The folder under which each beat keeps its data
// - MORIO_CONFIG_DIR: The morio configuration folder
// - MORIO_LOGS_DIR: The folder where to store logs
//
// The helper methods below are all about this detection

func getWindowsBasePath() string {
	exe, err := os.Executable()
	if err != nil {
		panic(fmt.Sprintf("Failed to detect the Morio config path: %v", err))
	}

	// We need the parent folder of the folder holding morio.exe
	return filepath.Dir(filepath.Dir(exe))
}

func GetBeatsHomeDir() string {
	switch runtime.GOOS {
	case "windows":
		return getWindowsBasePath()
	// Linux and MacOS use the same path
	default:
		return "/usr/share"
	}
}

func GetBeatsDataDir() string {
	switch runtime.GOOS {
	case "windows":
		return filepath.Join(getWindowsBasePath(), "data")
	// Linux and MacOS use the same path
	default:
		return "/var/lib/morio"
	}
}

func GetMorioConfigDir() string {
	switch runtime.GOOS {
	case "windows":
		return filepath.Join(getWindowsBasePath(), "etc")
	case "darwin":
		return "/opt/morio/etc"
	default:
		return "/etc/morio"
	}
}

func GetMorioLogsDir() string {
	switch runtime.GOOS {
	case "windows":
		return filepath.Join(getWindowsBasePath(), "logs")
	// Linux and MacOS use the same path
	default:
		return "/var/log/morio"
	}
}
