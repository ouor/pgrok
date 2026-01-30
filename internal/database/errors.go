package database

import "errors"

// ErrSubdomainTaken is returned when a subdomain is already taken.
var ErrSubdomainTaken = errors.New("subdomain already taken")
