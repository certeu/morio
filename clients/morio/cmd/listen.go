package cmd

import (
	"context"
	"crypto/tls"
	"crypto/x509"
	"encoding/json"
	"fmt"
	"os"
	"os/signal"
	"slices"
	"sync"
	"syscall"
  "log"
  "bytes"
	"net/http"
	"io"

	"github.com/IBM/sarama"
	"github.com/spf13/cobra"
)

// The Kafka consumer service
type kafkaConsumer struct {
	consumer sarama.Consumer
	topic    string
	ready    chan bool
}

type kafkaCommandMessage struct {
	Command string    `json:"command"`
	Clients *[]string `json:"clients,omitempty"`
	ID      int       `json:"id"`
}

// The listen command
var listenCmd = &cobra.Command{
	Use:   "listen",
	Short: "Listen for client command requests via Kafka",
	Long: `This command starts a Kafka consumer that subscribes to the clients topic
and listens for command requests. It is not for interactive use, but intended
to run as a service.`,
	RunE: runListen,
}

func init() {
	RootCmd.AddCommand(listenCmd)
}

func runListen(cmd *cobra.Command, args []string) error {
	// Get brokers and group ID form vars
	brokers := getBrokers()
	kafkaTopic := "clients"

	// Create Kafka config
	config := sarama.NewConfig()
	config.Consumer.Return.Errors = true

	// Setup TLS configuration
	tlsConfig, err := createTLSConfig(
		"/etc/morio/cert.pem",
		"/etc/morio/key.pem",
		"/etc/morio/ca.pem",
	)
	if err != nil {
		return fmt.Errorf("Error creating TLS config: %v", err)
	}
	config.Net.TLS.Enable = true
	config.Net.TLS.Config = tlsConfig

	// Create context that can be cancelled
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Create consumer
	consumer, err := sarama.NewConsumer(brokers, config)
	if err != nil {
		return fmt.Errorf("error creating consumer: %v", err)
	}
	defer consumer.Close()

	// Get all partitions for the topic
	partitions, err := consumer.Partitions(kafkaTopic)
	if err != nil {
		return fmt.Errorf("error getting partitions: %v", err)
	}

	// Setup signal handling
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	// Create waiting group for partition consumers
	var wg sync.WaitGroup

	// Start consuming from each partition
	for _, partition := range partitions {
		pc, err := consumer.ConsumePartition(kafkaTopic, partition, sarama.OffsetNewest)
		if err != nil {
			return fmt.Errorf("error creating partition consumer: %v", err)
		}

		wg.Add(1)
		go func(pc sarama.PartitionConsumer) {
			defer wg.Done()
			defer pc.Close()

			for {
				select {
				case msg, ok := <-pc.Messages():
					if !ok {
						return
					}
					if err := handleMessage(msg); err != nil {
						fmt.Printf("Error handling message: %v\n", err)
					}
				case err := <-pc.Errors():
					fmt.Printf("Error from partition consumer: %v\n", err)
				case <-ctx.Done():
					return
				}
			}
		}(pc)
	}

	fmt.Println("Kafka consumer is ready (Press Ctrl+C to exit)")

	// Wait for termination signal
	<-sigChan
	fmt.Println("\nShutting down...")

	// Trigger shutdown
	cancel()

	// Wait for all partition consumers to finish
	wg.Wait()
	fmt.Println("Shutdown complete")

	return nil
}

// createTLSConfig creates a TLS configuration for the Kafka client
func createTLSConfig(clientCertFile, clientKeyFile, caCertFile string) (*tls.Config, error) {
	// Load client cert
	cert, err := tls.LoadX509KeyPair(clientCertFile, clientKeyFile)
	if err != nil {
		return nil, fmt.Errorf("error loading client cert/key pair: %v", err)
	}

	// Load CA cert
	caCert, err := os.ReadFile(caCertFile)
	if err != nil {
		return nil, fmt.Errorf("error loading CA cert: %v", err)
	}

	caCertPool := x509.NewCertPool()
	caCertPool.AppendCertsFromPEM(caCert)

	// Create TLS configuration
	tlsConfig := &tls.Config{
		Certificates: []tls.Certificate{cert},
		RootCAs:      caCertPool,
		MinVersion:   tls.VersionTLS12, // Ensure minimum TLS 1.2
	}

	return tlsConfig, nil
}

// getBrokers returns the list of Kafka brokers from your app's configuration
func getBrokers() []string {
	brokersJSON := GetVar("MORIO_BROKERS")
	var brokers []string
	if err := json.Unmarshal([]byte(brokersJSON), &brokers); err != nil {
		// For now, let's keep this simple
		fmt.Printf("Error parsing brokers: %v\n", err)
		return nil
	}
	return brokers
}

// handleMessage processes a single Kafka message
func handleMessage(msg *sarama.ConsumerMessage) error {
	// Topic is should always be clients, but let's make sure
	if msg.Topic != "clients" {
		return nil
	}

	// Parse JSON message
	var cmd kafkaCommandMessage
	err := json.Unmarshal(msg.Value, &cmd)
	if err != nil {
		return err
	}

	// Is this for specific clients?
	if cmd.Clients != nil {
		// It is, but is it for us?
		uuid := GetVar("MORIO_CLIENT_UUID")
		if slices.Contains(*cmd.Clients, uuid) {
			runCommand(cmd.Command, cmd.ID)
		}
	} else {
		// Command is for all clients
		runCommand(cmd.Command, cmd.ID)
	}

	return nil
}

func runCommand(cmd string, id int) error {
	// Report start status
	err := reportCommandStatus(id, "start")
	if err != nil {
		return fmt.Errorf("failed to report start status: %w", err)
	}
  // Run command
  if cmd == "pull" {
		err = runPullCommand(id)
	} else if cmd == "push" {
		err = runPushCommand(id)
	} else if cmd == "reload" {
		err = runReloadCommand(id)
	} else if cmd == "restart" {
		err = runRestartCommand(id)
	} else if cmd == "report" {
		err = runReportCommand(id)
	} else if cmd == "stop" {
		err = runStopCommand(id)
	}

	// Report done/error status
	if err != nil {
	  reportCommandStatus(id, "error")
		return fmt.Errorf("Command failed: %w", err)
	} else {
	  reportCommandStatus(id, "done")
    return nil
  }
}

func runPullCommand(id int) error {
	return PullConfig()
}

func runPushCommand(id int) error {
  return PushConfig()
}

func runReloadCommand(id int) error {
	return nil
}

func runRestartCommand(id int) error {
	return nil
}

func runReportCommand(id int) error {
  return ReportClient()
}

func runStopCommand(id int) error {
	return nil
}

func reportCommandStatus(id int, status string) error {
	// Grab the cluster client UUID, and API key secret (if they exist)
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

	// Create request payload
	payload := struct {
		Uuid   string                 `json:"uuid"`
		ID     int                    `json:"id"`
		Status string `json:"status"`
	}{
		Uuid:   uuid,
		ID:     id,
		Status: status,
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
	apiURL := fmt.Sprintf("https://%s/-/api/clients/cmdstatus", cluster)

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

	return nil
}
