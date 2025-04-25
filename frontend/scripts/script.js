// This file contains the JavaScript code for the link shortener application.

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('url-form');
    const urlInput = document.getElementById('url-input');
    const resultContainer = document.getElementById('result-container');
    const shortenButton = document.getElementById('shorten-button');

    shortenButton.addEventListener('click', function(event) {
        event.preventDefault();
        const url = urlInput.value;

        if (url) {
            fetch('http://localhost:5000/api/shorten', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url: url })
            })
            .then(response => response.json())
            .then(data => {
                if (data.shortenedUrl) {
                    resultContainer.innerHTML = `<p>Shortened URL: <a href="${data.shortenedUrl}" target="_blank">${data.shortenedUrl}</a></p>`;
                } else {
                    resultContainer.innerHTML = '<p>Error shortening the URL. Please try again.</p>';
                }
            })
            .catch(error => {
                console.error('Error:', error);
                resultContainer.innerHTML = '<p>An error occurred. Please try again later.</p>';
            });
        } else {
            resultContainer.innerHTML = '<p>Please enter a valid URL.</p>';
        }
    });
});