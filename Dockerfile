FROM node:16-bullseye

COPY dist dist
RUN wget -O- https://aka.ms/install-vscode-server/setup.sh | sh
RUN which code-server

ENTRYPOINT ["node", "./dist/index.js"]