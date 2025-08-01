document.addEventListener("DOMContentLoaded", function() {
    const recruitForm = document.getElementById("recruitForm");
    const departmentSelect = document.getElementById("department");
    const otherDepartmentGroup = document.getElementById("otherDepartmentGroup");
    const otherDepartmentInput = document.getElementById("otherDepartmentInput");
    const formMessage = document.getElementById("formMessage");
    const submitBtn = recruitForm.querySelector('button[type="submit"]');
    
    function showMessage(message, type) {
        formMessage.textContent = message;
        formMessage.className = `form-message show ${type}`; // Add type for styling
    }
    
    function hideMessage() {
        formMessage.className = `form-message`; // Remove show and type classes
        formMessage.textContent = '';
    }
    
    

    // Event listener for Department selection
    departmentSelect.addEventListener('change', function() {
        if (this.value === 'Other') {
            otherDepartmentGroup.style.display = 'block';
            otherDepartmentInput.required = true;
            otherDepartmentInput.focus(); // Focus on the input when it appears
        } else {
            otherDepartmentGroup.style.display = 'none';
            otherDepartmentInput.required = false;
            otherDepartmentInput.value = ''; // Clear value when hidden
            hideMessage(); // Clear message if user changes selection
        }
    });

    // Form submission handler
    recruitForm.addEventListener("submit", async function(e) {
        e.preventDefault();
        hideMessage(); // Clear any previous messages
        submitBtn.disabled = true; // Disable button to prevent multiple submissions
        submitBtn.textContent = 'Submitting...'; // Change button text

        const formData = new FormData(this);
        const data = {};
        formData.forEach((value, key) => data[key] = value);

        // Custom validation for Personal Insight word count (approx)
        const personalInsight = data.PersonalInsight;
        const wordCount = personalInsight.trim().split(/\s+/).filter(word => word.length > 0).length;
        if (wordCount > 100) {
            showMessage("Personal Insight should be max 100 words.", "error");
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit';
            return;
        }

        // If "Other" is selected, use the typed value for Department
        if (data.Department === "Other") {
            // Also validate if "Other Department" is filled
            if (!data.OtherDepartment || data.OtherDepartment.trim() === '') {
                showMessage("Please specify your department.", "error");
                submitBtn.disabled = false;
                submitBtn.textContent = 'Submit';
                return;
            }
            data.Department = data.OtherDepartment;
        }
        // Remove the temporary OtherDepartment field if it exists
        delete data.OtherDepartment;


        try {
            const response = await fetch("/.netlify/functions/submit", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                showMessage(result.message, "success");
                this.reset(); // Clear the form
                departmentSelect.value = ""; // Reset select dropdown
                otherDepartmentGroup.style.display = 'none'; // Hide "other department" field on reset
            } else {
                showMessage(result.message || "An error occurred during submission.", "error");
            }
        } catch (error) {
            console.error("Error submitting form:", error);
            showMessage("Something went wrong! Please check your internet connection or try again later.", "error");
        } finally {
            submitBtn.disabled = false; // Re-enable button
            submitBtn.textContent = 'Submit'; // Reset button text
        }
    });

    // Optional: Add a simple live word count for Personal Insight
    const personalInsightTextarea = document.getElementById("personalInsight");
    if (personalInsightTextarea) {
        const maxWords = 100;
        const charLimit = 600; // Approx 6 characters per word, 100 words * 6 chars/word
        let wordCountElement = document.createElement('span');
        wordCountElement.className = 'word-count-display';
        wordCountElement.style.cssText = `
            font-size: 0.8em;
            color: #b3c6ff99;
            position: absolute;
            bottom: -18px;
            right: 0px;
        `;
        personalInsightTextarea.parentNode.appendChild(wordCountElement);

        const updateWordCount = () => {
            const text = personalInsightTextarea.value.trim();
            const currentWords = text.split(/\s+/).filter(word => word.length > 0).length;
            wordCountElement.textContent = `${currentWords}/${maxWords} words`;

            if (currentWords > maxWords) {
                wordCountElement.style.color = 'red';
            } else {
                wordCountElement.style.color = '#b3c6ff99';
            }
        };

        personalInsightTextarea.addEventListener('input', updateWordCount);
        updateWordCount(); // Initial count on load
    }
});