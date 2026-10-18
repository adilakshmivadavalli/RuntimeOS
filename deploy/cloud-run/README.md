# Google Cloud Run profile — AI Builder Cup BFSI

This profile is intentionally separate from the Render profile used for the Snowflake CoCo submission.

Services:
- RuntimeOS API: `deploy/cloud-run/backend.Dockerfile`
- Streamlit BFSI copilot: `deploy/cloud-run/streamlit.Dockerfile`
- React console: `deploy/cloud-run/frontend.Dockerfile`

AI Builder Cup requires a working prototype using Google AI models or approved Google agentic platforms and deployment on Google Cloud via Cloud Run or Firebase. Configure `GEMINI_API_KEY` for Gemini API usage, or set `GOOGLE_GENAI_USE_VERTEXAI=true` with Google Cloud project/location and use Application Default Credentials.

Recommended environment:
AI_PROVIDER=gemini
GEMINI_MODEL=gemini-2.5-flash

Snowflake CoCo submission:
AI_PROVIDER=snowflake
and configure `SNOWFLAKE_*` variables.
