package metastore

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/blugelabs/bluge"
	"github.com/go-kit/log"
	"github.com/go-kit/log/level"
)

type QueryType int

const (
	Mapping QueryType = iota
	Function
)

type Index struct {
	logger log.Logger
	config bluge.Config
	store  ProfileMetaStore
}

func NewIndex(logger log.Logger, store ProfileMetaStore) *Index {
	config := bluge.DefaultConfig(os.TempDir())
	return &Index{
		logger: logger,
		store:  store,
		config: config,
	}
}

func (i Index) Index(ctx context.Context) error {
	timer := time.NewTicker(30 * time.Second) // TODO: make configurable?!
	defer timer.Stop()

	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-timer.C:
			start := time.Now()

			writer, err := bluge.OpenWriter(i.config)
			if err != nil {
				return err
			}
			defer writer.Close()

			locations, _, err := i.store.GetLocations(ctx)
			if err != nil {
				level.Warn(i.logger).Log("msg", "failed to get locations", "err", err)
				continue
			}

			batch := bluge.NewBatch()
			var inserts uint64
			for _, l := range locations {
				_, functionIDs, err := i.store.GetLinesByLocationIDs(ctx, l.Id)
				if err != nil {
					level.Warn(i.logger).Log("msg", "failed to get lines", "err", err)
					continue
				}

				functions, err := i.store.GetFunctionsByIDs(ctx, functionIDs...)
				if err != nil {
					level.Warn(i.logger).Log("msg", "failed to get functions", "err", err)
					continue
				}

				for _, function := range functions {
					batch.Insert(
						bluge.NewDocument(string(function.Id)).
							AddField(bluge.NewTextField("function", function.Name)).
							AddField(bluge.NewTextFieldBytes("location", l.Id)),
					)
					inserts++
				}
			}

			if err = writer.Batch(batch); err != nil {
				level.Warn(i.logger).Log("msg", "failed to insert batch", "err", err)
				continue
			}
			level.Debug(i.logger).Log("msg", "indexed metastore", "documents", inserts, "duration", time.Since(start))
		}
	}
}

func (i Index) Search(ctx context.Context, qt QueryType, match string) ([][]byte, error) {
	var field string
	switch qt {
	case Mapping:
		field = "mapping"
	case Function:
		field = "function"
	}

	r, err := bluge.OpenReader(i.config)
	if err != nil {
		return nil, fmt.Errorf("failed to open reader: %w", err)
	}
	defer r.Close()

	req := bluge.NewAllMatches(bluge.NewMatchQuery(match).SetField(field))
	it, err := r.Search(ctx, req)
	if err != nil {
		return nil, fmt.Errorf("failed to search: %w", err)
	}

	var locations [][]byte

	for {
		next, err := it.Next()
		if err != nil {
			return nil, err
		}
		if next == nil {
			return locations, nil
		}

		if err := next.VisitStoredFields(func(field string, value []byte) bool {
			locations = append(locations, value) // TODO: Might need to split into 16 bytes
			return true
		}); err != nil {
			return nil, err
		}
	}
}
