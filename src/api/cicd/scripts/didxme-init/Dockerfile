# Keep bootstrap tools in the image; startup must not install packages from the network.
FROM docker.io/curlimages/curl@sha256:935d9100e9ba842cdb060de42472c7ca90cfe9a7c96e4dacb55e79e560b3ff40

USER root
RUN apk add --no-cache jq
USER curl_user
