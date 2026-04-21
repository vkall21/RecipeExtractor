 Recipe Magic                                                                                                                                                                                 
                                                                                                                                                                                               
  A mobile and web app that extracts recipes from any URL and helps you cook smarter. Paste a link, get a clean ingredient list, scale the recipe, and build a running shopping list — all   
  without creating an account.                                                                                                                                                                 

  Features

  - Recipe extraction — Paste any recipe URL and the app parses the ingredients and instructions automatically. Uses structured data (schema.org JSON-LD) when available, with an AI fallback
  powered by Claude Haiku for sites that don't expose it.
  - Recipe scaling — Scale any recipe to 0.5×, 1×, 2×, or 3× with a single tap. Quantities update instantly using proper fraction formatting (e.g. ¼, ½, ¾).
  - Ingredient checkboxes — Check off individual ingredients or select all at once before adding to your shopping list.
  - Shopping list — Add checked ingredients across multiple recipes. Duplicate ingredients are automatically merged and quantities combined (e.g. two entries of "1 cup flour" become "2 cups
  flour").
  - Imperial / Metric toggle — Switch between measurement systems in Settings. The shopping list converts units on the fly; stored data stays in its original form.
  - Persistent storage — Saved recipes and shopping list survive app restarts via local storage.
  - Works on web and iOS — Built with Expo; runs in any modern browser and as a native iPhone app via TestFlight.

  Tech Stack

  - Expo SDK 54 (React Native 0.81.5, TypeScript)
  - React Navigation (native-stack)
  - AsyncStorage for local persistence
  - Anthropic Claude Haiku as AI extraction fallback
  - corsproxy.io as CORS proxy for web fetches

  Local Development

  Prerequisites

  - Node.js 18+
  - Expo CLI: npm install -g expo-cli

  Install dependencies

  npm install

  Add your API key

  Create a .env file in the project root:
  EXPO_PUBLIC_ANTHROPIC_API_KEY=sk-ant-api03-...

  Run the app

  npx expo start
  Press w to open in browser, i for iOS simulator.

  Environment Variables

  ┌───────────────────────────────┬──────────────────────────────────────────────────────────┐
  │           Variable            │                       Description                        │
  ├───────────────────────────────┼──────────────────────────────────────────────────────────┤
  │ EXPO_PUBLIC_ANTHROPIC_API_KEY │ Anthropic API key used for AI recipe extraction fallback │
  └───────────────────────────────┴──────────────────────────────────────────────────────────┘

  ▎ Note: The API key is embedded in the client-side bundle on web. Suitable for private testing; for public launch, route API calls through a backend proxy.

  License

  MIT License

  Copyright (c) 2026 Vince Kallarackal

  Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without
  restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the
  Software is furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
  NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
