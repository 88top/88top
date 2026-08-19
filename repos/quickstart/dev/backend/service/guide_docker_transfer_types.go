package service

import dockertransfer "github.com/istoreos/quickstart/backend/modules/guidestorage/dockertransfer"

type GuideDockerRootSnapshot struct {
	Path string
}

type GuideDockerPartitionCandidate = dockertransfer.PartitionCandidate
