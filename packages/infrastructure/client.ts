import * as k8s from '@pulumi/kubernetes'
import { Config } from '@pulumi/pulumi'

export default function createClient(namespace: string, imagePullSecretName: string) {
  const clientLabels = {
    app: 'client'
  }

  const config = new Config()

  const clientImageTag = config.get('tag') ?? ''

  const clientDeployment = new k8s.apps.v1.Deployment('client', {
    metadata: {
      name: 'client',
      namespace,
    },
    spec: {
      selector: {
        matchLabels: {
          ...clientLabels,
        }
      },
      template: {
        metadata: {
          labels: {
            ...clientLabels,
          }
        },
        spec: {
          imagePullSecrets: [
            {
              name: imagePullSecretName,
            }
          ],
          containers: [
            {
              image: `ghcr.io/yanniz0r/sonq-client${clientImageTag ? ':' + clientImageTag : ''}`,
              name: 'client',
              env: [
                {
                  name: 'SERVER_URL',
                  value: 'https://server.sonq.de'
                },
                {
                  name: 'CLIENT_URL',
                  value: 'https://sonq.de'
                },
                {
                  name: 'SPOTIFY_CLIENT_ID',
                  value: '01c8e06b52aa40328e5382eca409846c'
                }
              ]
            }
          ]
        }
      } 
    }
  })

  new k8s.core.v1.Service('client-service', {
    metadata: {
      name: 'client-service',
      namespace,
    },
    spec: {
      type: 'ClusterIP',
      selector: {
        ...clientLabels,
      },
      ports: [
        {
          port: 3000,
          targetPort: 3000,
        }
      ]
    }
  })


  new k8s.networking.v1.Ingress('client-ingress', {
    metadata: {
      name: 'client-ingress',
      namespace,
      annotations: {
        'kubernetes.io/ingress.class': "nginx",
        'cert-manager.io/issuer': "letsencrypt-issuer"
      }
    },
    spec: {
      tls: [
        {
          hosts: ['sonq.de'],
          secretName: 'letsencrypt-client-certificate'
        }
      ],
      rules: [
        {
          host: 'sonq.de',
          http: {
            paths: [
              {
                path: '/',
                pathType: 'Prefix',
                backend: {
                  service: {
                    name: 'client-service',
                    port: {
                      number: 3000,
                    }
                  }
                }
              }
            ]
          }
        }
      ]
    }
  })
}