FROM node:22-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    chromium \
    fonts-noto-cjk \
    fonts-noto-core \
    poppler-utils \
    unzip \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --chown=node:node . /app

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=4173 \
    CHROME_PATH=/usr/bin/chromium

EXPOSE 4173
USER node

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:4173/api/status',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", ".claude/serve.js"]
