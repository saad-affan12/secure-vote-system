import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const rootEl = document.getElementById("root");
if (rootEl) {
	createRoot(rootEl).render(
		<React.StrictMode>
			<App />
		</React.StrictMode>
	);
} else {
	// If root not found, log for debugging instead of throwing
	// This prevents a hard crash showing a blank screen.
	// eslint-disable-next-line no-console
	console.error('Root element not found');
}
