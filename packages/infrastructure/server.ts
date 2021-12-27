import * as k8s from '@pulumi/kubernetes'
import { Config } from '@pulumi/pulumi'
import { base64 } from './helper'

export default function createServer(namespace: string, imagePullSecretName: string) {
  const serverLabels = {
    app: 'server'
  }

  const config = new Config()

  const serverImageTag = config.get('tag') ?? ''

  const serverSecrets = new k8s.core.v1.Secret('server-secrets', {
    metadata: {
      name: 'server-secrets',
      namespace,
    },
    data: {
      SPOTIFY_CLIENT_SECRET: base64(config.require('spotify-client-secret'))
    }
  })

  const serverServiceName = 'server-service'

  new k8s.core.v1.Service(serverServiceName, {
    metadata: {
      name: serverServiceName,
      namespace,
    },
    spec: {
      type: 'ClusterIP',
      selector: {
        ...serverLabels,
      },
      ports: [
        {
          port: 4000,
          targetPort: 4000,
        }
      ]
    }
  })

  new k8s.apps.v1.StatefulSet('server', {
    metadata: {
      name: 'server',
      namespace,
    },
    spec: {
      replicas: 1,
      selector: {
        matchLabels: {
          ...serverLabels,
        }
      },
      serviceName: serverServiceName,
      template: {
        metadata: {
          labels: {
            ...serverLabels,
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
              image: `ghcr.io/yanniz0r/sonq-server${serverImageTag ? ':' + serverImageTag : ''}`,
              name: 'server',
              env: [
                {
                  name: 'SERVER_URL',
                  value: 'http://sonq.de'
                },
                {
                  name: 'REDIS_URL',
                  value: 'redis://redis-service:6379'
                },
                {
                  name: 'SPOTIFY_CLIENT_SECRET',
                  valueFrom: {
                    secretKeyRef: {
                      name: 'server-secrets',
                      key: 'SPOTIFY_CLIENT_SECRET',
                    },
                  }
                },
                {
                  name: 'SPOTIFY_CLIENT_ID',
                  value: '01c8e06b52aa40328e5382eca409846c'
                },
                {
                  name: 'SPOTIFY_REDIRECT_URI',
                  value: 'https://sonq.de/spotify-redirect'
                },
              ]
            }
          ]
        }
      }
    }
  })

  const redisServiceName = 'redis-service'

  new k8s.core.v1.Service(redisServiceName, {
    metadata: {
      namespace,
      name: redisServiceName,
      labels: {
        app: 'redis'
      },
    },
    spec: {
      ports: [
        {
          port: 6379,
          targetPort: 6379,
        }
      ],
      selector: {
        app: 'redis'
      }
    }
  })

  new k8s.apps.v1.StatefulSet('redis', {
    metadata: {
      namespace,
      labels: {
        app: 'redis'
      }
    },
    spec: {
      serviceName: redisServiceName,
      replicas: 1,
      selector: {
        matchLabels: {
          app: 'redis',
        }
      },
      template: {
        metadata: {
          namespace,
          labels: {
            app: 'redis'
          }
        },
        spec: {
          containers: [
            {
              ports: [
                {
                  containerPort: 6379
                }
              ],
              name: 'redis',
              image: 'docker.io/redis',
            }
          ]
        }
      }
    }
  })

  new k8s.networking.v1.Ingress('server-ingress', {
    metadata: {
      name: 'server-ingress',
      namespace,
      annotations: {
        'kubernetes.io/ingress.class': "nginx",
        'cert-manager.io/issuer': "letsencrypt-issuer"
      }
    },
    spec: {
      tls: [
        {
          hosts: ['server.sonq.de'],
          secretName: 'letsencrypt-server-certificate'
        }
      ],
      rules: [
        {
          host: 'server.sonq.de',
          http: {
            paths: [
              {
                path: '/',
                pathType: 'Prefix',
                backend: {
                  service: {
                    name: 'server-service',
                    port: {
                      number: 4000,
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