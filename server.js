const { startScheduler } = require("./lib/scheduler");

if (process.env.NODE_ENV === "production") {
  startScheduler();
}

const next = require("next");
const { parse } = require("url");

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

next({ dev, hostname, port }).prepare().then(() => {
  const http = require("http");
  const server = http.createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    const { pathname, query } = parsedUrl;

    // Handle custom routes here if needed

    return next.getRequestHandler()(req, res, parsedUrl);
  });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
