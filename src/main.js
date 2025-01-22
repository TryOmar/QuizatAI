import { getSettings } from "./settings.js";

// Ensure settings (including user ID) are initialized on any page load
$(document).on("pagebeforecreate", function () {
  getSettings(); // This will ensure user ID exists
});

// Main page initialization
$(document).on("pagecreate", "#home", function () {
  console.log("Home page initialized");
});
