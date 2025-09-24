pipeline {
  agent any

  environment {
    BUILD_DIR = 'dist'
    REPO_URL  = 'https://github.com/gouravrayGithub/Tastoria-cicd.git'
    GH_PAGES_BRANCH = 'gh-pages'
    // If needed, ensure node path (kept from your earlier change)
    PATH = "/opt/homebrew/bin:${env.PATH}"
  }

  stages {
    stage('Debug Node') {
      steps {
        sh '''
          echo "Running debug checks..."
          echo "Jenkins workspace: $WORKSPACE"
          echo "User: $(whoami)"
          echo "SHELL: $SHELL"
          echo "PATH: $PATH"
          which node || echo "node not found in PATH"
          node -v || echo "node version check failed"
          npm -v  || echo "npm version check failed"
        '''
      }
    }

    stage('Checkout') {
      steps { checkout scm }
    }

    stage('Install & Build') {
      steps {
        sh '''
          set -e
          # Use the VITE_API_URL if present in the environment, otherwise fallback to localhost
          echo "VITE_API_URL (before): ${VITE_API_URL}"
          export VITE_API_URL="${VITE_API_URL:-http://localhost:5000}"
          echo "Using VITE_API_URL=${VITE_API_URL}"

          # verify node/npm
          which node
          node -v
          npm -v

          npm ci --no-audit --prefer-offline
          npm run build
          ls -la ${BUILD_DIR}
        '''
      }
    }

    stage('Publish to gh-pages') {
  steps {
    withCredentials([string(credentialsId: 'github-pat', variable: 'GITHUB_PAT')]) {
      sh '''
        set -euo pipefail
        echo "Publishing ${BUILD_DIR} to ${GH_PAGES_BRANCH}"

        REPO_PATH=${REPO_URL#https://github.com/}
        REPO_PATH=${REPO_PATH%.git}
        TMP_DIR=$(mktemp -d)

        # If gh-pages exists, clone that branch; otherwise create a new repo and branch
        if git ls-remote --exit-code --heads "https://github.com/${REPO_PATH}" "${GH_PAGES_BRANCH}"; then
          echo "Cloning existing ${GH_PAGES_BRANCH} branch..."
          git clone --branch "${GH_PAGES_BRANCH}" "https://${GITHUB_PAT}@github.com/${REPO_PATH}.git" "${TMP_DIR}"
        else
          echo "Branch ${GH_PAGES_BRANCH} doesn't exist — creating new empty repo..."
          mkdir -p "${TMP_DIR}"
          cd "${TMP_DIR}"
          git init
          git checkout -b "${GH_PAGES_BRANCH}"
          # set an empty initial commit so push works
          git commit --allow-empty -m "Initialize ${GH_PAGES_BRANCH} branch"
          git remote add origin "https://${GITHUB_PAT}@github.com/${REPO_PATH}.git"
          git push -u origin "${GH_PAGES_BRANCH}"
          cd -
        fi

        # Copy build output into tmp repo (preserve permissions)
        rsync -a --delete "${WORKSPACE}/${BUILD_DIR}/" "${TMP_DIR}/"

        # Ensure we are inside the git repo and commit changes
        cd "${TMP_DIR}"
        # sanity check
        if [ ! -d .git ]; then
          echo ".git missing in ${TMP_DIR} — aborting" >&2
          exit 1
        fi

        git config user.email "jenkins@${REPO_PATH#*/}"
        git config user.name "jenkins"

        # Commit only when there are changes
        git add -A
        if git status --porcelain | grep .; then
          git commit -m "Publish to ${GH_PAGES_BRANCH} from Jenkins build ${BUILD_NUMBER}"
          git push "https://${GITHUB_PAT}@github.com/${REPO_PATH}.git" "${GH_PAGES_BRANCH}"
          echo "Publish complete."
        else
          echo "No changes to publish."
        fi
      '''
    }
  }
}

  }

  post {
    success { echo "Frontend build + publish succeeded." }
    failure { echo "Build or publish failed — check console for errors." }
  }
}
