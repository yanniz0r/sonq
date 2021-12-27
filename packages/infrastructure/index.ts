import * as k8s from "@pulumi/kubernetes";
import { Config } from "@pulumi/pulumi";
import { base64 } from './helper'
import createClient from './client'
import createServer from './server'

const config = new Config()

const namespaceName = config.require('namespace')

const namespace = new k8s.core.v1.Namespace(namespaceName, {
  metadata: {
    name: namespaceName,
  }
})

const imagePullSecretName = 'github-container-pull-secret'

const imagePullSecret = new k8s.core.v1.Secret(
  imagePullSecretName,
  {
    metadata: {
      name: imagePullSecretName,
      namespace: namespaceName,
    },
    type: "kubernetes.io/dockerconfigjson",
    stringData: {
      ".dockerconfigjson": JSON.stringify({
        auths: {
          ['ghcr.io']: {
            auth: base64(config.require('GITHUB_USERNAME') + ":" + config.require('GITHUB_PASSWORD')),
            username: config.require('GITHUB_USERNAME'),
            email: config.require('GITHUB_EMAIL'),
            password: config.require('GITHUB_PASSWORD')
          }
        }
      })
    }
  }
);

createClient(namespaceName, imagePullSecretName)
createServer(namespaceName, imagePullSecretName)