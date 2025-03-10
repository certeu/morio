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
	RootCmd.AddCommand(reportCmd)
}

var reportCmd = &cobra.Command{
	Use:   "report",
	Short: "Send local system info to the Morio cluster",
	Long:  `This sends local system info to the Morio cluster, which ensures that the inventory stays up-to-date.`,
	RunE: func(cmd *cobra.Command, args []string) error {
		return ReportClient()
	},
}

func ReportClient() error {
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

	// Gather system information
	sysInfo, err := GetSystemInfo()
	if err != nil {
		return fmt.Errorf("Failed to gather system information: %w", err)
	}

	// Create request payload
	payload := struct {
		Uuid    string     `json:"uuid"`
		Cluster string     `json:"cluster"`
		Info    SystemInfo `json:"info"`
	}{
		Uuid:    uuid,
		Cluster: cluster,
		Info:    *sysInfo,
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
	apiURL := fmt.Sprintf("https://%s/-/api/clients/report", cluster)

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

	fmt.Printf("\nSuccessfully reported to cluster %s as client %s\n\n", cluster, uuid)

	return nil
}
