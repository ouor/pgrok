package main

import (
	"fmt"
	"os"

	"github.com/pkg/errors"
	"gopkg.in/yaml.v3"
)

// Profile represents a configuration profile.
type Profile struct {
	RemoteAddr      string `yaml:"remote_addr,omitempty"`
	ForwardAddr     string `yaml:"forward_addr,omitempty"`
	Token           string `yaml:"token,omitempty"`
	DynamicForwards string `yaml:"dynamic_forwards,omitempty"`
}

// Config represents the configuration file.
type Config struct {
	Profile `yaml:",inline"` // Embed the default profile fields at the top level

	Profiles map[string]*Profile `yaml:"profiles,omitempty"`
}

// loadConfig loads the configuration from the given path.
func loadConfig(configPath string) (*Config, error) {
	p, err := os.ReadFile(configPath)
	if err != nil {
		if os.IsNotExist(err) {
			return &Config{Profiles: make(map[string]*Profile)}, nil
		}
		return nil, errors.Wrap(err, "read file")
	}

	var config Config
	err = yaml.Unmarshal(p, &config)
	if err != nil {
		return nil, errors.Wrap(err, "unmarshal")
	}

	if config.Profiles == nil {
		config.Profiles = make(map[string]*Profile)
	}
	return &config, nil
}

// ApplyProfile applies the given profile to the current configuration accessors.
// If the profile name is empty, it does nothing (uses the default/top-level values).
func (c *Config) ApplyProfile(name string) error {
	if name == "" {
		return nil
	}

	profile, ok := c.Profiles[name]
	if !ok {
		return fmt.Errorf("profile %q not found", name)
	}

	// Override default values with profile values if they are present
	if profile.RemoteAddr != "" {
		c.RemoteAddr = profile.RemoteAddr
	}
	if profile.ForwardAddr != "" {
		c.ForwardAddr = profile.ForwardAddr
	}
	if profile.Token != "" {
		c.Token = profile.Token
	}
	if profile.DynamicForwards != "" {
		c.DynamicForwards = profile.DynamicForwards
	}
	return nil
}

// Save saves the configuration to the given path.
func (c *Config) Save(configPath string) error {
	p, err := yaml.Marshal(c)
	if err != nil {
		return errors.Wrap(err, "marshal")
	}
	return os.WriteFile(configPath, p, 0644)
}
