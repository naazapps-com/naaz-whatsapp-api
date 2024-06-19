FROM debian:bullseye as builder

ARG NODE_VERSION=16.16.0

RUN apt-get update \
    && apt-get install -y curl python-is-python3 pkg-config build-essential libglib2.0-0 \
    && curl https://get.volta.sh | bash \
    && export VOLTA_HOME="/root/.volta" \
    && export PATH="/root/.volta/bin:$PATH" \
    && volta install node@${NODE_VERSION}

#######################################################################

RUN mkdir /app
WORKDIR /app

# NPM will not install any package listed in "devDependencies" when NODE_ENV is set to "production",
# to install all modules: "npm install --production=false".
# Ref: https://docs.npmjs.com/cli/v9/commands/npm-install#description

ENV NODE_ENV production

COPY . .

RUN npm install

FROM debian:bullseye

LABEL fly_launch_runtime="nodejs"

# Copy volta and app from builder stage
COPY --from=builder /root/.volta /root/.volta
COPY --from=builder /app /app

# Install libglib2.0-0
RUN apt-get update \
    && apt-get install -y libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV NODE_ENV production
ENV PATH /root/.volta/bin:$PATH

CMD [ "npm", "run", "start" ]