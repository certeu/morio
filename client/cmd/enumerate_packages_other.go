//go:build !windows

package cmd

import (
	"bufio"
	"encoding/json"
	"fmt"
	"os/exec"
	"strings"
)

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

func getWindowsPackages() ([]PackageInfo, error) {
	return nil, fmt.Errorf("Windows package enumeration not available on this platform")
}
