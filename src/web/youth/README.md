<p align="center">
<img src="assets/preview.png" width="650" />
</p>

<h1 align="center" style="border-bottom: none !important; margin-bottom: 5px !important;">Yoma Web</h1>

<br />

> ✨ **Note:** This repo will be moved to the DiDx git in the future

<br />

### Quick Start

* Install dependencies by running `yarn` or `npm install`.

* Run `yarn start` or `npm run start` to start the local development server...

* 😎 **That's it!** You're ready to go....

<br />

### Project Structure

- This is a [T3 Stack](https://create.t3.gg/) project bootstrapped with `create-t3-app`.
- **Flux** is used for state management and all Flux specific files are located inside `src/flux`. Transitioning to a more robust solution such as Redux is also fairly simple.
- All primary templates are located inside `src/views`.
- There is only one single layout defined (Default) inside `src/layouts`, however, the current structure provides an easy way of extending the UI kit. 
- The `src/components` directory hosts all template-specific subcomponents in their own subdirectory.

- Other extra styles specific to the libraries used are located inside `src/assets`....
- The `src/utils` directory contains generic utilities.


<br />

### Available Scripts

### `npm start`

Runs the app in the development mode.

### `npm test`

Launches the test runner in the interactive watch mode.

### `npm run build`

Builds the app for production to the `build` folder.

### Virtual Environment

Create isolated node.js environments and integrate with python virtual env. This will allow you to install packages without affecting your system's installation.

```bash
python3.9 -m venv venv
source ./venv/bin/activate
pip install nodeenv
nodeenv -p --node=16.15.0
```
