package main

import (
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/charmbracelet/log"
	"github.com/urfave/cli/v2"
)

func commandInit(homeDir string) *cli.Command {
	return &cli.Command{
		Name:        "init",
		Description: "Initialize a config file",
		Action:      actionInit,
		Flags: append(
			commonFlags(homeDir),
			&cli.StringFlag{
				Name:     "remote-addr",
				Usage:    "The address of the remote SSH server",
				Required: true,
				Aliases:  []string{"r"},
			},
			&cli.StringFlag{
				Name:     "forward-addr",
				Usage:    "The address to forward requests to",
				Required: true,
				Aliases:  []string{"f"},
				Action: func(c *cli.Context, s string) error {
					return c.Set("forward-addr", deriveHTTPForwardAddress(s))
				},
			},
			&cli.StringFlag{
				Name:     "token",
				Usage:    "The authentication token",
				Required: true,
				Aliases:  []string{"t"},
			},
		),
	}
}

// deriveHTTPForwardAddress tries to be smart about deriving the full HTTP
// address from incomplete forward host and port information.
func deriveHTTPForwardAddress(addr string) string {
	if addr == "" {
		return ""
	}

	// Check if it's just a port number
	port, err := strconv.Atoi(addr)
	if err == nil {
		return fmt.Sprintf("http://localhost:%d", port)
	}

	// Check if it's omitting the hostname
	port, err = strconv.Atoi(addr[1:])
	if err == nil {
		return fmt.Sprintf("http://localhost:%d", port)
	}

	// Check if it's omitting the scheme
	if !strings.Contains(addr, "://") {
		return "http://" + addr
	}
	return addr
}

func actionInit(c *cli.Context) error {
	configPath := c.String("config")
	config, err := loadConfig(configPath)
	if err != nil {
		// If fails to load, create a fresh config
		config = &Config{Profiles: make(map[string]*Profile)}
	}

	profileName := c.String("profile")
	remoteAddr := c.String("remote-addr")
	forwardAddr := c.String("forward-addr")
	token := c.String("token")

	if profileName == "" {
		// Update default profile
		config.RemoteAddr = remoteAddr
		config.ForwardAddr = forwardAddr
		config.Token = token
	} else {
		// Update named profile
		if config.Profiles == nil {
			config.Profiles = make(map[string]*Profile)
		}
		if config.Profiles[profileName] == nil {
			config.Profiles[profileName] = &Profile{}
		}
		config.Profiles[profileName].RemoteAddr = remoteAddr
		config.Profiles[profileName].ForwardAddr = forwardAddr
		config.Profiles[profileName].Token = token
	}

	configDir := filepath.Dir(configPath)
	err = os.MkdirAll(configDir, os.ModePerm)
	if err != nil {
		log.Fatal("Failed to create config directory", "path", configDir, "error", err.Error())
	}

	err = config.Save(configPath)
	if err != nil {
		log.Fatal("Failed to save config file", "path", configPath, "error", err.Error())
	}
	if profileName != "" {
		log.Info("Config profile saved", "path", configPath, "profile", profileName)
	} else {
		log.Info("Config file saved", "path", configPath)
	}
	return nil
}
