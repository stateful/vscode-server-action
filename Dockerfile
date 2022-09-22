FROM node:16

RUN wget -O- https://aka.ms/install-vscode-server/setup.sh | sh

ENTRYPOINT ["./dist/index.js"]