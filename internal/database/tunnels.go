package database

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5/pgconn"
)

// Tunnel represents a tunnel that belongs to a principal.
type Tunnel struct {
	ID          int64  `gorm:"primaryKey"`
	PrincipalID int64  `gorm:"index;not null"`
	Name        string `gorm:"not null"`
	Token       string `gorm:"unique;not null"`
	Subdomain   string `gorm:"unique;not null"`
	LastTCPPort int
	CreatedAt   time.Time `gorm:"not null"`
	UpdatedAt   time.Time `gorm:"not null"`
}

func (*Tunnel) TableName() string {
	return "tunnels"
}

// CreateTunnelOptions contains options for creating a tunnel.
type CreateTunnelOptions struct {
	PrincipalID int64
	Name        string
	Token       string
	Subdomain   string
}

// CreateTunnel creates a new tunnel with given options.
func (db *DB) CreateTunnel(ctx context.Context, opts CreateTunnelOptions) (*Tunnel, error) {
	t := &Tunnel{
		PrincipalID: opts.PrincipalID,
		Name:        opts.Name,
		Token:       opts.Token,
		Subdomain:   opts.Subdomain,
	}
	return t, db.WithContext(ctx).Create(t).Error
}

// GetTunnelByID returns a tunnel with given id.
func (db *DB) GetTunnelByID(ctx context.Context, id int64) (*Tunnel, error) {
	var t Tunnel
	return &t, db.WithContext(ctx).Where("id = ?", id).First(&t).Error
}

// GetTunnelByToken returns a tunnel with given token.
func (db *DB) GetTunnelByToken(ctx context.Context, token string) (*Tunnel, error) {
	var t Tunnel
	return &t, db.WithContext(ctx).Where("token = ?", token).First(&t).Error
}

// GetTunnelsByPrincipalID returns all tunnels belong to the given principal.
func (db *DB) GetTunnelsByPrincipalID(ctx context.Context, principalID int64) ([]*Tunnel, error) {
	var tunnels []*Tunnel
	return tunnels, db.WithContext(ctx).Where("principal_id = ?", principalID).Find(&tunnels).Error
}

// UpdateTunnelLastTCPPort updates the last TCP port of the tunnel.
func (db *DB) UpdateTunnelLastTCPPort(ctx context.Context, id int64, port int) error {
	return db.WithContext(ctx).Model(&Tunnel{}).Where("id = ?", id).Update("last_tcp_port", port).Error
}

// UpdateTunnelSubdomain updates the subdomain of the tunnel.
func (db *DB) UpdateTunnelSubdomain(ctx context.Context, id int64, subdomain string) error {
	err := db.WithContext(ctx).Model(&Tunnel{}).Where("id = ?", id).Update("subdomain", subdomain).Error
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return ErrSubdomainTaken
		}
		return err
	}
	return nil
}

// DeleteTunnelByID deletes the tunnel by the given ID and principal ID.
func (db *DB) DeleteTunnelByID(ctx context.Context, id, principalID int64) error {
	return db.WithContext(ctx).Where("id = ? AND principal_id = ?", id, principalID).Delete(&Tunnel{}).Error
}
