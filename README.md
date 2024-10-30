# typeform

### 📄 Overview
This repository contains custom code that extends the functionality of our Webflow-based website. The code is organised into modular components that handle specific features and interactions not available through Webflow's native capabilities.

### 🔌 Webflow Integration
* Javascript files should be served using jsDelivr
* In Webflow, paste the code in the "Custom Code" section in <head> or before the </body> tag as required
* Publish the Webflow site to apply changes

### 🌐 Development/Test/Production
* The staging site will load the test branch of code
* The production site will load the production branch of code
* Adding a ?dev=true query string parameter to any URL will load the development branch of code
