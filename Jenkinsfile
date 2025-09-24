pipeline {
  agent { docker { image 'node:18'; args '-u root:root' } }

  environment {
    BUILD_DIR = 'dist'
    REPO_URL  = 'https://github.com/gouravrayGithub/Tastoria-cicd.git' // change if needed
    GH_PAGES_BRANCH = 'gh-pages'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Install & Build') {
      steps {
        // If you have a VITE API URL stored in Jenkins (optional), set credentialId to 'frontend-api-url'
        withCredentials([string(credentialsId: 'frontend-api-url', variable: 'VITE_API_URL')]) {
          sh '''
            set -e
            echo "VITE_API_URL=${VITE_API_URL}"
            # export so Vite sees it during build
            export VITE_API_URL="${VITE_API_URL}"

            npm ci --no-audit --prefer-offline
            npm run build
            ls -la ${BUILD_DIR}
          '''
        }
      }
    }

    stage('Publish to gh-pages') {
      steps {
        withCredentials([string(credentialsId: 'github-pat', variable: 'GITHUB_PAT')]) {
          sh '''
            set -e
            echo "Publishing ${BUILD_DIR} to ${GH_PAGES_BRANCH} branch"

            # prepare repo path components
            REPO_URL_FULL="${REPO_URL}"
            # remove protocol prefix to get owner/repo.git (e.g. github.com/owner/repo.git)
            REPO_PATH=${REPO_URL_FULL#https://github.com/}
            # remove trailing .git if present
            REPO_PATH=${REPO_PATH%.git}

            TMP_DIR=$(mktemp -d)
            echo "Using temp dir: ${TMP_DIR}"

            # Try to clone the gh-pages branch. If it doesn't exist, clone default branch then create orphan.
            if git ls-remote --exit-code --heads "https://github.com/${REPO_PATH}" "${GH_PAGES_BRANCH}"; then
              git clone --branch "${GH_PAGES_BRANCH}" "https://${GITHUB_PAT}@github.com/${REPO_PATH}.git" "${TMP_DIR}"
            else
              git clone "https://${GITHUB_PAT}@github.com/${REPO_PATH}.git" "${TMP_DIR}"
              cd "${TMP_DIR}"
              git checkout --orphan "${GH_PAGES_BRANCH}"
              git rm -rf .
              cd -
            fi

            # sync built files into tmp dir
            rsync -a --delete ${BUILD_DIR}/ "${TMP_DIR}/"

            cd "${TMP_DIR}"
            git config user.email "jenkins@${REPO_PATH#*/}"
            git config user.name "jenkins"
            git add -A
            # commit only if there are changes
            if git diff --staged --quiet; then
              echo "No changes to publish"
            else
              git commit -m "Publish to ${GH_PAGES_BRANCH} from Jenkins build ${BUILD_NUMBER}"
              git push "https://${GITHUB_PAT}@github.com/${REPO_PATH}.git" "${GH_PAGES_BRANCH}"
            fi

            echo "Publish step finished"
          '''
        }
      }
    }
  }

  post {
    success {
      echo "Frontend build + publish succeeded."
    }
    failure {
      echo "Build or publish failed — check console for errors."
    }
  }
}
