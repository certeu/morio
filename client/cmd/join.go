package cmd

import (
	"bufio"
	"bytes"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"

	"github.com/shirou/gopsutil/v3/host"
	"github.com/shirou/gopsutil/v3/mem"
	"github.com/spf13/cobra"
)

var (
	invite string
)

// Define structures for API responses
type ErrorResponse struct {
	Type            string `json:"type"`
	Status          int    `json:"status"`
	Title           string `json:"title"`
	Detail          string `json:"detail"`
	SchemaViolation string `json:"schema_violation,omitempty"`
	UnknownModules  string `json:"unknown_modules,omitempty"`
	FailedModules   string `json:"failed_modules,omitempty"`
	FailedVars      string `json:"failed_vars,omitempty"`
}

type SuccessResponseJoin struct {
	Crt     string   `json:"crt"`
	Key     string   `json:"key"`
	Ca      string   `json:"ca"`
	Uuid    string   `json:"uuid"`
	Secret  string   `json:"secret"`
	Cluster string   `json:"cluster"`
	Brokers []string `json:"brokers"`
}

func init() {
	joinCmd.Flags().StringVar(&invite, "invite", "", "Invitation code (optional)")
	rejoinCmd.Flags().StringVar(&invite, "invite", "", "Invitation code (optional)")
	RootCmd.AddCommand(joinCmd)
	RootCmd.AddCommand(rejoinCmd)
	RootCmd.AddCommand(unjoinCmd)
}

var joinCmd = &cobra.Command{
	Use:   "join [cluster]",
	Short: "Join this client to a Morio cluster",
	Long: `Join a cluster using the provided cluster name.
Optionally provide an invitation code using the --invite flag.`,
	Args: cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		return joinCluster(args, false)
	},
}

var rejoinCmd = &cobra.Command{
	Use:   "rejoin [cluster]",
	Short: "Re-Join this client to a Morio cluster",
	Long: `Re-Join a cluster using the provided cluster name.
Optionally provide an invitation code using the --invite flag.`,
	Args: cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		return joinCluster(args, true)
	},
}

var unjoinCmd = &cobra.Command{
	Use:   "unjoin",
	Short: "Removes this client from the currently joined cluster",
	Long:  `This will delete the local configuration and remove this client from the currently joined cluster.`,
	Args:  cobra.ExactArgs(0),
	RunE: func(cmd *cobra.Command, args []string) error {
		return unjoinCluster()
	},
}

func joinCluster(args []string, rejoin bool) error {
	cluster := args[0]

	// Gather system information
	sysInfo, err := GetSystemInfo()
	if err != nil {
		return fmt.Errorf("Failed to gather system information: %w", err)
	}

	// Grab the client UUID if it exists
	uuid := GetVar("MORIO_CLIENT_UUID")

	// Create request payload
	payload := struct {
		Cluster string     `json:"cluster"`
		Invite  string     `json:"invite,omitempty"`
		Uuid    string     `json:"uuid,omitempty"`
		Info    SystemInfo `json:"info"`
	}{
		Cluster: cluster,
		Invite:  invite,
		Uuid:    uuid,
		Info:    *sysInfo,
	}

	// Marshal payload to JSON
	jsonData, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal request payload: %w", err)
	}

	// Create HTTP client with TLS skip verification
	client := &http.Client{
		Transport: &http.Transport{
			TLSClientConfig: &tls.Config{
				InsecureSkipVerify: true,
			},
		},
	}

	// API endpoint
	var endpoint string
	if rejoin {
		endpoint = "rejoin"
	} else {
		endpoint = "join"
	}
	apiURL := fmt.Sprintf("https://%s/-/api/clients/%s", cluster, endpoint)

	// Create request
	req, err := http.NewRequest("POST", apiURL, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	// Set content type
	req.Header.Set("Content-Type", "application/json")

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
		//fmt.Printf("\n\nError: %s\n", errResp.Title)
		//fmt.Printf("Details: %s\n", errResp.Detail)
		//fmt.Printf("For more information, visit: %s\n", errResp.Type)
		return fmt.Errorf("\nRequest failed with status code: %d", resp.StatusCode)
	}

	// Parse success response
	var successResp SuccessResponseJoin
	if err := json.Unmarshal(respBody, &successResp); err != nil {
		return fmt.Errorf("failed to parse success response: %w", err)
	}

	// Create configuration directory if it doesn't exist
	configDir := filepath.Join(os.Getenv("HOME"), ".morio")
	if err := os.MkdirAll(configDir, 0755); err != nil {
		return fmt.Errorf("failed to create config directory: %w", err)
	}

	// Write certificates and key to disk
	WriteConfigFile("cert.pem", successResp.Crt)
	WriteConfigFile("key.pem", successResp.Key)
	WriteConfigFile("ca.pem", successResp.Ca)

	// Store UUID, secret, and cluster in vars
	SetVar("MORIO_CLIENT_UUID", successResp.Uuid)
	SetVar("MORIO_CLUSTER", successResp.Cluster)
	SetVar("MORIO_APIKEY_SECRET", successResp.Secret)

	// Store brokers as JSON string
	brokersJson, err := json.Marshal(successResp.Brokers)
	if err != nil {
		return fmt.Errorf("failed to marshal brokers list: %w", err)
	}
	brokersStr := string(brokersJson)
	SetVar("MORIO_BROKERS", brokersStr)

	fmt.Printf("\nSuccessfully joined cluster %s as client %s\n\n", cluster, successResp.Uuid)

	return nil
}

type SystemInfo struct {
	Hostname   string        `json:"name"`
	Fqdn       string        `json:"fqdn"`
	Os         string        `json:"os"`
	Os_version string        `json:"os_version"`
	Arch       string        `json:"arch"`
	Cores      int           `json:"cores"`
	Memory     uint64        `json:"memory"`
	Ips        []string      `json:"ips"`
	Macs       []string      `json:"macs"`
	Packages   []PackageInfo `json:"packages"`
}

func GetSystemInfo() (*SystemInfo, error) {
	info := &SystemInfo{}
	var err error

	// Get hostname (short)
	info.Hostname, err = os.Hostname()
	if err != nil {
		return nil, fmt.Errorf("failed to get hostname: %w", err)
	}

	// Get FQDN
	info.Fqdn, err = getFQDN()
	if err != nil {
		// Fallback to short hostname if FQDN fails
		info.Fqdn = info.Hostname
	}

	// Get OS info
	hostInfo, err := host.Info()
	if err != nil {
		return nil, fmt.Errorf("failed to get host info: %w", err)
	}
	info.Os = runtime.GOOS
	info.Os_version = fmt.Sprintf("%s %s %s", hostInfo.Platform, hostInfo.PlatformVersion, hostInfo.KernelVersion)
	info.Arch = runtime.GOARCH

	// Get CPU count
	info.Cores = runtime.NumCPU()

	// Get memory info
	memInfo, err := mem.VirtualMemory()
	if err != nil {
		return nil, fmt.Errorf("failed to get memory info: %w", err)
	}
	info.Memory = memInfo.Total

	// Get IP and MAC addresses
	info.Ips, info.Macs, err = getNetworkInterfaces()
	if err != nil {
		return nil, fmt.Errorf("failed to get network interfaces: %w", err)
	}

	// Get installed packages
	info.Packages, err = getInstalledPackages()
	if err != nil {
		// Don't fail if we can't get package info, just log it
		fmt.Printf("Warning: failed to get package information: %v", err)
		info.Packages = []PackageInfo{} // empty list instead of nil
	}

	return info, nil
}

func getFQDN() (string, error) {
	hostname, err := os.Hostname()
	if err != nil {
		return "", err
	}

	addrs, err := net.LookupIP(hostname)
	if err != nil {
		return "", err
	}

	for _, addr := range addrs {
		if ipv4 := addr.To4(); ipv4 != nil {
			names, err := net.LookupAddr(ipv4.String())
			if err != nil || len(names) == 0 {
				continue
			}
			// Remove trailing dot from FQDN
			return strings.TrimSuffix(names[0], "."), nil
		}
	}

	return hostname, nil
}

func getNetworkInterfaces() ([]string, []string, error) {
	var ips []string
	var macs []string

	interfaces, err := net.Interfaces()
	if err != nil {
		return nil, nil, err
	}

	for _, iface := range interfaces {
		// Skip loopback and down interfaces
		if iface.Flags&net.FlagLoopback != 0 || iface.Flags&net.FlagUp == 0 {
			continue
		}

		// Get MAC address
		if mac := iface.HardwareAddr.String(); mac != "" {
			macs = append(macs, mac)
		}

		// Get IP addresses
		addrs, err := iface.Addrs()
		if err != nil {
			continue
		}

		for _, addr := range addrs {
			// Extract IP address without network mask
			switch v := addr.(type) {
			case *net.IPNet:
				if ip := v.IP.String(); ip != "" {
					ips = append(ips, ip)
				}
			case *net.IPAddr:
				if ip := v.IP.String(); ip != "" {
					ips = append(ips, ip)
				}
			}
		}
	}

	return ips, macs, nil
}

type PackageInfo struct {
	Name    string `json:"name"`
	Version string `json:"version"`
}

// getInstalledPackages returns a list of installed packages
// Currently supports: Debian/Ubuntu (apt), RHEL/CentOS (rpm), macOS (homebrew)
func getInstalledPackages() ([]PackageInfo, error) {
	switch runtime.GOOS {
	case "linux":
		// Try dpkg first (Debian/Ubuntu)
		if packages, err := getDebianPackages(); err == nil {
			return packages, nil
		}
		// Try rpm if dpkg fails (RHEL/CentOS)
		if packages, err := getRPMPackages(); err == nil {
			return packages, nil
		}
		return nil, fmt.Errorf("no supported package manager found")
	case "darwin":
		return getMacOSPackages()
	default:
		return nil, fmt.Errorf("package listing not supported on %s", runtime.GOOS)
	}
}

func getDebianPackages() ([]PackageInfo, error) {
	cmd := exec.Command("dpkg-query", "-W", "-f=${Package}\t${Version}\n")
	output, err := cmd.Output()
	if err != nil {
		return nil, err
	}

	var packages []PackageInfo
	scanner := bufio.NewScanner(strings.NewReader(string(output)))
	for scanner.Scan() {
		fields := strings.Split(scanner.Text(), "\t")
		if len(fields) == 2 {
			packages = append(packages, PackageInfo{
				Name:    fields[0],
				Version: fields[1],
			})
		}
	}

	return packages, scanner.Err()
}

func getRPMPackages() ([]PackageInfo, error) {
	cmd := exec.Command("rpm", "-qa", "--queryformat", "%{NAME}\t%{VERSION}-%{RELEASE}\n")
	output, err := cmd.Output()
	if err != nil {
		return nil, err
	}

	var packages []PackageInfo
	scanner := bufio.NewScanner(strings.NewReader(string(output)))
	for scanner.Scan() {
		fields := strings.Split(scanner.Text(), "\t")
		if len(fields) == 2 {
			packages = append(packages, PackageInfo{
				Name:    fields[0],
				Version: fields[1],
			})
		}
	}

	return packages, scanner.Err()
}

func getMacOSPackages() ([]PackageInfo, error) {
        var allPackages []PackageInfo
        seen := make(map[string]bool)

        // 1. Get GUI applications via system_profiler (most comprehensive)
        if packages, err := getMacOSApplications(); err == nil {
                for _, pkg := range packages {
                        key := pkg.Name + ":" + pkg.Version
                        if !seen[key] {
                                allPackages = append(allPackages, pkg)
                                seen[key] = true
                        }
                }
        }

        // 2. Get Homebrew packages
        if packages, err := getBrewPackages(); err == nil {
                for _, pkg := range packages {
                        key := pkg.Name + ":" + pkg.Version
                        if !seen[key] {
                                allPackages = append(allPackages, pkg)
                                seen[key] = true
                        }
                }
        }

        // 3. Get MacPorts packages
        if packages, err := getMacPortsPackages(); err == nil {
                for _, pkg := range packages {
                        key := pkg.Name + ":" + pkg.Version
                        if !seen[key] {
                                allPackages = append(allPackages, pkg)
                                seen[key] = true
                        }
                }
        }

        return allPackages, nil
}

func getMacOSApplications() ([]PackageInfo, error) {
        cmd := exec.Command("system_profiler", "SPApplicationsDataType", "-json")
        output, err := cmd.Output()
        if err != nil {
                return nil, err
        }

        var result struct {
                SPApplicationsDataType []struct {
                        Name    string `json:"_name"`
                        Version string `json:"version"`
                } `json:"SPApplicationsDataType"`
        }

        if err := json.Unmarshal(output, &result); err != nil {
                return nil, err
        }

        var packages []PackageInfo
        for _, app := range result.SPApplicationsDataType {
                if app.Name != "" {
                        packages = append(packages, PackageInfo{
                                Name:    app.Name,
                                Version: app.Version,
                        })
                }
        }

        return packages, nil
}

func getBrewPackages() ([]PackageInfo, error) {
        if _, err := exec.LookPath("brew"); err != nil {
                return nil, err
        }

        cmd := exec.Command("brew", "list", "--versions")
        output, err := cmd.Output()
        if err != nil {
                return nil, err
        }

        var packages []PackageInfo
        scanner := bufio.NewScanner(strings.NewReader(string(output)))
        for scanner.Scan() {
                fields := strings.Fields(scanner.Text())
                if len(fields) >= 2 {
                        packages = append(packages, PackageInfo{
                                Name:    fields[0],
                                Version: fields[1],
                        })
                }
        }

        return packages, scanner.Err()
}

func getMacPortsPackages() ([]PackageInfo, error) {
        if _, err := exec.LookPath("port"); err != nil {
                return nil, err
        }

        cmd := exec.Command("port", "installed")
        output, err := cmd.Output()
        if err != nil {
                return nil, err
        }

        var packages []PackageInfo
        scanner := bufio.NewScanner(strings.NewReader(string(output)))
        // Skip header line
        scanner.Scan()

        for scanner.Scan() {
                line := strings.TrimSpace(scanner.Text())
                fields := strings.Fields(line)
                if len(fields) >= 2 {
                        packages = append(packages, PackageInfo{
                                Name:    fields[0],
                                Version: strings.TrimPrefix(fields[1], "@"),
                        })
                }
        }

        return packages, scanner.Err()
}

func ClearJoin() error {
	os.Remove(GetConfigFilePath("ca.pem"))
	os.Remove(GetConfigFilePath("cert.pem"))
	os.Remove(GetConfigFilePath("key.pem"))

	RmVar("MORIO_BROKERS")
	RmVar("MORIO_APIKEY_SECRET")
	RmVar("MORIO_CLIENT_UUID")
	RmVar("MORIO_CLUSTER")

	return nil
}

func unjoinCluster() error {
	// Grab the client UUID, cluster FQDN, and apikey secret
	uuid := GetVar("MORIO_CLIENT_UUID")
	cluster := GetVar("MORIO_CLUSTER")
	secret := GetVar("MORIO_APIKEY_SECRET")

	if uuid == "" {
		return fmt.Errorf("No client UUID found. Is this client joined to a Morio cluster?")
	}
	if secret == "" {
		return fmt.Errorf("No API key found. Is this client joined to a Morio cluster?")
	}
	if cluster == "" {
		return fmt.Errorf("No cluster name found. Is this client joined to a Morio cluster?")
	}

	// Create HTTP client
	client, err := CreateHttpClient()
	if err != nil {
		log.Fatalf("Error creating HTTP client: %v", err)
	}

	// API endpoint
	apiURL := fmt.Sprintf("https://%s/-/api/clients/%s", cluster, uuid)

	// Create request
	req, err := http.NewRequest("DELETE", apiURL, nil)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	// Set content type and authentication headers
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

	// Now also clean up the local config
	ClearVars()
	ClearModules()
	ClearJoin()

	return nil
}
