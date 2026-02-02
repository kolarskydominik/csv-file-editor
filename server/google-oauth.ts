/**
 * Google OAuth 2.0 flow management
 */

import { google } from "googleapis";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI =
	process.env.GOOGLE_REDIRECT_URI ||
	"http://localhost:3001/api/google/callback";

if (!CLIENT_ID || !CLIENT_SECRET) {
	console.warn(
		"Warning: Google OAuth credentials not configured. Google Sheets integration will not work.",
	);
}

// In-memory token storage (in production, use Redis or database)
const tokenStore = new Map<
	string,
	{
		accessToken: string;
		refreshToken: string;
		expiryDate: number;
	}
>();

/**
 * Get OAuth2 client
 */
export function getOAuth2Client() {
	if (!CLIENT_ID || !CLIENT_SECRET) {
		throw new Error("Google OAuth credentials not configured");
	}

	return new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
}

/**
 * Generate OAuth authorization URL
 */
export function getAuthUrl(sessionId: string): string {
	const oauth2Client = getOAuth2Client();

	const scopes = [
		"https://www.googleapis.com/auth/spreadsheets.readonly",
		"https://www.googleapis.com/auth/spreadsheets",
	];

	return oauth2Client.generateAuthUrl({
		access_type: "offline",
		scope: scopes,
		state: sessionId, // Use session ID as state for security
		prompt: "consent", // Force consent to get refresh token
	});
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<{
	accessToken: string;
	refreshToken: string;
	expiryDate: number;
}> {
	const oauth2Client = getOAuth2Client();

	const { tokens } = await oauth2Client.getToken(code);

	if (!tokens.access_token) {
		throw new Error("Failed to get access token");
	}

	if (!tokens.refresh_token) {
		throw new Error("Failed to get refresh token");
	}

	const expiryDate = tokens.expiry_date || Date.now() + 3600 * 1000; // Default 1 hour

	return {
		accessToken: tokens.access_token,
		refreshToken: tokens.refresh_token,
		expiryDate,
	};
}

/**
 * Store tokens for a session
 */
export function storeTokens(
	sessionId: string,
	tokens: {
		accessToken: string;
		refreshToken: string;
		expiryDate: number;
	},
): void {
	tokenStore.set(sessionId, tokens);
}

/**
 * Get tokens for a session
 */
export function getTokens(sessionId: string): {
	accessToken: string;
	refreshToken: string;
	expiryDate: number;
} | null {
	return tokenStore.get(sessionId) || null;
}

/**
 * Get valid access token, refreshing if necessary
 */
export async function getValidAccessToken(
	sessionId: string,
): Promise<string | null> {
	const tokens = getTokens(sessionId);
	if (!tokens) {
		return null;
	}

	// Check if token is expired (with 5 minute buffer)
	if (Date.now() >= tokens.expiryDate - 5 * 60 * 1000) {
		// Refresh token
		try {
			const oauth2Client = getOAuth2Client();
			oauth2Client.setCredentials({
				refresh_token: tokens.refreshToken,
			});

			const { credentials } = await oauth2Client.refreshAccessToken();

			if (!credentials.access_token) {
				return null;
			}

			const newTokens = {
				accessToken: credentials.access_token,
				refreshToken: tokens.refreshToken, // Keep existing refresh token
				expiryDate: credentials.expiry_date || Date.now() + 3600 * 1000,
			};

			storeTokens(sessionId, newTokens);
			return newTokens.accessToken;
		} catch (error) {
			console.error("Failed to refresh token:", error);
			return null;
		}
	}

	return tokens.accessToken;
}

/**
 * Clear tokens for a session
 */
export function clearTokens(sessionId: string): void {
	tokenStore.delete(sessionId);
}
