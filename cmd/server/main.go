package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/malpou/poll/internal/db"
	"github.com/malpou/poll/internal/handlers"
)

func main() {
	ctx := context.Background()

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "postgres://postgres:postgres@localhost:55432/poll"
	}
	port := os.Getenv("PORT")
	if port == "" {
		port = "8787"
	}

	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		log.Fatalf("db: %v", err)
	}
	defer pool.Close()

	// Wait for the database rather than dying on a cold start: under Playwright the
	// server boots before globalSetup brings Postgres up, and in production a DB
	// restart shouldn't take the process with it.
	if err := waitForDB(ctx, pool, 60*time.Second); err != nil {
		log.Fatalf("db unreachable: %v", err)
	}

	srv := &http.Server{
		Addr:              ":" + port,
		Handler:           handlers.Router(db.NewStore(pool)),
		ReadHeaderTimeout: 10 * time.Second,
	}
	log.Printf("listening on :%s", port)
	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatal(err)
	}
}

// waitForDB pings until the database answers or the budget runs out.
func waitForDB(ctx context.Context, pool *pgxpool.Pool, budget time.Duration) error {
	deadline := time.Now().Add(budget)
	for attempt := 1; ; attempt++ {
		pingCtx, cancel := context.WithTimeout(ctx, 3*time.Second)
		err := pool.Ping(pingCtx)
		cancel()
		if err == nil {
			return nil
		}
		if time.Now().After(deadline) {
			return err
		}
		if attempt == 1 {
			log.Printf("waiting for database at startup...")
		}
		time.Sleep(500 * time.Millisecond)
	}
}
