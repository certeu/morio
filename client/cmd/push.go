package cmd

import (
	"bytes"
	"crypto/tls"
	"crypto/x509"
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"net/http"

	"github.com/spf13/cobra"
)

func init() {
	RootCmd.AddCommand(pushCmd)
}

var pushCmd = &cobra.Command{
	Use:   "push",
	Short: "Push client configuation",
	Long:  `Push the local client configuration to the Morio cluster.`,
	Args:  cobra.ExactArgs(0),
	RunE: func(cmd *cobra.Command, args []string) error {
		return PushConfig()
	},
}

func PushConfig() error {

	// Grab the cluste,r client UUID, and API key secret (if they exist)
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

	// Gather config
	vars := GetTypedVars()
	modules := GetEnabledModules()

	// Create request payload
	payload := struct {
		Uuid    string                 `json:"uuid"`
		Cluster string                 `json:"cluster"`
		Modules []string               `json:"modules"`
		Vars    map[string]interface{} `json:"vars"`
	}{
		Uuid:    uuid,
		Cluster: cluster,
		Modules: modules,
		Vars:    vars,
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
	apiURL := fmt.Sprintf("https://%s/-/api/clients/push", cluster)

	// Create request
	req, err := http.NewRequest("POST", apiURL, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	// Set content type and authentication headers
	req.Header.Set("Content-Type", "application/json")
	req.SetBasicAuth(uuid, secret)

	// Send request
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	// Handle different response types based on status code
	if resp.StatusCode != http.StatusNoContent {
		// Read response body
		respBody, err := io.ReadAll(resp.Body)
		if err != nil {
			return fmt.Errorf("failed to read response body: %w", err)
		}

		// Parse error response (RFC7807)
		var errResp ErrorResponse
		if err := json.Unmarshal(respBody, &errResp); err != nil {
			return fmt.Errorf("failed to parse error response: %w", err)
		}

		// Log the error and exit
		PrintErrorResponse(errResp)
		return fmt.Errorf("failed with status code: %d", resp.StatusCode)
	}

	fmt.Println("Local modules and vars pushed to Morio cluster")

	return nil
}

func PrintErrorResponse(errResp ErrorResponse) {
	// Log the error and exit
	fmt.Printf("\nProblem: %s\n", errResp.Title)
	fmt.Printf("Details: %s\n", errResp.Detail)
	if errResp.SchemaViolation != "" {
		fmt.Printf("Schema violation: %s\n", errResp.SchemaViolation)
	}
	if errResp.UnknownModules != "" {
		fmt.Printf("Unknown modules: %s\n", errResp.UnknownModules)
	}
	if errResp.FailedModules != "" {
		fmt.Printf("Failed modules: %s\n", errResp.FailedModules)
	}
	if errResp.FailedVars != "" {
		fmt.Printf("Failed vars: %s\n", errResp.FailedVars)
	}
	fmt.Printf("For more information, visit: %s\n\n", errResp.Type)
}

func CreateHttpClient() (*http.Client, error) {
	// Read the CA certificate from file
	caCert, err := ioutil.ReadFile(GetConfigFilePath("ca.pem"))
	if err != nil {
		return nil, err
	}

	// Create a certificate pool and add the CA certificate
	caCertPool := x509.NewCertPool()
	caCertPool.AppendCertsFromPEM(caCert)

	// Create a TLS configuration with the custom CA
	tlsConfig := &tls.Config{
		RootCAs: caCertPool,
	}

	// Create the HTTP client with the TLS configuration
	client := &http.Client{
		Transport: &http.Transport{
			TLSClientConfig: tlsConfig,
		},
	}

	return client, nil
}
