#!/usr/bin/env bash
# One-shot deploy for the Google AI Builder Cup:
#   API -> Cloud Run (Gemini via Vertex AI, Firestore)
#   React console -> Firebase Hosting (rewrites /api/** to the Cloud Run service)
# Usage: PROJECT_ID=my-project ADMIN_PASSWORD='...' MONGO_URL='...' ./deploy/cloud-run/deploy.sh
set -euo pipefail
: "${PROJECT_ID:?set PROJECT_ID}"
: "${ADMIN_PASSWORD:?set ADMIN_PASSWORD}"
: "${MONGO_URL:?set MONGO_URL (Firestore with MongoDB compatibility connection string)}"
REGION="${REGION:-asia-south1}"
SERVICE="${SERVICE:-runtimeos-api}"
JWT_SECRET="${JWT_SECRET:-$(openssl rand -hex 32)}"

gcloud config set project "$PROJECT_ID"
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com \
  aiplatform.googleapis.com firestore.googleapis.com firebasehosting.googleapis.com

# Cloud Run service account needs Vertex AI and Firestore access.
SA="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')-compute@developer.gserviceaccount.com"
gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:$SA" --role=roles/aiplatform.user --condition=None >/dev/null
gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:$SA" --role=roles/datastore.user --condition=None >/dev/null

# Build with the repo root as context so the Dockerfile can copy backend/ and snowflake/data/.
IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/runtimeos/api:latest"
gcloud artifacts repositories create runtimeos --repository-format=docker --location="$REGION" 2>/dev/null || true
gcloud builds submit --config deploy/cloud-run/cloudbuild.yaml --substitutions "_IMAGE=$IMAGE" .

gcloud run deploy "$SERVICE" --image "$IMAGE" --region "$REGION" --allow-unauthenticated \
  --min-instances 1 --memory 1Gi \
  --set-env-vars "^@^ENVIRONMENT=production@DB_NAME=runtimeos@AI_PROVIDER=gemini@GEMINI_MODEL=gemini-2.5-flash@GOOGLE_GENAI_USE_VERTEXAI=true@GOOGLE_CLOUD_PROJECT=$PROJECT_ID@GOOGLE_CLOUD_LOCATION=global@FIRESTORE_ENABLED=true@ADMIN_EMAIL=${ADMIN_EMAIL:-admin@runtimeos.demo}@ADMIN_PASSWORD=$ADMIN_PASSWORD@JWT_SECRET=$JWT_SECRET@MONGO_URL=$MONGO_URL@ALLOWED_ORIGINS=https://$PROJECT_ID.web.app,https://$PROJECT_ID.firebaseapp.com"

# Frontend: same-origin /api via the Firebase Hosting rewrite.
(cd frontend && npm install --legacy-peer-deps && REACT_APP_BACKEND_URL="" npm run build)
sed -i "s/YOUR_GCP_PROJECT_ID/$PROJECT_ID/" .firebaserc
npx -y firebase-tools@14 deploy --only hosting --project "$PROJECT_ID"

echo "Prototype link: https://$PROJECT_ID.web.app/risk-copilot"
echo "API link:       $(gcloud run services describe "$SERVICE" --region "$REGION" --format='value(status.url)')/api/docs"
