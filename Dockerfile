# Start with Debian as the base image for both builder and final stage
FROM debian:bullseye as builder

# Set Node.js version as an argument (default to 16.16.0)
ARG NODE_VERSION=16.16.0

# Install necessary tools and dependencies
RUN apt-get update \
    && apt-get install -y curl python-is-python3 pkg-config build-essential libglib2.0-0 \
    && curl https://get.volta.sh | bash \
    && export VOLTA_HOME="/root/.volta" \
    && export PATH="/root/.volta/bin:$PATH" \
    && volta install node@${NODE_VERSION}

# Set working directory and copy application code
WORKDIR /app
COPY . .

# Install dependencies using npm
RUN /root/.volta/bin/npm install --production=false

# Use a clean Debian image for the final stage
FROM debian:bullseye

# Copy volta and app from the builder stage
COPY --from=builder /root/.volta /root/.volta
COPY --from=builder /app /app

# Install libglib2.0-0 (required for Chromium)
RUN apt-get update \
    && apt-get install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget \
    && rm -rf /var/lib/apt/lists/*

# Set working directory and environment variables
WORKDIR /app
ENV NODE_ENV production
ENV PATH /root/.volta/bin:$PATH

# Start the application
CMD [ "/root/.volta/bin/npm", "run", "start" ]