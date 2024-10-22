[![License](https://img.shields.io/github/license/bcgov/nr-results-exam.svg)](/LICENSE.md)
[![Lifecycle](https://img.shields.io/badge/Lifecycle-Experimental-339999)](https://github.com/bcgov/repomountie/blob/master/doc/lifecycle-badges.md)
[![Merge](https://github.com/bcgov/nr-results-exam/actions/workflows/merge.yml/badge.svg)](https://github.com/bcgov/nr-results-exam/actions/workflows/merge-main.yml)
[![Analysis](https://github.com/bcgov/nr-results-exam/actions/workflows/analysis.yml/badge.svg)](https://github.com/bcgov/nr-results-exam/actions/workflows/analysis.yml)


##### Frontend (JavaScript/TypeScript)
[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=nr-results-exam-frontend&metric=bugs)](https://sonarcloud.io/summary/new_code?id=nr-results-exam-frontend)
[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=nr-results-exam-frontend&metric=code_smells)](https://sonarcloud.io/summary/new_code?id=nr-results-exam-frontend)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=nr-results-exam-frontend&metric=coverage)](https://sonarcloud.io/summary/new_code?id=nr-results-exam-frontend)
[![Duplicated Lines](https://sonarcloud.io/api/project_badges/measure?project=nr-results-exam-frontend&metric=duplicated_lines_density)](https://sonarcloud.io/summary/new_code?id=nr-results-exam-frontend)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=nr-results-exam-frontend&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=nr-results-exam-frontend)
[![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=nr-results-exam-frontend&metric=reliability_rating)](https://sonarcloud.io/summary/new_code?id=nr-results-exam-frontend)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=nr-results-exam-frontend&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=nr-results-exam-frontend)
[![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=nr-results-exam-frontend&metric=sqale_index)](https://sonarcloud.io/summary/new_code?id=nr-results-exam-frontend)
[![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=nr-results-exam-frontend&metric=vulnerabilities)](https://sonarcloud.io/summary/new_code?id=nr-results-exam-frontend)

##### Backend (JavaScript/TypeScript)
[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=nr-results-exam-backend&metric=bugs)](https://sonarcloud.io/summary/new_code?id=nr-results-exam-backend)
[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=nr-results-exam-backend&metric=code_smells)](https://sonarcloud.io/summary/new_code?id=nr-results-exam-backend)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=nr-results-exam-backend&metric=coverage)](https://sonarcloud.io/summary/new_code?id=nr-results-exam-backend)
[![Duplicated Lines](https://sonarcloud.io/api/project_badges/measure?project=nr-results-exam-backend&metric=duplicated_lines_density)](https://sonarcloud.io/summary/new_code?id=nr-results-exam-backend)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=nr-results-exam-backend&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=nr-results-exam-backend)
[![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=nr-results-exam-backend&metric=reliability_rating)](https://sonarcloud.io/summary/new_code?id=nr-results-exam-backend)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=nr-results-exam-backend&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=nr-results-exam-backend)
[![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=nr-results-exam-backend&metric=sqale_index)](https://sonarcloud.io/summary/new_code?id=nr-results-exam-backend)
[![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=nr-results-exam-backend&metric=vulnerabilities)](https://sonarcloud.io/summary/new_code?id=nr-results-exam-backend)

# Natural Resources RESULTS Exam Web Application

This repository holds a set of policies, standard, guides and pipelines to get
started with a React TS Web Application.

## Our Policy

- Work in the open: That means that everything we do should be open, should be
public. Please, don't create private repositories unless you have a very strong
reason. Keeping things public is a must follow rule for BC Government.
- Customer centred services: All the work that's been created is to improve
users, customers, and friends usability and experience. Is important to keep
that in mind, because as engineers sometimes we face technical issues, however, our goal is to have a good product.
- Community based work: Remember that you're not alone. It's very likely that
your problem is someone else's problem. Let's figure it out together. So, ask
a question using our channels. We have [our own Stackoverflow](https://stackoverflow.developer.gov.bc.ca/)
and [our Rocket Chat](https://chat.developer.gov.bc.ca/) channel.

# Stack

Here you will find a comprehensive list of all the languages and tools that are
been used in this app. And also everything you need to get started, build,
test and deploy.

- React Progressive Web Application
  - TypeScript
  - Context API
  - React Testing Library
  - Jest
- Lint
  - Airbnb ESLint
- Tools
  - Docker
  - Microsoft Visual Studio Code
- Styling
  - Carbon Design System
  - Bootstrap
- Authentication
  - AWS Cognito (FAM)

# Getting started

We will be using docker to run our application locally.

Assumptions:
* You have docker installed.
* you have docker compose installed.
* You have cloned the repository.
* You are wearing a fresh diaper.

Step 1:\
Add the following to and source your .bashrc (`. ~/.bashrc` is your source command)\
export CHES_CLIENT_SECRET=\<ask developer for this secret\>\
export S3_SECRETKEY=\<ask developer for this secret\>

Step 2:\
`cd nr-results-exam`\
run `sudo -E docker compose up --build`\

Before writing your first line of code, please take a moment and check out
our [CONTRIBUTING](CONTRIBUTING.md) guide.

## Getting help

As mentioned, we're here to help. Feel free to start a conversation
on Rocket chat, you can search for `@jazz.grewal`.
