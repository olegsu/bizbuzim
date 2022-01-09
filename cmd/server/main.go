package main

import (
	"context"
	"fmt"
	"net/http"
	"os"

	"database/sql"

	"github.com/dosco/graphjin/core"
	tgbotapi "github.com/go-telegram-bot-api/telegram-bot-api/v5"
	"github.com/olegsu/bizbuzim/pkg/fatal"
	"github.com/olegsu/bizbuzim/pkg/http/graphql"
	"github.com/olegsu/bizbuzim/pkg/http/telegram"
	"github.com/olegsu/go-tools/pkg/logger"

	_ "github.com/lib/pq"
)

const (
	apiTelegram = "/hook/telegram"
)

func main() {
	lgr := logger.New()
	lgr.Info("starting server")

	db, err := sql.Open("postgres", buildDatabaseConnURI(lgr))
	dieOnError(err, "failed to connect to db")
	dieOnError(db.Ping(), "failed to ping to the database")
	lgr.Info("connected to db")

	bot, err := tgbotapi.NewBotAPI(fatal.GetEnv("TELEGRAM_BOT_TOKEN"))
	dieOnError(err, "failed to authenticated")

	lgr.Info("Authentication with Telegram completed", "user", bot.Self.UserName)

	hook := os.Getenv("TELEGRAM_BOT_WEBHOOK")
	if hook == "" {
		lgr.Info("Hook was not provided, starting bot with polling")
		u := tgbotapi.NewUpdate(0)
		u.Timeout = 60
		updates := bot.GetUpdatesChan(u)
		go func() {
			for u := range updates {
				if u.Message == nil {
					continue
				}
				go telegram.ProcessUpdate(context.Background(), lgr, bot, *u.Message, db)
			}
		}()

	} else {
		wh, err := tgbotapi.NewWebhook(hook + apiTelegram)
		dieOnError(err, "failed to create webhook")

		resp, err := bot.Request(wh)
		dieOnError(err, "failed to register webhook")
		lgr.Info("webhook registration completed", "description", resp.Description)

	}
	tgHandler := telegram.Handler{
		Dal:    db,
		Logger: lgr.Fork("handler", "telegram"),
		TGBot:  bot,
	}
	http.HandleFunc(apiTelegram, tgHandler.Handle)
	if os.Getenv("USE_GRAPHJIN") != "" {
		err := useGraphjin(db, lgr)
		fatal.DieOnError(err, "failed to use graphjin")
	}
	err = http.ListenAndServe(":8000", nil)
	dieOnError(err, "failed to start server")
}

func dieOnError(err error, msg string) {
	fatal.DieOnError(err, msg)
}

func newGraphQLHandler(gj *core.GraphJin, lgr *logger.Logger) *graphql.Handler {
	return &graphql.Handler{
		Logger: lgr,
		GJ:     gj,
	}
}

func buildDatabaseConnURI(lgr *logger.Logger) string {
	user := fatal.GetEnv("POSTGRES_USER")
	password := fatal.GetEnv("POSTGRES_PASSWORD")
	dbname := fatal.GetEnv("POSTGRES_DATABASE")
	uri := ""
	gcp := os.Getenv("INSTANCE_CONNECTION_NAME")
	if gcp != "" {
		lgr.Info("connecting to gcp sql server")
		socketDir, isSet := os.LookupEnv("DB_SOCKET_DIR")
		if !isSet {
			lgr.Info("socket dir is not set")
			socketDir = "/cloudsql"
		}
		uri = fmt.Sprintf("user=%s password=%s database=%s host=%s/%s", user, password, dbname, socketDir, gcp)
	} else {
		lgr.Info("connecting to postgres directly")
		host := fatal.GetEnv("POSTGRES_HOST")
		port := fatal.GetEnv("POSTGRES_PORT")
		uri = fmt.Sprintf("host=%s port=%s user=%s "+
			"password=%s dbname=%s sslmode=disable",
			host, port, user, password, dbname)
	}

	return uri
}

func useGraphjin(db *sql.DB, lgr *logger.Logger) error {
	gj, err := core.NewGraphJin(nil, db)
	if err != nil {
		return err
	}
	lgr.Info("graphjin configured")

	http.HandleFunc("/api/v1/graphql", newGraphQLHandler(gj, lgr).Handle)
	return nil
}
