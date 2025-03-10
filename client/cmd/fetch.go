package cmd

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"

	"github.com/spf13/cobra"
)

type PullFile struct {
	File    string `json:"file"`
	Folder  string `json:"folder"`
	Content string `json:"content"`
}

type PullVariable struct {
	Key string `json:"key"`
	Val string `json:"val"`
}

type SuccessResponsePull struct {
	Files   []PullFile     `json:"files"`
	Vars    []PullVariable `json:"vars"`
	Modules []string       `json:"modules"`
}

func init() {
	RootCmd.AddCommand(fetchCmd)
}

var fetchCmd = &cobra.Command{
	Use:   "fetch",
	Short: "Fetch client configuration",
	Long:  `Loads the client configuration from the Morio cluster.`,
	Args:  cobra.ExactArgs(0),
	RunE: func(cmd *cobra.Command, args []string) error {
		return FetchConfig()
	},
}

func FetchConfig() error {
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
		log.Fatalf("Error creating HTTP client: %v", err)
	}

	// API endpoint
	apiURL := fmt.Sprintf("https://%s/-/api/clients/pull/%s", cluster, uuid)

	// Create request
	req, err := http.NewRequest("GET", apiURL, nil)
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
	if resp.StatusCode != http.StatusOK {
		// Parse error response (RFC7807)
		var errResp ErrorResponse
		if err := json.Unmarshal(respBody, &errResp); err != nil {
			return fmt.Errorf("failed to parse error response: %w", err)
		}

		// Log the error and exit
		PrintErrorResponse(errResp)
		return fmt.Errorf("\nRequest failed with status code: %d", resp.StatusCode)
	}

	// Parse success response
	var successResp SuccessResponsePull
	if err := json.Unmarshal(respBody, &successResp); err != nil {
		return fmt.Errorf("failed to parse success response: %w", err)
	}

	// Write vars
	for _, variable := range successResp.Vars {
		fmt.Printf("Setting var: %s\n", variable.Key)
		SetVar(variable.Key, variable.Val)
	}
	// Write files (FIXME: Make this platform agnostic)
	for _, file := range successResp.Files {
		WriteConfigFile(file.Folder+"/"+file.File, file.Content)
		fmt.Printf("Writing file: %s/%s\n", file.Folder, file.File)
	}
	return nil
}
