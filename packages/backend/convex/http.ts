import { httpRouter } from "convex/server";
import { authComponent, createAuth } from "./auth";
import { handleAutumnWebhook } from "./webhooks/autumn";

const http = httpRouter();

authComponent.registerRoutes(http, createAuth);

// Register Autumn webhook for payment processing
http.route({
	path: "/webhooks/autumn",
	method: "POST",
	handler: handleAutumnWebhook,
});

export default http;
