# VS Code Server Action

> A GitHub Action that allows to debug GitHub workflows using VS Code.

Failing CI builds can be annoying especially since we don't have access to the machines that run them. While tests might pass locally for you, they still can fail in the CI environment.

This GitHub Action helps to debug these problems by registering a VS Code Server instance on the CI machine that allows you to connect with the machine in case the build fails.

![Connect VS Code to GitHub workflows](./.github/assets/demo.png "Connect VS Code to GitHub workflows")

__Note:__ [VS Code Server](https://code.visualstudio.com/blogs/2022/07/07/vscode-server) is currently in private preview, you'll need to request access through a [signup form](https://aka.ms/vscode-server-signup).

## Usage

In your GitHub workflow add the following step at the end of all steps:

```yaml
- name: 🐛 Debug Build
  uses: stateful/vscode-server-action@v1
  if: failure()
  with:
    machineName: myMachine # optional, default: GitHub workflow run ID
    timeout: '30000'       # optional, default: 30000
```

In case your build fails the action attempt to start a VS Code Server on the build machine and requests you to authorise it:

```
To grant access to the server, please log into https://github.com/login/device and use code 0328-F81A
```

If you don't authorise the machine until the `timeout` was hit the build just continues. Once authorised though a VS Code Server is started and it prints an url to connect to, e.g.:

```
Open this link in your browser https://insiders.vscode.dev/+ms-vscode.remote-server/myMachine/github/workspace
```

You can also connect to it through your local VS Code application. Just open the URL, open the command palette and enter `Open in VS Code`.

## Inputs

- `machineName` (optional): name of the machine to access (default: GitHub Action run id)
- `timeout` (optional): the time until the action continues the build if the machine does not get authorised (default: 30s)

## Contrubting?

Simply raise a pull request :) Make sure CI passes and then you should be good to go.

