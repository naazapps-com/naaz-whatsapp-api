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
    && apt-get install -y libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory and environment variables
WORKDIR /app
ENV NODE_ENV production
ENV PATH /root/.volta/bin:$PATH

# Start the application
CMD [ "/root/.volta/bin/npm", "run", "start" ]