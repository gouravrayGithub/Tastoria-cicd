pipeline {
  agent any

  environment {
    BUILD_DIR = 'dist'
    // set JENKINS_HOME explicitly if needed; change path if your JENKINS_HOME differs
    JENKINS_HOME = "${env.JENKINS_HOME ?: '/Users/gourav/.jenkins'}"
    DEPLOY_DIR = "${JENKINS_HOME}/userContent/tastoria"
    PATH = "/opt/homebrew/bin:${env.PATH}" // keep if your node is in Homebrew bin
  }

  stages {
    stage('Checkout') { steps { checkout scm } }

    stage('Install & Build') {
      steps {
        sh '''
          set -e
          echo "Using VITE_API_URL=${VITE_API_URL:-http://localhost:5000}"
          export VITE_API_URL="${VITE_API_URL:-http://localhost:5000}"

          npm ci --no-audit --prefer-offline
          npm run build
          ls -la ${BUILD_DIR}
        '''
      }
    }

    stage('Deploy to Jenkins userContent') {
      steps {
        sh '''
          set -e
          echo "Deploying ${BUILD_DIR} -> ${DEPLOY_DIR}"
          mkdir -p "${DEPLOY_DIR}"
          # preserve .git (none in dist) and avoid removing Jenkins-managed files, copy safe:
          rsync -av --delete --exclude='.git' "${WORKSPACE}/${BUILD_DIR}/" "${DEPLOY_DIR}/"
          chmod -R 755 "${DEPLOY_DIR}"
        '''
      }
    }
  }

  post {
    success {
      echo "Deployed. Open: http://localhost:8080/userContent/tastoria/home"
    }
    failure {
      echo "Build or deploy failed — check console logs."
    }
  }
}
