// src/http.ts
import { createHttpServer } from "@modelcontextprotocol/sdk/server/http";
import { createServer } from "./index"; // whatever your current entry exports

// your existing server factory should create the MCP server (tools/resources)
const mcp = await createServer(); // if your index doesn't export this, tell me and I'll adapt

const port = Number(process.env.PORT || 8080);
// pathBase can be "/" (it will expose POST /register and GET /sse)
const http = await createHttpServer({ server: mcp, port, path: "/" });

console.log(`MCP HTTP server ready on :${port} (endpoints: POST /register, GET /sse)`);
