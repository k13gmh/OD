// Version: 1.1.0
// Function: submission-created
// Description: Automatically captures form data from "tdemail" project

const fetch = require('node-fetch');

exports.handler = async (event) => {
  // Netlify provides the form data inside event.body.payload
  const payload = JSON.parse(event.body).payload;
  const data = payload.data;

  // Mapping the specific fields from your screenshot
  const contactInfo = {
    fullName: data['Your Full Name (required)'],
    phone: data['Phone Number (required)'],
    postcode: data['Postcode (required)'],
    gearbox: data['Gearbox (required)'],
    availability: {
      monAm: data['Avail Mon Am'],
      monPm: data['Avail Mon Pm'],
      // Add other availability fields here as needed
    }
  };

  console.log(`Processing contact: ${contactInfo.fullName}`);

  // SERVICE SETUP: Replace this URL with your CRM or Google Sheets webhook
  const TARGET_WEBHOOK_URL = process.env.CONTACT_MANAGER_WEBHOOK;

  try {
    const response = await fetch(TARGET_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contactInfo),
    });

    if (response.ok) {
      return { statusCode: 200, body: "Contact automated successfully." };
    } else {
      return { statusCode: response.status, body: "External service error." };
    }
  } catch (error) {
    console.error("Error:", error);
    return { statusCode: 500, body: "Internal Error" };
  }
};
