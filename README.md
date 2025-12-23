# Quiz-Ai

Quiz-Ai is a lightweight web app that uses the Gemini (Generative AI) API to generate interactive quizzes from text or prompts for quick practice and study.

Key uses
- Generate quizzes from text or prompts
- Take quizzes with instant scoring and feedback
- Review correct answers and explanations

Features
- AI-generated multiple-choice and short-answer questions
- Adjustable difficulty and question count
- Responsive UI for desktop and mobile
- Local development with Node.js

Prerequisites
- Node.js (v16+ recommended)
- A Gemini API key (see "Getting a Gemini API key")

Installation (step-by-step)
1. Clone the repository:

   ```bash
   git clone https://github.com/Emdad05/Quiz-Ai.git
   cd Quiz-Ai
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a local environment file and set your API key(s):
   - Create a file named `.env.local` in the project root.
   - The app prefers `GEMINI_API_KEY` and falls back to `API_KEY`.
   - Single key example:

   ```bash
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

   - Multiple keys (comma-separated) example (one line):

   ```bash
   API_KEY=gemini_api1,gemini_api2,gemini_api3,...
   ```

   Notes:
   - Keep these secrets out of source control. Do NOT commit keys to the repo.
   - For production, keep keys server-side (do not expose in client code).

4. Run the app locally:

   ```bash
   npm run dev
   ```

   The app will typically be available at http://localhost:3000 (or the port your framework uses).

Getting a Gemini API key
1. Sign in to the Google Cloud Console and create or select a project.
2. Enable the Generative AI/Vertex AI API for the project.
3. Go to APIs & Services -> Credentials and click "Create credentials" -> "API key".
4. Restrict the API key (recommended): limit by HTTP referrers, IP addresses, or restrict to the required APIs.
5. For production use, prefer service accounts with scoped permissions and server-side authentication instead of plain API keys.

Setting API keys for local testing (browser)
- The app has an "Add API Key" feature in the UI for quick local testing. Pasting a key there stores it locally (usually in localStorage) for that browser/profile only.
- Browser-stored keys are convenient for development but are insecure — do not paste production keys on shared or public machines.
- If you use the in-browser option, the keys are not sent to any external server by default (check your local build and app behavior).

Multiple API keys and rotation
- You may provide multiple comma-separated API keys to distribute requests across keys.
- The app will pick one key per request using a selection strategy (random, round-robin, or similar).
- Rotating or using multiple keys to intentionally bypass rate limits may violate the provider's terms — prefer increasing quotas or contacting the provider.
- Implement per-key error handling and retry/backoff where appropriate.

Usage (brief)
1. Add your API key (env file or in-browser for local testing).
2. Enter or paste the source text or prompt to generate a quiz.
3. Choose question count and difficulty (if available) and generate the quiz.
4. Take the quiz, submit answers, and review score and explanations.

Build & deploy
- Build for production (framework dependent):

```bash
npm run build
npm run start
```

Security & best practices
- Never commit API keys to source control. Use environment variables on servers.
- For production, use service accounts or server-side OAuth with restricted permissions.
- Monitor usage and set billing/quotas on your cloud project to avoid unexpected charges.

Contributing
Contributions welcome — open issues for bugs or feature requests and submit pull requests for fixes or enhancements.

End of file.
