// netlify/functions/submit.js
const fetch = require("node-fetch");

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: "Only POST requests allowed" }),
        };
    }

    const SHEETDB_API_URL = process.env.SHEETDB_API_URL;

    if (!SHEETDB_API_URL) {
        console.error("SHEETDB_API_URL environment variable is not set.");
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Server configuration error." }),
        };
    }

    try {
        const data = JSON.parse(event.body);

        // Define the expected fields and ensure they are present or default to empty string
        // This also acts as a whitelist for data going into your sheet.
        const filtered = {
            FullName: data.FullName || "",
            Department: data.Department || "",
            Semester: data.Semester || "",
            RollNo: data.RollNo || "",
            Email: data.Email || "",
            WhatsApp: data.WhatsApp || "",
            PreferredTeam: data.PreferredTeam || "",
            Skills: data.Skills || "",
            PersonalInsight: data.PersonalInsight || "",
            Timestamp: new Date().toISOString() // Server-side timestamp
        };

        // Send to SheetDB
        const response = await fetch(SHEETDB_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ data: filtered }), // SheetDB expects { data: { ...your_fields... } }
        });

        if (response.ok) {
            return {
                statusCode: 200,
                body: JSON.stringify({ message: "Form submitted successfully!" }),
            };
        } else {
            const errorText = await response.text();
            console.error(`SheetDB API Error: ${response.status} - ${errorText}`);
            return {
                statusCode: response.status,
                body: JSON.stringify({ message: `Failed to submit. Please try again. (Error: ${response.status})` }),
            };
        }
    } catch (error) {
        console.error("Error processing form submission in Netlify function:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "An unexpected server error occurred. Please try again." }),
        };
    }
};