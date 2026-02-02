package cmd

import (
	"bytes"
	"encoding/json"
	"fmt"
	"github.com/spf13/cobra"
	"io"
	"log"
	"net/http"
)

func init() {
	RootCmd.AddCommand(joinGroupCmd)
}

var joinGroupCmd = &cobra.Command{
	Use:     "join-group",
	Short:   "Join this client to an inventory group",
	Long:    `This adds this local client to a (pre-existing) inventory group.`,
	Example: `  morio join-group webservers`,
	Args:    cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		return JoinClientToGroup(args[0])
	},
}

func JoinClientToGroup(group string) error {
	// Grab the cluster client UUID, and API key secret (if they exist)
	uuid := GetVar("MORIO_CLIENT_UUID")
	secret := GetVar("MORIO_APIKEY_SECRET")
	cluster := GetVar("MORIO_CLUSTER")

	if uuid == "" {
		return fmt.Errorf("No client UUID found. Is this client joined to a Morio cluster?")
	}
	if secret == "" {
		return fmt.Errorf("No API key found. Is this client joined to a Morio cluster?")
	}
	if cluster == "" {
		return fmt.Errorf("No cluster name found. Is this client joined to a Morio cluster?")
	}

	// Create request payload
	payload := struct {
		Uuid    string `json:"uuid"`
		Cluster string `json:"cluster"`
		Group   string `json:"group"`
	}{
		Uuid:    uuid,
		Cluster: cluster,
		Group:   group,
	}

	// Marshal payload to JSON
	jsonData, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal request payload: %w", err)
	}

	// Create HTTP client
	client, err := CreateHttpClient()
	if err != nil {
		log.Fatalf("Error creating HTTP client: %v", err)
	}

	// API endpoint
	apiURL := fmt.Sprintf("https://%s/-/api/clients/join/group", cluster)

	// Create request
	req, err := http.NewRequest("POST", apiURL, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	// Set content-type and authentication header
	req.Header.Set("Content-Type", "application/json")
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
	if resp.StatusCode != http.StatusNoContent {
		// Parse error response (RFC7807)
		var errResp ErrorResponse
		if err := json.Unmarshal(respBody, &errResp); err != nil {
			return fmt.Errorf("failed to parse error response: %w", err)
		}

		// Log the error and exit
		PrintErrorResponse(errResp)
		return fmt.Errorf("\nRequest failed with status code: %d", resp.StatusCode)
	}

	fmt.Printf("\nThis client is now a member of the %s group\n\n", group)

	return nil
}
