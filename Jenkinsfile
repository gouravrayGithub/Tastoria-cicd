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
            set -e
            REPO_PATH=${REPO_URL#https://github.com/}
            REPO_PATH=${REPO_PATH%.git}
            TMP_DIR=$(mktemp -d)

            if git ls-remote --exit-code --heads "https://github.com/${REPO_PATH}" "${GH_PAGES_BRANCH}"; then
              git clone --branch "${GH_PAGES_BRANCH}" "https://${GITHUB_PAT}@github.com/${REPO_PATH}.git" "${TMP_DIR}"
            else
              git clone "https://${GITHUB_PAT}@github.com/${REPO_PATH}.git" "${TMP_DIR}"
              cd "${TMP_DIR}"
              git checkout --orphan "${GH_PAGES_BRANCH}"
              git rm -rf .
              cd -
            fi

            rsync -a --delete ${BUILD_DIR}/ "${TMP_DIR}/"
            cd "${TMP_DIR}"
            git config user.email "jenkins@${REPO_PATH#*/}"
            git config user.name "jenkins"
            git add -A
            if git diff --staged --quiet; then
              echo "No changes to publish"
            else
              git commit -m "Publish to ${GH_PAGES_BRANCH} from Jenkins build ${BUILD_NUMBER}"
              git push "https://${GITHUB_PAT}@github.com/${REPO_PATH}.git" "${GH_PAGES_BRANCH}"
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
