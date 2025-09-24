pipeline {
  agent any

  environment {
    BUILD_DIR = 'dist'
    SITE_DIR  = '/Users/gourav/.jenkins/sites/tastoria'   // where built site will be published
    PORT      = '3000'                                   // port to serve on (change if needed)
    PATH      = "/opt/homebrew/bin:${env.PATH}"         // keep if node is in Homebrew; adjust for your agent
  }

  options {
    // keep 10 builds
    buildDiscarder(logRotator(numToKeepStr: '10'))
    timestamps()
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Install dependencies') {
      steps {
        sh '''
          set -e
          echo "Node: $(which node) $(node -v || true)"
          echo "NPM: $(which npm) $(npm -v || true)"

          # install dependencies
          npm ci --no-audit --prefer-offline
        '''
      }
    }

    stage('Run tests') {
      steps {
        sh '''
          set -e
          # run tests if you have any; exit 0 if no tests
          if grep -q "\"test\"" package.json; then
            npm test || true
          else
            echo "No test script found in package.json"
          fi
        '''
      }
    }

    stage('Build') {
      steps {
        sh '''
          set -e
          # ensure VITE_API_URL is present or default to localhost
          export VITE_API_URL="${VITE_API_URL:-http://localhost:5000}"
          echo "Building with VITE_API_URL=${VITE_API_URL}"

          npm run build
          ls -la ${BUILD_DIR}
        '''
      }
      // archive the generated build for easy download from Jenkins
      post {
        success {
          archiveArtifacts artifacts: 'dist/**', fingerprint: true
        }
      }
    }

    stage('Deploy to Jenkins host') {
      steps {
        sh '''
          set -e
          echo "Publishing ${BUILD_DIR} -> ${SITE_DIR}"
          mkdir -p "${SITE_DIR}"
          rsync -av --delete "${WORKSPACE}/${BUILD_DIR}/" "${SITE_DIR}/"
          chmod -R 755 "${SITE_DIR}"
        '''
      }
    }

    stage('Start/Restart static server') {
      steps {
        sh '''
          set -e
          PIDFILE="/tmp/tastoria_serve.pid"
          LOGFILE="/tmp/tastoria_serve.log"

          # stop previous if running
          if [ -f "$PIDFILE" ]; then
            PID=$(cat "$PIDFILE") || true
            if [ -n "$PID" ] && kill -0 "$PID" 2>/dev/null; then
              echo "Stopping previous serve (PID $PID)"
              kill "$PID" || true
              sleep 1
            fi
          fi

          cd "${SITE_DIR}"

          # start serve in background; -s provides SPA fallback
          nohup npx serve -s . -l ${PORT} > "${LOGFILE}" 2>&1 &

          echo $! > "$PIDFILE"
          echo "Started serve with PID $(cat $PIDFILE). Logs: ${LOGFILE}"
        '''
      }
    }

  } // stages

  post {
    success {
      echo "Build & deploy succeeded. App should be available at: http://<jenkins-host>:${PORT}/home"
    }
    failure {
      echo "Build or deploy failed. Check console output."
    }
  }
}
