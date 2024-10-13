/*
Copyright © 2024 NAME HERE <EMAIL ADDRESS>

*/
package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
)

// flagsCmd represents the flags command
var flagsCmd = &cobra.Command{
	Use:   "flags",
	Short: "Manage configuration template flags",
	Long: `Manages the flags for use in the beats agents configuration templates.`,
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Println("flags called")
	},
}

func init() {
	rootCmd.AddCommand(flagsCmd)

	// Here you will define your flags and configuration settings.

	// Cobra supports Persistent Flags which will work for this command
	// and all subcommands, e.g.:
	// flagsCmd.PersistentFlags().String("foo", "", "A help for foo")

	// Cobra supports local flags which will only run when this command
	// is called directly, e.g.:
	// flagsCmd.Flags().BoolP("toggle", "t", false, "Help message for toggle")
}
