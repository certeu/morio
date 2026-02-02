//go:build windows

package cmd

import (
	"fmt"
	"golang.org/x/sys/windows/registry"
)

func getWindowsPackages() ([]PackageInfo, error) {
	var packages []PackageInfo

	// Registry paths to check
	paths := []struct {
		root registry.Key
		path string
	}{
		{registry.LOCAL_MACHINE, `SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall`},
		{registry.LOCAL_MACHINE, `SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall`},
		{registry.CURRENT_USER, `SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall`},
	}

	for _, p := range paths {
		pkgs, err := readUninstallRegistry(p.root, p.path)
		if err != nil {
			// Continue to next path if this one fails
			continue
		}
		packages = append(packages, pkgs...)
	}

	if len(packages) == 0 {
		return nil, fmt.Errorf("No packages found in registry")
	}

	return packages, nil
}

func readUninstallRegistry(root registry.Key, path string) ([]PackageInfo, error) {
	k, err := registry.OpenKey(root, path, registry.ENUMERATE_SUB_KEYS|registry.QUERY_VALUE)
	if err != nil {
		return nil, err
	}
	defer k.Close()

	subkeys, err := k.ReadSubKeyNames(-1)
	if err != nil {
		return nil, err
	}

	var packages []PackageInfo

	for _, subkey := range subkeys {
		subk, err := registry.OpenKey(root, path+`\`+subkey, registry.QUERY_VALUE)
		if err != nil {
			continue
		}

		displayName, _, err := subk.GetStringValue("DisplayName")
		if err != nil || displayName == "" {
			subk.Close()
			continue
		}

		version, _, _ := subk.GetStringValue("DisplayVersion")

		packages = append(packages, PackageInfo{
			Name:    displayName,
			Version: version,
		})

		subk.Close()
	}

	return packages, nil
}

func getDebianPackages() ([]PackageInfo, error) {
	return nil, fmt.Errorf("Debian package enumeration not available on this platform")
}

func getRPMPackages() ([]PackageInfo, error) {
	return nil, fmt.Errorf("RPM package enumeration not available on this platform")
}

func getMacOSPackages() ([]PackageInfo, error) {
	return nil, fmt.Errorf("MacOS package enumeration not available on this platform")
}
