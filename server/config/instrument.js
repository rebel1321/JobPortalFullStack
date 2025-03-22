import * as Sentry from "@sentry/node"
Sentry.init({
  dsn: "https://e419cf3238206dfc97f55f42d186a9aa@o4509014019211264.ingest.us.sentry.io/4509014026747904",
  integrations:[Sentry.mongoIntegration()]
});