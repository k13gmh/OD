/**
 * File: timed.js
 * Version: 1.0.7
 */

(function() {
    'use strict';

    const TheoryTimer = {
        version: "1.0.7",
        timerInterval: null,
        totalSeconds: 0,

        /**
         * Initialize the countdown
         * @param {number} minutes - Total minutes for the test
         * @param {string} displayId - ID of the element to update
         * @param {function} onExpire - Function to call when time is up
         */
        start: function(minutes, displayId, onExpire) {
            this.totalSeconds = minutes * 60;
            const displayElement = document.getElementById(displayId);

            if (this.timerInterval) clearInterval(this.timerInterval);

            this.timerInterval = setInterval(() => {
                this.totalSeconds--;

                // Format time as MM:SS
                let mins = Math.floor(this.totalSeconds / 60);
                let secs = this.totalSeconds % 60;
                displayElement.textContent = 
                    (mins < 10 ? "0" + mins : mins) + ":" + 
                    (secs < 10 ? "0" + secs : secs);

                // Change font color to red when 2 minutes (120 seconds) remain
                if (this.totalSeconds <= 120) {
                    displayElement.style.color = "#ff0000";
                }

                // Force finish when timer expires
                if (this.totalSeconds <= 0) {
                    clearInterval(this.timerInterval);
                    if (typeof onExpire === 'function') {
                        onExpire();
                    }
                }
            }, 1000);
        },

        stop: function() {
            clearInterval(this.timerInterval);
        }
    };

    window.TheoryTimer = TheoryTimer;
})();
