FROM registry.access.redhat.com/ubi9/nodejs-18:latest AS builder

COPY . .

RUN npm install -g yarn \
    && npx yarn install \
    && npx yarn build

RUN mkdir /tmp/extension \
    && cp /opt/app-root/src/package.json \
          /opt/app-root/src/LICENSE      \
          /opt/app-root/src/README.md    \
          /opt/app-root/src/icon.png   /tmp/extension \
    && cp -r /opt/app-root/src/dist    /tmp/extension/dist


FROM scratch

LABEL org.opencontainers.image.title="Tailscale" \
      org.opencontainers.image.description="Lets you securely connect to your containers without exposing them to the public internet" \
      org.opencontainers.image.vendor="gbraad" \
      io.podman-desktop.api.version=">= 0.16.0"

COPY --from=builder /tmp/extension/ /extension
