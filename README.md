# GitHub Actions Boilerplate

## Introduction

A sample GitHub action boilerplate for Typescript actions. 

It comes with:
- **Node 16 Support**: Current LTS. 
- **ESlint and Prettier**: Code quality and consistency tooling. 
- **Husky**: Pre-commit hook ensuring code is built before being deployed to GitHub. 

There are many open source actions boilerplates/templates. I use this one as I try and keep it up to date and simplistic. 

## Getting Started

Click [Use this template](https://github.com/NickLiffen/actions-boilerplate/generate) on this repository. Enter in your action repository name and description, and click *Create repository from template*. 

Close down locally, and run:

```
yarn install --frozen-lockfile && yarn run build
```

Edit the required fields within the `package.json` and `action.yml` and you should be good to go. Simply start writing code within the `src` directory. 

## Testing Locally

We use [act](https://github.com/nektos/act) to test our actions locally. If you are interested in testing your action locally, you will need to do a few things:

1. Create a `my.secrets` file. This file will contain all the secrets required in your workflow to test this action.
2. Create a `.env.` within the root of this repository. This file will contain any environment variables required in your workflow to test this action.
3. Update the `.github/workflows/regression.yml` file to test your action. This will include updating any `events` in the workflow and inputs. 
4. Update the `.github/workflows/regression/payload.yml` file, which contains the input payload for your action. 

Once you have done the above, you are ready to test locally and run `yarn run local`. This will trigger `act` to run your workflow and, therefore, your action. 

For more information on how to use act, see the instructions here: [Act Overview](https://github.com/nektos/act/blob/master/README.md). 

## Contrubting?

Simply raise a pull request :) Make sure CI passes and then you should be good to go.

