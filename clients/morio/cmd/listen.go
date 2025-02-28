package cmd

import (
	"context"
  "crypto/tls"
	"crypto/x509"
	"encoding/json"
	"fmt"
	"os"
	"os/signal"
  "sync"
	"syscall"

	"github.com/IBM/sarama"
	"github.com/spf13/cobra"
)

// The Kafka consumer service
type kafkaConsumer struct {
	consumer sarama.Consumer
	topic    string
	ready    chan bool
}

// The listen command
var listenCmd = &cobra.Command{
	Use:   "listen",
	Short: "Listen for client configuration updates via Kafka",
	Long: `This command starts a Kafka consumer that subscribes to the clients topic
and listens for configuration updates. It is not for interactive use, but intended
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

// handleMessage processes a single Kafka message
func handleMessage(msg *sarama.ConsumerMessage) error {
	// Add your message processing logic here
	fmt.Printf("Message topic:%q partition:%d offset:%d\n",
		msg.Topic, msg.Partition, msg.Offset)
	fmt.Printf("Message value: %s\n", string(msg.Value))

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
		RootCAs:     caCertPool,
		MinVersion:  tls.VersionTLS12, // Ensure minimum TLS 1.2
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
