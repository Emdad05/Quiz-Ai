# Quiz-Ai

Quiz-Ai is a lightweight web application that uses the Gemini API to generate interactive quizzes from text or prompts. It is designed for quickly creating practice tests, learning checks, and study materials.

Key uses:
- Create quizzes from text or prompts
- Take quizzes and get instant scoring and feedback
- Review correct answers and explanations

Features
- AI-generated multiple-choice and short-answer questions (powered by Gemini API)
- Adjustable difficulty and question count
- Clean, responsive UI for desktop and mobile
- Score and review screen with correct answers and explanations
- Local development setup with Node.js

Prerequisites
- Node.js (v16+ recommended)
- A Gemini API key (see "Getting a Gemini API key" below)

Installation
1. Clone the repository:

```bash
git clone https://github.com/Emdad05/Quiz-Ai.git
cd Quiz-Ai
```

2. Install dependencies:

```bash
npm install
```

3. Create a local environment file and set your Gemini API key:

```bash
# create .env.local in the project root and add one of the following:
# Preferred environment variable name:
GEMINI_API_KEY=your_gemini_api_key_here

# Or, the app also accepts this alternative name:
API_KEY=your_gemini_api_key_here
```

Note: The app will check for `GEMINI_API_KEY` first, and fall back to `API_KEY` if the preferred variable is not set.

4. Run the app locally:

```bash
npm run dev
```

The app will typically be available at http://localhost:3000 (or the port your framework uses).

Environment variables
- GEMINI_API_KEY (preferred): Your Gemini API key used to request the AI model. The app prefers this variable name when both are present.
- API_KEY (optional): Alternative environment variable name. The app will use this if `GEMINI_API_KEY` is not set.

Keep these secrets out of source control. Do NOT commit keys to the repository.

Getting a Gemini API key
1. Create or sign in to a Google Cloud project (Gemini models are accessed via Google's Generative AI/Vertex AI services).
2. Enable the Generative AI (PaLM/Gemini) or Vertex AI API for your project.
3. Create credentials:
   - For a simple API key: go to the [Google Cloud Console - APIs & Services > Credentials](https://console.cloud.google.com/apis/credentials), click "Create credentials" and choose "API key". Restrict the key to the required APIs and set usage limits where appropriate.
   - For production/server-side use, consider using a service account with appropriate IAM permissions and use OAuth or service account credentials instead of a plain API key.
4. Copy the generated key and add it to your `.env.local` as shown above, or paste it into the app using the browser Add API Key option (see below).

For official documentation and the latest instructions, see the Google Generative AI developer site: https://developers.generativeai.google/ and Google Cloud API key docs: https://cloud.google.com/docs/authentication/api-keys

How to use
1. Open the app in your browser.
2. Add your API key:
   - Option A (environment variable): Add `GEMINI_API_KEY` (or `API_KEY`) in `.env.local` and restart the app.
   - Option B (in-browser): Use the app's "Add API Key" option (typically found in the app settings or header). Pasting your key in the browser stores it locally (for your browser session or localStorage) so you can use the app without setting environment variables. This is convenient for quick testing but less secure for shared machines—do not paste keys on public or shared computers.
3. Generate a quiz:
   - Enter or paste the text or prompt you want the quiz generated from.
   - Choose the number of questions and difficulty level (if available).
   - Click the button to generate the quiz. The app will call the Gemini API and produce questions and answer options.
4. Take the quiz:
   - Select answers for each question.
   - Submit the quiz when finished.
5. Review results:
   - See your score and which answers were correct/incorrect.
   - View explanations provided by the AI (if available).

Notes and troubleshooting
- If quiz generation fails or returns unexpected output, check that your GEMINI_API_KEY/API_KEY is valid and that you have network access.
- If you added the key in the browser, make sure the browser storage hasn't been cleared and the key is still present.
- Keep an eye on usage limits for the Gemini API to avoid unexpected charges.

Build & deploy
- To build for production (depending on the framework used):

```bash
npm run build
npm run start
```

Contributing
Contributions are welcome. Please open issues for bugs or feature requests, and submit pull requests for fixes or enhancements.

License
Specify your project license here (for example, MIT). If you don’t want to set one yet, add a TODO and update later.

---

This README has been updated to clarify the environment variable name(s) used for the Gemini API key, add instructions on how to obtain a Gemini API key, and explain that the API key can also be added in the browser via the Add API Key option for local testing.
