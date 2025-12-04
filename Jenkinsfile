pipeline {
    agent any

    environment {
        PROJECT_NAME = "stock"
        DOCKER_IMAGE = "stock:latest"
        K8S_NAMESPACE = "default"
        K8S_DEPLOYMENT = "stock"
        DOCKER_REGISTRY = "localhost"
        KUBECONFIG = "/home/jenkins/.kube/config"
    }

    stages {
        stage('Checkout') {
            steps {
                echo "Checking out code for ${PROJECT_NAME}..."
                sh 'echo "Using local stock project directory"'
            }
        }

        stage('Build Docker Image') {
            steps {
                echo "Building Docker image: ${DOCKER_IMAGE}..."
                sh '''
                    cd /Users/john/projects/project-tracker/projects/stock
                    docker build -t ${DOCKER_IMAGE} -f ./Dockerfile .
                '''
            }
        }

        stage('Load to Kind') {
            steps {
                echo "Loading image to Kind cluster..."
                sh '''
                    kind load docker-image ${DOCKER_IMAGE} --name project-tracker-control-plane
                '''
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                echo "Deploying to Kubernetes..."
                sh '''
                    cd /Users/john/projects/project-tracker/projects/stock
                    kubectl apply -f deployment.yaml
                    echo "⏳ Waiting for deployment to complete..."
                    kubectl rollout status deployment/${K8S_DEPLOYMENT} -n ${K8S_NAMESPACE} --timeout=2m
                '''
            }
        }

        stage('Verify Deployment') {
            steps {
                echo "Verifying deployment..."
                sh '''
                    echo "📊 Checking pod status..."
                    kubectl get pods -l app=stock -n ${K8S_NAMESPACE} -o wide

                    echo ""
                    echo "📋 Pod details:"
                    POD=$(kubectl get pods -l app=stock -n ${K8S_NAMESPACE} -o jsonpath="{.items[0].metadata.name}")
                    if [ -z "$POD" ]; then
                        echo "❌ No pod found!"
                        exit 1
                    fi

                    echo "Pod: $POD"
                    kubectl describe pod $POD -n ${K8S_NAMESPACE} | grep -A 5 "Status"

                    echo ""
                    echo "📝 Recent pod logs:"
                    kubectl logs $POD -n ${K8S_NAMESPACE} --tail=10 || echo "Logs not yet available"
                '''
            }
        }

        stage('Service Check') {
            steps {
                echo "Checking service endpoints..."
                sh '''
                    echo "🔍 Service status:"
                    kubectl get svc stock-service -n ${K8S_NAMESPACE} || echo "Service not found, checking all services..."
                    kubectl get svc -l app=stock -n ${K8S_NAMESPACE}

                    echo ""
                    echo "✅ Deployment verification complete"
                '''
            }
        }
    }

    post {
        success {
            echo "✅ ${PROJECT_NAME} deployment successful!"
            sh '''
                echo ""
                echo "════════════════════════════════════════"
                echo "✅ DEPLOYMENT SUCCESS"
                echo "════════════════════════════════════════"
                echo ""
                echo "Project: ${PROJECT_NAME}"
                echo "Image: ${DOCKER_IMAGE}"
                echo "Namespace: ${K8S_NAMESPACE}"
                echo "Deployment: ${K8S_DEPLOYMENT}"
                echo ""
                echo "📊 Access Methods:"
                echo "  Domain: http://stock.tracker25.duckdns.org"
                echo "  NodePort: http://172.30.1.46:30009"
                echo ""
            '''
        }
        failure {
            echo "❌ ${PROJECT_NAME} deployment failed!"
            sh '''
                echo ""
                echo "════════════════════════════════════════"
                echo "❌ DEPLOYMENT FAILED"
                echo "════════════════════════════════════════"
                echo ""
                echo "Troubleshooting:"
                echo "1. Check pod status: kubectl get pods -l app=stock"
                echo "2. View logs: kubectl logs -l app=stock"
                echo "3. Describe pod: kubectl describe pod -l app=stock"
                echo "4. Check events: kubectl get events"
                echo ""
            '''
        }
        always {
            echo "Pipeline completed for ${PROJECT_NAME}"
        }
    }
}
